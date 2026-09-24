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
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Settings</h1>
          <p className="text-slate-500">Manage your account and security.</p>
        </div>

        <div className="max-w-xl">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ShieldCheck className="w-40 h-40 text-blue-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3 relative z-10">
              <KeyRound className="h-6 w-6 text-blue-600" />
              Change Password
            </h2>
            
            <form onSubmit={handleUpdatePassword} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <Label className="text-slate-700">Account Email</Label>
                <div className="h-12 rounded-xl border border-slate-200 px-4 flex items-center text-slate-500 bg-slate-50">
                  {user?.email}
                </div>
                <p className="text-xs text-slate-400 ml-1">You cannot change your email address.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-pass" className="text-slate-700">New Password</Label>
                <Input 
                  id="new-pass" 
                  type="password"
                  className="bg-white h-12 rounded-xl border-slate-300"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pass" className="text-slate-700">Confirm New Password</Label>
                <Input 
                  id="confirm-pass" 
                  type="password"
                  className="bg-white h-12 rounded-xl border-slate-300"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full h-12 rounded-xl mt-4 shadow-sm" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
