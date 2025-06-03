<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MythosForgeAI - Prototype</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Inter', sans-serif; 
        }
        #chat-output::-webkit-scrollbar, #error-log-output::-webkit-scrollbar {
            width: 8px;
        }
        #chat-output::-webkit-scrollbar-track, #error-log-output::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
        #chat-output::-webkit-scrollbar-thumb, #error-log-output::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
        }
        #chat-output::-webkit-scrollbar-thumb:hover, #error-log-output::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
        .chat-bubble { max-width: 80%; padding: 10px 15px; border-radius: 18px; margin-bottom: 10px; word-wrap: break-word; line-height: 1.5; }
        .user-bubble { background-color: #c8e6c9; align-self: flex-end; border-bottom-right-radius: 5px; }
        .ai-bubble { background-color: #e0e0e0; align-self: flex-start; border-bottom-left-radius: 5px; position: relative; }
        .message-container { display: flex; flex-direction: column; }
        .settings-input { padding: 10px; border: 1px solid #D1D5DB; border-radius: 8px; margin-bottom: 8px; width: 100%; box-sizing: border-box; }
        #error-log-output-container { margin-top: 10px; }
        #error-log-output {
            max-height: 100px; 
            overflow-y: auto;
            border: 1px solid #fecaca; 
            padding: 8px;
            border-radius: 8px;
            background-color: #fff5f5; 
            font-size: 0.8rem;
        }
        .error-message {
            padding: 4px;
            color: #b91c1c; 
            margin-bottom: 4px;
            word-wrap: break-word;
        }
        #loading-indicator {
            text-align: center;
            padding: 10px;
            color: #4f46e5; /* Indigo */
            font-style: italic;
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    </style>
</head>
<body class="bg-gray-200 flex flex-col items-center justify-center min-h-screen p-2 md:p-4">

    <div class="w-full max-w-4xl bg-white shadow-2xl rounded-xl flex flex-col h-[95vh] md:h-[90vh] mt-2 md:mt-0">
        <header class="bg-indigo-700 text-white p-4 rounded-t-xl flex items-center justify-between">
            <h1 class="text-xl md:text-2xl font-semibold">MythosForgeAI - Chat Prototype</h1>
            <div></div> 
        </header>

        <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div class="w-full md:w-1/3 lg:w-1/4 p-3 md:p-4 border-b md:border-b-0 md:border-r border-gray-300 bg-gray-100 flex flex-col">
                <div>
                    <label for="persona-input" class="block text-xs md:text-sm font-medium text-gray-800 mb-1">AI Persona Instructions:</label>
                    <textarea id="persona-input" rows="4" class="settings-input focus:ring-indigo-600 focus:border-indigo-600 text-sm" placeholder="e.g., You are a grumpy pirate captain..."></textarea>
                </div>
                <div class="mt-2">
                    <label for="max-history-input" class="block text-xs md:text-sm font-medium text-gray-800 mb-1">Chat History Turns to Send (Test):</label>
                    <input type="number" id="max-history-input" value="10" min="0" max="50" class="settings-input focus:ring-indigo-600 focus:border-indigo-600 text-sm w-24">
                </div>
                <div id="error-log-output-container" class="mt-4 flex-1 flex flex-col overflow-hidden">
                    <div class="flex justify-between items-center mb-1">
                        <h3 class="text-xs md:text-sm font-medium text-gray-800">Error Log:</h3>
                        <button id="clear-error-log-button" class="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded">Clear Log</button>
                    </div>
                    <div id="error-log-output" class="flex-1">
                        </div>
                </div>
            </div>

            <div class="flex-1 flex flex-col bg-white overflow-hidden">
                <div id="loading-indicator" class="hidden">AI is thinking... (Attempt 1)</div>
                <div id="chat-output" class="flex-1 p-4 md:p-6 space-y-3 overflow-y-auto message-container">
                    </div>

                <div class="bg-gray-100 p-3 md:p-4 border-t border-gray-300">
                    <div class="flex items-center space-x-2 md:space-x-3">
                        <input type="text" id="message-input" class="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none text-sm md:text-base" placeholder="Type your message...">
                        <button id="send-button" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-3 md:px-4 rounded-lg transition duration-150 ease-in-out text-sm md:text-base">
                            Send
                        </button>
                        <button id="resend-button" title="Resend last user message to AI" class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-3 md:px-4 rounded-lg transition duration-150 ease-in-out text-sm md:text-base">
                            Resend User
                        </button>
                        <button id="reroll-ai-button" title="Reroll last AI response" class="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-3 md:px-4 rounded-lg transition duration-150 ease-in-out text-sm md:text-base">
                            Reroll AI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const chatOutput = document.getElementById('chat-output');
            const messageInput = document.getElementById('message-input');
            const sendButton = document.getElementById('send-button');
            const personaInput = document.getElementById('persona-input'); 
            const maxHistoryInput = document.getElementById('max-history-input'); 
            const errorLogOutput = document.getElementById('error-log-output');
            const resendButton = document.getElementById('resend-button');
            const rerollAIButton = document.getElementById('reroll-ai-button');
            const clearErrorLogButton = document.getElementById('clear-error-log-button'); 
            const loadingIndicator = document.getElementById('loading-indicator'); 

            if (!chatOutput || !messageInput || !sendButton || !personaInput || !maxHistoryInput || !errorLogOutput || !resendButton || !rerollAIButton || !clearErrorLogButton || !loadingIndicator) {
                console.error("One or more critical UI elements are missing!");
                [sendButton, resendButton, rerollAIButton, clearErrorLogButton].forEach(btn => {
                    if (btn) btn.disabled = true;
                });
                return; 
            }

            let conversationHistoryForAPI = []; 
            let lastUserMessageText = ""; 
            let lastAIResponseBubble = null; 

            function saveToLocalStorage() {
                localStorage.setItem('mythosForgePersona', personaInput.value);
                localStorage.setItem('mythosForgeMaxHistory', maxHistoryInput.value);
                localStorage.setItem('mythosForgeChatHistory', JSON.stringify(conversationHistoryForAPI));
                localStorage.setItem('mythosForgeLastError', lastUserMessageText); 
            }

            function loadFromLocalStorage() {
                const savedPersona = localStorage.getItem('mythosForgePersona');
                const savedMaxHistory = localStorage.getItem('mythosForgeMaxHistory');
                const savedChatHistory = localStorage.getItem('mythosForgeChatHistory');
                const savedLastUserMessage = localStorage.getItem('mythosForgeLastError');

                if (savedPersona) personaInput.value = savedPersona;
                if (savedMaxHistory) maxHistoryInput.value = savedMaxHistory;
                if (savedLastUserMessage) lastUserMessageText = savedLastUserMessage;

                if (savedChatHistory) {
                    conversationHistoryForAPI = JSON.parse(savedChatHistory);
                    chatOutput.innerHTML = ''; 
                    conversationHistoryForAPI.forEach(msg => {
                        if (msg.role === 'user') {
                            displayMessage(msg.parts[0].text, 'User');
                        } else if (msg.role === 'model') {
                            displayMessage(msg.parts[0].text, 'AI');
                        }
                    });
                } else {
                    displayMessage("Set my persona, adjust history length, and send a message!", 'AI', 'initial-ai-message');
                }
            }
            
            function displayMessage(messageText, sender, messageId = null) {
                if (!chatOutput) { console.error("displayMessage called but chatOutput element is not available."); return; }
                const messageElement = document.createElement('div');
                messageElement.classList.add('chat-bubble');
                if (messageId) messageElement.dataset.messageId = messageId; 

                if (sender === 'User') {
                    messageElement.classList.add('user-bubble');
                    messageElement.textContent = `You: ${messageText}`;
                } else {
                    messageElement.classList.add('ai-bubble');
                    messageElement.textContent = `AI: ${messageText}`;
                    lastAIResponseBubble = messageElement; 
                }
                chatOutput.appendChild(messageElement);
                chatOutput.scrollTop = chatOutput.scrollHeight; 
            }

            function logToUIError(errorMessage) { // Renamed for clarity
                if (!errorLogOutput) { console.error("logToUIError called but errorLogOutput is not available."); return; }
                const errorElement = document.createElement('div');
                errorElement.className = 'error-message'; 
                errorElement.textContent = `[${new Date().toLocaleTimeString()}] ${errorMessage}`;
                errorLogOutput.appendChild(errorElement);
                errorLogOutput.scrollTop = errorLogOutput.scrollHeight;
            }

            async function fetchWithRetries(url, options, totalRetries = 3) {
                let attempt = 0;
                let currentBackoff = 1000; // Initial backoff 1 second

                while (attempt <= totalRetries) {
                    attempt++;
                    loadingIndicator.textContent = `AI is thinking... (Attempt ${attempt} of ${totalRetries + 1})`;
                    loadingIndicator.classList.remove('hidden');
                    
                    try {
                        const response = await fetch(url, options);
                        if (response.ok) {
                            return await response.json(); // Success
                        }

                        // If response is not ok, check if it's a retryable error
                        const retryableStatuses = [500, 502, 503, 504];
                        if (retryableStatuses.includes(response.status) && attempt <= totalRetries) {
                            const errorTextForConsole = await response.text().catch(() => `Status ${response.status}`);
                            console.warn(`API Error (${response.status}): ${errorTextForConsole}. Retrying in ${currentBackoff / 1000}s... (${totalRetries - attempt +1} retries left)`);
                            await new Promise(resolve => setTimeout(resolve, currentBackoff));
                            currentBackoff *= 2; // Exponential backoff
                            continue; // Go to next iteration of the while loop
                        }
                        
                        // If not retryable or retries exhausted, parse error and throw
                        const errorData = await response.json().catch(() => ({ 
                            error: `Request failed with status ${response.status}: ${response.statusText || 'Unknown server error'}` 
                        }));
                        throw errorData; // This will be caught by the outer catch block

                    } catch (networkOrThrownError) {
                        // This catches initial network errors (fetch itself fails) OR errors deliberately thrown above
                        if (attempt <= totalRetries && (networkOrThrownError.message?.includes('Failed to fetch') || networkOrThrownError.name === 'AbortError')) {
                            console.warn(`Network Error: ${networkOrThrownError.message}. Retrying in ${currentBackoff / 1000}s... (${totalRetries - attempt + 1} retries left)`);
                            await new Promise(resolve => setTimeout(resolve, currentBackoff));
                            currentBackoff *= 2;
                            continue; // Go to next iteration
                        }
                        // If retries exhausted or it's an error re-thrown from the !response.ok block
                        console.error("Fetch with retries final error:", networkOrThrownError);
                        throw networkOrThrownError; // Re-throw to be caught by getAIResponse
                    }
                }
                // Should not be reached if logic is correct, but as a fallback:
                throw new Error("Max retries reached without success.");
            }


            async function getAIResponse(userMessageTextForAPI, isContinuation = false) {
                if (!isContinuation) {
                    conversationHistoryForAPI.push({ role: "user", parts: [{ text: userMessageTextForAPI }] });
                }
                saveToLocalStorage(); 

                const yourNetlifyProxyUrl = "/.netlify/functions/llm-proxy"; 
                const personaValue = personaInput.value.trim(); 
                const maxHistoryTurns = parseInt(maxHistoryInput.value, 10) || 10; 
                const maxHistoryItems = maxHistoryTurns * 2; 

                let historyToSend = [...conversationHistoryForAPI]; 
                if (historyToSend.length > maxHistoryItems) {
                    historyToSend = historyToSend.slice(historyToSend.length - maxHistoryItems);
                }
                
                console.log("Sending persona:", personaValue);
                console.log("Sending conversation history for API call:", JSON.stringify(historyToSend, null, 2));

                // Loading indicator is now handled inside fetchWithRetries

                try {
                    const payloadToProxy = {
                        history: historyToSend, 
                        persona: personaValue 
                    };

                    const result = await fetchWithRetries(yourNetlifyProxyUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', },
                        body: JSON.stringify(payloadToProxy)
                    }); // fetchWithRetries will handle showing/hiding loading per attempt
                    
                    if (result.aiMessage) {
                        const aiResponseText = result.aiMessage;
                        displayMessage(aiResponseText, 'AI', `ai-${Date.now()}`);
                        conversationHistoryForAPI.push({ role: "model", parts: [{ text: aiResponseText }] });
                    } else if (result.error) { 
                        console.error("Error message from proxy function:", result.error);
                        logToUIError(`Error from AI service: ${result.error}`); 
                    } else { 
                        console.error("Unexpected response structure from proxy:", result);
                        logToUIError("Received an unexpected response from the AI service."); 
                    }
                } catch (error) { 
                    console.error("Final error after retries or other issue in getAIResponse:", error);
                    const errorMessage = error.error || error.message || "An unknown error occurred after retries.";
                    logToUIError(errorMessage); 
                } finally {
                    loadingIndicator.classList.add('hidden'); // Ensure loading indicator is hidden finally
                    saveToLocalStorage(); 
                }
            }

            function handleSendMessage() {
                if (!messageInput) return; 
                const messageText = messageInput.value.trim();
                if (messageText) {
                    displayMessage(messageText, 'User', `user-${Date.now()}`); 
                    lastUserMessageText = messageText; 
                    messageInput.value = ''; 
                    getAIResponse(messageText, false); 
                }
            }
            
            function handleResendMessage() {
                if (lastUserMessageText) {
                    console.log("Resending last user message to AI:", lastUserMessageText);
                    getAIResponse(lastUserMessageText, true); 
                } else {
                    logToUIError("No last user message to resend.");
                }
            }

            function handleRerollAI() {
                if (conversationHistoryForAPI.length < 1) { 
                    logToUIError("Not enough history to identify user message for AI reroll.");
                    return;
                }
                
                let lastUserMessageForRerollText = null;
                let lastAiBubbleToRemove = lastAIResponseBubble; 

                if (conversationHistoryForAPI.length >= 2 && 
                    conversationHistoryForAPI[conversationHistoryForAPI.length - 1].role === 'model' &&
                    conversationHistoryForAPI[conversationHistoryForAPI.length - 2].role === 'user') {
                    
                    lastUserMessageForRerollText = conversationHistoryForAPI[conversationHistoryForAPI.length - 2].parts[0].text;
                    conversationHistoryForAPI.pop(); 

                } else if (conversationHistoryForAPI[conversationHistoryForAPI.length - 1].role === 'user') {
                    lastUserMessageForRerollText = conversationHistoryForAPI[conversationHistoryForAPI.length - 1].parts[0].text;
                    lastAiBubbleToRemove = null; 
                }

                if (lastUserMessageForRerollText) {
                    if (lastAiBubbleToRemove && lastAiBubbleToRemove.parentNode === chatOutput) {
                        chatOutput.removeChild(lastAiBubbleToRemove);
                        lastAIResponseBubble = null; 
                    } else { 
                        const allAiBubbles = chatOutput.querySelectorAll('.ai-bubble');
                        const initialAiBubble = document.querySelector('[data-message-id="initial-ai-message"]');
                        if (allAiBubbles.length > 0) {
                            const lastBubble = allAiBubbles[allAiBubbles.length - 1];
                            if (lastBubble !== initialAiBubble) { 
                                chatOutput.removeChild(lastBubble);
                            }
                        }
                    }
                    console.log("Rerolling AI response for user message:", lastUserMessageForRerollText);
                    getAIResponse(lastUserMessageForRerollText, true); 
                } else {
                    logToUIError("Could not determine user message for AI reroll.");
                }
            }

            function handleClearErrorLog() {
                if(errorLogOutput) errorLogOutput.innerHTML = '';
            }

            // --- Event Listeners ---
            if (sendButton) sendButton.addEventListener('click', handleSendMessage);
            if (messageInput) messageInput.addEventListener('keypress', function(event) { if (event.key === 'Enter') handleSendMessage(); });
            if (resendButton) resendButton.addEventListener('click', handleResendMessage);
            if (rerollAIButton) rerollAIButton.addEventListener('click', handleRerollAI);
            if (clearErrorLogButton) clearErrorLogButton.addEventListener('click', handleClearErrorLog);

            loadFromLocalStorage();

            if(personaInput) personaInput.addEventListener('blur', saveToLocalStorage);
            if(maxHistoryInput) maxHistoryInput.addEventListener('change', saveToLocalStorage);
        });
    </script>
