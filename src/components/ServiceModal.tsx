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
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#fff',
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
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#fff',
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#fff',
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
      <DialogContent className="glass-panel text-white border-white/20 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingService ? "Edit Service" : "Add New Service"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title" className="text-white/80">Service Name *</Label>
              <Input 
                id="title" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="glass-input" 
                placeholder="e.g. Main Company Website" 
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider" className="text-white/80">Provider / Vendor</Label>
              <Input 
                id="provider" 
                value={formData.provider}
                onChange={e => setFormData({...formData, provider: e.target.value})}
                className="glass-input" 
                placeholder="e.g. GoDaddy" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-white/80">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({...formData, category: v || ''})}
              >
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-white/10">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label className="text-white/80">Company / Subsidiary *</Label>
              {isAddingCompany ? (
                <div className="flex gap-2">
                  <Input 
                    value={newCompanyName}
                    onChange={e => setNewCompanyName(e.target.value)}
                    className="glass-input" 
                    placeholder="New company name" 
                    autoFocus
                  />
                  <Button type="button" onClick={handleAddCompany} className="bg-blue-600 hover:bg-blue-700">Add</Button>
                  <Button type="button" variant="ghost" onClick={() => setIsAddingCompany(false)} className="text-white/70 hover:text-white">Cancel</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select 
                    key={companies.length}
                    value={formData.companyId} 
                    onValueChange={(v) => setFormData({...formData, companyId: v || ''})}
                  >
                    <SelectTrigger className="glass-input flex-1">
                      <SelectValue placeholder="Select company">
                        {companies.find(c => c.id === formData.companyId)?.name || "Select company"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 text-white border-white/10">
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10" onClick={() => setIsAddingCompany(true)}>
                    + New
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="expiryDate" className="text-white/80">Expiry Date *</Label>
              <Input 
                id="expiryDate" 
                type="date"
                value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''}
                onChange={e => setFormData({...formData, expiryDate: new Date(e.target.value)})}
                className="glass-input [color-scheme:dark]" 
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="renewUrl" className="text-white/80">Renewal Link (URL)</Label>
              <Input 
                id="renewUrl" 
                type="url"
                value={formData.renewUrl}
                onChange={e => setFormData({...formData, renewUrl: e.target.value})}
                className="glass-input" 
                placeholder="https://" 
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="glass-button" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
