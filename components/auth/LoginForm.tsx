"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signInWithEmail, signInWithGoogle } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import GoogleIcon from "@/components/icons/GoogleIcon";

interface LoginFormProps {
  onToggleForm: () => void;
}

const LoginForm = ({ onToggleForm }: LoginFormProps) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { user, error: loginError } = await signInWithEmail(email, password);

    if (loginError) {
      setError(loginError);
      setIsLoading(false);
      return;
    }

    if (user) {
      router.push("/chat");
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsGoogleLoading(true);

    const { user, error: googleError } = await signInWithGoogle();

    if (googleError) {
      setError(googleError);
      setIsGoogleLoading(false);
      return;
    }

    if (user) {
      router.push("/chat");
    }
    setIsGoogleLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sign in to continue to ChatApp
        </p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <Input
          type="email"
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={18} />}
          required
        />

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={18} />}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="w-full"
        >
          Sign In
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">
            or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="google"
        onClick={handleGoogleLogin}
        isLoading={isGoogleLoading}
        icon={<GoogleIcon />}
        className="w-full"
      >
        Sign in with Google
      </Button>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <button
          onClick={onToggleForm}
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
