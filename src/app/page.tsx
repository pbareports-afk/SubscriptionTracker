"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Plus, ExternalLink, MoreVertical, ShieldAlert, CheckCircle2, Clock, Edit, Trash2 } from "lucide-react";
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

  const currentCategory = searchParams.category;
  const filteredServices = currentCategory 
    ? services.filter(s => s.category === currentCategory || currentCategory === 'All Services')
    : services;

  useEffect(() => {
    fetchData();
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

  const getCompanyName = (id: string) => {
    return companies.find(c => c.id === id)?.name || "Unknown Company";
  };

  const getStatusColor = (days: number) => {
    if (days <= 30) return "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/50";
    if (days <= 60) return "bg-gradient-to-r from-amber-400 to-orange-500 shadow-orange-500/50";
    return "bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-500/50";
  };

  const getStatusIcon = (days: number) => {
    if (days <= 30) return <ShieldAlert className="h-5 w-5 text-red-400" />;
    if (days <= 60) return <Clock className="h-5 w-5 text-amber-400" />;
    return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
  }

  const getStatusText = (days: number) => {
    if (days < 0) return "Expired";
    if (days === 0) return "Expires Today";
    return `${days} days left`;
  };

  const getProgressValue = (days: number) => {
    const percentage = (days / 365) * 100;
    return Math.min(Math.max(percentage, 5), 100); 
  };

  const handleRenew = (service: Subscription) => {
    if (!service.renewUrl || service.renewUrl === '#') {
      Swal.fire({
        title: 'No Renewal Link',
        text: 'You have not set a renewal link for this service. Please edit the service to add one.',
        icon: 'warning',
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#fff',
      });
      return;
    }

    Swal.fire({
      title: 'Renew Service?',
      text: `You will be redirected to renew ${service.title}.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Proceed to Payment',
      background: 'rgba(15, 23, 42, 0.95)',
      color: '#fff',
      backdrop: 'rgba(0,0,0,0.6)'
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(service.renewUrl, '_blank');
      }
    });
  };

  const handleDelete = (service: Subscription) => {
    Swal.fire({
      title: 'Delete Service?',
      text: `Are you sure you want to delete ${service.title}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Yes, delete it!',
      background: 'rgba(15, 23, 42, 0.95)',
      color: '#fff',
      backdrop: 'rgba(0,0,0,0.6)'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteSubscription(service.id!);
          setServices(services.filter(s => s.id !== service.id));
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            showConfirmButton: false,
            timer: 1500,
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#fff',
          });
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
    await fetchData(); // Refresh list
  };

  return (
    <DashboardLayout>
      <div className="p-8 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Overview</h1>
            <p className="text-blue-200">Track and manage your upcoming expirations.</p>
          </div>
          <button 
            onClick={() => { setEditingService(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 glass-button px-6 py-3 rounded-xl font-medium transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5" /> Add Service
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-3xl border-white/10">
             <Clock className="h-16 w-16 text-white/20 mb-4" />
             <h3 className="text-2xl font-semibold text-white mb-2">No Services Yet</h3>
             <p className="text-blue-200 mb-6">Click the button above to add your first subscription.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map((service) => {
              const daysLeft = differenceInDays(service.expiryDate, new Date());
              const colorClass = getStatusColor(daysLeft);
              const isDanger = daysLeft <= 30;

              return (
                <div 
                  key={service.id} 
                  className={`flex flex-col glass rounded-3xl overflow-hidden relative transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_15px_40px_0_rgba(0,0,0,0.4)] ${isDanger ? 'border-red-500/30' : 'border-white/10'}`}
                >
                  {isDanger && <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/20 blur-[50px] rounded-full pointer-events-none"></div>}
                  
                  <div className="p-6 flex-1 z-10 relative">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white border border-white/10 backdrop-blur-md">
                        {service.category}
                      </span>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger className="text-white/50 hover:text-white transition-colors outline-none cursor-pointer">
                          <MoreVertical className="h-5 w-5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-slate-800 text-white border-white/10">
                          <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={() => { setEditingService(service); setIsModalOpen(true); }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-red-500/20 text-red-400 cursor-pointer" onClick={() => handleDelete(service)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{service.title}</h3>
                    <p className="text-sm text-blue-200/70 mb-6">{service.provider || 'No Provider'}</p>

                    <div className="space-y-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(daysLeft)}
                          <span className={`font-semibold ${isDanger ? 'text-red-400' : 'text-white'}`}>
                            {getStatusText(daysLeft)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 shadow-lg ${colorClass}`}
                          style={{ width: `${getProgressValue(daysLeft)}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center mt-2 text-xs text-white/60">
                        <span>{format(service.expiryDate, "dd MMM yyyy")}</span>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                           <span className="truncate max-w-[80px]">{getCompanyName(service.companyId)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-white/10 bg-black/20 z-10">
                    <button 
                      onClick={() => handleRenew(service)}
                      className={`w-full flex justify-center items-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                        isDanger 
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/40 border border-red-500/30' 
                          : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      Renew Service <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
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
