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
                <div id="loading-indicator" class="hidden">AI is thinking...</div>
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
            const clearErrorLogButton = document.getElementById('clear-error-log-button'); // New
            const loadingIndicator = document.getElementById('loading-indicator'); // New

            // --- Element Existence Checks ---
            if (!chatOutput || !messageInput || !sendButton || !personaInput || !maxHistoryInput || !errorLogOutput || !resendButton || !rerollAIButton || !clearErrorLogButton || !loadingIndicator) {
                console.error("One or more critical UI elements are missing!");
                // Disable buttons if elements are missing
                [sendButton, resendButton, rerollAIButton, clearErrorLogButton].forEach(btn => {
                    if (btn) btn.disabled = true;
                });
                return; 
            }

            let conversationHistoryForAPI = []; 
            let lastUserMessageText = ""; 
            let lastAIResponseBubble = null; 

            // --- Local Storage Functions ---
            function saveToLocalStorage() {
                localStorage.setItem('mythosForgePersona', personaInput.value);
                localStorage.setItem('mythosForgeMaxHistory', maxHistoryInput.value);
                localStorage.setItem('mythosForgeChatHistory', JSON.stringify(conversationHistoryForAPI));
                localStorage.setItem('mythosForgeLastError', lastUserMessageText); // Save last user message too
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
                    chatOutput.innerHTML = ''; // Clear any default HTML message
                    conversationHistoryForAPI.forEach(msg => {
                        if (msg.role === 'user') {
                            displayMessage(msg.parts[0].text, 'User');
                        } else if (msg.role === 'model') {
                            displayMessage(msg.parts[0].text, 'AI');
                        }
                    });
                } else {
                     // If no history, display a default initial message
                    displayMessage("Set my persona, adjust history length, and send a message!", 'AI', 'initial-ai-message');
                }
            }
            
            // --- Display Functions ---
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

            function displayError(errorMessage, isFinal = true) { // isFinal flag for retry logic
                if (!errorLogOutput) { console.error("displayError called but errorLogOutput is not available."); return; }
                if (isFinal) { // Only display if it's the final error after retries
                    const errorElement = document.createElement('div');
                    errorElement.className = 'error-message'; 
                    errorElement.textContent = `[${new Date().toLocaleTimeString()}] ${errorMessage}`;
                    errorLogOutput.appendChild(errorElement);
                    errorLogOutput.scrollTop = errorLogOutput.scrollHeight;
                } else {
                    console.warn("Attempting retry for error:", errorMessage); // Log retry attempts
                }
            }

            // --- API Call with Retries ---
            async function fetchWithRetries(url, options, retries = 3, backoff = 1000) {
                loadingIndicator.classList.remove('hidden');
                try {
                    const response = await fetch(url, options);
                    if (!response.ok) {
                        // Specific errors to retry on
                        if ((response.status === 503 || response.status === 500 || response.status === 502 || response.status === 504) && retries > 0) {
                            displayError(`API Error (${response.status}), retrying in ${backoff / 1000}s... (${retries} left)`, false);
                            await new Promise(resolve => setTimeout(resolve, backoff));
                            return fetchWithRetries(url, options, retries - 1, backoff * 2); // Exponential backoff
                        }
                        // For other non-ok responses, or if retries exhausted, treat as final error
                        const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}: ${response.statusText}` }));
                        throw errorData; // Throw an object that can be caught and parsed
                    }
                    return await response.json();
                } catch (error) { // Catches network errors and errors thrown from non-ok responses
                    if (retries > 0 && (error.message.includes('Failed to fetch') || error.name === 'AbortError')) { // Retry on network errors
                        displayError(`Network Error, retrying in ${backoff / 1000}s... (${retries} left)`, false);
                        await new Promise(resolve => setTimeout(resolve, backoff));
                        return fetchWithRetries(url, options, retries - 1, backoff * 2);
                    }
                    console.error("Fetch with retries final error:", error);
                    throw error; // Re-throw final error to be caught by getAIResponse
                } finally {
                    // This might hide too soon if retries are quick. Better to hide in getAIResponse.
                    // loadingIndicator.classList.add('hidden'); 
                }
            }

            async function getAIResponse(userMessageTextForAPI, isContinuation = false) {
                if (!isContinuation) {
                    conversationHistoryForAPI.push({ role: "user", parts: [{ text: userMessageTextForAPI }] });
                }
                saveToLocalStorage(); // Save history including new user message

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

                loadingIndicator.classList.remove('hidden'); // Show loading indicator

                try {
                    const payloadToProxy = {
                        history: historyToSend, 
                        persona: personaValue 
                    };

                    const result = await fetchWithRetries(yourNetlifyProxyUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', },
                        body: JSON.stringify(payloadToProxy)
                    });
                    
                    if (result.aiMessage) {
                        const aiResponseText = result.aiMessage;
                        displayMessage(aiResponseText, 'AI', `ai-${Date.now()}`);
                        conversationHistoryForAPI.push({ role: "model", parts: [{ text: aiResponseText }] });
                    } else if (result.error) { // Error successfully returned from proxy
                        console.error("Error message from proxy function:", result.error);
                        displayError(`Error from AI service: ${result.error}`); 
                    } else { // Unexpected success structure from proxy
                        console.error("Unexpected response structure from proxy:", result);
                        displayError("Received an unexpected response from the AI service."); 
                    }
                } catch (error) { // Catches final error from fetchWithRetries or other errors
                    console.error("Final error after retries or other issue in getAIResponse:", error);
                    const errorMessage = error.error || error.message || "An unknown error occurred.";
                    displayError(errorMessage); 
                } finally {
                    loadingIndicator.classList.add('hidden'); // Hide loading indicator
                    saveToLocalStorage(); // Save history including AI response or after error
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
                    // The lastUserMessageText should be the last 'user' entry if AI failed or we want to retry.
                    // Call getAIResponse with isContinuation = true, which assumes lastUserMessageText is already
                    // correctly the last 'user' part of conversationHistoryForAPI that needs a response.
                    // No new user message is displayed in the UI for this action.
                    getAIResponse(lastUserMessageText, true); 
                } else {
                    displayError("No last user message to resend.");
                }
            }

            function handleRerollAI() {
                if (conversationHistoryForAPI.length < 1) { 
                    displayError("Not enough history to identify user message for AI reroll.");
                    return;
                }
                
                let lastUserMessageForRerollText = null;
                let lastAiBubbleToRemove = lastAIResponseBubble; 

                if (conversationHistoryForAPI.length >= 2 && 
                    conversationHistoryForAPI[conversationHistoryForAPI.length - 1].role === 'model' &&
                    conversationHistoryForAPI[conversationHistoryForAPI.length - 2].role === 'user') {
                    
                    lastUserMessageForRerollText = conversationHistoryForAPI[conversationHistoryForAPI.length - 2].parts[0].text;
                    conversationHistoryForAPI.pop(); // Remove last AI response

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
                            if (lastBubble !== initialAiBubble) { // Don't remove initial greeting
                                chatOutput.removeChild(lastBubble);
                            }
                        }
                    }
                    console.log("Rerolling AI response for user message:", lastUserMessageForRerollText);
                    getAIResponse(lastUserMessageForRerollText, true); 
                } else {
                    displayError("Could not determine user message for AI reroll.");
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

            // --- Load from Local Storage on Page Load ---
            loadFromLocalStorage();

            // --- Save to Local Storage on Input Change ---
            if(personaInput) personaInput.addEventListener('blur', saveToLocalStorage);
            if(maxHistoryInput) maxHistoryInput.addEventListener('change', saveToLocalStorage);


        });
    </script>
</body>
</html>
```

**Summary of Key Changes in this Version:**

1.  **HTML Additions:**
    * `<div id="loading-indicator" class="hidden">AI is thinking...</div>` (placed above the chat output).
    * `<button id="clear-error-log-button"...>Clear Log</button>` added in the settings sidebar.
    * Made the error log container `flex-1` within its new parent `div` so it uses available space better if many errors.
2.  **JavaScript Additions & Modifications:**
    * **`loadingIndicator` and `clearErrorLogButton` elements fetched.**
    * **`saveToLocalStorage()` function:** Saves persona, max history, current chat history, and last user message.
    * **`loadFromLocalStorage()` function:** Loads these values on page start and re-renders the chat history. The initial hardcoded AI message in HTML is removed; it's now added by `loadFromLocalStorage` if no history exists.
    * **`fetchWithRetries()` function:**
        * A new async helper function that wraps the `fetch` call.
        * Takes `url`, `options`, `retries` (default 3), and `backoff` (default 1s) as parameters.
        * If the response is not `ok` and the status code is retryable (500, 503, 502, 504), it waits with exponential backoff and tries again.
        * Also retries on network errors (`Failed to fetch`, `AbortError`).
        * Displays non-final errors to the console (or a "retrying" message to `displayError` with `isFinal=false`).
        * Returns the final parsed JSON result or throws the final error.
    * **Modified `getAIResponse()`:**
        * Now calls `await fetchWithRetries(...)` instead of `await fetch(...)`.
        * Shows/hides the `loadingIndicator` at the start and end (in `finally` block) of the API call process.
        * Error handling now mainly deals with the *final* error passed from `fetchWithRetries` and calls `displayError` with `isFinal=true`.
        * Calls `saveToLocalStorage()` after adding user message and after AI response/error.
    * **Modified `displayError(errorMessage, isFinal = true)`:** Added an `isFinal` parameter. Only appends to the visual error log if `isFinal` is true. Logs retry attempts to the console.
    * **`handleClearErrorLog()` function:** Clears the `errorLogOutput.innerHTML`.
    * Event listener for `clearErrorLogButton`.
    * Event listeners on `personaInput` and `maxHistoryInput` to save changes to local storage (`blur` for persona, `change` for max history).

This version is significantly more robust for testing. The local storage will be a big help for you, and the retry logic should make dealing with transient API errors much smoother. The loading indicator also improves the user experien
