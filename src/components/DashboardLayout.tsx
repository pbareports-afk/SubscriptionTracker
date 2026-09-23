"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { LayoutDashboard, Globe, Server, Smartphone, MonitorDot, LogOut, Settings, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";
import Swal from 'sweetalert2';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "All Services";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d0f1c]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const menuItems = [
    { icon: LayoutDashboard, label: "All Services", mappedCategory: "All Services" },
    { icon: Globe, label: "Domains", mappedCategory: "Domain" },
    { icon: Server, label: "Hosting / Cloud", mappedCategory: "Hosting" },
    { icon: Smartphone, label: "SIM & Network", mappedCategory: "SIM" },
    { icon: MonitorDot, label: "Software / Subs", mappedCategory: "Software" },
  ].map(item => ({...item, active: item.mappedCategory === currentCategory || item.label === currentCategory}));

  const handleSignOut = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of the dashboard.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, log out',
      background: 'rgba(15, 23, 42, 0.9)',
      color: '#fff',
      backdrop: 'rgba(0,0,0,0.6)'
    }).then((result) => {
      if (result.isConfirmed) {
        signOut();
        Swal.fire({
          title: 'Logged out!',
          text: 'You have been successfully logged out.',
          icon: 'success',
          background: 'rgba(15, 23, 42, 0.9)',
          color: '#fff',
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-theme">
      <div className="flex w-full h-full bg-black/40 backdrop-blur-[2px]">
        {/* Sidebar */}
        <aside className="w-72 glass-panel border-r-white/10 flex flex-col m-4 rounded-3xl z-10 overflow-hidden">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-2 rounded-xl">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">SubTracker</h1>
            </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <p className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Categories</p>
            {menuItems.map((item, idx) => (
              <a
                key={idx}
                href={item.label === "All Services" ? "/" : `/?category=${encodeURIComponent(item.label)}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  item.active 
                    ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]" 
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="p-4 mt-auto">
            <div className="glass rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-white truncate">{user.email}</p>
                  <p className="text-xs text-blue-300">Administrator</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white justify-center rounded-xl transition-colors border border-white/5" 
                  onClick={() => router.push('/settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1 bg-white/5 hover:bg-red-500/20 text-red-300 hover:text-red-200 justify-center rounded-xl transition-colors border border-white/5" 
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 z-10 pl-0">
          <div className="glass-panel w-full h-full rounded-3xl overflow-auto border-white/10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0d0f1c]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
