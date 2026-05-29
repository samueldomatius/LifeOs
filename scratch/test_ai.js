import dotenv from 'dotenv';
import { getAIDailySummary } from '../src/utils/aiEngine.js';

dotenv.config({ path: '../.env' });

// Mock import.meta.env
global.import = {
  meta: {
    env: {
      VITE_GEMINI_API_KEYS: process.env.VITE_GEMINI_API_KEYS
    }
  }
};

// Mock localStorage
global.localStorage = {
  getItem: () => null
};

async function run() {
  try {
    console.log("Testing getAIDailySummary...");
    const summary = await getAIDailySummary(
      { date: "2026-05-29", sleepHours: 8, sleepQuality: "Good", steps: 5000, workoutMinutes: 30, directMood: "Happy" },
      [{ text: "Belajar React", status: "completed" }],
      [{ description: "Kopi", amount: 25000, type: "expense" }]
    );
    console.log("Success! Result:", summary);
  } catch (error) {
    console.error("Failed:", error);
  }
}

run();
