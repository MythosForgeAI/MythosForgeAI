// netlify/functions/llm-proxy.js

exports.handler = async function(event, context) {
    // --- Step 1: Get your secret API Key from Netlify's settings ---
    // This line MUST correctly access the environment variable you set in Netlify.
    // The KEY for the variable in Netlify settings should be 'GEMINI_API_KEY'.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("CRITICAL ERROR: GEMINI_API_KEY is not set or accessible in Netlify environment variables.");
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ error: "Server configuration error: API key is missing or not configured correctly." })
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
        console.error("Invalid JSON in request body:", event.body, error);
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ error: "Invalid JSON provided in the request." })
        };
    }

    const conversationHistoryFromFrontend = requestBody.history;
    const personaInstruction = requestBody.persona;

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

    if (conversationHistoryFromFrontend && Array.isArray(conversationHistoryFromFrontend)) {
        contentsForGemini = contentsForGemini.concat(conversationHistoryFromFrontend);
    }

    // --- Step 5: Prepare the request to the Gemini API ---
    // Ensure this model name is exactly what you intend to use and have access to.
    const geminiModelName = "gemini-1.5-flash-latest"; // Or "models/gemini-2.5-flash-preview-05-20" if you are sure (without the leading 'models/' here)
                                                     // If using "models/gemini-2.5-flash-preview-05-20", the variable should be:
                                                     // const geminiModelNameForURL = "models/gemini-2.5-flash-preview-05-20";
                                                     // And the URL: `https://generativelanguage.googleapis.com/v1beta/${geminiModelNameForURL}:generateContent?key=${apiKey}`;
                                                     // Let's stick to gemini-1.5-flash-latest for now for simplicity unless you specify.

    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelName}:generateContent?key=${apiKey}`;

    const geminiPayload = {
        contents: contentsForGemini, 
        generationConfig: { 
            temperature: 0.7,
            maxOutputTokens: 500 
        }
    };
    
    console.log("Attempting to call Gemini API with URL:", geminiApiUrl); // For debugging
    console.log("Payload being sent to Gemini API:", JSON.stringify(geminiPayload, null, 2)); // For debugging

    // --- Step 6: Call the Gemini API ---
    try {
        const llmResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(geminiPayload)
        });

        const responseBodyText = await llmResponse.text(); 

        if (!llmResponse.ok) {
            console.error(`Gemini API Error (Status: ${llmResponse.status}):`, responseBodyText);
            return {
                statusCode: llmResponse.status,
                body: JSON.stringify({ error: `Gemini API request failed. Details: ${responseBodyText}` })
            };
        }

        const llmResult = JSON.parse(responseBodyText); 

        // --- Step 7: Extract the AI's message from Gemini's response ---
        let aiMessageText = "Error: Could not parse AI's response."; 
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
            body: JSON.stringify({ aiMessage: aiMessageText })
        };

    } catch (error) {
        console.error("Error executing the serverless function (e.g., fetch to Gemini failed or other JS error):", error.toString(), error.stack);
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ error: `Function execution error: ${error.message}` })
        };
    }
};
```

**Please perform these exact steps:**
1.  Go to your GitHub repository.
2.  Navigate to the file `netlify/functions/llm-proxy.js`.
3.  Click to edit it.
4.  **Delete all the existing content in that file.**
5.  **Copy the entire code block above and paste it into your `llm-proxy.js` file.**
6.  Commit the changes with a message like "Replace proxy code with known good version."
7.  Push the changes to GitHub.
8.  Wait for Netlify to complete the new deployment.
9.  Then, try testing your chat application again and check your Netlify function logs.

If there was a stray character or a typo causing that `SyntaxError`, this process of replacing the entire file content with a clean version should resolve it. The error you showed means the problem is right at the beginning when the code is first read, not when it's trying to do complex logic.

I am here to help, and I will try my best to make the steps as clear as possib
