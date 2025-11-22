import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Briefcase, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import DepartmentForm from "./Depatments";
import { jobApi, type Job } from "@/services/jobApi";
import type { Department } from "@/utils/types";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

const Jobs = () => {
  const [selectedCategory, setSelectedCategory] = useState<Number>(null);
  const [jobListing, setJobListing] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [keyword, setKeyword] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const fetchJobs = async () => {
      const data = await jobApi.getAll();
      const data2 = await jobApi.getDepartments();
      const jobsWithQuestionsForm: Job[] = data.map((job: any) => ({
        ...job,
      }));
      setAllJobs(jobsWithQuestionsForm);
      setJobListing(jobsWithQuestionsForm);
      setDepartments(data2);
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      if (selectedCategory !== null) {
        let data = await jobApi.getJobsByDepartments(Number(selectedCategory));
        setJobListing(data);
      }
    };
    fetchJobs();
  }, [selectedCategory]);

  useEffect(() => {
    applyFilters();
  }, [selectedCategory]);

  const applyFilters = () => {
    let filtered = [...allJobs];
    if (keyword.trim() !== "") {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(keyword.toLowerCase()) ||
          job.description.toLowerCase().includes(keyword.toLowerCase())
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

  const handleDelete = async (job_id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this job?"
    );
    if (!confirmDelete) return;

    try {
      await jobApi.delete(job_id);

      setJobListing((prev) => prev.filter((job) => job.job_id !== job_id));
      setAllJobs((prev) => prev.filter((job) => job.job_id !== job_id));

      alert("Job deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete job");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Job Postings
            </h1>
            <p className="text-muted-foreground">
              Browse and manage all job listings
            </p>
          </div>
          <div className="ml-auto">
            <DepartmentForm />
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-card rounded-lg shadow-sm p-6 mb-8 border border-border">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Keywords"
                className="pl-10 h-12"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Location"
                className="pl-10 h-12"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <Button className="h-12 px-8" onClick={applyFilters}>
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Job Categories</h3>
                <div className="space-y-2">
                  {departments.map((category) => (
                    <button
                      key={category.department_name}
                      onClick={() =>
                        setSelectedCategory(category.department_id)
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.department_id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {category.department_name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {jobListing.length} Jobs found
              </p>
            </div>

            {jobListing.map((job) => (
              <Card
                key={job.job_id}
                className="hover:shadow-lg transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        {job.urgent && (
                          <Badge variant="destructive">URGENT</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{job.job_type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            Posted at:{" "}
                            {job.created_at
                              ? new Date(job.created_at).toLocaleDateString(
                                  undefined,
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )
                              : "Date N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <p className="font-semibold text-lg text-primary">
                        Rs. {job.salary_range}K
                      </p>

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() =>
                            navigate(`/candidates?job=${job.job_id}`)
                          }
                        >
                          View Candidates
                        </Button>

                        <Button
                          className="bg-transparent text-black hover:text-red-600 hover:bg-transparent"
                          onClick={() => handleDelete(job.job_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Jobs;
