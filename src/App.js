import React, { useState, useRef, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase/config';
import ChatContainer from './components/ChatContainer';
import Header from './components/Header';
import InputArea from './components/InputArea';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';
import Auth from './components/Auth';
import { sendMessageToGemini } from './services/geminiService';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isPro, setIsPro] = useState(() => {
    const saved = localStorage.getItem('arivu-ai-pro');
    if (saved) {
      const proData = JSON.parse(saved);
      // Check if first month free is still valid
      if (proData.firstMonthFree && new Date() < new Date(proData.firstMonthFreeEnd)) {
        return true;
      }
      return proData.isPro || false;
    }
    return false;
  });
  const [messageCount, setMessageCount] = useState(() => {
    return parseInt(localStorage.getItem('arivu-ai-message-count') || '0');
  });
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Load user from localStorage and check Firebase auth state
  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email,
          provider: firebaseUser.providerData[0]?.providerId || 'email',
          picture: firebaseUser.photoURL
        };
        setUser(userData);
        localStorage.setItem('arivu-ai-user', JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem('arivu-ai-user');
      }
    });

    return () => unsubscribe();
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('arivu-ai-chats');
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      if (parsedChats.length > 0 && !currentChatId) {
        const firstChat = parsedChats[0];
        setCurrentChatId(firstChat.id);
        const firstChatMessages = firstChat.messages || [];
        setMessages(firstChatMessages);
        
        // Set initial message count for normal version
        if (!isPro) {
          setMessageCount(firstChatMessages.length);
          localStorage.setItem('arivu-ai-message-count', firstChatMessages.length.toString());
        }
      }
    }
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('arivu-ai-chats', JSON.stringify(chats));
    }
  }, [chats]);

  const getChatTitle = (msgs) => {
    const firstUserMessage = msgs.find(m => m.sender === 'user');
    if (firstUserMessage) {
      return firstUserMessage.text.substring(0, 30) + (firstUserMessage.text.length > 30 ? '...' : '');
    }
    return 'New Chat';
  };

  // Save current chat messages
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages, title: getChatTitle(messages) }
          : chat
      ));
      
      // Update message count for normal version
      if (!isPro) {
        const currentChat = chats.find(c => c.id === currentChatId);
        const totalMessages = messages.length;
        setMessageCount(totalMessages);
        localStorage.setItem('arivu-ai-message-count', totalMessages.toString());
      }
    }
  }, [messages, currentChatId, isPro, chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message, files = []) => {
    if (!message.trim() && files.length === 0) return;

    // Check message limits for normal version
    if (!isPro) {
      const currentChat = currentChatId ? chats.find(c => c.id === currentChatId) : null;
      const chatMessageCount = currentChat ? (currentChat.messages?.length || 0) : messages.length;
      
      if (chatMessageCount >= 5) {
        alert('You have reached the message limit (5 messages) for the free version. Upgrade to Pro for unlimited messages!');
        return;
      }
    }

    const userMessage = {
      id: Date.now(),
      text: message || (files.length > 0 ? `[Attached ${files.length} file(s)]` : ''),
      sender: 'user',
      timestamp: new Date(),
      files: files.map(f => ({ name: f.name, type: f.type }))
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare chat history
      const history = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Detect tool mode from message
      let toolMode = null;
      if (message.includes('[WEB_SEARCH_MODE]')) {
        toolMode = 'web-search';
        message = message.replace('[WEB_SEARCH_MODE]', '').trim();
      } else if (message.includes('[DEEP_LEARNING_MODE]')) {
        toolMode = 'deep-learning';
        message = message.replace('[DEEP_LEARNING_MODE]', '').trim();
      } else if (message.includes('[STUDY_MODE]')) {
        toolMode = 'study-mode';
        message = message.replace('[STUDY_MODE]', '').trim();
      }
      
      // Send message directly to Gemini API
      const data = await sendMessageToGemini(
        message || 'Please analyze the attached files.',
        history,
        files,
        toolMode
      );

      if (data.success && data.message) {
        const aiMessage = {
          id: Date.now() + 1,
          text: data.message,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error:', error);
      let errorText = 'Sorry, I encountered an error. Please try again.';
      
      if (error.message) {
        errorText = error.message;
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const newChat = () => {
    // Check chat limit for normal version (5 chats allowed)
    if (!isPro && chats.length >= 5) {
      alert('You can only have 5 chats in the free version. Upgrade to Pro for unlimited chats!');
      return;
    }
    
    const newChatId = Date.now();
    const newChat = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    setMessages([]);
    
    // Reset message count for normal version
    if (!isPro) {
      setMessageCount(0);
      localStorage.setItem('arivu-ai-message-count', '0');
    }
    
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const selectChat = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      const chatMessages = chat.messages || [];
      setMessages(chatMessages);
      
      // Update message count for normal version
      if (!isPro) {
        setMessageCount(chatMessages.length);
        localStorage.setItem('arivu-ai-message-count', chatMessages.length.toString());
      }
      
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    }
  };

  const deleteChat = (chatId) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (currentChatId === chatId) {
      if (chats.length > 1) {
        const remainingChats = chats.filter(c => c.id !== chatId);
        if (remainingChats.length > 0) {
          setCurrentChatId(remainingChats[0].id);
          setMessages(remainingChats[0].messages || []);
        } else {
          setCurrentChatId(null);
          setMessages([]);
        }
      } else {
        setCurrentChatId(null);
        setMessages([]);
      }
    }
  };

  const clearChat = () => {
    setMessages([]);
    if (currentChatId) {
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId ? { ...chat, messages: [] } : chat
      ));
      // Reset message count for normal version
      if (!isPro) {
        setMessageCount(0);
        localStorage.setItem('arivu-ai-message-count', '0');
      }
    }
  };

  const downloadChat = async () => {
    if (messages.length === 0) return;
    
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Set up PDF styling
      doc.setFillColor(15, 15, 15);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
      
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      // Title
      doc.setTextColor(0, 212, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Arivu AI Chat Export', margin, yPos);
      yPos += 10;
      
      doc.setTextColor(136, 136, 136);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Exported: ${new Date().toLocaleString()}`, margin, yPos);
      yPos += 15;
      
      // Messages
      messages.forEach((msg, index) => {
        // Check if we need a new page
        if (yPos > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          yPos = 20;
        }
        
        const sender = msg.sender === 'user' ? 'You' : 'Arivu AI';
        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
        
        // Sender name
        if (msg.sender === 'user') {
          doc.setTextColor(0, 212, 255);
        } else {
          doc.setTextColor(255, 0, 255);
        }
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`${sender} (${timestamp})`, margin, yPos);
        yPos += 8;
        
        // Message text
        doc.setTextColor(236, 236, 241);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const lines = doc.splitTextToSize(msg.text, maxWidth);
        lines.forEach((line) => {
          if (yPos > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, margin, yPos);
          yPos += 6;
        });
        
        yPos += 10; // Space between messages
      });
      
      // Save PDF
      doc.save(`arivu-ai-chat-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to JSON if PDF generation fails
      const chatData = {
        title: getChatTitle(messages),
        messages: messages,
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arivu-ai-chat-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('arivu-ai-user', JSON.stringify(userData));
  };

  const handleSignUp = (userData) => {
    setUser(userData);
    localStorage.setItem('arivu-ai-user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('arivu-ai-user');
      setMessages([]);
      setChats([]);
      setCurrentChatId(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const handleVersionChange = (version) => {
    const isProVersion = version === 'pro';
    setIsPro(isProVersion);
    
    if (isProVersion) {
      // First month free
      const firstMonthFreeEnd = new Date();
      firstMonthFreeEnd.setMonth(firstMonthFreeEnd.getMonth() + 1);
      localStorage.setItem('arivu-ai-pro', JSON.stringify({
        isPro: true,
        firstMonthFree: true,
        firstMonthFreeEnd: firstMonthFreeEnd.toISOString()
      }));
    } else {
      localStorage.setItem('arivu-ai-pro', JSON.stringify({
        isPro: false
      }));
      // Reset message count when switching to normal
      setMessageCount(0);
      localStorage.setItem('arivu-ai-message-count', '0');
    }
  };

  if (!user) {
    return <Auth onLogin={handleLogin} onSignUp={handleSignUp} />;
  }

  return (
    <div className="App" data-theme={theme}>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={newChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        onSettings={() => setSettingsOpen(true)}
        user={user}
        onLogout={handleLogout}
      />
      <div className="chat-wrapper">
        <Header 
          onToggleSidebar={toggleSidebar}
          onDownloadChat={downloadChat}
          onClear={clearChat}
          user={user}
        />
        <ChatContainer 
          messages={messages} 
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
          isPro={isPro}
        />
        <InputArea 
          onSendMessage={sendMessage} 
          isLoading={isLoading}
          isPro={isPro}
        />
      </div>
      <Settings 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        isPro={isPro}
        onVersionChange={handleVersionChange}
        messageCount={messageCount}
        user={user}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;

