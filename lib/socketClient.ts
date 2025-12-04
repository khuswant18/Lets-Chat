"use client";
import { io, Socket } from "socket.io-client";

// Lazy URL determination to avoid SSR issues
const getSocketURL = () => {
  if (typeof window !== 'undefined') {
    return process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:3000';
  }
  return 'http://localhost:3000'; // fallback for SSR
};

// Initialize socket with auto-connect disabled initially
export const socket: Socket = io(getSocketURL(), {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

// Add debugging
if (typeof window !== 'undefined') {
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('🔴 Socket connection error:', error);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
  });
}
