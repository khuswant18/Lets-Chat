"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      router.push("/chat");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <LoadingSpinner size={48} text="Loading..." />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
            <MessageCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ChatApp
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Real-time messaging made simple
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {isLogin ? (
            <LoginForm onToggleForm={() => setIsLogin(false)} />
          ) : (
            <SignupForm onToggleForm={() => setIsLogin(true)} />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
