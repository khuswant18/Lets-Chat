"use strict";
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
// Track online users per room
const roomUsers = new Map();
app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        handle(req, res);
    });
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.NODE_ENV === "production"
                ? false
                : ["http://localhost:3000", "http://127.0.0.1:3000"],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);
        let currentRoom = null;
        let currentUsername = null;
        socket.on("join-room", ({ room, username }) => {
            // Leave previous room if any
            if (currentRoom) {
                socket.leave(currentRoom);
                const users = roomUsers.get(currentRoom);
                if (users) {
                    users.delete(socket.id);
                    if (users.size === 0) {
                        roomUsers.delete(currentRoom);
                    }
                    else {
                        io.to(currentRoom).emit("online_users", users.size);
                    }
                }
            }
            // Join new room
            socket.join(room);
            currentRoom = room;
            currentUsername = username;
            // Track user in room
            if (!roomUsers.has(room)) {
                roomUsers.set(room, new Set());
            }
            roomUsers.get(room).add(socket.id);
            console.log(`User ${username} joined room ${room}`);
            // Notify others in the room
            socket.to(room).emit("user_joined", `${username} joined the chat`);
            // Send online users count to everyone in the room
            io.to(room).emit("online_users", roomUsers.get(room).size);
        });
        socket.on("message", ({ room, message, sender }) => {
            console.log(`Message from ${sender} in room ${room}: ${message}`);
            // Broadcast to everyone in the room (including sender)
            io.to(room).emit("message", { sender, message });
        });
        socket.on("typing", ({ room }) => {
            socket.to(room).emit("typing");
        });
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
            if (currentRoom) {
                const users = roomUsers.get(currentRoom);
                if (users) {
                    users.delete(socket.id);
                    // Notify room that user left
                    if (currentUsername) {
                        socket.to(currentRoom).emit("user_left", `${currentUsername} left the chat`);
                    }
                    // Update online users count
                    if (users.size === 0) {
                        roomUsers.delete(currentRoom);
                    }
                    else {
                        io.to(currentRoom).emit("online_users", users.size);
                    }
                }
            }
        });
    });
    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.IO server is running`);
    });
});
