'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  sender: string;
  senderUsername: string;
  content: string;
  room: string;
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();
  const room = 'general';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      setUser(parsedUser);
      
      // Fetch existing messages
      fetchMessages();

      // Initialize Socket.io connection
      const socket = io({
        auth: { token },
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to WebSocket');
        setConnected(true);
        socket.emit('joinRoom', room);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
        setConnected(false);
      });

      socket.on('message', (message: Message) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });
      });

      socket.on('userJoined', ({ username }) => {
        console.log(`${username} joined the room`);
      });

      socket.on('userLeft', ({ username }) => {
        console.log(`${username} left the room`);
      });

      socket.on('error', ({ message }) => {
        setError(message);
      });

      return () => {
        socket.emit('leaveRoom', room);
        socket.disconnect();
      };
    } catch {
      router.push('/login');
    }
  }, [router]);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages?room=general');
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setSending(true);
    setError('');

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
          room,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add message to local state
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        
        // Also broadcast via WebSocket for real-time delivery to others
        if (socketRef.current?.connected) {
          socketRef.current.emit('sendMessage', {
            content: newMessage.trim(),
            room,
          });
        }
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.emit('leaveRoom', room);
      socketRef.current.disconnect();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Lets Chat</h1>
            <p className="text-sm text-indigo-200">
              General Room {connected ? '• Connected' : '• Connecting...'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {user?.username}</span>
            <button
              onClick={handleLogout}
              className="bg-indigo-500 hover:bg-indigo-400 px-4 py-2 rounded-md text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${
                  message.sender === user?._id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                    message.sender === user?._id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 shadow'
                  }`}
                >
                  {message.sender !== user?._id && (
                    <p className="text-xs font-semibold text-indigo-600 mb-1">
                      {message.senderUsername}
                    </p>
                  )}
                  <p className="overflow-wrap-anywhere">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === user?._id
                        ? 'text-indigo-200'
                        : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-2 text-sm text-red-600">{error}</div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
