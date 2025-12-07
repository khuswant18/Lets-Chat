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
  room: string;
}

interface ServerToClientEvents {
  message: (data: {
    _id: string;
    sender: string;
    senderUsername: string;
    content: string;
    room: string;
    createdAt: string;
  }) => void;
  userJoined: (data: { username: string; room: string }) => void;
  userLeft: (data: { username: string; room: string }) => void;
  error: (data: { message: string }) => void;
}

interface ClientToServerEvents {
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  sendMessage: (data: MessagePayload) => void;
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
    console.log(`User connected: ${user?.username}`);

    socket.on('joinRoom', (room: string) => {
      socket.join(room);
      socket.to(room).emit('userJoined', {
        username: user?.username || 'Unknown',
        room,
      });
      console.log(`${user?.username} joined room: ${room}`);
    });

    socket.on('leaveRoom', (room: string) => {
      socket.leave(room);
      socket.to(room).emit('userLeft', {
        username: user?.username || 'Unknown',
        room,
      });
      console.log(`${user?.username} left room: ${room}`);
    });

    socket.on('sendMessage', async (data: MessagePayload) => {
      if (!user) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      const messageData = {
        _id: Date.now().toString(),
        sender: user.userId,
        senderUsername: user.username,
        content: data.content,
        room: data.room,
        createdAt: new Date().toISOString(),
      };

      // Broadcast to all clients in the room including sender
      io?.to(data.room).emit('message', messageData);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user?.username}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}
