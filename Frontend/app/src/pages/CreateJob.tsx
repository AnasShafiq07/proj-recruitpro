import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, X, Sparkles, Briefcase, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShareModal } from "@/components/ui/modal";
import { LinkedInPostPreview } from "@/components/jobs/LinkedInPostPreview";
import type { Department } from "../utils/types";


const API_BASE_URL = "http://127.0.0.1:8000";

const CreateJob = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([""]);
  const [showLinkedInGenerator, setShowLinkedInGenerator] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobCreated, setJobCreated] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkToShare, setLinkToShare] = useState("");
  const [linkedinConnected, setLinkedinConnected] = useState<boolean>(false);

  const fetchLinkedInDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/linkedin/auth/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLinkedinConnected(data.authenticated);
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
    }
  }

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/departments/get/all", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch departments!");
        }

        const data: Department[] = await response.json();
        setDepartments(data);
      } catch (error: any) {
        toast({
          title: "Error!",
          description: error.message,
        });
      }
    };
    fetchLinkedInDetails();
    fetchDepartments();
  }, []);

  const addQuestion = () => setScreeningQuestions([...screeningQuestions, ""]);
  const removeQuestion = (index: number) =>
    setScreeningQuestions(screeningQuestions.filter((_, i) => i !== index));
  const updateQuestion = (index: number, value: string) => {
    const updated = [...screeningQuestions];
    updated[index] = value;
    setScreeningQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const deadline = formData.get("deadline") as string;

    const jobData = {
      department_id: Number(selectedDepartment),
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      requirements: (formData.get("skills") as string) || undefined,
      job_type: (formData.get("jobType") as string) || undefined,
      location: (formData.get("location") as string) || undefined,
      salary_range: (formData.get("salary") as string) || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      application_fee: formData.get("fees") ? Number(formData.get("fees")) : undefined,
      skills_weight: formData.get("skillsWeight") ? Number(formData.get("skillsWeight")) : undefined,
      experience_weight: formData.get("experienceWeight")
        ? Number(formData.get("experienceWeight"))
        : undefined,
      hr_id: Number(localStorage.getItem("hr_id")) || undefined,
      questions_form:
        screeningQuestions.length > 0
          ? { questions: screeningQuestions.map((q) => ({ question_text: q })) }
          : undefined,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/jobs/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create job");
      }

      const resData = await response.json();
      setLinkToShare("http://localhost:8082/apply/" + resData.job_link);

      toast({
        title: "Success!",
        description: "Job has been created successfully.",
      });
      setJobCreated(true);
      setIsModalOpen(true);
    } catch (error: any) {
      toast({
        title: "Error!",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 lg:mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                    Create Job Posting
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base mt-1">
                    Fill in the details to create a new opportunity for top talent
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
            {/* Job Information */}
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in">
              <CardHeader className="border-b border-border/30 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Job Information</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Core details about the position</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5 lg:pt-6 space-y-5 lg:space-y-6">
                <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium flex items-center gap-1">
                      Job Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Senior Frontend Developer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                      className="h-10 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department-select" className="text-sm font-medium flex items-center gap-1">
                      Department <span className="text-destructive">*</span>
                    </Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="h-10 transition-all">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem
                            key={dept.department_id}
                            value={String(dept.department_id)}
                            className="cursor-pointer"
                          >
                            {dept.department_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium flex items-center gap-1">
                    Job Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
                    rows={6}
                    required
                    className="resize-none transition-all"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-sm font-medium">
                      Required Experience
                    </Label>
                    <Input
                      id="experience"
                      name="experience"
                      placeholder="e.g., 5+ years"
                      className="h-10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobType" className="text-sm font-medium">
                      Job Type
                    </Label>
                    <Input
                      id="jobType"
                      name="jobType"
                      placeholder="e.g., Full-time, Remote"
                      className="h-10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium">
                      Job Location
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="City name or Remote"
                      className="h-10 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills" className="text-sm font-medium">
                      Required Skills
                    </Label>
                    <Input
                      id="skills"
                      name="skills"
                      placeholder="React, TypeScript, Node.js"
                      className="h-10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="salary" className="text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      Salary Range
                    </Label>
                    <Input
                      id="salary"
                      name="salary"
                      placeholder="e.g., $120k - $150k"
                      className="h-10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Deadline
                    </Label>
                    <Input
                      id="deadline"
                      name="deadline"
                      type="date"
                      className="h-10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fees" className="text-sm font-medium">
                      Application Fee
                    </Label>
                    <Input
                      id="fees"
                      name="fees"
                      type="number"
                      min={0}
                      placeholder="0"
                      className="h-10 transition-all"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Screening Questions */}
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in">
              <CardHeader className="border-b border-border/30 pb-4">
                <CardTitle className="text-lg sm:text-xl">Screening Questions</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Ask candidates key questions to filter applications</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 lg:pt-6 space-y-4">
                {screeningQuestions.map((question, index) => (
                  <div key={index} className="flex gap-2 sm:gap-3 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder={`Question ${index + 1}`}
                        value={question}
                        onChange={(e) => updateQuestion(index, e.target.value)}
                        className="h-10 transition-all"
                      />
                    </div>
                    {screeningQuestions.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeQuestion(index)}
                        className="h-10 w-10 shrink-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addQuestion}
                  className="gap-2 h-10 border-primary/20 hover:border-primary hover:bg-primary/5 hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </CardContent>
            </Card>

            {/* Hiring Criteria */}
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in">
              <CardHeader className="border-b border-border/30 pb-4">
                <CardTitle className="text-lg sm:text-xl">AI Matching Criteria</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Configure how candidates will be scored</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 lg:pt-6">
                <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="skillsWeight" className="text-sm font-medium">
                      Skills Matching Weight (%)
                    </Label>
                    <Input
                      id="skillsWeight"
                      name="skillsWeight"
                      type="number"
                      placeholder="e.g., 40"
                      min={0}
                      max={100}
                      className="h-10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceWeight" className="text-sm font-medium">
                      Experience Weight (%)
                    </Label>
                    <Input
                      id="experienceWeight"
                      name="experienceWeight"
                      type="number"
                      placeholder="e.g., 30"
                      min={0}
                      max={100}
                      className="h-10 transition-all"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="h-11 px-6 sm:px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !selectedDepartment || !jobTitle}
                className="h-11 px-6 sm:px-8 gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Job Posting
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* LinkedIn Post Generator Modal */}
          {showLinkedInGenerator && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="max-w-2xl w-full">
                <LinkedInPostPreview
                  jobTitle={jobTitle || "New Position"}
                  applyLink={linkToShare}
                  onClose={() => setShowLinkedInGenerator(false)}
                />
              </div>
            </div>
          )}

          {/* Share Modal */}
          <ShareModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            link={linkToShare}
          />

          {/* LinkedIn Post Generator */}
          <div className="mt-5 lg:mt-6">
            <Card className="border-accent/30 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in bg-gradient-to-br from-card to-accent/5">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="p-2.5 bg-accent/10 rounded-xl border border-accent/20 shrink-0">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg">Share on LinkedIn</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                        Generate an AI-powered post to attract top talent on LinkedIn
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setShowLinkedInGenerator(true)}
                      variant="outline"
                      className="h-10 gap-2 border-accent/30 hover:border-accent hover:bg-accent/10 text-accent hover:text-accent w-full sm:w-auto"
                      disabled={!jobCreated || !linkedinConnected}
                    >
                      <Sparkles className="h-4 w-4" />
                      {linkedinConnected ? "Generate LinkedIn Post" : "LinkedIn not connected"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateJob;
