import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import { invokeFunction } from '@/lib/api';
import { 
  MessageCircle, Send, Search, ArrowLeft, User, Clock, 
  CheckCheck, Check, Plus, X, Stethoscope 
} from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  partnerId: string;
  partner: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    specialty?: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

interface Provider {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  specialty?: string;
}

const MessagingView: React.FC = () => {
  const { currentUser, userRole } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.partnerId);
      markMessagesAsRead(selectedConversation.partnerId);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const { data, error } = await invokeFunction('messaging', {
        action: 'getConversations', data: { userId: currentUser.id }
      });

      if (!error && data?.success) {
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
    setLoading(false);
  };

  const loadMessages = async (partnerId: string) => {
    if (!currentUser) return;

    try {
      const { data, error } = await invokeFunction('messaging', {
        action: 'getConversation', 
        data: { userId1: currentUser.id, userId2: partnerId } 
      });

      if (!error && data?.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    if (!currentUser) return;

    try {
      await invokeFunction('messaging', { 
        action: 'markMessagesRead', 
        data: { userId: currentUser.id, senderId } 
      });
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.partnerId === senderId ? { ...conv, unreadCount: 0 } : conv
      ));
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const sendMessage = async () => {
    if (!currentUser || !selectedConversation || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const { data, error } = await invokeFunction('messaging', { 
        action: 'sendMessage', 
        data: { 
          senderId: currentUser.id, 
          receiverId: selectedConversation.partnerId,
          content: newMessage.trim()
        } 
      });

      if (!error && data?.success) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        
        // Update conversation list
        loadConversations();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
    setSendingMessage(false);
  };

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const { data, error } = await invokeFunction('messaging', {
        action: 'getAllProviders', data: {}
      });

      if (!error && data?.success) {
        setProviders(data.providers || []);
      }
    } catch (err) {
      console.error('Error loading providers:', err);
    }
    setLoadingProviders(false);
  };

  const startNewConversation = (provider: Provider) => {
    const newConv: Conversation = {
      partnerId: provider.id,
      partner: provider,
      lastMessage: { id: '', sender_id: '', receiver_id: '', content: '', is_read: true, created_at: '' },
      unreadCount: 0
    };
    
    setSelectedConversation(newConv);
    setMessages([]);
    setShowNewChat(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const name = `${conv.partner.first_name} ${conv.partner.last_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Sign in to Message</h3>
          <p className="text-slate-400">Please sign in to access messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px] flex bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Conversations List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-700/50 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Messages</h2>
            {userRole === 'patient' && (
              <button
                onClick={() => {
                  setShowNewChat(true);
                  loadProviders();
                }}
                className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400">No conversations yet</p>
              {userRole === 'patient' && (
                <button
                  onClick={() => {
                    setShowNewChat(true);
                    loadProviders();
                  }}
                  className="mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                >
                  Start a conversation
                </button>
              )}
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.partnerId}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-slate-800/50 transition-colors border-b border-slate-700/30 ${
                  selectedConversation?.partnerId === conv.partnerId ? 'bg-slate-800/50' : ''
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                    {conv.partner.first_name[0]}{conv.partner.last_name[0]}
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white truncate">
                      {conv.partner.role === 'provider' ? 'Dr. ' : ''}{conv.partner.first_name} {conv.partner.last_name}
                    </p>
                    {conv.lastMessage.created_at && (
                      <span className="text-xs text-slate-500">{formatTime(conv.lastMessage.created_at)}</span>
                    )}
                  </div>
                  {conv.partner.specialty && (
                    <p className="text-xs text-cyan-400 truncate">{conv.partner.specialty}</p>
                  )}
                  {conv.lastMessage.content && (
                    <p className="text-sm text-slate-400 truncate">{conv.lastMessage.content}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                {selectedConversation.partner.first_name[0]}{selectedConversation.partner.last_name[0]}
              </div>
              <div>
                <p className="font-semibold text-white">
                  {selectedConversation.partner.role === 'provider' ? 'Dr. ' : ''}
                  {selectedConversation.partner.first_name} {selectedConversation.partner.last_name}
                </p>
                {selectedConversation.partner.specialty && (
                  <p className="text-sm text-cyan-400">{selectedConversation.partner.specialty}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-slate-400">No messages yet</p>
                  <p className="text-sm text-slate-500">Send a message to start the conversation</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isMine
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        <p className="break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-xs ${isMine ? 'text-white/70' : 'text-slate-500'}`}>
                            {formatTime(msg.created_at)}
                          </span>
                          {isMine && (
                            msg.is_read 
                              ? <CheckCheck className="w-3 h-3 text-white/70" />
                              : <Check className="w-3 h-3 text-white/70" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-700/50">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className={`p-3 rounded-xl transition-all ${
                    newMessage.trim() && !sendingMessage
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {sendingMessage ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
            <p className="text-slate-400">Choose a conversation from the list to start messaging</p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">New Conversation</h3>
              <button
                onClick={() => setShowNewChat(false)}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-slate-400 text-sm mb-4">Select a healthcare provider to message:</p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {loadingProviders ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-slate-700" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-700 rounded w-3/4" />
                          <div className="h-3 bg-slate-700 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : providers.length === 0 ? (
                  <div className="text-center py-8">
                    <Stethoscope className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No providers available</p>
                  </div>
                ) : (
                  providers.map(provider => (
                    <button
                      key={provider.id}
                      onClick={() => startNewConversation(provider)}
                      className="w-full p-3 flex items-center gap-3 rounded-xl hover:bg-slate-800/50 transition-colors border border-slate-700/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                        {provider.first_name[0]}{provider.last_name[0]}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white">Dr. {provider.first_name} {provider.last_name}</p>
                        {provider.specialty && (
                          <p className="text-sm text-cyan-400">{provider.specialty}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingView;
