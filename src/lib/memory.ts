import { MemoryClient } from 'mem0ai';

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

class MemoryService {
  private memory: MemoryClient;
  private initialized = false;
  private enabled = true; // Toggle to disable memory for testing

  constructor() {
    this.memory = new MemoryClient({
      apiKey: process.env.MEM0_API_KEY || '',
    });
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async init() {
    if (!this.initialized) {
      // Check if API key is configured
      if (!process.env.MEM0_API_KEY) {
        console.warn('MEM0_API_KEY not found in environment variables. Memory features will be disabled.');
        this.enabled = false;
        return;
      }
      
      console.log('Initializing cloud Mem0 with API key...');
      this.initialized = true;
    }
  }

  async storeUserPreferences(userId: string, context: any, message: string) {
    // Run memory storage in background to not slow down chat
    setTimeout(async () => {
      try {
        await this.init();
        
        // Store conversation context as memories
        const memories = [];
        
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
          this.memory.add([{ role: 'user', content: memoryText }], { 
            user_id: userId, 
            metadata: { 
              type: 'fitness_preference',
              timestamp: new Date().toISOString()
            }
          })
        );

        // Also store the raw conversation for context
        storePromises.push(
          this.memory.add([{ role: 'user', content: `User said: "${message}"` }], {
            user_id: userId,
            metadata: {
              type: 'conversation',
              timestamp: new Date().toISOString()
            }
          })
        );

        await Promise.all(storePromises);
        console.log('Stored memories for user:', userId, memories);
      } catch (error) {
        console.error('Error storing memories:', error);
      }
    }, 0);
  }

  async getUserMemories(userId: string, query: string = ''): Promise<any[]> {
    if (!this.enabled) return [];
    
    try {
      await this.init();
      
      // Search for relevant memories
      const searchQuery = query || 'fitness preferences workout goals equipment time';
      const memories = await this.memory.search(searchQuery, { user_id: userId });
      
      console.log('Retrieved memories for user:', userId, memories);
      
      // Handle the cloud Mem0 response format
      if (memories && typeof memories === 'object') {
        // Cloud API returns an array directly or has a results property
        if (Array.isArray(memories)) {
          return memories;
        }
        const memoryObj = memories as any;
        if (memoryObj.results && Array.isArray(memoryObj.results)) {
          return memoryObj.results;
        }
        if (memoryObj.memories && Array.isArray(memoryObj.memories)) {
          return memoryObj.memories;
        }
      }
      
      // Fallback to empty array
      return [];
    } catch (error) {
      console.error('Error retrieving memories:', error);
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
        memories.forEach((memory: any) => {
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
      console.error('Error getting user profile:', error);
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