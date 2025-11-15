import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Briefcase, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import DepartmentForm from "./Depatments";

// Mock data
const jobCategories = [
  { name: "Frontend Developer", count: 8 },
  { name: "Backend Developer", count: 12 },
  { name: "Full Stack Developer", count: 6 },
  { name: "UI/UX Designer", count: 4 },
  { name: "Product Manager", count: 3 },
  { name: "Data Analyst", count: 5 },
  { name: "DevOps Engineer", count: 7 },
  { name: "QA Engineer", count: 4 },
];

const mockJobListings = [
  {
    id: "1",
    title: "Senior React Developer",
    company: "TechCorp Solutions",
    location: "Remote",
    type: "Full-time",
    salary: "$120k - $150k",
    posted: "2 days ago",
    urgent: true,
  },
  {
    id: "2",
    title: "Product Designer",
    company: "Design Studio Inc",
    location: "New York, NY",
    type: "Full-time",
    salary: "$90k - $120k",
    posted: "5 days ago",
  },
  {
    id: "3",
    title: "Backend Engineer",
    company: "CloudSystems",
    location: "San Francisco, CA",
    type: "Contract",
    salary: "$140k - $180k",
    posted: "1 week ago",
  },
  {
    id: "4",
    title: "DevOps Specialist",
    company: "Infrastructure Ltd",
    location: "Remote",
    type: "Full-time",
    salary: "$130k - $160k",
    posted: "3 days ago",
  },
];

const Jobs = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Job Postings</h1>
            <p className="text-muted-foreground">Browse and manage all job listings</p>
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
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Location"
                className="pl-10 h-12"
              />
            </div>
            <Button className="h-12 px-8">
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
                  {jobCategories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.name
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{category.name}</span>
                        <span className="text-xs">({category.count})</span>
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
                {mockJobListings.length} jobs found
              </p>
            </div>

            {mockJobListings.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        {job.urgent && (
                          <Badge variant="destructive">URGENT</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-4">{job.company}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{job.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{job.posted}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-lg text-primary mb-2">
                        {job.salary}
                      </p>
                      <Button>View Details</Button>
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
