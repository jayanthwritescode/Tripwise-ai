# TripWise

A thoughtful AI-powered travel architecture tool, designed to curate bespoke itineraries that move at your rhythm. TripWise seamlessly combines Firebase's infrastructure and the Gemini Developer API to provide a comprehensive, interactive travel planning experience.

## Features

- **Intelligent Itinerary Generation:** Leverage Gemini to automatically generate day-by-day travel plans customized to your destination, timeline, and objective.
- **Flight & Hotel Grounding:** Contextually aware location extraction for finding the best accommodation and routing.
- **Persistent Personal Archive:** Store your past and upcoming journeys using local storage, instantly accessible across your sessions without the need for sign-ups.
- **Elegant UI:** Built on to of React and TailwindCSS with a strong focus on fluid animations, micro-interactions, and premium aesthetics.
- **Bring Your Own Key (BYOK) Model:** Operates out of the box using your own Gemini Developer API Key, ensuring you maintain complete control of your generative resources.

## Demo

Watch the demonstration of how TripWise creates perfect journeys in seconds:

https://github.com/user-attachments/assets/fca01665-5b47-4023-ac34-0efdcbf1f5ff

## Tech Stack

- **Core:** React 19 (via Vite), TypeScript
- **Styling:** TailwindCSS, Lucide-React
- **Cloud Infrastructure:** Firebase (App Initialization)
- **AI Backend:** `@firebase/ai` configured securely with `GoogleAIBackend` connecting straight to the Gemini Developer API

## Getting Started

### Prerequisites

You will need Node.js and npm installed on your local machine.

1. **Get an API Key:** Navigate to [Google AI Studio](https://aistudio.google.com/app/apikey) and generate a new key.

### Installation

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open the application in your browser and click "API Settings" or "Begin Curation". You'll be prompted to input your specific Gemini API key. This key is stored purely locally in your browser's persistent storage.

## Design Philosophy

The interface avoids generic palettes, leaning into deep indigos, sleek glassmorphism layers, and bespoke typography (Playfair Display and Plus Jakarta Sans). Interactive elements employ subtle hover states and micro-animations to create an application that feels alive and premium.

## Deployment

TripWise is configured seamlessly with Firebase Hosting. To deploy your own instance:

```bash
npm run build
firebase deploy --only hosting
```

## License
MIT
