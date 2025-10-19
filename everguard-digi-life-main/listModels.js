// listModels.js
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables from .env
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

// Check that the API key is loaded
if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY is not set in your .env file.");
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
  try {
    const response = await axios.get(url);
    console.log(response.data);
  } catch (error) {
    console.error('Error fetching models:', error.response?.data || error.message);
  }
}

listModels();
