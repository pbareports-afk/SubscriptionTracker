"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Plus, MoreHorizontal, Search, CheckCircle2, AlertCircle, XCircle, Edit, Trash2 } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import Swal from 'sweetalert2';
import { getSubscriptions, getCompanies, deleteSubscription, addSubscription, updateSubscription, Subscription, Company } from "@/lib/db";
import { ServiceModal } from "@/components/ServiceModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Home({ searchParams }: { searchParams: { category?: string } }) {
  const [services, setServices] = useState<Subscription[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Subscription | null>(null);

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
    
    // Listen for custom event from sidebar
    const handleOpenModal = () => {
      setEditingService(null);
      setIsModalOpen(true);
    };
    window.addEventListener('open-add-modal', handleOpenModal);
    return () => window.removeEventListener('open-add-modal', handleOpenModal);
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
        confirmButtonColor: '#4f46e5',
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
  };

  const groupedServices = companies.map(company => ({
    company,
    services: filteredServices.filter(s => s.companyId === company.id).sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())
  })).filter(group => group.services.length > 0);

  const unknownCompanyServices = filteredServices.filter(s => !companies.find(c => c.id === s.companyId)).sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
  if (unknownCompanyServices.length > 0) {
    groupedServices.push({
      company: { id: "unknown", name: "Other Services" },
      services: unknownCompanyServices
    });
  }

  const getStatusDisplay = (days: number) => {
    if (days < 0) return { icon: <XCircle className="h-4 w-4" />, text: "Expired", color: "text-red-500", bg: "bg-red-50" };
    if (days <= 30) return { icon: <AlertCircle className="h-4 w-4" />, text: `${days} days left`, color: "text-red-500", bg: "bg-red-50" };
    if (days <= 60) return { icon: <AlertCircle className="h-4 w-4" />, text: `${days} days left`, color: "text-amber-500", bg: "bg-amber-50" };
    return { icon: <CheckCircle2 className="h-4 w-4" />, text: "Active", color: "text-emerald-500", bg: "bg-emerald-50" };
  };

  return (
    <DashboardLayout>
      {/* Header & Search */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">Your subscriptions</h1>
        
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search services, providers..." 
            className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-lg">No services found.</p>
        </div>
      ) : (
        <div className="space-y-10 pb-20">
          {groupedServices.map(group => (
            <div key={group.company.id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
              
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{group.company.name}</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-400 uppercase bg-white border-b border-slate-100">
                    <tr>
                      <th scope="col" className="px-8 py-4 font-semibold w-1/3">Service</th>
                      <th scope="col" className="px-8 py-4 font-semibold">Status</th>
                      <th scope="col" className="px-8 py-4 font-semibold">Category</th>
                      <th scope="col" className="px-8 py-4 font-semibold">Payment Due</th>
                      <th scope="col" className="px-8 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {group.services.map((service) => {
                      const daysLeft = differenceInDays(service.expiryDate, new Date());
                      const status = getStatusDisplay(daysLeft);

                      return (
                        <tr key={service.id} className="hover:bg-slate-50/50 transition-colors group/row">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">
                                {(service.title || '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-base">{service.title}</p>
                                <p className="text-slate-500 text-xs mt-0.5">{service.provider || 'Unknown Provider'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${status.color} ${status.bg}`}>
                              {status.icon}
                              {status.text}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-slate-500 font-medium">{service.category}</span>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-slate-800 font-semibold">{format(service.expiryDate, "dd MMM yyyy")}</p>
                            {daysLeft > 60 && (
                              <p className="text-slate-400 text-xs mt-0.5">in {daysLeft} days</p>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => handleRenew(service)}
                                className="text-indigo-600 font-semibold hover:text-indigo-800 hover:underline px-3 py-1.5 transition-all"
                              >
                                Renew
                              </button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors outline-none cursor-pointer opacity-0 group-hover/row:opacity-100">
                                  <MoreHorizontal className="h-5 w-5" />
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

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
