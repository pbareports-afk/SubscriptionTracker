"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Plus, ExternalLink, MoreVertical, ShieldAlert, CheckCircle2, Clock, Edit, Trash2, Building2 } from "lucide-react";
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
    if (days <= 30) return "bg-red-500 shadow-red-500/20";
    if (days <= 60) return "bg-amber-500 shadow-amber-500/20";
    return "bg-emerald-500 shadow-emerald-500/20";
  };

  const getStatusIcon = (days: number) => {
    if (days <= 30) return <ShieldAlert className="h-5 w-5 text-red-500" />;
    if (days <= 60) return <Clock className="h-5 w-5 text-amber-500" />;
    return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
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
        confirmButtonColor: '#2563eb',
      });
      return;
    }
    window.open(service.renewUrl, '_blank');
  };

  const handleDelete = (service: Subscription) => {
    Swal.fire({
      title: 'Delete Service?',
      text: `Are you sure you want to delete ${service.title}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteSubscription(service.id!);
          setServices(services.filter(s => s.id !== service.id));
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            showConfirmButton: false,
            timer: 1500
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
    await fetchData();
  };

  // Group services by company
  const groupedServices = companies.map(company => ({
    company,
    services: filteredServices.filter(s => s.companyId === company.id)
  })).filter(group => group.services.length > 0);

  const unknownCompanyServices = filteredServices.filter(s => !companies.find(c => c.id === s.companyId));
  if (unknownCompanyServices.length > 0) {
    groupedServices.push({
      company: { id: "unknown", name: "Other Services" },
      services: unknownCompanyServices
    });
  }

  return (
    <DashboardLayout>
      <div className="p-2 md:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Overview</h1>
            <p className="text-slate-500">Track and manage your upcoming expirations.</p>
          </div>
          <button 
            onClick={() => { setEditingService(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl px-5 py-2.5 font-medium transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5" /> Add Service
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
             <Clock className="h-16 w-16 text-slate-300 mb-4" />
             <h3 className="text-2xl font-semibold text-slate-900 mb-2">No Services Found</h3>
             <p className="text-slate-500 mb-6">Click the button above to add a new subscription.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groupedServices.map(group => (
              <div key={group.company.id} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-800">{group.company.name}</h2>
                  <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">{group.services.length}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {group.services.map((service) => {
                    const daysLeft = differenceInDays(service.expiryDate, new Date());
                    const colorClass = getStatusColor(daysLeft);
                    const isDanger = daysLeft <= 30;

                    return (
                      <div 
                        key={service.id} 
                        className={`flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border transition-all hover:shadow-md ${isDanger ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'}`}
                      >
                        <div className="p-5 flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
                              {service.category}
                            </span>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger className="text-slate-400 hover:text-slate-600 transition-colors outline-none cursor-pointer">
                                <MoreVertical className="h-5 w-5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 bg-white text-slate-800 border-slate-200">
                                <DropdownMenuItem className="focus:bg-slate-100 cursor-pointer" onClick={() => { setEditingService(service); setIsModalOpen(true); }}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-red-50 text-red-600 cursor-pointer" onClick={() => handleDelete(service)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{service.title}</h3>
                          <p className="text-sm text-slate-500 mb-5">{service.provider || 'No Provider'}</p>

                          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(daysLeft)}
                                <span className={`font-semibold ${isDanger ? 'text-red-600' : 'text-slate-700'}`}>
                                  {getStatusText(daysLeft)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${colorClass}`}
                                style={{ width: `${getProgressValue(daysLeft)}%` }}
                              />
                            </div>
                            
                            <div className="flex justify-between items-center mt-1 text-xs text-slate-500 font-medium">
                              <span>Exp: {format(service.expiryDate, "dd MMM yyyy")}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                          <button 
                            onClick={() => handleRenew(service)}
                            className={`w-full flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                              isDanger 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200' 
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-sm'
                            }`}
                          >
                            Renew Service <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
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
