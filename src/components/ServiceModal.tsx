"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Subscription, Company, addCompany } from "@/lib/db";
import Swal from 'sweetalert2';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Subscription) => Promise<void>;
  editingService?: Subscription | null;
  companies: Company[];
  onCompanyAdded: (company: Company) => void;
}

const CATEGORIES = ["Domain", "Hosting", "SIM", "Software", "Other"];

export function ServiceModal({ isOpen, onClose, onSave, editingService, companies, onCompanyAdded }: ServiceModalProps) {
  const [formData, setFormData] = useState<Partial<Subscription>>({
    title: "",
    provider: "",
    category: "",
    companyId: "",
    renewUrl: "",
    expiryDate: new Date(),
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isAddingCompany, setIsAddingCompany] = useState(false);

  useEffect(() => {
    if (editingService) {
      setFormData({
        ...editingService,
      });
    } else {
      setFormData({
        title: "",
        provider: "",
        category: "",
        companyId: "",
        renewUrl: "",
        expiryDate: new Date(),
      });
    }
  }, [editingService, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.companyId || !formData.category || !formData.expiryDate) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please fill in all required fields.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData as Subscription);
      onClose();
      Swal.fire({
        icon: 'success',
        title: editingService ? 'Service Updated' : 'Service Added',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    try {
      const id = await addCompany({ name: newCompanyName.trim() });
      const newCompany = { id, name: newCompanyName.trim() };
      onCompanyAdded(newCompany);
      setFormData(prev => ({ ...prev, companyId: id }));
      setIsAddingCompany(false);
      setNewCompanyName("");
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-slate-900 border-slate-200 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingService ? "Edit Service" : "Add New Service"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title" className="text-slate-700">Service Name *</Label>
              <Input 
                id="title" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="bg-white border-slate-300" 
                placeholder="e.g. Main Company Website" 
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider" className="text-slate-700">Provider / Vendor</Label>
              <Input 
                id="provider" 
                value={formData.provider}
                onChange={e => setFormData({...formData, provider: e.target.value})}
                className="bg-white border-slate-300" 
                placeholder="e.g. GoDaddy" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-slate-700">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({...formData, category: v || ''})}
              >
                <SelectTrigger className="bg-white border-slate-300">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-900 border-slate-200">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label className="text-slate-700">Company / Subsidiary *</Label>
              {isAddingCompany ? (
                <div className="flex gap-2">
                  <Input 
                    value={newCompanyName}
                    onChange={e => setNewCompanyName(e.target.value)}
                    className="bg-white border-slate-300" 
                    placeholder="New company name" 
                    autoFocus
                  />
                  <Button type="button" onClick={handleAddCompany} className="bg-blue-600 hover:bg-blue-700 text-white">Add</Button>
                  <Button type="button" variant="ghost" onClick={() => setIsAddingCompany(false)} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">Cancel</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select 
                    key={companies.length}
                    value={formData.companyId} 
                    onValueChange={(v) => setFormData({...formData, companyId: v || ''})}
                  >
                    <SelectTrigger className="bg-white border-slate-300 flex-1">
                      <SelectValue placeholder="Select company">
                        {companies.find(c => c.id === formData.companyId)?.name || "Select company"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white text-slate-900 border-slate-200">
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" className="border-slate-300 text-slate-700 bg-white hover:bg-slate-100" onClick={() => setIsAddingCompany(true)}>
                    + New
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="expiryDate" className="text-slate-700">Expiry Date *</Label>
              <Input 
                id="expiryDate" 
                type="date"
                value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''}
                onChange={e => setFormData({...formData, expiryDate: new Date(e.target.value)})}
                className="bg-white border-slate-300" 
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="renewUrl" className="text-slate-700">Renewal Link (URL)</Label>
              <Input 
                id="renewUrl" 
                type="url"
                value={formData.renewUrl}
                onChange={e => setFormData({...formData, renewUrl: e.target.value})}
                className="bg-white border-slate-300" 
                placeholder="https://" 
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
