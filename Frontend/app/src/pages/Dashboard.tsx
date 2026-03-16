import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobCard } from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { 
  Plus, Search, Briefcase, Users, 
  Video, Calendar, Clock, Filter,
  ExternalLink, MoreHorizontal
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { jobApi, type Job } from "@/services/jobApi";
import { candidateApi } from "@/services/candidatesApi";
import { dashboardApi, type NextInterview } from "@/services/dashboard";
import { toast } from "sonner";

// --- Enterprise Stat Card ---
const StatCard = ({ title, value, icon: Icon, subtext }: any) => (
  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-slate-300">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
      <Icon className="h-4 w-4 text-slate-400" />
    </div>
    <div className="flex items-baseline gap-2">
      <h3 className="text-2xl font-bold text-slate-900 tabular-nums">{value}</h3>
      <span className="text-[10px] font-medium text-slate-400">{subtext}</span>
    </div>
  </div>
);

const Dashboard = () => {
  const [jobListing, setJobListing] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCandidates, setTotalCandidates] = useState<any[]>([]);
  const [nextInterview, setNextInterview] = useState<NextInterview | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [jobs, cands, interviewResponse] = await Promise.all([
          jobApi.getAll(),
          candidateApi.getTotalApplied(),
          dashboardApi.getNextInterview()
        ]);
        setJobListing(jobs);
        setTotalCandidates(cands);
        setNextInterview(interviewResponse || null);
      } catch (error) {
        toast.error("System sync failed. Check connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatTime12h = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  };

  const filteredJobs = jobListing.filter((job) => 
    job.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#fafafa] py-8 px-10">
        
        {/* --- Top Global Bar --- */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Recruitment Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/jobs/create")}
              className="h-9 px-4 rounded-md bg-primary hover:bg-slate-800 text-white font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Job Posting
            </Button>
          </div>
        </div>

        {/* --- Main Content Layout --- */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Column: Stats & Jobs */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard 
                title="Active Jobs" 
                value={jobListing.length} 
                icon={Briefcase} 
                subtext="Current openings" 
              />
              <StatCard 
                title="Applicant Volume" 
                value={totalCandidates.length} 
                icon={Users} 
                subtext="+4.2% MoM" 
              />
            </div>

            {/* Jobs Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  className="w-full pl-9 pr-4 py-1.5 bg-transparent text-sm font-medium focus:outline-none placeholder:text-slate-400"
                  placeholder="Filter by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-slate-500">
                <Filter size={14} className="mr-2" /> Filter
              </Button>
            </div>

            {/* Job Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[1, 2, 3, 4].map((i) => (
                   <div key={i} className="h-40 bg-white border border-slate-200 animate-pulse rounded-lg" />
                 ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJobs.map((job) => (
                  <div key={job.job_id} onClick={() => navigate(`/candidates?job=${job.job_id}`)}>
                    <JobCard job={job} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Next Event (Enterprise Sidebar) */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm sticky top-8 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  Next Event
                </h2>
                <MoreHorizontal size={14} className="text-slate-400 cursor-pointer" />
              </div>

              {nextInterview ? (
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {nextInterview.candidate_name}
                      </h3>
                      <p className="text-sm font-medium text-slate-500 mt-1">
                        {nextInterview.job_title}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Start Time</p>
                        <p className="text-sm font-bold text-slate-700 mt-1 flex items-center gap-2">
                          <Clock size={12} /> {formatTime12h(nextInterview.scheduled_time)}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                        <p className="text-sm font-bold text-slate-700 mt-1 flex items-center gap-2">
                          <Calendar size={12} /> {new Date(nextInterview.scheduled_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <Button 
                        asChild 
                        className="w-full bg-primary hover:bg-slate-800 text-white rounded-md h-10 font-medium"
                      >
                        <a href={nextInterview.meet_link} target="_blank" rel="noreferrer">
                          <Video size={16} className="mr-2" /> Join Interview Session
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Calendar className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-400">No events scheduled.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;