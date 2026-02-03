'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
}

interface PawfessorChatProps {
  syllabusId: string;
}

// ElevenLabs Conversation interface
interface ConversationConfig {
  signedUrl: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: { message: string; source: 'user' | 'ai' }) => void;
  onError?: (error: Error) => void;
  onModeChange?: (mode: { mode: 'listening' | 'speaking' }) => void;
}

export default function PawfessorChat({ syllabusId }: PawfessorChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hey there! 🐾 I'm Pawfessor, your adorable course assistant! I've got all the deets on your syllabus - deadlines, readings, policies, you name it! What can I help you with today?",
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);

  // Connect to ElevenLabs agent
  const connectToAgent = useCallback(async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Get signed URL from backend
      const response = await fetch(`${BACKEND_URL}/api/agent/signed-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabus_id: syllabusId })
      });
      
      const data = await response.json();
      
      if (data.error || !data.signed_url) {
        // Fallback to text-only mode
        console.warn('ElevenLabs not configured, using text-only mode');
        setError('Voice features unavailable. Using text mode.');
        setIsConnecting(false);
        return;
      }
      
      // Dynamically import ElevenLabs SDK
      // @ts-ignore - Package may not be installed
      const ElevenLabsModule = await import('@elevenlabs/client').catch(() => null);
      
      if (!ElevenLabsModule) {
        console.warn('ElevenLabs SDK not available, using text-only mode');
        setError('Voice SDK not installed. Using text mode.');
        setIsConnecting(false);
        return;
      }
      
      const { Conversation } = ElevenLabsModule;
      
      // Start the conversation
      conversationRef.current = await Conversation.startSession({
        signedUrl: data.signed_url,
        onConnect: () => {
          console.log('Connected to ElevenLabs agent');
          setIsConnected(true);
          setIsConnecting(false);
        },
        onDisconnect: () => {
          console.log('Disconnected from ElevenLabs agent');
          setIsConnected(false);
        },
        onMessage: (message: { message: string; source: 'user' | 'ai' }) => {
          const newMessage: Message = {
            id: Date.now().toString(),
            role: message.source === 'user' ? 'user' : 'assistant',
            content: message.message,
            timestamp: new Date(),
            isAudio: message.source === 'ai'
          };
          setMessages(prev => [...prev, newMessage]);
        },
        onError: (error: string) => {
          console.error('ElevenLabs error:', error);
          setError('Voice connection error. Try again.');
          setIsConnecting(false);
        },
        onModeChange: (mode: { mode: 'listening' | 'speaking' }) => {
          setIsListening(mode.mode === 'listening');
          setIsSpeaking(mode.mode === 'speaking');
        }
      });
      
    } catch (err) {
      console.error('Failed to connect to agent:', err);
      setError('Could not connect to voice assistant. Using text mode.');
      setIsConnecting(false);
    }
  }, [syllabusId, isConnecting, isConnected, BACKEND_URL]);

  // Disconnect from agent
  const disconnectFromAgent = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  // Handle text message submission (fallback mode)
  const sendTextMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const query = inputText;
    setInputText('');
    
    // If connected to voice agent, send text to it
    if (isConnected && conversationRef.current) {
      // ElevenLabs handles the response
      return;
    }
    
    // Fallback: Call backend directly for text responses
    try {
      // Determine which endpoint to call based on the query
      let response: string = '';
      
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes('deadline') || lowerQuery.includes('due') || lowerQuery.includes('assignment')) {
        const res = await fetch(`${BACKEND_URL}/api/agent/tools/deadlines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syllabus_id: syllabusId, days_ahead: 14 })
        });
        const data = await res.json();
        response = formatDeadlinesResponse(data);
      } else if (lowerQuery.includes('schedule') || lowerQuery.includes('lecture') || lowerQuery.includes('lab') || lowerQuery.includes('class')) {
        const res = await fetch(`${BACKEND_URL}/api/agent/tools/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syllabus_id: syllabusId })
        });
        const data = await res.json();
        response = formatScheduleResponse(data);
      } else if (lowerQuery.includes('policy') || lowerQuery.includes('late') || lowerQuery.includes('grade')) {
        const res = await fetch(`${BACKEND_URL}/api/agent/tools/policies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syllabus_id: syllabusId, policy_type: 'all' })
        });
        const data = await res.json();
        response = formatPoliciesResponse(data);
      } else if (lowerQuery.includes('reading') || lowerQuery.includes('textbook') || lowerQuery.includes('book')) {
        const res = await fetch(`${BACKEND_URL}/api/agent/tools/readings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syllabus_id: syllabusId })
        });
        const data = await res.json();
        response = formatReadingsResponse(data);
      } else if (lowerQuery.includes('study') || lowerQuery.includes('tip') || lowerQuery.includes('help')) {
        const res = await fetch(`${BACKEND_URL}/api/agent/tools/study-tips`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syllabus_id: syllabusId, weeks_ahead: 2 })
        });
        const data = await res.json();
        response = formatStudyTipsResponse(data);
      } else {
        // Default: get course snapshot
        const res = await fetch(`${BACKEND_URL}/api/agent/tools/snapshot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syllabus_id: syllabusId })
        });
        const data = await res.json();
        response = formatSnapshotResponse(data, query);
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Optionally play audio
      if (!isMuted) {
        playAudioResponse(response);
      }
      
    } catch (err) {
      console.error('Error getting response:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Oops! 😿 I had trouble fetching that info. Could you try asking again?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Play audio response using TTS endpoint
  const playAudioResponse = async (text: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/agent/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.substring(0, 500) }) // Limit length
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        audioRef.current = new Audio(url);
        audioRef.current.play();
      }
    } catch (err) {
      console.error('TTS error:', err);
    }
  };

  // Start/stop microphone
  const toggleMicrophone = async () => {
    if (!isConnected) {
      await connectToAgent();
      return;
    }
    
    if (isListening) {
      // Stop listening
      conversationRef.current?.setVolume({ volume: 0 });
    } else {
      // Start listening
      conversationRef.current?.setVolume({ volume: 1 });
    }
  };

  // Format response helpers
  const formatDeadlinesResponse = (data: any): string => {
    if (!data.deadlines || data.deadlines.length === 0) {
      return "Great news! 🎉 You don't have any deadlines coming up in the next two weeks. Purrfect time to get ahead on your readings!";
    }
    
    let response = `📚 Here are your upcoming deadlines:\n\n`;
    data.deadlines.forEach((d: any) => {
      response += `• **${d.title}**\n`;
      response += `  Due: ${d.formatted_date}\n`;
      if (d.weight) response += `  Weight: ${d.weight}%\n`;
      response += `  (${d.days_until} days away)\n\n`;
    });
    response += "Need help planning your study time? Just ask! 🐱";
    return response;
  };

  const formatScheduleResponse = (data: any): string => {
    if (!data.schedule || data.schedule.length === 0) {
      return "I couldn't find your class schedule. 🤔 It might not be in the syllabus, or you could check with your instructor!";
    }
    
    let response = `📅 Here's your weekly class schedule:\n\n`;
    data.schedule.forEach((s: any) => {
      response += `• **${s.title}** (${s.event_type})\n`;
      response += `  ${s.day_of_week}, ${s.time_range}\n`;
      if (s.location) response += `  📍 ${s.location}\n`;
      response += '\n';
    });
    return response;
  };

  const formatPoliciesResponse = (data: any): string => {
    const policies = data.policies || {};
    let response = "📋 Here's what I found about course policies:\n\n";
    
    if (policies.late_policy) {
      response += `**Late Policy:**\n${policies.late_policy}\n\n`;
    }
    
    if (policies.grade_breakdown && policies.grade_breakdown.length > 0) {
      response += `**Grade Breakdown:**\n`;
      policies.grade_breakdown.forEach((g: any) => {
        response += `• ${g.component}: ${g.weight}\n`;
      });
      response += '\n';
    }
    
    if (Object.keys(policies).length === 0) {
      response = "I couldn't find specific policies in the syllabus. 📄 You might want to check the full document or ask your instructor!";
    }
    
    return response;
  };

  const formatReadingsResponse = (data: any): string => {
    let response = "📖 Here's what I found about course materials:\n\n";
    
    if (data.required_reading) {
      response += `**Required Reading:**\n${data.required_reading}\n\n`;
    }
    
    if (data.citations && data.citations.length > 0) {
      response += `**Textbooks & References:**\n`;
      data.citations.forEach((c: any) => {
        response += `• ${c.title}`;
        if (c.author) response += ` by ${c.author}`;
        if (c.isbn) response += ` (ISBN: ${c.isbn})`;
        response += '\n';
      });
    }
    
    if (!data.required_reading && (!data.citations || data.citations.length === 0)) {
      response = "I couldn't find specific reading materials listed. 📚 Check with your instructor for the required texts!";
    }
    
    return response;
  };

  const formatStudyTipsResponse = (data: any): string => {
    let response = "🎓 Here are some study tips for you:\n\n";
    
    if (data.workload_summary) {
      response += `${data.workload_summary}\n\n`;
    }
    
    if (data.priority_items && data.priority_items.length > 0) {
      response += `**🚨 Priority Items:**\n`;
      data.priority_items.forEach((p: any) => {
        response += `• ${p.title} - due in ${p.due_in}`;
        if (p.weight) response += ` (${p.weight}%)`;
        response += '\n';
      });
      response += '\n';
    }
    
    if (data.suggestions && data.suggestions.length > 0) {
      response += `**💡 Suggestions:**\n`;
      data.suggestions.forEach((s: string) => {
        response += `${s}\n`;
      });
    }
    
    response += "\nYou've got this! 💪🐱";
    return response;
  };

  const formatSnapshotResponse = (data: any, query: string): string => {
    const snapshot = data.snapshot || {};
    
    if (Object.keys(snapshot).length === 0) {
      return "I'm not sure about that one! 🤔 Try asking about deadlines, schedule, policies, readings, or study tips. I'm here to help!";
    }
    
    let response = `📋 **${snapshot.course_title || 'Course Info'}**\n\n`;
    
    if (snapshot.course_code) response += `Course Code: ${snapshot.course_code}\n`;
    if (snapshot.instructor) response += `Instructor: ${snapshot.instructor}\n`;
    if (snapshot.term) response += `Term: ${snapshot.term}\n`;
    
    if (snapshot.office_hours && (snapshot.office_hours.days || snapshot.office_hours.times)) {
      response += `\n**Office Hours:**\n`;
      if (snapshot.office_hours.days) response += `Days: ${snapshot.office_hours.days}\n`;
      if (snapshot.office_hours.times) response += `Time: ${snapshot.office_hours.times}\n`;
      if (snapshot.office_hours.location) response += `Location: ${snapshot.office_hours.location}\n`;
    }
    
    if (snapshot.description) {
      response += `\n**Course Description:**\n${snapshot.description.substring(0, 300)}...\n`;
    }
    
    response += "\n🐱 Ask me about deadlines, schedule, or policies for more details!";
    return response;
  };

  // Close modal and cleanup
  const handleClose = async () => {
    setIsOpen(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    // Keep connection alive for quick reopening
  };

  // Handle key press in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  return (
    <>
      {/* Floating Pawfessor Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 z-50 transition-all duration-300 hover:scale-110 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Open Pawfessor Chat"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
          
          {/* Cat button */}
          <div 
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
            style={{ 
              background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 50%, #6d28d9 100%)',
              boxShadow: '0 4px 20px rgba(147, 51, 234, 0.5)'
            }}
          >
            <img 
              src="/assets/images/purple-pawfessor-side.png" 
              alt="Pawfessor" 
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain transform -scale-x-100"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
            />
          </div>
          
          {/* Notification dot */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-white animate-bounce" />
        </div>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div 
          className={`fixed z-50 transition-all duration-300 ease-out ${
            isExpanded 
              ? 'inset-4 sm:inset-8' 
              : 'bottom-6 left-6 w-[calc(100%-3rem)] sm:w-96 h-150'
          }`}
        >
          <div 
            className="h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-purple-300"
            style={{ 
              background: 'linear-gradient(180deg, #faf5ff 0%, #f3e8ff 100%)',
              boxShadow: '0 25px 50px -12px rgba(147, 51, 234, 0.4)'
            }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 border-b border-purple-200"
              style={{ background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <img 
                    src="/assets/images/purple-pawfessor-side.png" 
                    alt="Pawfessor" 
                    className="w-8 h-8 object-contain transform -scale-x-100"
                  />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg" style={{ fontFamily: 'Chewie, sans-serif' }}>
                    Pawfessor
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <span className="text-white/80 text-xs">
                      {isConnected ? 'Voice ready' : isConnecting ? 'Connecting...' : 'Text mode'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Expand/Collapse button */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isExpanded ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    )}
                  </svg>
                </button>
                
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2 text-yellow-800 text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-auto text-yellow-600 hover:text-yellow-800">✕</button>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md shadow-md border border-purple-100'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🐱</span>
                        {message.isAudio && <span className="text-xs text-purple-500">🔊</span>}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className={`text-xs mt-1 block ${message.role === 'user' ? 'text-purple-200' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-purple-100 bg-white/50">
              {['📅 Deadlines', '🗓️ Schedule', '📋 Policies', '💡 Study Tips'].map((action) => (
                <button
                  key={action}
                  onClick={() => {
                    setInputText(action.slice(3)); // Remove emoji
                    setTimeout(() => sendTextMessage(), 100);
                  }}
                  className="shrink-0 px-3 py-1.5 text-xs rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors whitespace-nowrap"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-purple-200 bg-white">
              <div className="flex items-center gap-2">
                {/* Mute button */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-gray-200 text-gray-500' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about deadlines, schedule, policies..."
                  className="flex-1 px-4 py-2 rounded-full border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm"
                />

                {/* Mic button */}
                <button
                  onClick={toggleMicrophone}
                  disabled={isConnecting}
                  className={`p-3 rounded-full transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : isSpeaking
                        ? 'bg-green-500 text-white'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-label={isListening ? 'Stop listening' : 'Start voice'}
                >
                  {isConnecting ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : isListening ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>

                {/* Send button */}
                <button
                  onClick={sendTextMessage}
                  disabled={!inputText.trim()}
                  className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              
              {/* Voice status indicator */}
              {(isListening || isSpeaking) && (
                <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                  {isListening && (
                    <span className="flex items-center gap-1 text-red-500">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Listening...
                    </span>
                  )}
                  {isSpeaking && (
                    <span className="flex items-center gap-1 text-green-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Speaking...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
