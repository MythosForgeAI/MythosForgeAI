// netlify/functions/llm-proxy.js

exports.handler = async function(event, context) {
    // --- Step 1: Get your secret API Key from Netlify's settings ---
    // You will set this in the Netlify UI:
    // Site configuration > Build & deploy > Environment > Environment variables
    // Key: GEMINI_API_KEY
    // Value: Your actual Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("GEMINI_API_KEY is not set in Netlify environment variables.");
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ error: "Server configuration error: API key missing." })
        };
    }

    // --- Step 2: Ensure this function is called with a POST request ---
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ error: "Only POST requests are allowed to this function." })
        };
    }

    // --- Step 3: Get the 'history' from the request sent by your webpage ---
    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (error) {
        console.error("Invalid JSON in request body:", event.body);
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ error: "Invalid JSON provided in the request." })
        };
    }

    const conversationHistory = requestBody.history;

    if (!conversationHistory || !Array.isArray(conversationHistory) || conversationHistory.length === 0) {
        console.error("Missing or invalid 'history' array in request body:", requestBody);
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ error: "Request must include a 'history' array." })
        };
    }

    // --- Step 4: Prepare the request to the Gemini API ---
    const geminiModelName = "gemini-2.0-flash"; // Using the model from your curl example
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelName}:generateContent?key=${apiKey}`;

    const geminiPayload = {
        contents: conversationHistory, // Your frontend's conversationHistory is already in the Gemini 'contents' format
        generationConfig: { // Optional: You can adjust these later if needed
            temperature: 0.7,
            maxOutputTokens: 500 // Limit output tokens to manage cost/length
        }
    };

    // --- Step 5: Call the Gemini API ---
    try {
        const llmResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(geminiPayload)
        });

        const responseBodyText = await llmResponse.text(); // Read the raw response body

        if (!llmResponse.ok) {
            console.error(`Gemini API Error (Status: ${llmResponse.status}):`, responseBodyText);
            return {
                statusCode: llmResponse.status,
                body: JSON.stringify({ error: `Gemini API request failed. Details: ${responseBodyText}` })
            };
        }

        const llmResult = JSON.parse(responseBodyText); // Parse the JSON from the text

        // --- Step 6: Extract the AI's message from Gemini's response ---
        let aiMessageText = "Sorry, I couldn't understand the AI's response format."; // Default message
        if (llmResult.candidates && llmResult.candidates.length > 0 &&
            llmResult.candidates[0].content && llmResult.candidates[0].content.parts &&
            llmResult.candidates[0].content.parts.length > 0 &&
            typeof llmResult.candidates[0].content.parts[0].text === 'string') {
            aiMessageText = llmResult.candidates[0].content.parts[0].text;
        } else {
            // This part helps if the response isn't what we expect.
            console.error("Unexpected Gemini API response structure:", JSON.stringify(llmResult, null, 2));
        }
        
        // --- Step 7: Send the AI's message back to your webpage ---
        return {
            statusCode: 200, // OK
            body: JSON.stringify({ aiMessage: aiMessageText }) // Format: { "aiMessage": "..." }
        };

    } catch (error) {
        console.error("Error executing the serverless function:", error);
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ error: `Function execution error: ${error.message}` }) // Format: { "error": "..." }
        };
    }
};
