import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface UserPayload {
  userId: string;
  username: string;
  email: string;
}

interface MessagePayload {
  content: string;
  receiverId: string;
  receiverUsername: string;
  conversationId: string;
}

interface TypingPayload {
  receiverId: string;
  isTyping: boolean;
}

interface ServerToClientEvents {
  message: (data: {
    _id: string;
    sender: string;
    receiver: string;
    senderUsername: string;
    receiverUsername: string;
    content: string;
    conversationId: string;
    isRead: boolean;
    createdAt: string;
  }) => void;
  typing: (data: { userId: string; username: string; isTyping: boolean }) => void;
  userOnline: (data: { userId: string; username: string }) => void;
  userOffline: (data: { userId: string; username: string }) => void;
  messageRead: (data: { conversationId: string; readBy: string }) => void;
  error: (data: { message: string }) => void;
  onlineUsers: (userIds: string[]) => void;
}

interface ClientToServerEvents {
  sendMessage: (data: MessagePayload) => void;
  typing: (data: TypingPayload) => void;
  markAsRead: (data: { conversationId: string; senderId: string }) => void;
  getOnlineUsers: () => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  user: UserPayload;
}

let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map<string, Set<string>>();

function addUserSocket(userId: string, socketId: string) {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId)!.add(socketId);
}

function removeUserSocket(userId: string, socketId: string) {
  const userSockets = onlineUsers.get(userId);
  if (userSockets) {
    userSockets.delete(socketId);
    if (userSockets.size === 0) {
      onlineUsers.delete(userId);
      return true; // User is now offline
    }
  }
  return false;
}

function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}

export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    if (!user) return;

    console.log(`User connected: ${user.username}`);

    // Join user's personal room for direct messages
    socket.join(user.userId);
    
    // Track online status
    const wasOffline = !onlineUsers.has(user.userId);
    addUserSocket(user.userId, socket.id);

    // Notify others that user is online
    if (wasOffline) {
      socket.broadcast.emit('userOnline', {
        userId: user.userId,
        username: user.username,
      });
    }

    // Send current online users to the newly connected client
    socket.emit('onlineUsers', getOnlineUserIds());

    // Handle request for online users
    socket.on('getOnlineUsers', () => {
      socket.emit('onlineUsers', getOnlineUserIds());
    });

    // Handle typing indicator
    socket.on('typing', (data: TypingPayload) => {
      io?.to(data.receiverId).emit('typing', {
        userId: user.userId,
        username: user.username,
        isTyping: data.isTyping,
      });
    });

    // Handle direct message
    socket.on('sendMessage', async (data: MessagePayload) => {
      if (!user) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      const messageData = {
        _id: Date.now().toString(),
        sender: user.userId,
        receiver: data.receiverId,
        senderUsername: user.username,
        receiverUsername: data.receiverUsername,
        content: data.content,
        conversationId: data.conversationId,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      // Send to receiver
      io?.to(data.receiverId).emit('message', messageData);
      // Send back to sender for confirmation
      socket.emit('message', messageData);
    });

    // Handle message read
    socket.on('markAsRead', (data: { conversationId: string; senderId: string }) => {
      io?.to(data.senderId).emit('messageRead', {
        conversationId: data.conversationId,
        readBy: user.userId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.username}`);
      
      const isNowOffline = removeUserSocket(user.userId, socket.id);
      
      if (isNowOffline) {
        io?.emit('userOffline', {
          userId: user.userId,
          username: user.username,
        });
      }
    });
  });

  return io;
}

export function getIO() {
  return io;
}
