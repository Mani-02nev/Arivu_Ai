import React, { useState, useRef, useEffect } from 'react';
import Canvas from './Canvas';
import ToolsPanel from './ToolsPanel';
import './InputArea.css';

const InputArea = ({ onSendMessage, isLoading, onFileUpload, isPro }) => {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((message.trim() || attachedFiles.length > 0) && !isLoading) {
      onSendMessage(message, attachedFiles);
      setMessage('');
      setAttachedFiles([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      file,
      type: type === 'image' ? 'image' : 'file',
      name: file.name,
      size: file.size,
      preview: type === 'image' ? URL.createObjectURL(file) : null
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    const file = attachedFiles[index];
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCanvasSave = (file) => {
    const newFile = {
      file,
      type: 'image',
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file)
    };
    setAttachedFiles(prev => [...prev, newFile]);
  };

  const generateMusic = async (prompt) => {
    if (!isPro) {
      alert('Music generation is only available in Pro version!');
      return;
    }
    
    if (!prompt || !prompt.trim()) {
      alert('Please describe the music you want to generate');
      return;
    }

    // Use Gemini to generate music description/lyrics
    // Note: Actual music generation requires audio API, but we can generate music descriptions
    const musicPrompt = `Generate a detailed music description for: ${prompt}. Include genre, tempo, mood, instruments, and a short description. Format as a music composition guide.`;
    
    // This would trigger a message to Gemini with music generation context
    onSendMessage(musicPrompt, []);
  };

  const handleToolSelect = (toolId) => {
    setActiveTool(toolId);
    let toolPrompt = '';
    
    switch(toolId) {
      case 'web-search':
        toolPrompt = '[WEB_SEARCH_MODE] Please search the web for: ';
        break;
      case 'deep-learning':
        toolPrompt = '[DEEP_LEARNING_MODE] Provide advanced AI analysis for: ';
        break;
      case 'study-mode':
        toolPrompt = '[STUDY_MODE] Explain in educational detail: ';
        break;
      default:
        return;
    }
    
    setMessage(toolPrompt);
  };

  const downloadVoiceAsMP3 = async (text) => {
    if (!isPro) {
      alert('Voice MP3 download is only available in Pro version!');
      return;
    }
    
    if (!text || !text.trim()) {
      alert('Please enter text to convert to speech');
      return;
    }

    try {
      // Use Web Speech API to generate speech
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get best voice
      const voices = synth.getVoices();
      const selectedVoice = voices.find(voice =>
        voice.lang.startsWith('en') &&
        (voice.name.includes('Google') || voice.name.includes('Natural') || voice.name.includes('Enhanced'))
      ) || voices.find(voice => voice.lang.startsWith('en-US')) || voices[0];
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Note: Browser Speech Synthesis API doesn't directly support MP3 export
      // We'll use a text-to-speech service or download as WAV/WebM
      // For now, we'll create a simple audio file using Web Audio API
      
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Use a workaround: Record system audio (requires user interaction)
      // For better results, consider using a TTS API service
      
      // Simple approach: Play the speech and provide download info
      synth.speak(utterance);
      
      // Show info about conversion
      const userChoice = window.confirm(
        'Voice is playing. Browser Speech Synthesis API doesn\'t support direct MP3 export.\n\n' +
        'Options:\n' +
        '1. Use browser extensions to record the audio\n' +
        '2. Use online TTS services for MP3 download\n' +
        '3. Convert WebM to MP3 using online tools\n\n' +
        'Would you like to see alternative solutions?'
      );
      
      if (userChoice) {
        // Could open a help page or show instructions
        console.log('Consider using: Google Cloud TTS, Amazon Polly, or Azure Speech Services for MP3 export');
      }
    } catch (error) {
      console.error('Error generating voice:', error);
      alert('Error generating voice. Please check browser compatibility.');
    }
  };

  // Initialize Speech Recognition with better configuration
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Keep listening
      recognitionRef.current.interimResults = true; // Show interim results
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setMessage(prev => {
            // Remove any interim text and add final transcript
            const baseMessage = prev.replace(interimTranscript, '').trim();
            return baseMessage + (baseMessage ? ' ' : '') + finalTranscript.trim();
          });
        } else if (interimTranscript) {
          // Show interim results in real-time (temporary)
          setMessage(prev => {
            // Remove previous interim text if exists
            const baseMessage = prev.replace(/\s*\[listening\.\.\.\]\s*$/, '');
            return baseMessage + (baseMessage ? ' ' : '') + interimTranscript;
          });
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // No speech detected, continue listening
          return;
        }
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please enable microphone access in your browser settings.');
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if still in listening mode
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, message]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="input-area">
      {attachedFiles.length > 0 && (
        <div className="attached-files">
          {attachedFiles.map((file, index) => (
            <div key={index} className="attached-file-item">
              {file.type === 'image' && file.preview ? (
                <img src={file.preview} alt={file.name} className="file-preview" />
              ) : (
                <i className="bi bi-file-earmark"></i>
              )}
              <span className="file-name">{file.name}</span>
              <button 
                className="remove-file-btn"
                onClick={() => removeFile(index)}
                title="Remove file"
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-wrapper">
          <div className="input-actions">
            {isPro && (
              <>
                <button
                  type="button"
                  className={`voice-btn ${isListening ? 'listening' : ''}`}
                  onClick={toggleVoiceInput}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  <i className={`bi ${isListening ? 'bi-mic-fill' : 'bi-mic'}`}></i>
                </button>
                <button
                  type="button"
                  className="tool-btn-input"
                  onClick={() => setCanvasOpen(true)}
                  title="Open Canvas (Pro)"
                >
                  <i className="bi bi-palette"></i>
                </button>
                <button
                  type="button"
                  className="tool-btn-input"
                  onClick={() => {
                    if (message.trim()) {
                      downloadVoiceAsMP3(message);
                    } else {
                      alert('Please type a message first to convert to voice');
                    }
                  }}
                  title="Download Voice as MP3 (Pro)"
                >
                  <i className="bi bi-file-earmark-music"></i>
                </button>
                <button
                  type="button"
                  className="tool-btn-input"
                  onClick={() => {
                    const musicPrompt = window.prompt('Describe the music you want to generate:');
                    if (musicPrompt) {
                      generateMusic(musicPrompt);
                    }
                  }}
                  title="Generate Music (Pro)"
                >
                  <i className="bi bi-music-note-beamed"></i>
                </button>
                <button
                  type="button"
                  className="tool-btn-input"
                  onClick={() => setToolsOpen(true)}
                  title="AI Tools"
                >
                  <i className="bi bi-tools"></i>
                </button>
              </>
            )}
            <button
              type="button"
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              <i className="bi bi-paperclip"></i>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e, 'file')}
              style={{ display: 'none' }}
              multiple
            />
            <button
              type="button"
              className="attach-btn"
              onClick={() => imageInputRef.current?.click()}
              title="Attach image"
            >
              <i className="bi bi-image"></i>
            </button>
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'image')}
              style={{ display: 'none' }}
              multiple
            />
          </div>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="message-input"
            disabled={isLoading}
            rows={1}
          />
          <button
            type="submit"
            className="send-button"
            disabled={(!message.trim() && attachedFiles.length === 0) || isLoading}
          >
            {isLoading ? (
              <i className="bi bi-hourglass-split"></i>
            ) : (
              <i className="bi bi-send-fill"></i>
            )}
          </button>
        </div>
      </form>
      <Canvas
        isOpen={canvasOpen}
        onClose={() => setCanvasOpen(false)}
        onSave={handleCanvasSave}
        onGenerateCode={true}
        onSendMessage={onSendMessage}
      />
      <ToolsPanel
        isOpen={toolsOpen}
        onClose={() => setToolsOpen(false)}
        onSelectTool={handleToolSelect}
        isPro={isPro}
      />
    </div>
  );
};

export default InputArea;

