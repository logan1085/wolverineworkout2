# Wolverine Workout Frontend

A Next.js-based frontend for the Wolverine Workout tracking application with AI-powered workout generation.

## Features

- Create, edit, and delete workouts
- Track exercises with sets, reps, and weights
- **AI-powered workout generation using ChatGPT**
- Modern, responsive UI built with Tailwind CSS
- Single-server architecture with Next.js API routes

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file in the frontend directory with:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## AI Workout Generation

The app now includes ChatGPT integration for generating personalized workouts:

1. Click "Generate AI Workout" button
2. Select your fitness level, workout type, and focus area
3. Choose available equipment
4. Set desired duration
5. Click "Generate Workout" to get an AI-created workout plan

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   │   ├── workouts/   # Workout CRUD operations
│   │   └── generate-workout/ # AI workout generation
│   ├── page.tsx        # Main application page
│   ├── layout.tsx      # Root layout
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── WorkoutForm.tsx # Form for creating/editing workouts
│   ├── WorkoutList.tsx # List of workouts
│   └── WorkoutGenerator.tsx # AI workout generator
├── services/          # API services
│   └── api.ts         # Backend API communication
└── types/             # TypeScript type definitions
    └── workout.ts     # Workout and exercise types
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Routes

The app uses Next.js API routes for backend functionality:

- `GET /api/workouts` - Get all workouts
- `POST /api/workouts` - Create new workout
- `GET /api/workouts/[id]` - Get specific workout
- `PUT /api/workouts/[id]` - Update workout
- `DELETE /api/workouts/[id]` - Delete workout
- `POST /api/generate-workout` - Generate AI workout

## Technologies Used

- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- OpenAI API (ChatGPT)
- Next.js API Routes
