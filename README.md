# Lets Chat - Real-time Chat Application

A full-stack real-time chat application built with Next.js, MongoDB, Socket.io, and TypeScript.

## Features

- 🔐 User authentication (signup/login)
- 💬 Real-time messaging with WebSocket
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive design
- 🔒 JWT-based authentication
- 📦 MongoDB for data persistence

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Socket.io
- **Database:** MongoDB Atlas
- **Authentication:** JWT tokens
- **Real-time:** WebSocket with Socket.io

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier available)

### 1. Clone the repository

```bash
git clone https://github.com/khuswant18/Lets-Chat.git
cd Lets-Chat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account and cluster
3. Create a database user
4. Get your connection string from the "Connect" button
5. Update `.env.local` with your MongoDB URI:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/letschat?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 4. Run the application

#### Development mode (with WebSocket support):
```bash
npm run dev:socket
```

#### Standard Next.js development:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

1. **Sign Up:** Create a new account
2. **Login:** Sign in with your credentials
3. **Chat:** Start sending real-time messages in the general room

## API Routes

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/messages` - Fetch messages
- `POST /api/messages` - Send a message
- `GET /api/users` - Get current user info

## Project Structure

```
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/
│   │       └── signup/
│   ├── chat/
│   ├── login/
│   ├── signup/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts
│   ├── mongodb.ts
│   └── socket.ts
├── models/
│   ├── Message.ts
│   └── User.ts
├── server.ts
└── .env.local
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-secure-jwt-secret
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Local MongoDB (Alternative)

If you prefer local MongoDB:

```bash
# Install MongoDB locally
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Update .env.local
MONGODB_URI=mongodb://localhost:27017/letschat
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
