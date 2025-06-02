// netlify/functions/llm-proxy.js

// If you plan to use `netlify dev` for local testing and have a .env file for your API key:
// require('dotenv').config(); 

exports.handler = async function(event, context) {
    // 1. Get the LLM API key from Netlify's environment variables
    const LLM_API_KEY = process.env.GEMINI_API_KEY; // Make sure this matches the KEY you set in Netlify UI

    if (!LLM_API_KEY) {
        console.error("LLM API key not configured in serverless function.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server configuration error: LLM API key missing." })
        };
    }

    // 2. Only allow POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ error: "Only POST requests are allowed." })
        };
    }

    // 3. Get the data (conversation history) sent from your frontend
    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (error) {
        console.error("Invalid JSON in request body:", event.body);
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ error: "Invalid JSON in request body." })
        };
    }

    const conversationHistory = requestBody.history; // Expecting { "history": [...] } from frontend

    if (!conversationHistory || !Array.isArray(conversationHistory) || conversationHistory.length === 0) {
        console.error("Missing or invalid 'history' in request body:", requestBody);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing or invalid 'history' (array) in request body." })
        };
    }
    
    // 4. Construct the payload for the LLM API (Gemini example)
    const llmPayload = {
        contents: conversationHistory, // This 'history' array IS the 'contents' for Gemini
        generationConfig: { // Optional: configure AI generation
            temperature: 0.7, // Adjust as needed
            maxOutputTokens: 500, // Adjust as needed
        }
    };

    // ADAPT THIS URL FOR YOUR CHOSEN GEMINI MODEL (or other provider)
    const llmApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${LLM_API_KEY}`;

    try {
        const llmResponse = await fetch(llmApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(llmPayload)
        });

        const responseBodyText = await llmResponse.text(); // Read body once for logging/errors

        if (!llmResponse.ok) {
            console.error(`LLM API Error (Status: ${llmResponse.status}):`, responseBodyText);
            return {
                statusCode: llmResponse.status,
                body: JSON.stringify({ error: `LLM API request failed. Details: ${responseBodyText}` })
            };
        }

        const llmResult = JSON.parse(responseBodyText); // Parse the successfully read body

        // 5. Extract the AI's message from the LLM's response (Gemini example)
        let aiMessageText = "Sorry, I couldn't get a valid response from the AI."; // Default
        if (llmResult.candidates && llmResult.candidates.length > 0 &&
            llmResult.candidates[0].content && llmResult.candidates[0].content.parts &&
            llmResult.candidates[0].content.parts.length > 0 &&
            llmResult.candidates[0].content.parts[0].text) {
            aiMessageText = llmResult.candidates[0].content.parts[0].text;
        } else {
            console.error("Unexpected LLM API response structure:", llmResult);
        }
        
        // 6. Send the AI's message back to your frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ aiMessage: aiMessageText }) // Format: { "aiMessage": "..." }
        };

    } catch (error) {
        console.error("Error in serverless function execution:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Serverless function error: ${error.message}` }) // Format: { "error": "..." }
        };
    }
};
