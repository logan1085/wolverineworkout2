'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Workout, Exercise } from '@/types/workout';
import { getVoiceCoachPrompt } from '@/prompts';
import { log } from '@/lib/logger';

interface VoiceChatProps {
  workout: Workout;
  currentExercise: Exercise;
  currentExerciseIndex: number;
  exerciseStates: {
    completed: boolean;
    sets: {
      reps: number;
      weight: number;
      completed: boolean;
    }[];
  }[];
  onCompleteSet: (exerciseIndex: number, setIndex: number) => void;
  isActive?: boolean;
  onToggle?: () => void;
}

/**
 * A `function_call` output item from the realtime API. `arguments` arrives as a
 * JSON string, not an object.
 */
interface RealtimeFunctionCall {
  name?: string;
  arguments?: string;
  call_id?: string;
}

interface VoiceChatState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * One "Connected"/"Listening"/"Logan Speaking" pill.
 *
 * Whether each one is on used to be carried entirely by colour, so a screen
 * reader read the same three labels no matter what the session was doing, and
 * so did anyone who cannot separate the grey from the green. The sr-only yes/no
 * states it outright.
 */
function StatusDot({
  label,
  active,
  activeClassName,
  dotClassName,
}: {
  label: string;
  active: boolean;
  activeClassName: string;
  dotClassName: string;
}) {
  return (
    <div className={`flex items-center space-x-2 ${active ? activeClassName : 'text-gray-400'}`}>
      <div aria-hidden="true" className={`w-2 h-2 rounded-full ${active ? dotClassName : 'bg-gray-500'}`} />
      <span className="text-sm">
        {label}
        <span className="sr-only">: {active ? 'yes' : 'no'}</span>
      </span>
    </div>
  );
}

/** Turns a getUserMedia rejection into something a user can act on. */
function describeMicrophoneError(error: unknown): string {
  const name = error instanceof Error ? error.name : '';

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Microphone access is blocked. Allow it for this site in your browser settings, then start the voice coach again.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return "We couldn't find a microphone. Connect one and try again.";
  }
  if (name === 'NotReadableError') {
    return 'Your microphone is in use by another app. Close it and try again.';
  }
  return 'We could not access your microphone. Please try again.';
}

