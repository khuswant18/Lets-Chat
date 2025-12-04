# Let's Chat - Real-time Socket.IO Chat Application

A modern, real-time chat application built with Next.js 15, Socket.IO, and Firebase Authentication.

## 🚀 Features

- **Real-time messaging** with Socket.IO
- **Firebase Authentication** (Email/Password & Google Sign-in)
- **Responsive design** with Tailwind CSS
- **Multiple user support** in chat rooms
- **Online user tracking** and notifications
- **Typing indicators** and user join/leave notifications
- **Modern UI** with beautiful gradients and animations

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Backend:** Socket.IO Server with Node.js
- **Authentication:** Firebase Auth
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project (for authentication)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/khuswant18/Lets-Chat.git
cd Lets-Chat
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Firebase
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication with Email/Password and Google providers
3. Create a web app and copy the config
4. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing the Chat

### Option 1: Full Application (with Authentication)
1. Open http://localhost:3000
2. Sign up/Login with different accounts in multiple browser windows
3. Navigate to the chat page and start messaging

### Option 2: Quick Test (without Authentication)
1. Open `test-chat.html` in your browser
2. Open multiple tabs/windows of the test page
3. Enter different usernames and click "Connect"
4. Start chatting in real-time!

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── chat/              # Chat page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth/             # Authentication forms
│   ├── ui/               # Reusable UI components
│   └── icons/            # Icon components
├── context/               # React context providers
├── lib/                   # Utility libraries
│   ├── firebase.ts       # Firebase configuration
│   └── socketClient.ts   # Socket.IO client
├── server.mts            # Socket.IO server
└── test-chat.html        # Standalone test page
```

## 🔧 Available Scripts

- `npm run dev` - Start the Socket.IO server with Next.js
- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🌐 Socket.IO Events

### Client → Server
- `join-room` - Join a chat room
- `message` - Send a message
- `typing` - Indicate typing status

### Server → Client
- `message` - Receive a message
- `user_joined` - User joined notification
- `user_left` - User left notification
- `online_users` - Online user count update

## 🚀 Deployment

### Vercel (Frontend only)
The frontend can be deployed to Vercel, but you'll need a separate Socket.IO server.

### Full Deployment
For full functionality, deploy both the Next.js app and Socket.IO server to a platform that supports WebSockets like:
- Railway
- Render
- DigitalOcean App Platform
- AWS/Heroku with WebSocket support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Support

If you have any questions or issues, please open an issue on GitHub.

---

**Watch the video tutorial:** https://youtu.be/b79LOKfXzOk
