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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="flex w-full h-full">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-10 overflow-hidden shadow-sm">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">SubTracker</h1>
            </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Categories</p>
            {menuItems.map((item, idx) => (
              <a
                key={idx}
                href={item.label === "All Services" ? "/" : `/?category=${encodeURIComponent(item.mappedCategory)}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  item.active 
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="p-4 mt-auto">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 justify-center rounded-xl transition-colors border border-slate-200 shadow-sm" 
                  onClick={() => router.push('/settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex-1 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 justify-center rounded-xl transition-colors border border-slate-200 shadow-sm" 
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
        <main className="flex-1 overflow-auto p-4 md:p-8 z-10 bg-slate-50">
          <div className="w-full h-full rounded-3xl overflow-auto">
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
