import React, { useState, useRef, useEffect } from 'react';
import './Message.css';

const Message = ({ message, isPro }) => {
  const isUser = message.sender === 'user';
  const isError = message.isError;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleSpeak = () => {
    if (!synthRef.current) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    } else {
      // Get available voices and select the best one
      const voices = synthRef.current.getVoices();
      let selectedVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('Enhanced'))
      ) || voices.find(voice => voice.lang.startsWith('en-US')) || voices[0];

      const utterance = new SpeechSynthesisUtterance(message.text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly slower for better clarity
      utterance.pitch = 1;
      utterance.volume = 1;
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };

      // Cancel any ongoing speech before starting new one
      synthRef.current.cancel();
      synthRef.current.speak(utterance);
    }
  };

  // Load voices when component mounts
  useEffect(() => {
    if (synthRef.current) {
      // Some browsers load voices asynchronously
      const loadVoices = () => {
        const voices = synthRef.current.getVoices();
        if (voices.length > 0) {
          // Voices loaded
        }
      };
      
      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'ai'}`}>
      <div className={`message ${isError ? 'error' : ''}`}>
        {!isUser && (
          <div className="message-avatar">
            <i className="bi bi-robot"></i>
          </div>
        )}
        <div className="message-content">
          <div className="message-text">
            {message.text.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < message.text.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
          <div className="message-footer">
            <div className="message-time">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            {!isUser && !isError && isPro && (
              <button
                className={`speak-btn ${isSpeaking ? 'speaking' : ''}`}
                onClick={handleSpeak}
                title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
              >
                <i className={`bi ${isSpeaking ? 'bi-pause-fill' : 'bi-volume-up'}`}></i>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;

