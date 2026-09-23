"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Wait a moment for auth context to update
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error: any) {
      setError("Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8 bg-theme">
      <div className="flex w-full max-w-6xl h-[600px] rounded-3xl overflow-hidden glass-panel">
        
        {/* Left Side (Text/Branding) */}
        <div className="hidden md:flex flex-col justify-center p-12 w-1/2 text-white">
          <div className="flex items-center gap-2 mb-8">
            <BarChart3 className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold">SubscriptionTracker</h1>
          </div>
          <h2 className="text-5xl font-bold leading-tight mb-4">
            All Your <br/>
            <span className="text-blue-400">Subscriptions</span> <br/>
            in One Place
          </h2>
          <p className="text-gray-300 text-lg">
            Domains • Hosting • SIM • Software<br/>
            Track it all. Stay in control.
          </p>
        </div>

        {/* Right Side (Login Form) */}
        <div className="flex w-full md:w-1/2 items-center justify-center p-8 relative">
          
          <div className="w-full max-w-md glass rounded-3xl p-8 sm:p-10 relative z-10 text-white">
            <div className="flex flex-col items-center mb-8">
              <BarChart3 className="h-10 w-10 text-blue-400 mb-2 md:hidden" />
              <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
              <p className="text-white/60 text-center">Sign in to continue managing your subscriptions</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              {error && <div className="text-sm font-medium text-red-300 bg-red-900/30 p-3 rounded-lg border border-red-500/30 text-center">{error}</div>}
              
              <div className="space-y-1.5 relative">
                <div className="absolute left-3 top-3 text-white/50">
                  <Mail className="h-5 w-5" />
                </div>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Email address" 
                  required 
                  className="glass-input pl-10 h-12 rounded-xl border-white/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-1.5 relative">
                <div className="absolute left-3 top-3 text-white/50">
                  <Lock className="h-5 w-5" />
                </div>
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password"
                  required 
                  className="glass-input pl-10 pr-10 h-12 rounded-xl border-white/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  className="absolute right-3 top-3 text-white/50 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl glass-button text-base mt-4" disabled={loading}>
                {loading ? "Signing in..." : "Sign in →"}
              </Button>
            </form>
          </div>
        </div>
        
      </div>
    </div>
  );
}
