import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Video, 
  CheckCircle, 
  ChevronRight, 
  AlertCircle,
  Loader2,
  Hourglass
} from 'lucide-react';
import { schedulingApi, SlotResponse } from '@/services/slotSchedulingApi';

const InterviewScheduler: React.FC = () => {
  // 1. Get IDs from URL: /select-slot/:jobId/:candidateId
  const { jobId, candidateId } = useParams<{ jobId: string; candidateId: string }>();
  
  const [slots, setSlots] = useState<SlotResponse[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [successData, setSuccessData] = useState<{ link: string; time: string } | null>(null);

  // Helper function to format 24h string (e.g. "14:30") to 12h string ("2:30 PM")
  const formatTo12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // 2. Load available slots on mount
  useEffect(() => {
    const fetchSlots = async () => {
      if (!jobId || !candidateId) return;
      try {
        setLoading(true);
        setError(null);
        // Updated API call to include both jobId and candidateId for expiry check
        const data = await schedulingApi.getAvailableSlots(Number(jobId), Number(candidateId));
        setSlots(data);
      } catch (err: any) {
        if (err.message.includes("expired")) {
          setIsExpired(true);
        } else {
          setError(err.message || "Unable to load interview slots.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [jobId, candidateId]);

  // 3. Handle the booking
  const handleBooking = async () => {
    if (!selectedSlot || !candidateId) return;
    
    setBookingLoading(true);
    setError(null);

    try {
      const result = await schedulingApi.bookSlot(selectedSlot.id, {
        candidate_id: Number(candidateId),
        email: "candidate@example.com", // This is usually verified via the candidateId on the backend
      });

      setSuccessData({ 
        link: result.meet_link, 
        time: `${new Date(selectedSlot.date).toLocaleDateString()} at ${formatTo12Hour(selectedSlot.start_time)}` 
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try a different slot.");
    } finally {
      setBookingLoading(false);
    }
  };

  // --- Expiry View ---
  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-red-50">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Hourglass className="w-10 h-10 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Link Expired</h2>
          <p className="text-slate-600 mt-4 leading-relaxed">
            For security reasons, this invitation link expired after 48 hours. 
            Please contact your recruiter to request a new scheduling link.
          </p>
        </div>
      </div>
    );
  }

  // --- Success View ---
  if (successData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-emerald-50 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">You're all set!</h2>
          <p className="text-slate-600 mt-2">
            Your interview is confirmed for <br />
            <span className="font-semibold text-slate-900">{successData.time}</span>
          </p>
          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meeting Details</p>
            <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
              <Video size={18} />
              <a href={successData.link} target="_blank" rel="noreferrer" className="hover:underline">
                Join Google Meet
              </a>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-6">
            A calendar invitation has been sent to your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFE] py-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <Video className="text-indigo-600" size={28} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">Technical <br/>Interview</h1>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="p-1.5 bg-slate-100 rounded-lg"><Clock size={16}/></div>
                <span className="text-sm font-medium">45 Minutes</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="p-1.5 bg-slate-100 rounded-lg"><Calendar size={16}/></div>
                <span className="text-sm font-medium">Google Meet Video</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm mt-8 leading-relaxed">
              Please select a convenient time for your interview. The session will be recorded for evaluation purposes.
            </p>
          </div>
        </div>

        {/* Slot Selection Grid */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] shadow-sm border border-slate-200/60 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Available Slots</h2>
            {slots.length > 0 && (
              <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                {slots.length} OPEN
              </span>
            )}
          </div>

          <div className="p-8 flex-1">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="animate-spin" size={32} />
                <p className="text-sm font-medium">Fetching latest availability...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <AlertCircle className="text-slate-300 mb-2" size={40} />
                <p className="text-slate-500 font-medium">No slots available at the moment.</p>
                <p className="text-slate-400 text-xs">Please contact the HR manager.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`group p-5 rounded-2xl border-2 transition-all duration-200 text-left relative ${
                      selectedSlot?.id === slot.id 
                      ? 'border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-50' 
                      : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`font-bold ${selectedSlot?.id === slot.id ? 'text-indigo-700' : 'text-slate-900'}`}>
                          {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5 font-medium">
                          <Clock size={14} className="text-slate-400" /> 
                          {formatTo12Hour(slot.start_time)} - {formatTo12Hour(slot.end_time)}
                        </p>
                      </div>
                      <ChevronRight size={18} className={`transition-transform duration-300 ${selectedSlot?.id === slot.id ? 'translate-x-1 text-indigo-600' : 'text-slate-300'}`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="mx-8 mb-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-700 text-xs font-bold">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="p-8 bg-slate-50/50 border-t border-slate-100">
            <button
              disabled={!selectedSlot || bookingLoading}
              onClick={handleBooking}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-950 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2"
            >
              {bookingLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Scheduling Interview...
                </>
              ) : (
                'Confirm Interview Time'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduler;