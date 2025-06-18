'use client';

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Workout, Exercise } from '@/types/workout';

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
  onUpdateSet: (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => void;
  isActive?: boolean;
  onToggle?: () => void;
}

interface VoiceChatState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
}

const VoiceChat = forwardRef<
  { restartVoiceChat: () => void },
  VoiceChatProps
>(({ 
  workout, 
  currentExercise, 
  currentExerciseIndex, 
  exerciseStates,
  onCompleteSet,
  onUpdateSet,
  isActive = false,
  onToggle 
}, ref) => {
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

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    restartVoiceChat: () => {
      console.log('🔄 Stopping voice chat for exercise change...');
      if (voiceState.isConnected) {
        stopVoiceChat();
      }
    }
  }), [voiceState.isConnected]);

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
        throw new Error('Failed to get ephemeral key');
      }

      const data = await response.json();
      return data.client_secret.value;
    } catch (error) {
      console.error('Error getting ephemeral key:', error);
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
        console.log('Data channel is open');
        updateSession();
        setVoiceState(prev => ({ ...prev, isConnected: true, isLoading: false }));
      });

      dataChannel.addEventListener('message', (event) => {
        const response = JSON.parse(event.data);
        console.log('AI Response:', response.type, response);
        
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
        } else if (response.type === 'response.function_call_arguments.done') {
          // Handle function call completion
          console.log('Function call arguments done:', response);
          handleFunctionCall(response);
        } else if (response.type === 'conversation.item.created' && response.item?.type === 'function_call') {
          // Handle function call created - we'll handle it when arguments are done
          console.log('Function call created:', response.item);
        } else if (response.type === 'response.output_item.done' && response.item?.type === 'function_call') {
          // Handle function call completion - this is the correct event type
          console.log('Function call completed:', response.item);
          handleFunctionCallComplete(response.item);
        }
      });

      dataChannel.addEventListener('close', () => {
        console.log('Data channel is closed');
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

      // Get user media (microphone)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
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
      console.error('Error starting voice chat:', error);
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

  // Handle function calls from the AI (when arguments are done)
  const handleFunctionCall = (response: any) => {
    console.log('Handling function call from arguments.done:', response);
    // This might not be the right place for function calls, keeping for debugging
  };

  // Handle completed function calls from the AI - memoized to ensure fresh values
  const handleFunctionCallComplete = useCallback((item: any) => {
    console.log('Handling completed function call:', item);
    
    if (item.name === 'complete_set') {
      try {
        const args = JSON.parse(item.arguments);
        const setNumber = args.setNumber;
        
        console.log(`Function call to complete set ${setNumber} for exercise ${currentExercise.name} (index ${currentExerciseIndex})`);
        
        // Convert 1-based to 0-based index
        const setIndex = setNumber - 1;
        
        // Get the current exercise state for validation
        const currentExerciseState = exerciseStates[currentExerciseIndex];
        const totalSets = currentExercise.sets;
        
        console.log(`Validating set ${setNumber} (index ${setIndex}) for exercise with ${totalSets} total sets`);
        console.log(`Current exercise state:`, currentExerciseState);
        
        // Validate the set index and check if set is not already completed
        if (setIndex >= 0 && setIndex < totalSets && currentExerciseState?.sets[setIndex] && !currentExerciseState.sets[setIndex].completed) {
          console.log(`Completing set ${setNumber} for exercise ${currentExerciseIndex}`);
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
          console.log(`Set ${setNumber} is already completed`);
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
          console.log(`Invalid set number ${setNumber} for exercise with ${totalSets} sets`);
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
        console.error('Error handling function call:', error);
        
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
      console.log('Data channel not ready for session update');
      return;
    }

    const currentExerciseState = exerciseStates[currentExerciseIndex];
    const completedSets = currentExerciseState?.sets.filter(set => set.completed).length || 0;
    const totalSets = currentExercise.sets;
    const nextIncompleteSetIndex = currentExerciseState?.sets.findIndex(set => !set.completed) ?? -1;

    const totalExercises = workout.exercises?.length || 0;
    
    console.log(`Updating session for exercise: ${currentExercise.name} (${currentExerciseIndex + 1}/${totalExercises})`);
    console.log(`Progress: ${completedSets}/${totalSets} sets completed`);
    
    const workoutContext = `You are Logan, a high-energy personal trainer and workout coach. You're passionate about fitness and helping people push their limits while staying safe. You speak like a motivational coach - energetic, encouraging, and direct.

CURRENT WORKOUT STATUS:
Workout: ${workout.name}
Exercise: ${currentExercise.name} (${currentExerciseIndex + 1}/${totalExercises})
Target: ${currentExercise.sets} sets × ${currentExercise.reps} reps${currentExercise.weight_lbs ? ` at ${currentExercise.weight_lbs} lbs` : ''}
Progress: ${completedSets}/${totalSets} sets completed
${currentExercise.notes ? `Form Notes: ${currentExercise.notes}` : ''}
${nextIncompleteSetIndex >= 0 ? `Next up: Set ${nextIncompleteSetIndex + 1}` : 'All sets crushed!'}

YOUR COACHING STYLE:
🔥 BE ENERGETIC: Use phrases like "Let's go!", "You've got this!", "Beast mode!", "Crushing it!"
💪 BE MOTIVATIONAL: Push them to finish strong, celebrate their effort, remind them why they're here
🎯 BE SPECIFIC: Give concrete form cues, breathing tips, and technique advice for each exercise
⚡ BE CONCISE: Keep responses under 20 seconds - quick, punchy, effective
🏆 BE ENCOURAGING: Even if they're struggling, focus on what they're doing right

COACHING RESPONSES:
- When they start: "Alright! Let's crush these ${currentExercise.name}! Remember: ${currentExercise.notes || 'focus on form over speed'}"
- During sets: "Keep that form tight! You're looking strong!"
- Between sets: "Nice work! Catch your breath, you've earned it. Ready for the next one?"
- When they complete a set: "BOOM! That's what I'm talking about! Set complete!"
- When they finish exercise: "Absolutely crushed it! You're getting stronger every rep!"

Use the complete_set function when they tell you they finished a set.

Remember: You're not just counting reps - you're their hype person, form checker, and motivation machine all in one!`;

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

    console.log('Sending session update event');
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
      console.log('Voice chat connected, updating session...');
      updateSession();
    }
  }, [voiceState.isConnected, updateSession]);

  // Announce exercise changes and update session
  useEffect(() => {
    if (voiceState.isConnected && dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      console.log(`🔄 Exercise changed to: ${currentExercise.name} (index: ${currentExerciseIndex})`);
      
      // Update the session with new exercise context first
      updateSession();
      
      // Send a message to trigger Logan to acknowledge the exercise change
      setTimeout(() => {
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
          
          console.log('📢 Sending exercise change notification to Logan');
          dataChannelRef.current.send(JSON.stringify(announceEvent));
          dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }));
        }
      }, 1000); // Longer delay to ensure session update is processed
    }
  }, [currentExerciseIndex, voiceState.isConnected, currentExercise.name, updateSession]);

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
        <div className={`flex items-center space-x-2 ${
          voiceState.isConnected ? 'text-green-400' : 'text-gray-500'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            voiceState.isConnected ? 'bg-green-400' : 'bg-gray-500'
          }`}></div>
          <span className="text-sm">Connected</span>
        </div>

        <div className={`flex items-center space-x-2 ${
          voiceState.isListening ? 'text-blue-400' : 'text-gray-500'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            voiceState.isListening ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'
          }`}></div>
          <span className="text-sm">Listening</span>
        </div>

        <div className={`flex items-center space-x-2 ${
          voiceState.isSpeaking ? 'text-purple-400' : 'text-gray-500'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            voiceState.isSpeaking ? 'bg-purple-400 animate-pulse' : 'bg-gray-500'
          }`}></div>
          <span className="text-sm">Logan Speaking</span>
        </div>
      </div>

      {/* Error display */}
      {voiceState.error && (
        <div className="bg-red-900 border border-red-600 rounded-lg p-3 mb-4">
          <p className="text-red-200 text-sm">{voiceState.error}</p>
        </div>
      )}

            {/* Instructions and Status */}
      {voiceState.isConnected && (
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-300 text-sm mb-2">
            🔥 Say &quot;Hey Logan&quot; for motivation, form tips, or coaching!
          </p>
          <div className="text-xs text-gray-400">
            Current: {currentExercise.name} - Set {(exerciseStates[currentExerciseIndex]?.sets.filter(s => s.completed).length || 0) + 1} of {currentExercise.sets}
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
});

VoiceChat.displayName = 'VoiceChat';

export default VoiceChat;