// check_models.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const modelResponse = await genAI.listModels();
    console.log("Available Models:");
    modelResponse.models.forEach((model) => {
      // Filter for models that support 'generateContent'
      if (model.supportedGenerationMethods.includes("generateContent")) {
        console.log(`- ${model.name}`);
      }
    });
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();