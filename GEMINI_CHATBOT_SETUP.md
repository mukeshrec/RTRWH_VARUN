# Gemini AI Chatbot Setup Guide

## What's Been Done:

✅ Chatbot component is already integrated  
✅ Supabase edge function is configured to use Gemini API  
✅ Environment variables are set locally

## What You Need to Do:

### Step 1: Add Gemini API Key to Supabase Secrets

1. Go to **Supabase Dashboard** → **Project Settings** → **Secrets**
2. Click **Add secret**
3. Fill in:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyB8utSHXgJeGqYPTzyO8R6VHm3jITZkdk4`
4. Click **Save**

### Step 2: Restart Supabase Edge Functions (if deployed)

If using Supabase Edge Functions:

```bash
supabase functions deploy --project-id dyoyfbopdgjmubbuqifd
```

### Step 3: Test the Chatbot

1. Open your app at `http://localhost:5174/`
2. Look for the **Chatbot** icon in the bottom-right corner
3. Click to open the chat
4. Ask a question like:
   - "What is rainwater harvesting?"
   - "How much tank size do I need?"
   - "Tell me about the Varun tool"
   - Share your location for location-specific answers!

## Chatbot Features:

✅ **Gemini AI Powered** - Uses Google's Gemini 1.5 Flash model  
✅ **Context-Aware** - Remembers location data from detection  
✅ **RTRWH Specialized** - Trained specifically for rainwater harvesting  
✅ **Location-Specific Answers** - Provides tailored recommendations  
✅ **Professional Responses** - Clear, helpful, and accurate

## How the Chatbot Works:

1. User sends a message
2. System includes location context if available
3. Message is sent to Gemini API with RTRWH system prompt
4. Gemini responds with expert advice
5. Response is displayed in chat UI

## Sample Questions to Try:

- "What is RTRWH?"
- "How do I size a rainwater tank?"
- "Is rainwater harvesting economical?"
- "What is the CGWB guideline?"
- "How does your assessment tool work?"
- "What components do I need?"
- "Share my location" (click location button for location-specific answers)

---

**Note**: The chatbot only answers questions related to rainwater harvesting, water conservation, and the Varun tool. It will politely redirect other topics.
