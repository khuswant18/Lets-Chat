'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  senderUsername: string;
  receiverUsername: string;
  content: string;
  conversationId: string;
  isRead: boolean;
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  isOnline?: boolean;
  lastSeen?: string;
  avatar?: string;
}

interface TypingUser {
  userId: string;
  username: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createConversationId = useCallback((userId1: string, userId2: string): string => {
    return [userId1, userId2].sort().join('_');
  }, []);

  const fetchMessages = useCallback(async (receiverId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setMessagesLoading(true);
    try {
      const response = await fetch(`/api/messages?receiverId=${receiverId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages);
        
        // Clear unread count for this conversation
        if (currentUser) {
          const convId = createConversationId(currentUser._id, receiverId);
          setUnreadCounts(prev => {
            const newMap = new Map(prev);
            newMap.delete(convId);
            return newMap;
          });
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, [currentUser, createConversationId]);

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/users?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
      
      // Fetch users
      fetchUsers();

      // Check if Socket.io should be disabled (e.g., in Vercel production)
      const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
      
      if (!isProduction) {
        // Initialize Socket.io connection for development
        const socket = io({
          auth: { token },
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Connected to WebSocket');
          setConnected(true);
          socket.emit('getOnlineUsers');
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from WebSocket');
          setConnected(false);
        });

        socket.on('onlineUsers', (userIds: string[]) => {
          setOnlineUserIds(new Set(userIds));
        });

        socket.on('userOnline', ({ userId }) => {
          setOnlineUserIds(prev => new Set([...prev, userId]));
          fetchUsers();
        });

        socket.on('userOffline', ({ userId }) => {
          setOnlineUserIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
          fetchUsers();
        });

        socket.on('message', (message: Message) => {
          setMessages((prev) => {
            if (prev.some((m) => m._id === message._id)) {
              return prev;
            }
            return [...prev, message];
          });

          if (message.sender !== parsedUser._id) {
            setUnreadCounts(prev => {
              const newMap = new Map(prev);
              const currentCount = newMap.get(message.conversationId) || 0;
              newMap.set(message.conversationId, currentCount + 1);
              return newMap;
            });
          }
        });

        socket.on('typing', ({ userId, username, isTyping }) => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            if (isTyping) {
              newMap.set(userId, { userId, username });
            } else {
              newMap.delete(userId);
            }
            return newMap;
          });
        });

        socket.on('messageRead', ({ conversationId }) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.conversationId === conversationId && !msg.isRead
                ? { ...msg, isRead: true }
                : msg
            )
          );
        });

        socket.on('error', ({ message }) => {
          setError(message);
        });
      } else {
        // Production mode (Vercel) - disable Socket.io
        console.log('Running in production mode - Socket.io disabled');
        setConnected(false);
      }

      setLoading(false);

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    } catch {
      router.push('/login');
    }
  }, [router, fetchUsers]);

  // Fetch messages when selecting a user
  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);
      
      // Mark messages as read
      if (socketRef.current && currentUser) {
        const conversationId = createConversationId(currentUser._id, selectedUser._id);
        socketRef.current.emit('markAsRead', {
          conversationId,
          senderId: selectedUser._id,
        });
      }
    }
  }, [selectedUser, fetchMessages, currentUser, createConversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !selectedUser || !currentUser) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setSending(true);
    setError('');

    const conversationId = createConversationId(currentUser._id, selectedUser._id);

    try {
      // Save to database
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          receiverId: selectedUser._id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add message to local state
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        
        // Also broadcast via WebSocket for real-time delivery
        if (socketRef.current?.connected) {
          socketRef.current.emit('sendMessage', {
            content: newMessage.trim(),
            receiverId: selectedUser._id,
            receiverUsername: selectedUser.username,
            conversationId,
          });
        }

        // Stop typing indicator
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        socketRef.current?.emit('typing', {
          receiverId: selectedUser._id,
          isTyping: false,
        });
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!selectedUser || !socketRef.current) return;

    // Emit typing indicator
    socketRef.current.emit('typing', {
      receiverId: selectedUser._id,
      isTyping: true,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', {
        receiverId: selectedUser._id,
        isTyping: false,
      });
    }, 2000);
  };

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredUsers = users.filter(user => {
    if (!user || !user.username || !user.email) return false;
    const query = searchQuery.toLowerCase();
    return user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);
  });

  const isTypingToMe = selectedUser && typingUsers.has(selectedUser._id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} flex-shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">Lets Chat</h1>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No users found' : 'No users available'}
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isOnline = onlineUserIds.has(user._id);
              const conversationId = currentUser ? createConversationId(currentUser._id, user._id) : '';
              const unreadCount = unreadCounts.get(conversationId) || 0;
              const isSelected = selectedUser?._id === user._id;

              return (
                <div
                  key={user._id}
                  onClick={() => {
                    setSelectedUser(user);
                    // Clear unread count
                    if (currentUser) {
                      const convId = createConversationId(currentUser._id, user._id);
                      setUnreadCounts(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(convId);
                        return newMap;
                      });
                    }
                  }}
                  className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-700 transition-colors ${
                    isSelected ? 'bg-gray-700' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                      {getInitials(user.username)}
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-gray-800 rounded-full"></span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{user.username}</h3>
                      {unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {isOnline ? 'Online' : user.lastSeen ? formatLastSeen(user.lastSeen) : 'Offline'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Current User */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
              {currentUser ? getInitials(currentUser.username) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{currentUser?.username}</h3>
              <p className="text-sm text-gray-400 truncate">{currentUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Sidebar Button (Mobile) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg text-white"
        title="Toggle sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Toggle sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                  {getInitials(selectedUser.username)}
                </div>
                {onlineUserIds.has(selectedUser._id) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate">{selectedUser.username}</h2>
                <p className="text-sm text-gray-400">
                  {isTypingToMe ? (
                    <span className="text-indigo-400">typing...</span>
                  ) : onlineUserIds.has(selectedUser._id) ? (
                    'Online'
                  ) : selectedUser.lastSeen ? (
                    `Last seen ${formatLastSeen(selectedUser.lastSeen)}`
                  ) : (
                    'Offline'
                  )}
                </p>
              </div>

              {/* Chat Actions */}
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" title="Voice call">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" title="Video call">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" title="More options">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Start the conversation with {selectedUser.username}!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwn = message.sender === currentUser?._id;
                    const showAvatar = index === 0 || messages[index - 1].sender !== message.sender;
                    const showTime = index === messages.length - 1 || 
                      messages[index + 1].sender !== message.sender ||
                      new Date(messages[index + 1].createdAt).getTime() - new Date(message.createdAt).getTime() > 60000;

                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end gap-2 max-w-xs md:max-w-md lg:max-w-lg ${isOwn ? 'flex-row-reverse' : ''}`}>
                          {!isOwn && showAvatar && (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold">
                              {getInitials(selectedUser.username)}
                            </div>
                          )}
                          {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

                          <div>
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isOwn
                                  ? 'bg-indigo-600 text-white rounded-br-md'
                                  : 'bg-gray-700 text-white rounded-bl-md'
                              }`}
                            >
                              <p className="break-words whitespace-pre-wrap">{message.content}</p>
                            </div>
                            {showTime && (
                              <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : ''}`}>
                                <span>{formatTime(message.createdAt)}</span>
                                {isOwn && (
                                  <span>
                                    {message.isRead ? (
                                      <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
            )}
            </div>

            {/* Typing Indicator */}
            {isTypingToMe && (
              <div className="px-4 py-2 bg-gray-800 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-150"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-300"></span>
                  </span>
                  {selectedUser.username} is typing...
                </span>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
              {error && (
                <div className="mb-2 text-sm text-red-500">{error}</div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Add emoji"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Attach file"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 text-gray-500">
            <svg className="w-24 h-24 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome to Lets Chat</h2>
            <p className="text-center max-w-md">
              Select a user from the sidebar to start chatting.
              <br />
              Send messages, see when they&apos;re online, and get real-time updates!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
