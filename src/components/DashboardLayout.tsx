"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Globe, Server, Smartphone, MonitorDot, LogOut, Settings, Hexagon, Grip, ChevronDown, Bell, Search, Plus } from "lucide-react";
import { Button } from "./ui/button";
import Swal from 'sweetalert2';
import { getSubscriptions, Subscription } from "@/lib/db";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "All Services";
  
  const [counts, setCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const subs = await getSubscriptions();
        const newCounts: { [key: string]: number } = {
          "All Services": subs.length
        };
        subs.forEach(sub => {
          newCounts[sub.category] = (newCounts[sub.category] || 0) + 1;
        });
        setCounts(newCounts);
      } catch (error) {
        console.error("Failed to fetch counts", error);
      }
    };
    fetchCounts();
    
    // Simple custom event listener to refresh counts after a service is added/deleted
    const handleRefresh = () => fetchCounts();
    window.addEventListener('refresh-data', handleRefresh);
    return () => window.removeEventListener('refresh-data', handleRefresh);
  }, []);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const menuItems = [
    { icon: Grip, label: "All Services", mappedCategory: "All Services" },
    { icon: Globe, label: "Domains", mappedCategory: "Domain" },
    { icon: Server, label: "Hosting", mappedCategory: "Hosting" },
    { icon: Smartphone, label: "SIM", mappedCategory: "SIM" },
    { icon: MonitorDot, label: "Software", mappedCategory: "Software" },
  ].map(item => ({...item, active: item.mappedCategory === currentCategory || item.label === currentCategory}));

  const handleSignOut = () => {
    Swal.fire({
      title: 'Sign Out?',
      text: "You will be logged out.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Yes, log out',
    }).then((result) => {
      if (result.isConfirmed) signOut();
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fc] font-sans">
      <div className="flex w-full h-full max-w-[1920px] mx-auto bg-white border-x border-slate-200">
        
        {/* Sidebar */}
        <aside className="w-[280px] bg-white border-r border-slate-100 flex flex-col z-10 shrink-0">
          {/* Logo */}
          <div className="px-6 py-6 flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg flex items-center justify-center">
              <Hexagon className="h-6 w-6 text-white fill-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Sub<span className="text-blue-600">Tracker</span></h1>
          </div>
          
          {/* User Profile */}
          <div className="px-4 mb-6">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors">
              <div className="h-9 w-9 rounded-full bg-[#00b4d8] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                  {user.email?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workspace</p>
                <p className="text-sm font-bold text-slate-700 truncate">{user.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          </div>
          
          {/* Menu */}
          <nav className="flex-1 px-4 mt-2 overflow-y-auto space-y-1">
            <p className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Categories</p>
            {menuItems.map((item, idx) => {
              const count = counts[item.mappedCategory] || 0;
              return (
                <a
                  key={idx}
                  href={item.label === "All Services" ? "/" : `/?category=${encodeURIComponent(item.mappedCategory)}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-semibold transition-all relative group ${
                    item.active 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${item.active ? 'text-white' : 'text-slate-400 group-hover:text-slate-500'}`} />
                  <span className="flex-1">{item.label}</span>
                  {count > 0 && (
                    <span className={`text-xs font-bold ${item.active ? 'text-blue-200' : 'text-slate-400'}`}>
                      {count}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Footer Menu */}
          <div className="p-4 space-y-1 border-t border-slate-100">
            <a href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
              <Settings className="h-5 w-5 text-slate-400" />
              Settings
            </a>
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
              <LogOut className="h-5 w-5 text-slate-400" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#f8f9fc] relative">
          {/* Header */}
          <header className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
            <div className="relative w-96 max-w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search services..." 
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                id="global-search-input"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative border border-slate-200">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              <Button onClick={() => window.dispatchEvent(new CustomEvent('open-add-modal'))} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-5 font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all">
                <Plus className="h-4 w-4" /> Add Service
              </Button>
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-auto p-8 lg:p-10">
            {children}
          </main>
        </div>

      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
