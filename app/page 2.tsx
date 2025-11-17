
import { redirect } from 'next/navigation';

export default function Home() {
  // Check if user is authenticated on the server side
  // For now, we'll handle this on the client side in the components
  // In a production app, you'd check authentication server-side

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to Lets Chat</h1>
        <p className="text-gray-600 mt-4">
          Connect with friends and start chatting!
        </p>
        <div className="mt-8 space-y-4">
          <a
            href="/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign In
          </a>
          <a
            href="/signup"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
} 
 