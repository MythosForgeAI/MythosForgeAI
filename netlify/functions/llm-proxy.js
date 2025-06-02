// netlify/functions/llm-proxy.js

// This line is important for Netlify to correctly process environment variables locally if you use `netlify dev`
// For deployed functions, Netlify injects them automatically.
// require('dotenv').config(); // You might need to install dotenv: npm install dotenv

exports.handler = async function(event, context) {
    // 1. Get the LLM API key from Netlify's environment variables
    //    You will set this up in the Netlify UI (see Step 3)
    const LLM_API_KEY = process.env.YOUR_LLM_API_KEY_NAME; // e.g., GEMINI_API_KEY or OPENAI_API_KEY

    if (!LLM_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "LLM API key not configured in serverless function." })
        };
    }

    // 2. Only allow POST requests (good practice)
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ error: "Only POST requests are allowed." })
        };
    }

    // 3. Get the data (conversation history, new message) sent from your frontend
    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (error) {
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ error: "Invalid JSON in request body." })
        };
    }

    const conversationHistory = requestBody.history; // Expecting { history: [...] } from frontend
    const userMessage = requestBody.message; // Expecting { message: "..." } from frontend

    if (!conversationHistory || !userMessage) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing 'history' or 'message' in request body." })
        };
    }
    
    // Ensure the latest user message is part of the history being sent to the LLM
    // The frontend prototype already adds the user message to conversationHistory before calling getAIResponse,
    // so conversationHistory should already be up-to-date.

    // 4. Construct the payload for the LLM API
    //    **ADAPT THIS PAYLOAD STRUCTURE FOR YOUR CHOSEN LLM API**
    //    This example assumes a Gemini-like structure.
    const llmPayload = {
        contents: conversationHistory, // Send the full history including the latest user message
        // generationConfig: { // Optional: configure AI generation
        //   temperature: 0.7,
        //   maxOutputTokens: 250,
        // }
    };

    // **ADAPT THIS URL FOR YOUR CHOSEN LLM API**
    // Example for a Gemini model (replace 'gemini-1.5-flash-latest' if using a different one)
    const llmApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${LLM_API_KEY}`;
    // For OpenAI, it would be something like: `https://api.openai.com/v1/chat/completions`
    // and you'd use an 'Authorization: Bearer YOUR_KEY' header instead of key in URL.

    try {
        const llmResponse = await fetch(llmApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // For OpenAI, you'd add: 'Authorization': `Bearer ${LLM_API_KEY}`
            },
            body: JSON.stringify(llmPayload)
        });

        if (!llmResponse.ok) {
            const errorBody = await llmResponse.text();
            console.error("LLM API Error:", errorBody);
            return {
                statusCode: llmResponse.status,
                body: JSON.stringify({ error: `LLM API request failed: ${errorBody}` })
            };
        }

        const llmResult = await llmResponse.json();

        // 5. Extract the AI's message from the LLM's response
        //    **ADAPT THIS EXTRACTION LOGIC FOR YOUR CHOSEN LLM API**
        let aiMessageText = "Sorry, I couldn't get a response."; // Default
        if (llmResult.candidates && llmResult.candidates.length > 0 &&
            llmResult.candidates[0].content && llmResult.candidates[0].content.parts &&
            llmResult.candidates[0].content.parts.length > 0) {
            aiMessageText = llmResult.candidates[0].content.parts[0].text;
        } else if (llmResult.choices && llmResult.choices.length > 0 && llmResult.choices[0].message) { // OpenAI structure
            aiMessageText = llmResult.choices[0].message.content;
        } else {
            console.error("Unexpected LLM API response structure:", llmResult);
        }
        
        // 6. Send the AI's message back to your frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ aiMessage: aiMessageText }) // Send as { "aiMessage": "..." }
        };

    } catch (error) {
        console.error("Error in serverless function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Serverless function error: ${error.message}` })
        };
    }
};
