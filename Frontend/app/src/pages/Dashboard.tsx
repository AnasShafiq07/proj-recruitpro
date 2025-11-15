import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobCard } from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import DepartmentForm from "./Depatments";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data
const mockJobs = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "Remote",
    type: "Full-time",
    applicants: 45,
    selected: 8,
    createdAt: "2 days ago",
    urgent: true,
  },
  {
    id: "2",
    title: "Product Manager",
    company: "Innovation Labs",
    location: "New York, NY",
    type: "Full-time",
    applicants: 32,
    selected: 5,
    createdAt: "5 days ago",
  },
  {
    id: "3",
    title: "UX Designer",
    company: "Design Studio",
    location: "San Francisco, CA",
    type: "Contract",
    applicants: 28,
    selected: 12,
    createdAt: "1 week ago",
  },
  {
    id: "4",
    title: "Backend Engineer",
    company: "CloudSystems",
    location: "Remote",
    type: "Full-time",
    applicants: 51,
    selected: 6,
    createdAt: "3 days ago",
  },
  {
    id: "5",
    title: "Data Analyst",
    company: "Analytics Pro",
    location: "Boston, MA",
    type: "Full-time",
    applicants: 19,
    selected: 3,
    createdAt: "1 week ago",
  },
  {
    id: "6",
    title: "DevOps Engineer",
    company: "Infrastructure Ltd",
    location: "Remote",
    type: "Full-time",
    applicants: 37,
    selected: 9,
    createdAt: "4 days ago",
    urgent: true,
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of all active job postings
            </p>
          </div>
          <Button
            onClick={() => navigate("/jobs/create")}
            className="gap-2"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Create Job Posting
          </Button>
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockJobs.map((job) => (
            <JobCard
              key={job.id}
              {...job}
              onClick={() => navigate(`/candidates?job=${job.id}`)}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
