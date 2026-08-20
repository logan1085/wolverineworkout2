import { MemoryClient } from 'mem0ai';
import { log, redact } from '@/lib/logger';

export interface UserFitnessProfile {
  fitnessLevel?: string;
  goals?: string;
  timeAvailable?: string;
  equipment?: string;
  focusAreas?: string;
  workoutFrequency?: string;
  preferences?: string[];
  pastWorkouts?: string[];
}

/** The subset of conversation context that gets persisted as memories. */
export interface MemorableContext {
  fitnessLevel?: string;
  goals?: string;
  timeAvailable?: string;
  equipment?: string;
  focusAreas?: string;
  workoutFrequency?: string;
}

/**
 * A single memory as returned by Mem0's search API.
 *
 * Deliberately structural rather than Mem0's own `Memory` type: the cloud API
 * has returned bare arrays, `{results}` and `{memories}` shapes across
 * versions, and `text` appears in some of them but not the published type.
 */
export interface StoredMemory {
  memory?: string;
  text?: string;
}

class MemoryService {
  private memory: MemoryClient | null = null;
  private initialized = false;
  private enabled = true; // Toggle to disable memory for testing

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Build the Mem0 client on first use, or return null when memory is turned
   * off or unconfigured. MemoryClient throws without an API key, so it must
   * never be constructed at module scope - that would take down every route
   * that imports this module rather than just disabling memory.
   */
  private getClient(): MemoryClient | null {
    if (!this.enabled) return null;

    if (!process.env.MEM0_API_KEY) {
      if (!this.initialized) {
        log.warn('MEM0_API_KEY not set. Memory features are disabled.');
        this.initialized = true;
      }
      this.enabled = false;
      return null;
    }

    if (!this.memory) {
      log.debug('Initializing cloud Mem0 client');
      this.memory = new MemoryClient({ apiKey: process.env.MEM0_API_KEY });
      this.initialized = true;
    }

    return this.memory;
  }

  async storeUserPreferences(userId: string, context: MemorableContext, message: string) {
    // Run memory storage in background to not slow down chat
    setTimeout(async () => {
      try {
        const client = this.getClient();
        if (!client) return;

        // Store conversation context as memories
        const memories: string[] = [];
        
        if (context.fitnessLevel) {
          memories.push(`User's fitness level is ${context.fitnessLevel}`);
        }
        if (context.goals) {
          memories.push(`User's fitness goal is ${context.goals}`);
        }
        if (context.timeAvailable) {
          memories.push(`User has ${context.timeAvailable} minutes available for workouts`);
        }
        if (context.equipment) {
          memories.push(`User has access to ${context.equipment}`);
        }
        if (context.focusAreas) {
          memories.push(`User wants to focus on ${context.focusAreas}`);
        }
        if (context.workoutFrequency) {
          memories.push(`User wants to workout ${context.workoutFrequency} days per week`);
        }

        // Store memories in parallel for better performance
        const storePromises = memories.map(memoryText =>
          client.add([{ role: 'user', content: memoryText }], {
            user_id: userId, 
            metadata: { 
              type: 'fitness_preference',
              timestamp: new Date().toISOString()
            }
          })
        );

        // Also store the raw conversation for context
        storePromises.push(
          client.add([{ role: 'user', content: `User said: "${message}"` }], {
            user_id: userId,
            metadata: {
              type: 'conversation',
              timestamp: new Date().toISOString()
            }
          })
        );

        await Promise.all(storePromises);
        // Count only - the memory strings themselves describe the user's body
        // and goals and must not reach the log sink.
        log.debug(`Stored ${memories.length} memories for user`, redact(userId));
      } catch (error) {
        log.error('Error storing memories:', error instanceof Error ? error.message : error);
      }
    }, 0);
  }

  async getUserMemories(userId: string, query: string = ''): Promise<StoredMemory[]> {
    try {
      const client = this.getClient();
      if (!client) return [];

      // Search for relevant memories
      const searchQuery = query || 'fitness preferences workout goals equipment time';
      const memories = await client.search(searchQuery, { user_id: userId });

      log.debug('Retrieved memories for user', redact(userId));

      // Handle the cloud Mem0 response format
      if (memories && typeof memories === 'object') {
        // Cloud API returns an array directly or has a results property
        if (Array.isArray(memories)) {
          return memories;
        }
        const memoryObj = memories as { results?: unknown; memories?: unknown };
        if (Array.isArray(memoryObj.results)) {
          return memoryObj.results as StoredMemory[];
        }
        if (Array.isArray(memoryObj.memories)) {
          return memoryObj.memories as StoredMemory[];
        }
      }
      
      // Fallback to empty array
      return [];
    } catch (error) {
      log.error('Error retrieving memories:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async getUserProfile(userId: string): Promise<UserFitnessProfile> {
    try {
      const memories = await this.getUserMemories(userId);
      
      // Parse memories into a structured profile
      const profile: UserFitnessProfile = {
        preferences: [],
        pastWorkouts: []
      };

      // Ensure memories is an array before processing
      if (Array.isArray(memories)) {
        memories.forEach((memory: StoredMemory) => {
          const text = memory.memory || memory.text || '';

          if (text.includes('fitness level is')) {
            profile.fitnessLevel = text.match(/fitness level is (\w+)/)?.[1];
          }
          if (text.includes('fitness goal is')) {
            profile.goals = text.match(/fitness goal is ([^.]+)/)?.[1];
          }
          if (text.includes('minutes available')) {
            const timeMatch = text.match(/(\d+) minutes available/);
            profile.timeAvailable = timeMatch?.[1];
          }
          if (text.includes('access to')) {
            profile.equipment = text.match(/access to ([^.]+)/)?.[1];
          }
          if (text.includes('focus on')) {
            profile.focusAreas = text.match(/focus on ([^.]+)/)?.[1];
          }
          if (text.includes('workout') && text.includes('days per week')) {
            const freqMatch = text.match(/(\d+) days per week/);
            profile.workoutFrequency = freqMatch?.[1];
          }
        });
      }

      return profile;
    } catch (error) {
      log.error('Error getting user profile:', error instanceof Error ? error.message : error);
      return {
        preferences: [],
        pastWorkouts: []
      };
    }
  }
}

export const memoryService = new MemoryService();

// Disable memory for faster testing (set to false to disable)
const ENABLE_MEMORY = process.env.ENABLE_MEMORY !== 'false';
memoryService.setEnabled(ENABLE_MEMORY); 