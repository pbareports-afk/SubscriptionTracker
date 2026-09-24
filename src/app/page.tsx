"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MoreHorizontal, Edit, Trash2, LayoutGrid, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import Swal from 'sweetalert2';
import { getSubscriptions, getCompanies, deleteSubscription, addSubscription, updateSubscription, Subscription, Company } from "@/lib/db";
import { ServiceModal } from "@/components/ServiceModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Home({ searchParams }: { searchParams: { category?: string } }) {
  const [services, setServices] = useState<Subscription[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Subscription | null>(null);
  
  // Search state is now driven by the header input (via a global event or we just keep it simple)
  // For simplicity since the search input is in the layout, we can listen to input events
  const [searchQuery, setSearchQuery] = useState("");

  const currentCategory = searchParams.category;
  let filteredServices = currentCategory 
    ? services.filter(s => s.category === currentCategory || currentCategory === 'All Services')
    : services;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredServices = filteredServices.filter(s => 
      s.title.toLowerCase().includes(q) || 
      (s.provider && s.provider.toLowerCase().includes(q))
    );
  }

  useEffect(() => {
    fetchData();
    
    const handleOpenModal = () => {
      setEditingService(null);
      setIsModalOpen(true);
    };
    window.addEventListener('open-add-modal', handleOpenModal);
    
    // Sync search from layout
    const searchInput = document.getElementById('global-search-input') as HTMLInputElement;
    const handleSearch = (e: any) => setSearchQuery(e.target.value);
    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
    }
    
    return () => {
      window.removeEventListener('open-add-modal', handleOpenModal);
      if (searchInput) searchInput.removeEventListener('input', handleSearch);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsData, compData] = await Promise.all([getSubscriptions(), getCompanies()]);
      setServices(subsData);
      setCompanies(compData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = (service: Subscription) => {
    if (!service.renewUrl || service.renewUrl === '#') {
      Swal.fire({
        title: 'No Renewal Link',
        text: 'You have not set a renewal link for this service. Please edit the service to add one.',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
      });
      return;
    }
    window.open(service.renewUrl, '_blank');
  };

  const handleDelete = (service: Subscription) => {
    Swal.fire({
      title: 'Delete Service?',
      text: `Are you sure you want to delete ${service.title}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Delete'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteSubscription(service.id!);
          setServices(services.filter(s => s.id !== service.id));
          window.dispatchEvent(new CustomEvent('refresh-data')); // update sidebar counts
          Swal.fire({ icon: 'success', title: 'Deleted!', showConfirmButton: false, timer: 1500 });
        } catch (error: any) {
          Swal.fire('Error', error.message, 'error');
        }
      }
    });
  };

  const handleSaveService = async (serviceData: Subscription) => {
    if (editingService?.id) {
      await updateSubscription(editingService.id, serviceData);
    } else {
      await addSubscription(serviceData);
    }
    await fetchData();
    window.dispatchEvent(new CustomEvent('refresh-data')); // update sidebar counts
  };

  const getCompanyName = (id: string) => {
    return companies.find(c => c.id === id)?.name || "Unknown Company";
  };

  const sortedServices = [...filteredServices].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

  // Stats
  const totalServices = filteredServices.length;
  const expiringSoon = filteredServices.filter(s => differenceInDays(s.expiryDate, new Date()) <= 30).length;
  const dueIn60 = filteredServices.filter(s => {
    const d = differenceInDays(s.expiryDate, new Date());
    return d > 30 && d <= 60;
  }).length;
  const healthy = filteredServices.filter(s => differenceInDays(s.expiryDate, new Date()) > 60).length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Title Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-[2px] w-4 bg-blue-600"></div>
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Subscription Command Center</p>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Overview</h1>
            <p className="text-slate-500 font-medium">Monitor every renewal. Stay ahead of every deadline.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Last synced just now
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Services</p>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <LayoutGrid className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <h2 className="text-4xl font-black text-slate-900">{totalServices.toString().padStart(2, '0')}</h2>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Expiring Soon</p>
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
            </div>
            <h2 className="text-4xl font-black text-slate-900">{expiringSoon.toString().padStart(2, '0')}</h2>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Due in 60 Days</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <h2 className="text-4xl font-black text-slate-900">{dueIn60.toString().padStart(2, '0')}</h2>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Healthy</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
            <h2 className="text-4xl font-black text-slate-900">{healthy.toString().padStart(2, '0')}</h2>
          </div>
        </div>

        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">{currentCategory === 'All Services' ? 'All Services' : currentCategory}</h2>
          <p className="text-sm font-medium text-slate-400">{filteredServices.length} active subscriptions</p>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-lg font-medium">No services found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
            {sortedServices.map((service) => {
              const daysLeft = differenceInDays(service.expiryDate, new Date());
              
              // Status Logic
              let statusConfig = {
                borderClass: "bg-emerald-500",
                badgeBg: "bg-emerald-50 text-emerald-600",
                badgeDot: "bg-emerald-500",
                text: "ON TRACK",
                progressColor: "bg-emerald-500",
                numberColor: "text-emerald-500"
              };
              
              if (daysLeft < 0) {
                statusConfig = {
                  borderClass: "bg-red-500",
                  badgeBg: "bg-red-50 text-red-600",
                  badgeDot: "bg-red-500",
                  text: "EXPIRED",
                  progressColor: "bg-red-500",
                  numberColor: "text-red-500"
                };
              } else if (daysLeft <= 30) {
                statusConfig = {
                  borderClass: "bg-red-500",
                  badgeBg: "bg-red-50 text-red-600",
                  badgeDot: "bg-red-500",
                  text: "EXPIRES SOON",
                  progressColor: "bg-red-500",
                  numberColor: "text-red-500"
                };
              } else if (daysLeft <= 60) {
                statusConfig = {
                  borderClass: "bg-amber-500",
                  badgeBg: "bg-amber-50 text-amber-600",
                  badgeDot: "bg-amber-500",
                  text: "DUE SHORTLY",
                  progressColor: "bg-amber-500",
                  numberColor: "text-amber-500"
                };
              }

              const progressValue = Math.min(Math.max((daysLeft / 365) * 100, 2), 100);

              return (
                <div key={service.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col group">
                  {/* Left Status Border */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusConfig.borderClass}`}></div>
                  
                  <div className="p-6 flex-1">
                    {/* Header: Logo, Name, Badge */}
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800 font-black text-lg shrink-0">
                          {(service.title || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-[15px] leading-tight mb-0.5 line-clamp-1">{service.title}</p>
                          <p className="text-slate-400 text-xs font-medium">{service.provider || 'Unknown Provider'}</p>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${statusConfig.badgeBg}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.badgeDot}`}></div>
                        {statusConfig.text}
                      </div>
                    </div>
                    
                    {/* Time Remaining */}
                    <div className="mb-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time Remaining</p>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black ${statusConfig.numberColor}`}>{daysLeft < 0 ? 0 : daysLeft}</span>
                        <span className={`text-sm font-semibold ${statusConfig.numberColor}`}>days left</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${statusConfig.progressColor}`}
                          style={{ width: `${progressValue}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-400">{Math.round(progressValue)}%</span>
                    </div>

                    {/* Expiration Date */}
                    <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                      <p className="text-xs font-semibold text-slate-400">Expiration date</p>
                      <p className="text-xs font-bold text-slate-800">{format(service.expiryDate, "MMM dd, yyyy")}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center mt-auto">
                    <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-500 shadow-sm truncate max-w-[120px]">
                      {getCompanyName(service.companyId)}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleRenew(service)}
                        className="text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors"
                      >
                        Renew Service &gt;
                      </button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors outline-none cursor-pointer">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white text-slate-800 border-slate-200 shadow-xl rounded-xl">
                          <DropdownMenuItem className="focus:bg-slate-50 cursor-pointer font-medium py-2.5" onClick={() => { setEditingService(service); setIsModalOpen(true); }}>
                            <Edit className="mr-2 h-4 w-4 text-slate-400" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-red-50 text-red-600 cursor-pointer font-medium py-2.5" onClick={() => handleDelete(service)}>
                            <Trash2 className="mr-2 h-4 w-4 text-red-400" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ServiceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveService}
        editingService={editingService}
        companies={companies}
        onCompanyAdded={(c) => setCompanies([...companies, c])}
      />
    </DashboardLayout>
  );
}
