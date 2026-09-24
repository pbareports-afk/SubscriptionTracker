"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { LayoutDashboard, Globe, Server, Smartphone, MonitorDot, LogOut, Settings, BarChart3, Plus } from "lucide-react";
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
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
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
      title: 'Sign Out?',
      text: "You will be logged out.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      confirmButtonText: 'Yes, log out',
    }).then((result) => {
      if (result.isConfirmed) signOut();
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <div className="flex w-full h-full max-w-[1600px] mx-auto bg-white border-x border-slate-200 shadow-2xl shadow-slate-200/50">
        
        {/* Sidebar */}
        <aside className="w-[280px] bg-white border-r border-slate-100 flex flex-col z-10 shrink-0">
          <div className="p-8 flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-full shadow-md shadow-indigo-600/20">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">SubTracker</h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-1 mt-2">
            <div className="px-4 mb-6">
              <Button onClick={() => window.dispatchEvent(new CustomEvent('open-add-modal'))} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl h-12 font-medium shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5">
                <Plus className="h-4 w-4" /> Add new service
              </Button>
            </div>

            <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-6">Menu</p>
            {menuItems.map((item, idx) => (
              <a
                key={idx}
                href={item.label === "All Services" ? "/" : `/?category=${encodeURIComponent(item.mappedCategory)}`}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all relative overflow-hidden group ${
                  item.active 
                    ? "text-indigo-700 bg-indigo-50/80" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-md"></div>}
                <item.icon className={`h-5 w-5 ${item.active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="p-6">
            <div className="space-y-1">
              <a href="/settings" className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <Settings className="h-5 w-5 text-slate-400" />
                Settings
              </a>
              <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
                <LogOut className="h-5 w-5 text-slate-400" />
                Sign Out
              </button>
            </div>

            <div className="mt-8 flex items-center gap-3 px-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold border border-indigo-100 shrink-0">
                  {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#fdfdfd] relative">
          <div className="max-w-7xl mx-auto p-8 md:p-12 w-full min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div></div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
