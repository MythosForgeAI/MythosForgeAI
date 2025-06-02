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

    // --- Step 3: Get the 'history' and 'persona' from the request sent by your webpage ---
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

    const conversationHistoryFromFrontend = requestBody.history;
    const personaInstruction = requestBody.persona; // Get the persona from the request

    // Validate that we have at least some history or a persona
    if ((!conversationHistoryFromFrontend || !Array.isArray(conversationHistoryFromFrontend)) && 
        (!personaInstruction || personaInstruction.trim() === "")) {
        console.error("Request must include a 'history' array and/or a 'persona' string:", requestBody);
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ error: "Request must include a 'history' array and/or a 'persona' string." })
        };
    }
    
    // --- Step 4: Construct the 'contents' payload for the Gemini API ---
    let contentsForGemini = [];

    // Add Persona Instruction as the first "user" turn, followed by a "model" acknowledgment
    // This helps set the stage for the AI before the actual conversation history begins.
    if (personaInstruction && personaInstruction.trim() !== "") {
        contentsForGemini.push({ 
            role: "user", 
            parts: [{ text: `SYSTEM INSTRUCTION: Adopt the following persona and instructions for our entire conversation: "${personaInstruction}" Please confirm you understand these instructions before we proceed with the main dialogue.` }] 
        });
        contentsForGemini.push({
            role: "model",
            parts: [{ text: "Understood. I have received my persona and instructions. I am ready to proceed with the dialogue."}]
        });
    }

    // Append the actual chat history from the frontend
    // Ensure conversationHistoryFromFrontend is not null/undefined before trying to concat
    if (conversationHistoryFromFrontend && Array.isArray(conversationHistoryFromFrontend)) {
        contentsForGemini = contentsForGemini.concat(conversationHistoryFromFrontend);
    }


    // --- Step 5: Prepare the request to the Gemini API ---
    const geminiModelName = "gemini-2.0-flash"; // You can change this if needed
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelName}:generateContent?key=${apiKey}`;

    const geminiPayload = {
        contents: contentsForGemini, 
        generationConfig: { 
            temperature: 0.7,       // Controls randomness (0.0 to 1.0)
            maxOutputTokens: 500,  // Max length of the AI's response
            // topP: 0.9,          // Alternative to temperature for sampling
            // topK: 40            // Alternative to temperature for sampling
        }
    };
    
    console.log("Payload being sent to Gemini API:", JSON.stringify(geminiPayload, null, 2));


    // --- Step 6: Call the Gemini API ---
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

        // --- Step 7: Extract the AI's message from Gemini's response ---
        let aiMessageText = "Sorry, I couldn't understand the AI's response format."; 
        if (llmResult.candidates && llmResult.candidates.length > 0 &&
            llmResult.candidates[0].content && llmResult.candidates[0].content.parts &&
            llmResult.candidates[0].content.parts.length > 0 &&
            typeof llmResult.candidates[0].content.parts[0].text === 'string') {
            aiMessageText = llmResult.candidates[0].content.parts[0].text;
        } else {
            console.error("Unexpected Gemini API response structure:", JSON.stringify(llmResult, null, 2));
        }
        
        // --- Step 8: Send the AI's message back to your webpage ---
        return {
            statusCode: 200, // OK
            body: JSON.stringify({ aiMessage: aiMessageText }) // Format: { "aiMessage": "..." }
        };

    } catch (error) {
        console.error("Error executing the serverless function (e.g., fetch failed):", error);
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ error: `Function execution error: ${error.message}` }) // Format: { "error": "..." }
        };
    }
};
```

**Reminder for this code:**
* Make sure your environment variable in Netlify is named `GEMINI_API_KEY` and contains your valid API key.
* This code is set up to call the `gemini-1.5-flash-latest` model. You can change `geminiModelName` if you want to test a different Gemini model (like `gemini-2.0-flash` if that's what you were looking at earlier, but ensure it's available via the API and your key has access).
* The persona instruction is added as an initial "user" message, followed by a "model" acknowledgment. This is a common way to set context for Gemini chat models.

After you update this file in your GitHub repository, Netlify should automatically redeploy the function. Then you can test from your `https://mythosforgeai.netlify.app/` page. Remember to check your Netlify function logs and browser console for any errors if things don't work as expect