export default function VoiceChat({
  workout,
  currentExercise,
  currentExerciseIndex,
  exerciseStates,
  onCompleteSet,
  isActive = false,
  onToggle,
}: VoiceChatProps) {
  const [voiceState, setVoiceState] = useState<VoiceChatState>({
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    isLoading: false,
    error: null
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const ephemeralKeyRef = useRef<string | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!audioElementRef.current) {
      audioElementRef.current = document.createElement('audio');
      audioElementRef.current.autoplay = true;
    }
  }, []);

  // Get ephemeral key from our server
  const getEphemeralKey = async (): Promise<string> => {
    try {
      const response = await fetch('/api/realtime-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'echo'
        })
      });

      if (!response.ok) {
        // Surface the server's message so an expired session reads as "sign in
        // again" rather than a generic failure.
        let message = 'Could not start the voice coach. Please try again.';
        try {
          const errorBody = await response.json();
          if (typeof errorBody?.error === 'string') message = errorBody.error;
        } catch {
          // Keep the default when the body is not JSON.
        }
        throw new Error(message);
      }

      const data = await response.json();
      const key = data?.client_secret?.value;
      if (typeof key !== 'string') {
        // Guards against a shape change upstream, which would otherwise throw a
        // bare "cannot read property of undefined" at the caller.
        throw new Error('Could not start the voice coach. Please try again.');
      }
      return key;
    } catch (error) {
      log.error('Error getting ephemeral key:', error instanceof Error ? error.message : error);
      throw error;
    }
  };

  // Start voice chat session
  const startVoiceChat = async () => {
    try {
      setVoiceState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get ephemeral key
      const ephemeralKey = await getEphemeralKey();
      ephemeralKeyRef.current = ephemeralKey;

      // Create peer connection
      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      // Set up data channel
      const dataChannel = peerConnection.createDataChannel('oai-events');
      dataChannelRef.current = dataChannel;

      // Data channel event handlers
      dataChannel.addEventListener('open', () => {
        log.debug('Data channel is open');
        updateSession();
        setVoiceState(prev => ({ ...prev, isConnected: true, isLoading: false }));
      });

      dataChannel.addEventListener('message', (event) => {
        const response = JSON.parse(event.data);
        // Type only: the full event carries audio transcripts of what the user
        // said out loud.
        log.debug('Realtime event:', response.type);

        // Handle different response types
        if (response.type === 'response.audio_transcript.delta') {
          // Handle streaming text if needed
        } else if (response.type === 'input_audio_buffer.speech_started') {
          setVoiceState(prev => ({ ...prev, isListening: true }));
        } else if (response.type === 'input_audio_buffer.speech_stopped') {
          setVoiceState(prev => ({ ...prev, isListening: false }));
        } else if (response.type === 'response.audio.delta') {
          setVoiceState(prev => ({ ...prev, isSpeaking: true }));
        } else if (response.type === 'response.done') {
          setVoiceState(prev => ({ ...prev, isSpeaking: false }));
        } else if (response.type === 'response.output_item.done' && response.item?.type === 'function_call') {
          // The event that actually carries a complete function call. The
          // `function_call_arguments.done` and `conversation.item.created`
          // branches that used to sit here only logged - one called a stub with
          // an empty body - so this is the single place a call is acted on.
          handleFunctionCallComplete(response.item);
        }
      });

      dataChannel.addEventListener('close', () => {
        log.debug('Data channel is closed');
        setVoiceState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isListening: false, 
          isSpeaking: false 
        }));
      });

      // Set up audio handling
      peerConnection.ontrack = (event) => {
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = event.streams[0];
        }
      };

      // Get user media (microphone). Denying the permission prompt is the most
      // likely way this call fails and by far the most likely failure overall,
      // so it gets its own message instead of surfacing the browser's raw
      // "Permission denied" DOMException text.
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (mediaError) {
        throw new Error(describeMicrophoneError(mediaError));
      }
      mediaStreamRef.current = mediaStream;

      const audioTrack = mediaStream.getAudioTracks()[0];
      peerConnection.addTrack(audioTrack);

      // Create offer and set local description
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to OpenAI
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to establish connection with OpenAI');
      }

      // Set remote description
      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text()
      };
      await peerConnection.setRemoteDescription(answer);

    } catch (error) {
      log.error('Error starting voice chat:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to start voice chat',
        isLoading: false 
      }));
    }
  };

  // Stop voice chat session
  const stopVoiceChat = () => {
    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Reset audio element
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
    }

    setVoiceState({
      isConnected: false,
      isListening: false,
      isSpeaking: false,
      isLoading: false,
      error: null
    });
  };

  // Handle completed function calls from the AI - memoized to ensure fresh values
  const handleFunctionCallComplete = useCallback((item: RealtimeFunctionCall) => {
    log.debug('Handling completed function call:', item.name);

    if (item.name === 'complete_set') {
      try {
        // `arguments` is optional on the event, and JSON.parse(undefined) throws
        // a SyntaxError that the catch below would report as a malformed call.
        const args = JSON.parse(item.arguments ?? '{}');
        const setNumber = Number(args.setNumber);

        log.debug(`Function call to complete set ${setNumber} for exercise ${currentExercise.name} (index ${currentExerciseIndex})`);
        
        // Convert 1-based to 0-based index
        const setIndex = setNumber - 1;
        
        // Get the current exercise state for validation
        const currentExerciseState = exerciseStates[currentExerciseIndex];
        const totalSets = currentExercise.sets;
        
        log.debug(`Validating set ${setNumber} (index ${setIndex}) for exercise with ${totalSets} total sets`);
        log.debug(`Current exercise state:`, currentExerciseState);
        
        // Validate the set index and check if set is not already completed
        if (setIndex >= 0 && setIndex < totalSets && currentExerciseState?.sets[setIndex] && !currentExerciseState.sets[setIndex].completed) {
          log.debug(`Completing set ${setNumber} for exercise ${currentExerciseIndex}`);
          onCompleteSet(currentExerciseIndex, setIndex);
          
          // Send function call output back to the AI
          const outputEvent = {
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: item.call_id,
              output: JSON.stringify({
                success: true,
                message: `Great job! Set ${setNumber} of ${currentExercise.name} completed successfully!`
              })
            }
          };
          
          if (dataChannelRef.current) {
            dataChannelRef.current.send(JSON.stringify(outputEvent));
            dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }));
          }
        } else if (currentExerciseState?.sets[setIndex]?.completed) {
          // Set already completed
          log.debug(`Set ${setNumber} is already completed`);
          const outputEvent = {
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: item.call_id,
              output: JSON.stringify({
                success: false,
                message: `Set ${setNumber} is already completed! Good job on that one.`
              })
            }
          };
          
          if (dataChannelRef.current) {
            dataChannelRef.current.send(JSON.stringify(outputEvent));
            dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }));
          }
        } else {
          // Invalid set number
          log.debug(`Invalid set number ${setNumber} for exercise with ${totalSets} sets`);
          const outputEvent = {
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: item.call_id,
              output: JSON.stringify({
                success: false,
                message: `Invalid set number. ${currentExercise.name} has ${totalSets} sets. Please use 1-${totalSets}.`
              })
            }
          };
          
          if (dataChannelRef.current) {
            dataChannelRef.current.send(JSON.stringify(outputEvent));
            dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }));
          }
        }
      } catch (error) {
        log.error('Error handling function call:', error);
        
        // Send error response back to AI
        const errorEvent = {
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: item.call_id,
            output: JSON.stringify({
              success: false,
              message: 'Sorry, there was an error completing the set. Please try again.'
            })
          }
        };
        
        if (dataChannelRef.current) {
          dataChannelRef.current.send(JSON.stringify(errorEvent));
          dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }));
        }
      }
    }
  }, [currentExercise, currentExerciseIndex, exerciseStates, onCompleteSet]);

  // Update session with workout context - memoized to prevent unnecessary re-renders
  const updateSession = useCallback(() => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      log.debug('Data channel not ready for session update');
      return;
    }

    const currentExerciseState = exerciseStates[currentExerciseIndex];
    const completedSets = currentExerciseState?.sets.filter(set => set.completed).length || 0;
    const totalSets = currentExercise.sets;
    const totalExercises = workout.exercises?.length || 0;
    
    log.debug(`Updating session for exercise: ${currentExercise.name} (${currentExerciseIndex + 1}/${totalExercises})`);
    log.debug(`Progress: ${completedSets}/${totalSets} sets completed`);
    
    const workoutContext = getVoiceCoachPrompt({
      workout,
      currentExercise,
      currentExerciseIndex,
      exerciseStates
    });

    const event = {
      type: "session.update",
      session: {
        instructions: workoutContext,
        voice: 'echo',
        turn_detection: { type: 'server_vad' },
        input_audio_transcription: { model: 'whisper-1' },
        tools: [
          {
            type: 'function',
            name: 'complete_set',
            description: 'Mark a set as completed when the user finishes it',
            parameters: {
              type: 'object',
              properties: {
                setNumber: {
                  type: 'number',
                  description: 'The set number to complete (1-based index)'
                }
              },
              required: ['setNumber']
            }
          }
        ]
      }
    };

    log.debug('Sending session update event');
    dataChannelRef.current.send(JSON.stringify(event));
  }, [currentExercise, currentExerciseIndex, exerciseStates, workout]);

  // Toggle voice chat
  const handleToggle = () => {
    if (voiceState.isConnected) {
      stopVoiceChat();
    } else {
      startVoiceChat();
    }
    onToggle?.();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoiceChat();
    };
  }, []);

  // Update session when connected
  useEffect(() => {
    if (voiceState.isConnected) {
      log.debug('Voice chat connected, updating session...');
      updateSession();
    }
  }, [voiceState.isConnected, updateSession]);

  // Read through a ref so the announce effect below does not have to list
  // `updateSession` as a dependency. That callback is rebuilt every time
  // `exerciseStates` changes - i.e. on every completed set - which re-ran the
  // effect and had Logan launch into "Time for Squats! pump me up!" again in
  // the middle of an exercise you were already halfway through.
  const updateSessionRef = useRef(updateSession);
  useEffect(() => {
    updateSessionRef.current = updateSession;
  }, [updateSession]);

  // Announce exercise changes and update session
  const announcedExerciseRef = useRef<number | null>(null);
  useEffect(() => {
    if (!voiceState.isConnected || dataChannelRef.current?.readyState !== 'open') {
      // Reconnecting should reintroduce the current exercise, so forget what
      // was announced on the previous session.
      announcedExerciseRef.current = null;
      return;
    }

    if (announcedExerciseRef.current === currentExerciseIndex) return;
    announcedExerciseRef.current = currentExerciseIndex;

    log.debug(`🔄 Exercise changed to: ${currentExercise.name} (index: ${currentExerciseIndex})`);

    // Update the session with new exercise context first
    updateSessionRef.current();

    // Send a message to trigger Logan to acknowledge the exercise change
    const timer = setTimeout(() => {
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        const announceEvent = {
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{
              type: 'input_text',
              text: `Time for ${currentExercise.name}! Let's go coach, pump me up and give me your best form tips!`
            }]
          }
        };

        log.debug('📢 Sending exercise change notification to Logan');
        dataChannelRef.current.send(JSON.stringify(announceEvent));
        dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }));
      }
    }, 1000); // Longer delay to ensure session update is processed

    return () => clearTimeout(timer);
  }, [currentExerciseIndex, voiceState.isConnected, currentExercise.name]);

  const completedSetCount =
    exerciseStates[currentExerciseIndex]?.sets.filter(set => set.completed).length ?? 0;

  return (
    <div className={`bg-gray-900 rounded-2xl p-4 border border-gray-600 transition-all duration-300 ${
      isActive ? 'ring-2 ring-blue-500' : ''
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🎤</div>
          <div>
            <h3 className="text-white font-semibold">Voice Coach</h3>
            <p className="text-gray-400 text-sm">Talk to Logan in real-time</p>
          </div>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={voiceState.isLoading}
          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
            voiceState.isConnected
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } ${voiceState.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {voiceState.isLoading ? 'Connecting...' : voiceState.isConnected ? 'Stop Voice' : 'Start Voice'}
        </button>
      </div>

      {/* Status indicators */}
      <div className="flex items-center space-x-4 mb-4">
        <StatusDot label="Connected" active={voiceState.isConnected} activeClassName="text-green-400" dotClassName="bg-green-400" />
        <StatusDot label="Listening" active={voiceState.isListening} activeClassName="text-blue-400" dotClassName="bg-blue-400 animate-pulse" />
        <StatusDot label="Logan Speaking" active={voiceState.isSpeaking} activeClassName="text-purple-400" dotClassName="bg-purple-400 animate-pulse" />
      </div>

      {/* Error display */}
      {voiceState.error && (
        <div role="alert" className="bg-red-900 border border-red-600 rounded-lg p-3 mb-4 flex items-start justify-between gap-3">
          <p className="text-red-200 text-sm">{voiceState.error}</p>
          <button
            onClick={() => setVoiceState(prev => ({ ...prev, error: null }))}
            aria-label="Dismiss voice coach error"
            className="shrink-0 px-2 text-red-300 hover:text-white text-sm leading-none"
          >
            ✕
          </button>
        </div>
      )}

            {/* Instructions and Status */}
      {voiceState.isConnected && (
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-300 text-sm mb-2">
            🔥 Say &quot;Hey Logan&quot; for motivation, form tips, or coaching!
          </p>
          {/* Once every set was ticked off this counted past the end and read
              "Set 4 of 3". */}
          <div className="text-xs text-gray-400">
            Current: {currentExercise.name} —{' '}
            {completedSetCount >= currentExercise.sets
              ? 'all sets complete'
              : `set ${completedSetCount + 1} of ${currentExercise.sets}`}
          </div>
          <div className="text-xs text-green-400 mt-1">
            💪 Say &quot;Set done!&quot; or &quot;Finished the set!&quot; to mark it complete!
          </div>
        </div>
      )}

      {!voiceState.isConnected && !voiceState.isLoading && (
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-300 text-sm">
            🔥 Start voice chat to get real-time coaching and motivation from Logan!
          </p>
        </div>
      )}
    </div>
  );
}