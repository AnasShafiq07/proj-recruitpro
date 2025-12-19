import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobCard } from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { 
  Plus, 
  Search, 
  Briefcase, 
  TrendingUp, 
  Users, 
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { jobApi, type Job } from "@/services/jobApi";
import { candidateApi } from "@/services/candidatesApi";

const StatCard = ({ title, value, icon: Icon, description }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
      <p className="text-xs text-green-600 mt-1 font-medium">{description}</p>
    </div>
    <div className="p-3 bg-blue-50 rounded-lg">
      <Icon className="h-5 w-5 text-blue-600" />
    </div>
  </div>
);

const Dashboard = () => {
  const [jobListing, setJobListing] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCandidates, setTotalCandidates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const data: Job[] = await jobApi.getAll();
        const cands = await candidateApi.getTotalApplied();
        setTotalCandidates(cands);
        setJobListing(data);
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = jobListing.filter((job) => 
    job.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50/50 p-8 space-y-8">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Recruitment Overview
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your job postings and track candidate pipelines.
            </p>
          </div>
          <Button
            onClick={() => navigate("/jobs/create")}
            className="shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Job Posting
          </Button>
        </div>

        {/* --- Stats Row (Professional HUD) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Active Jobs" 
            value={jobListing.length} 
            icon={Briefcase} 
            description="+2 this week"
          />
          <StatCard 
            title="Total Candidates" 
            value={totalCandidates.length} // You can make this dynamic later
            icon={Users} 
            description="+12% from last month"
          />
          <StatCard 
            title="Time to Hire" 
            value="18 Days" 
            icon={TrendingUp} 
            description="Top 10% of industry"
          />
        </div>

        <hr className="border-gray-200" />

        {/* --- Toolbar Section --- */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              placeholder="Search by job title or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="gap-2 text-gray-600 border-gray-200">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>
        </div>

        {/* --- Content Grid --- */}
        {loading ? (
          /* Loading Skeleton State */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1, 2, 3].map((i) => (
               <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />
             ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.job_id}
                job={job}
                onClick={() => navigate(`/candidates?job=${job.job_id}`)}
                // Assuming JobCard needs a subtle professional styling update, 
                // the layout here ensures spacing is correct.
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="bg-gray-50 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
            <p className="text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery 
                ? "We couldn't find any jobs matching your search." 
                : "You haven't posted any jobs yet. Create one to get started."}
            </p>
            {searchQuery && (
              <Button 
                variant="link" 
                onClick={() => setSearchQuery("")} 
                className="mt-2 text-blue-600"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;