</body>
</html>
```

**Key Changes in this Version's JavaScript:**

1.  **Renamed `displayError` to `logToUIError`:** To be more explicit about its purpose.
2.  **Modified `fetchWithRetries(url, options, totalRetries = 3)`:**
    * It now uses a `while` loop for retries, making the attempt count clearer.
    * `loadingIndicator.textContent` is updated to show the current attempt number.
    * **Console Logging for Retries:** When a retryable error occurs (500, 502, 503, 504, or network errors like "Failed to fetch"), it logs a message to the `console.warn` like: `API Error (502): [details]. Retrying in Xs... (Y retries left)`. It does *not* call `logToUIError` during these intermediate retry attempts.
    * **Final Error Handling:** If all retries are exhausted, or if a non-retryable HTTP error occurs, it `throw`s an error object.
3.  **Modified `getAIResponse()`:**
    * The `catch` block in `getAIResponse` now catches the *final* error thrown by `fetchWithRetries`.
    * It then calls `logToUIError(errorMessage)` to display this final error in your UI error log.
4.  **Loading Indicator:** The `loadingIndicator` is shown at the start of each attempt in `fetchWithRetries` and hidden in the `finally` block of `getAIResponse` (ensuring it's hidden even if all retries fail).

**How it should work now:**

* When you send a message:
    * The "AI is thinking... (Attempt 1 of 4)" message appears.
    * If the first call to your proxy (and then to Gemini) fails with a 502:
        * You should see a warning in your **browser's developer console** (not the UI error log) indicating a retry is happening.
        * The loading indicator will update to "AI is thinking... (Attempt 2 of 4)".
        * This will repeat for up to `totalRetries` (default 3 additional attempts after the first one).
    * Only if *all* attempts fail will the final error message be displayed in your UI's "Error Log" section.

This should give you the behavior you're looking for: silent retries for transient issues, with feedback in the console, and only the final unrecoverable error shown to the user in the dedicated l
