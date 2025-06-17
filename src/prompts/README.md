# System Prompts

This directory contains all AI system prompts used throughout the Wolverine Workout application. The prompts are organized into separate files for better maintainability and version control.

## File Structure

- `index.ts` - Central export file for easy importing
- `logan-chat.ts` - System prompts for Logan's conversational chat interactions
- `workout-generation.ts` - System prompts for workout generation and planning

## Usage

Import prompts from the main index file:

```typescript
import { getLoganChatPrompt, getWorkoutGenerationPrompt, WORKOUT_SYSTEM_PROMPT } from '@/prompts';
```

### Logan Chat Prompts

Used in `/api/chat-with-logan` for natural conversation with users:

```typescript
const systemPrompt = getLoganChatPrompt(conversationContext);
```

### Workout Generation Prompts

Used in `/api/generate-simple-workout` for creating personalized workouts:

```typescript
const prompt = getWorkoutGenerationPrompt({
  fitnessLevel: 'intermediate',
  goals: 'muscle building',
  timeAvailable: '45',
  equipment: 'full gym',
  conversation: 'optional conversation context'
});
```

## Benefits of This Organization

1. **Maintainability** - Easy to update prompts without touching API route logic
2. **Version Control** - Track prompt changes separately from business logic
3. **Reusability** - Prompts can be shared across multiple API routes
4. **Type Safety** - Full TypeScript support with proper interfaces
5. **Testing** - Prompts can be unit tested independently
6. **Documentation** - Clear separation makes the codebase more understandable

## Prompt Engineering Guidelines

When updating prompts:

1. Test changes thoroughly with different input scenarios
2. Maintain consistent personality and tone for Logan
3. Keep instructions clear and specific
4. Use proper TypeScript types for all parameters
5. Document any breaking changes to prompt interfaces 