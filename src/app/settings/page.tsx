"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { updatePassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ShieldCheck } from "lucide-react";
import Swal from 'sweetalert2';

export default function SettingsPage() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire('Error', 'Passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      Swal.fire('Error', 'Password should be at least 6 characters.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (user) {
        await updatePassword(user, newPassword);
        Swal.fire('Success', 'Your password has been updated.', 'success');
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      // If error is auth/requires-recent-login, they need to logout and login again.
      if (error.code === 'auth/requires-recent-login') {
        Swal.fire('Security Check', 'Please log out and log in again before changing your password.', 'warning');
      } else {
        Swal.fire('Error', error.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 md:p-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Settings</h1>
          <p className="text-blue-200">Manage your account and security.</p>
        </div>

        <div className="max-w-xl">
          <div className="glass rounded-3xl p-8 border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="w-40 h-40" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
              <KeyRound className="h-6 w-6 text-blue-400" />
              Change Password
            </h2>
            
            <form onSubmit={handleUpdatePassword} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <Label className="text-white/80">Account Email</Label>
                <div className="glass-input h-12 rounded-xl border-white/20 px-4 flex items-center text-white/50 bg-white/5">
                  {user?.email}
                </div>
                <p className="text-xs text-blue-300/60 ml-1">You cannot change your email address.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-pass" className="text-white/80">New Password</Label>
                <Input 
                  id="new-pass" 
                  type="password"
                  className="glass-input h-12 rounded-xl border-white/20"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pass" className="text-white/80">Confirm New Password</Label>
                <Input 
                  id="confirm-pass" 
                  type="password"
                  className="glass-input h-12 rounded-xl border-white/20"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="glass-button w-full h-12 rounded-xl mt-4" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
