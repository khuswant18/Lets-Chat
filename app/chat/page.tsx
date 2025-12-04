"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  LogOut,
  MessageCircle,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { logOut } from "@/lib/firebase";
import { socket } from "@/lib/socketClient";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Message {
  id: string;
  sender: string;
  senderUserId: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
}

const CHAT_ROOM = "global-chat";

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const displayName = user.displayName || user.email?.split("@")[0] || "Anonymous";
    console.log("Setting up socket connection for user:", displayName);

    socket.on("connect", () => {
      console.log("Socket connected successfully!");
      setIsConnected(true);
      socket.emit("join-room", { room: CHAT_ROOM, username: displayName });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected!");
      setIsConnected(false);
    });

    socket.on("message", (data: { sender: string; message: string }) => {
      console.log('📥 Received message:', data);
      setIsTyping(false);
      const newMessage: Message = {
        id: Date.now().toString() + Math.random(),
        sender: data.sender,
        senderUserId: data.sender,
        message: data.message,
        timestamp: new Date(),
      };
      // Only add if it's not from the current user (to avoid duplicates)
      setMessages((prev) => {
        const isDuplicate = prev.some(msg => 
          msg.message === data.message && 
          msg.sender === data.sender && 
          Date.now() - msg.timestamp.getTime() < 1000
        );
        if (isDuplicate) return prev;
        return [...prev, newMessage];
      });
    });

    socket.on("user_joined", (message: string) => {
      const newMessage: Message = {
        id: Date.now().toString() + Math.random(),
        sender: "system",
        senderUserId: "system",
        message,
        timestamp: new Date(),
        isSystem: true,
      };
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on("user_left", (message: string) => {
      const newMessage: Message = {
        id: Date.now().toString() + Math.random(),
        sender: "system",
        senderUserId: "system",
        message,
        timestamp: new Date(),
        isSystem: true,
      };
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on("online_users", (count: number) => {
      setOnlineUsers(count);
    });

    socket.on("typing", () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    });

    // Connect the socket
    socket.connect();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("message");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("online_users");
      socket.off("typing");
      socket.disconnect();
    };
  }, [user]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user || !isConnected) return;

    const displayName = user.displayName || user.email?.split("@")[0] || "Anonymous";

    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      sender: displayName,
      senderUserId: user.uid,
      message: inputMessage.trim(),
      timestamp: new Date(),
    };

    // Add message locally first for immediate feedback
    setMessages((prev) => [...prev, newMessage]);
    
    // Send to server
    console.log('📤 Sending message:', { room: CHAT_ROOM, message: inputMessage.trim(), sender: displayName });
    socket.emit("message", {
      room: CHAT_ROOM,
      message: inputMessage.trim(),
      sender: displayName,
    });
    setInputMessage("");
    inputRef.current?.focus();
  };

  const handleLogout = async () => {
    await logOut();
    router.push("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <LoadingSpinner size={48} text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "Anonymous";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <MessageCircle size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">ChatApp</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {isConnected ? (
                  <>
                    <Wifi size={12} className="text-green-500" />
                    <span className="text-green-500">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} className="text-red-500" />
                    <span className="text-red-500">Disconnected</span>
                  </>
                )}
                {onlineUsers > 0 && (
                  <span className="flex items-center gap-1 ml-2">
                    <Users size={12} />
                    {onlineUsers} online
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                {displayName[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                {displayName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Messages Area */}
          <div className="h-[calc(100vh-280px)] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <MessageCircle size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Be the first to say hello!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.isSystem
                      ? "justify-center"
                      : msg.sender === displayName
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {msg.isSystem ? (
                    <div className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400">
                      {msg.message}
                    </div>
                  ) : (
                    <div
                      className={`max-w-[75%] ${
                        msg.sender === displayName
                          ? "order-2"
                          : "order-1"
                      }`}
                    >
                      {msg.sender !== displayName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-3">
                          {msg.sender}
                        </p>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          msg.sender === displayName
                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                      <p
                        className={`text-[10px] text-gray-400 mt-1 ${
                          msg.sender === displayName ? "text-right mr-2" : "ml-3"
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-150" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-300" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
          >
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || !isConnected}
                title="Send message"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
