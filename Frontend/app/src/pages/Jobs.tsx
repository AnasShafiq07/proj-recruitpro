import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { 
  Search, 
  MapPin, 
  Trash2, 
  Filter, 
  MoreHorizontal,
  Pencil,
  Loader2,
  Building2,
  Briefcase,
  DollarSign
} from "lucide-react";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import DepartmentForm from "./Depatments";
import { jobApi, type Job } from "@/services/jobApi";
import { departmentApi } from "@/services/departmentsApi";
import type { Department } from "@/utils/types";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Jobs = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const [isEditDeptOpen, setIsEditDeptOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [newDeptName, setNewDeptName] = useState("");

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => jobApi.getAll(),
  });

  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["departments"],
    queryFn: () => jobApi.getDepartments(),
  });

  const isLoading = isLoadingJobs || isLoadingDepts;
  
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (keyword.trim() !== "") {
      const k = keyword.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(k) ||
          job.description?.toLowerCase().includes(k)
      );
    }

    if (locationFilter.trim() !== "") {
      const l = locationFilter.toLowerCase();
      result = result.filter((job) =>
        job.location?.toLowerCase().includes(l)
      );
    }

    if (selectedCategory !== null) {
      result = result.filter(
        (job) => job.department_id === Number(selectedCategory)
      );
    }

    return result;
  }, [jobs, keyword, locationFilter, selectedCategory]);


  const deleteJobMutation = useMutation({
    mutationFn: (jobId: number) => jobApi.delete(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Job deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete job", variant: "destructive" });
    },
  });

  const updateDeptMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      departmentApi.updateDepartment(name, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({ title: "Department updated successfully" });
      setIsEditDeptOpen(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Update failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: (id: number) => departmentApi.deleteDepartment(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      if (selectedCategory === deletedId) {
        setSelectedCategory(null);
      }
      toast({ title: "Department deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Delete failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });


  const handleDeleteJob = (job_id: number) => {
    if (window.confirm("Are you sure you want to delete this job posting?")) {
      deleteJobMutation.mutate(job_id);
    }
  };

  const openEditDeptModal = (dept: Department) => {
    setEditingDept(dept);
    setNewDeptName(dept.department_name);
    setIsEditDeptOpen(true);
  };

  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editingDept.department_id) return;
    updateDeptMutation.mutate({ 
      id: editingDept.department_id, 
      name: newDeptName 
    });
  };

  const handleDeleteDepartment = (deptId: number) => {
    if (window.confirm("Are you sure? This action cannot be undone.")) {
      deleteDeptMutation.mutate(deptId);
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

  const getDepartmentName = (deptId?: number) => {
    return departments.find(d => d.department_id === deptId)?.department_name || 'General';
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
                
                {isLoadingDepts ? (
                   <div className="space-y-2">
                      <div className="h-8 bg-gray-100 rounded animate-pulse" />
                      <div className="h-8 bg-gray-100 rounded animate-pulse" />
                   </div>
                ) : (
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
                      <div 
                        key={dept.department_id} 
                        className={`group flex items-center justify-between rounded-md transition-colors w-full ${
                          selectedCategory === dept.department_id
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                        }`}
                      >
                        <button
                          onClick={() => setSelectedCategory(dept.department_id!)}
                          className={`flex-1 text-left px-3 py-2 text-sm font-medium ${
                            selectedCategory === dept.department_id
                              ? "text-blue-700"
                              : "text-gray-600 group-hover:text-gray-900"
                          }`}
                        >
                          {dept.department_name}
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDeptModal(dept)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteDepartment(dept.department_id!)}
                              disabled={deleteDeptMutation.isPending}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              {deleteDeptMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Main Job List */}
            <div className="lg:col-span-9 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-medium text-gray-500">
                  Showing {filteredJobs.length} active jobs
                </h2>
              </div>

              {isLoadingJobs ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredJobs.length > 0 ? (
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
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
                            
                            {/* Restored Original Card Style with Icons */}
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4" />
                                <span>{getDepartmentName(job.department_id)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Briefcase className="h-4 w-4" />
                                <span>{job.job_type || 'Full-time'}</span>
                              </div>
                              {job.salary_range && (
                                <div className="flex items-center gap-1.5">
                                  <DollarSign className="h-4 w-4" />
                                  <span>{job.salary_range}</span>
                                </div>
                              )}
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
                              className="bg-primary text-white hover:shadow-md"
                            >
                              View Candidates
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 hover:bg-inherit">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteJob(job.job_id)}
                                  disabled={deleteJobMutation.isPending}
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

      {/* Edit Department Modal */}
      <Dialog open={isEditDeptOpen} onOpenChange={setIsEditDeptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Make changes to the department name here.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateDepartment}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={updateDeptMutation.isPending || !newDeptName.trim()}
              >
                {updateDeptMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Jobs;