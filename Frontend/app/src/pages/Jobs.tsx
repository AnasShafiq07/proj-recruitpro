import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  Trash2, 
  Filter, 
  Building2,
  DollarSign,
  MoreHorizontal,
  Edit2Icon
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import DepartmentForm from "./Depatments";
import { jobApi, type Job } from "@/services/jobApi";
import type { Department } from "@/utils/types";
import { useNavigate } from "react-router-dom";
import { candidateApi } from "@/services/candidatesApi";

const Jobs = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [jobListing, setJobListing] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [keyword, setKeyword] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initial Data Fetch
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const [jobsData, deptsData] = await Promise.all([
          jobApi.getAll(),
          jobApi.getDepartments()
        ]);
        
        const jobsWithQuestionsForm: Job[] = jobsData.map((job: any) => ({
          ...job,
        }));

        setAllJobs(jobsWithQuestionsForm);
        setJobListing(jobsWithQuestionsForm);
        setDepartments(deptsData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Filter Logic
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...allJobs];

      if (keyword.trim() !== "") {
        filtered = filtered.filter(
          (job) =>
            job.title.toLowerCase().includes(keyword.toLowerCase()) ||
            job.description?.toLowerCase().includes(keyword.toLowerCase())
        );
      }

      if (locationFilter.trim() !== "") {
        filtered = filtered.filter((job) =>
          job.location.toLowerCase().includes(locationFilter.toLowerCase())
        );
      }

      if (selectedCategory !== null) {
        filtered = filtered.filter(
          (job) => job.department_id === Number(selectedCategory)
        );
      }

      setJobListing(filtered);
    };

    applyFilters();
  }, [selectedCategory, keyword, locationFilter, allJobs]);

  const handleDelete = async (job_id: number) => {
    if (!window.confirm("Are you sure you want to delete this job posting?")) return;

    try {
      await jobApi.delete(job_id);
      setJobListing((prev) => prev.filter((job) => job.job_id !== job_id));
      setAllJobs((prev) => prev.filter((job) => job.job_id !== job_id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete job");
    }
  };

  const handleClearFilters = () => {
    setKeyword("");
    setLocationFilter("");
    setSelectedCategory(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Job Postings
              </h1>
              <p className="text-gray-500 mt-1">
                Manage your open positions and track candidate pools.
              </p>
            </div>
            <div className="flex items-center gap-2">
               <DepartmentForm />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by title or keyword..."
                className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Filter by location"
                className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            {(keyword || locationFilter || selectedCategory) && (
              <Button 
                variant="ghost" 
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-gray-900"
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar Categories */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">Departments</h3>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedCategory === null
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    All Departments
                  </button>
                  {departments.map((dept) => (
                    <button
                      key={dept.department_id}
                      onClick={() => setSelectedCategory(dept.department_id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedCategory === dept.department_id
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {dept.department_name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Job List */}
            <div className="lg:col-span-9 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-medium text-gray-500">
                  Showing {jobListing.length} active jobs
                </h2>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : jobListing.length > 0 ? (
                <div className="space-y-4">
                  {jobListing.map((job) => (
                    <Card 
                      key={job.job_id} 
                      className="group hover:shadow-md transition-all duration-200 border-gray-200"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          {/* Job Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between md:justify-start gap-3">
                              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                                {job.title}
                              </h3>
                              {job.urgent && (
                                <Badge variant="destructive" className="uppercase text-[10px] tracking-wider">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4" />
                                <span>{departments.find(d => d.department_id === job.department_id)?.department_name || 'General'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Briefcase className="h-4 w-4" />
                                <span>{job.job_type}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="h-4 w-4" />
                                <span>{job.salary_range}k</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                            <div className="text-right hidden md:block mr-4">
                              <p className="text-xs text-gray-400">Posted</p>
                              <p className="text-sm font-medium text-gray-700">{formatDate(job.created_at)}</p>
                            </div>
                            
                            <Button 
                              onClick={() => navigate(`/candidates?job=${job.job_id}`)}
                              className="bg-gray-900 text-white hover:bg-gray-800"
                            >
                              View Candidates
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/jobs/edit/${job.job_id}`)}>
                                  <Edit2Icon className="mr-2 h-4 w-4"
                                  />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(job.job_id)}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Job
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                  <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
                  <p className="text-gray-500 mt-1">
                    Try adjusting your filters or create a new job posting.
                  </p>
                  <Button 
                    variant="link" 
                    onClick={handleClearFilters}
                    className="mt-2 text-blue-600 font-medium"
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Jobs;