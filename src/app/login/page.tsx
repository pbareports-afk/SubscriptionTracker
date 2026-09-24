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
      console.error(error);
      setError(`Login failed: ${error.message || "Invalid credentials"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8 bg-theme">
      <div className="flex w-full max-w-6xl h-[600px] rounded-3xl overflow-hidden glass-panel">
        
        {/* Left Side (Text/Branding) */}
        <div className="hidden md:flex flex-col justify-center p-12 w-1/2 bg-blue-600 text-white">
          <div className="flex items-center gap-2 mb-8">
            <BarChart3 className="h-8 w-8 text-blue-200" />
            <h1 className="text-2xl font-bold">SubTracker</h1>
          </div>
          <h2 className="text-5xl font-bold leading-tight mb-4">
            All Your <br/>
            <span className="text-blue-200">Subscriptions</span> <br/>
            in One Place
          </h2>
          <p className="text-blue-100 text-lg">
            Domains • Hosting • SIM • Software<br/>
            Track it all. Stay in control.
          </p>
        </div>

        {/* Right Side (Login Form) */}
        <div className="flex w-full md:w-1/2 items-center justify-center p-8 relative bg-slate-50">
          
          <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 relative z-10 text-slate-900 border border-slate-200 shadow-md">
            <div className="flex flex-col items-center mb-8">
              <BarChart3 className="h-10 w-10 text-blue-600 mb-2 md:hidden" />
              <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
              <p className="text-slate-500 text-center">Sign in to continue managing your subscriptions</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              {error && <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-center">{error}</div>}
              
              <div className="space-y-1.5 relative">
                <div className="absolute left-3 top-3 text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Email address" 
                  required 
                  className="pl-10 h-12 rounded-xl border-slate-300 bg-slate-50 text-slate-900 focus:bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-1.5 relative">
                <div className="absolute left-3 top-3 text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password"
                  required 
                  className="pl-10 pr-10 h-12 rounded-xl border-slate-300 bg-slate-50 text-slate-900 focus:bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm text-base mt-4" disabled={loading}>
                {loading ? "Signing in..." : "Sign in →"}
              </Button>
            </form>
          </div>
        </div>
        
      </div>
    </div>
  );
}
