import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileCheck, Send, Download, Building2, 
  Briefcase, Banknote, CalendarDays, Sparkles,
  ShieldCheck, Gift, Clock
} from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { candidateViewApi } from "@/services/candidateViewApi";
import { toast } from "sonner"; // Assuming you use sonner or similar for notifications

interface OfferLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  onSendSuccess?: (data: any) => void;
}

export const OfferLetterModal = ({ 
  isOpen, 
  onClose, 
  candidateId, 
  candidateName, 
  candidateEmail,
  onSendSuccess 
}: OfferLetterModalProps) => {
  const [formData, setFormData] = useState({
    designation: 'Software Engineer',
    salary: '',
    joiningDate: '',
    probationPeriod: '3 Months',
    benefits: 'Health Insurance, 401k, Paid Time Off',
    expiryDate: '',
    additionalNotes: 'We were impressed by your technical skills and are excited to have you join our team.'
  });

  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!formData.salary || !formData.joiningDate) {
      toast.error("Please fill in the Salary and Joining Date");
      return;
    }

    setIsSending(true);

    // This mapping connects your UI to your Google Doc Template placeholders
    const replacements = {
      "{{candidate_name}}": candidateName,
      "{{designation}}": formData.designation,
      "{{salary}}": formData.salary,
      "{{joining_date}}": formData.joiningDate,
      "{{probation}}": formData.probationPeriod,
      "{{benefits}}": formData.benefits,
      "{{expiry_date}}": formData.expiryDate,
      "{{notes}}": formData.additionalNotes,
      "{{current_date}}": new Date().toLocaleDateString()
    };

    try {
      const result = await candidateViewApi.generateAndSendOffer(
        candidateId,
        candidateEmail,
        replacements
      );

      toast.success(`Offer letter successfully sent to ${candidateEmail}`);
      
      if (onSendSuccess) onSendSuccess(result);
      onClose();
    } catch (error: any) {
      console.error("Offer Error:", error);
      toast.error(error.message || "Failed to generate or send the offer letter.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl p-0 rounded-[2rem] overflow-hidden border-none shadow-2xl flex flex-col md:flex-row h-[90vh]">
        
        {/* Left Side: Form (Scrollable) */}
        <div className="w-full md:w-5/12 p-8 space-y-6 overflow-y-auto bg-white border-r border-slate-100">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-orange-500" />
              Offer Details
            </h3>
            <p className="text-sm text-slate-500">Input official employment terms for {candidateName}.</p>
          </div>

          <div className="space-y-5">
            {/* Position */}
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Position Title</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  value={formData.designation} 
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                  className="pl-10 rounded-xl h-12 bg-slate-50/50" 
                  placeholder="e.g. Senior Frontend Developer"
                />
              </div>
            </div>

            {/* Salary and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Annual CTC</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="80,000"
                    className="pl-10 rounded-xl h-12 bg-slate-50/50"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Joining Date</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    type="date"
                    className="pl-10 rounded-xl h-12 bg-slate-50/50"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Probation and Expiry */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Probation Period</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    className="pl-10 rounded-xl h-12 bg-slate-50/50"
                    value={formData.probationPeriod}
                    onChange={(e) => setFormData({...formData, probationPeriod: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Offer Expiry</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    type="date"
                    className="pl-10 rounded-xl h-12 bg-slate-50/50"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Benefits & Perks</Label>
              <div className="relative">
                <Gift className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  className="pl-10 rounded-xl h-12 bg-slate-50/50"
                  value={formData.benefits}
                  onChange={(e) => setFormData({...formData, benefits: e.target.value})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personalized Message</Label>
              <Textarea 
                value={formData.additionalNotes}
                onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                className="rounded-xl min-h-[100px] bg-slate-50/50"
                placeholder="Add any specific perks or welcoming notes..."
              />
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              className="w-full rounded-2xl h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all" 
              onClick={handleSend} 
              disabled={isSending}
            >
              {isSending ? "Processing..." : <><Send className="mr-2 h-4 w-4" /> Send Offer Letter</>}
            </Button>
            <Button variant="ghost" className="w-full text-slate-400" onClick={onClose} disabled={isSending}>
              Discard Draft
            </Button>
          </div>
        </div>

        {/* Right Side: Live Document Preview */}
        <div className="hidden md:flex flex-1 bg-slate-50 p-12 items-center justify-center overflow-y-auto">
          <div className="bg-white w-full max-w-[450px] aspect-[1/1.41] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-12 border border-slate-200 relative flex flex-col">
            
            <div className="flex justify-between items-start mb-10">
              <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                <Building2 className="text-white h-7 w-7" />
              </div>
              <div className="text-[10px] text-right text-slate-400 font-medium">
                <p className="font-bold text-slate-900 text-xs tracking-tight">RECRUITPRO AI SOLUTIONS</p>
                <p>Tech Hub, Block 4-C, Innovation Way</p>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <h4 className="text-sm font-bold text-slate-900 border-b pb-2">Employment Offer: {formData.designation}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Dear <strong>{candidateName}</strong>,<br /><br />
                We are thrilled to extend an offer for the position of <strong>{formData.designation}</strong>. 
                Your background aligns perfectly with our vision at RecruitPro AI.
                <br /><br />
                {formData.additionalNotes}
              </p>
              
              <div className="bg-blue-50/50 p-5 rounded-2xl space-y-3 border border-blue-100/50">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500 font-semibold">ANNUAL CTC</span>
                  <span className="text-blue-700 font-bold">{formData.salary ? `$${formData.salary}` : 'TBD'}</span>
                </div>
                <Separator className="bg-blue-100" />
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500 font-semibold">JOINING DATE</span>
                  <span className="text-slate-900 font-bold">{formData.joiningDate || 'TBD'}</span>
                </div>
                <Separator className="bg-blue-100" />
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500 font-semibold">PROBATION</span>
                  <span className="text-slate-900 font-bold">{formData.probationPeriod}</span>
                </div>
              </div>

              <div className="text-[10px] space-y-2 text-slate-600 italic">
                <p><strong>Benefits:</strong> {formData.benefits}</p>
                {formData.expiryDate && (
                  <p className="text-red-500 font-medium">Offer valid until: {formData.expiryDate}</p>
                )}
              </div>
            </div>

            <div className="pt-10 flex justify-between items-end">
              <div className="space-y-1">
                <div className="h-8 w-32 bg-slate-50 border-b border-slate-300 italic text-[10px] flex items-center px-2 text-slate-400">RecruitPro HR Dept</div>
                <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Hiring Authority</p>
              </div>
              <div className="flex flex-col items-center opacity-20">
                <FileCheck className="h-10 w-10 text-blue-600" />
                <span className="text-[6px] font-bold">VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};