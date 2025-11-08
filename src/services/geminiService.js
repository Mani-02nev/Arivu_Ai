import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API keys from environment variables
const apiKey1 = process.env.REACT_APP_GEMINI_API_KEY;
const apiKey2 = process.env.REACT_APP_GEMINI_API_KEY_2;
const apiKeys = [apiKey1, apiKey2].filter(Boolean);

let genAI;
let currentApiKeyIndex = 0;

// Initialize Gemini AI
const initializeGemini = () => {
  if (apiKeys.length === 0) {
    throw new Error('No Gemini API key found. Please set REACT_APP_GEMINI_API_KEY in environment variables.');
  }
  
  if (!genAI || currentApiKeyIndex >= apiKeys.length) {
    currentApiKeyIndex = 0;
    genAI = new GoogleGenerativeAI(apiKeys[currentApiKeyIndex]);
  }
  
  return genAI;
};

// Switch to next API key if available
const switchApiKey = () => {
  if (apiKeys.length > 1) {
    currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
    genAI = new GoogleGenerativeAI(apiKeys[currentApiKeyIndex]);
    console.log(`Switched to API key ${currentApiKeyIndex + 1}`);
    return true;
  }
  return false;
};

// Get model with fallback
const getModel = () => {
  const ai = initializeGemini();
  
  // Try models in order of preference
  const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  
  for (const modelName of models) {
    try {
      return ai.getGenerativeModel({ model: modelName });
    } catch (error) {
      console.warn(`Model ${modelName} not available, trying next...`);
      continue;
    }
  }
  
  // Fallback to default
  return ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

// Convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64,
          mimeType: file.type
        }
      });
    };
    reader.onerror = (error) => reject(error);
  });
};

// Send message to Gemini with tool modes
export const sendMessageToGemini = async (message, history = [], files = [], toolMode = null) => {
  try {
    const model = getModel();
    
    // Build chat history
    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    // Prepare content parts
    const parts = [];
    
    // Add text message with tool mode context
    if (message && message.trim()) {
      let enhancedMessage = message;
      
      // Enhance message based on tool mode
      if (toolMode === 'web-search') {
        enhancedMessage = `[WEB_SEARCH_MODE] Search the web and provide current, real-time information about: ${message.replace('[WEB_SEARCH_MODE]', '').trim()}`;
      } else if (toolMode === 'deep-learning') {
        enhancedMessage = `[DEEP_LEARNING_MODE] Provide advanced AI analysis, deep insights, and comprehensive understanding of: ${message.replace('[DEEP_LEARNING_MODE]', '').trim()}`;
      } else if (toolMode === 'study-mode') {
        enhancedMessage = `[STUDY_MODE] Explain in educational detail, with examples, step-by-step breakdown, and learning tips for: ${message.replace('[STUDY_MODE]', '').trim()}`;
      }
      
      parts.push({ text: enhancedMessage });
    }
    
    // Add image files
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.type && file.type.startsWith('image/')) {
          try {
            const imagePart = await fileToBase64(file.file || file);
            parts.push(imagePart);
          } catch (error) {
            console.error('Error processing image:', error);
          }
        }
      }
    }
    
    // Start chat with history
    const chat = model.startChat({
      history: chatHistory,
    });
    
    // Send message
    const result = await chat.sendMessage(parts);
    const response = await result.response;
    const text = response.text();
    
    return {
      success: true,
      message: text
    };
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Try switching API key if quota/rate limit error
    if ((error.message?.includes('quota') || 
         error.message?.includes('429') || 
         error.message?.includes('API_KEY')) && 
        apiKeys.length > 1) {
      
      const switched = switchApiKey();
      if (switched) {
        // Retry with new API key
        try {
          const model = getModel();
          const chat = model.startChat({
            history: history.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
            }))
          });
          
          const parts = [];
          if (message && message.trim()) {
            parts.push({ text: message });
          }
          
          if (files && files.length > 0) {
            for (const file of files) {
              if (file.type && file.type.startsWith('image/')) {
                try {
                  const imagePart = await fileToBase64(file.file || file);
                  parts.push(imagePart);
                } catch (err) {
                  console.error('Error processing image:', err);
                }
              }
            }
          }
          
          const result = await chat.sendMessage(parts);
          const response = await result.response;
          const text = response.text();
          
          return {
            success: true,
            message: text
          };
        } catch (retryError) {
          console.error('Retry with alternate API key failed:', retryError);
        }
      }
    }
    
    // Return error
    let errorMessage = 'Sorry, I encountered an error. Please try again.';
    
    if (error.message) {
      if (error.message.includes('API_KEY')) {
        errorMessage = 'API key not configured. Please set REACT_APP_GEMINI_API_KEY.';
      } else if (error.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

