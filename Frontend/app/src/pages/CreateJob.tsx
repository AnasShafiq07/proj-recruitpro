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
      <div className="min-h-screen bg-gradient-subtle">
        <div className="p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-slide-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Briefcase className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Create Job Posting
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Fill in the details to create a new opportunity for top talent
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Information */}
            <Card className="shadow-elegant border-border/50 hover:shadow-glow transition-all duration-300 animate-fade-in">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Job Information
                </CardTitle>
                <CardDescription>Core details about the position</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold">
                      Job Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Senior Frontend Developer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department-select" className="text-sm font-semibold">
                      Department *
                    </Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
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
                  <Label htmlFor="description" className="text-sm font-semibold">
                    Job Description *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
                    rows={8}
                    required
                    className="resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-sm font-semibold">
                      Required Experience
                    </Label>
                    <Input
                      id="experience"
                      name="experience"
                      placeholder="e.g., 5+ years"
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobType" className="text-sm font-semibold">
                      Job Type
                    </Label>
                    <Input
                      id="jobType"
                      name="jobType"
                      placeholder="e.g., Full-time, Remote"
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-semibold">
                    Job Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="City name or Remote"
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills" className="text-sm font-semibold">
                    Required Skills
                  </Label>
                  <Input
                    id="skills"
                    name="skills"
                    placeholder="React, TypeScript, Node.js (comma separated)"
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="salary" className="text-sm font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Salary Range
                    </Label>
                    <Input
                      id="salary"
                      name="salary"
                      placeholder="e.g., $120k - $150k"
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Application Deadline
                    </Label>
                    <Input
                      id="deadline"
                      name="deadline"
                      type="date"
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fees" className="text-sm font-semibold">
                      Application Fee
                    </Label>
                    <Input
                      id="fees"
                      name="fees"
                      type="number"
                      min={0}
                      placeholder="0"
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Screening Questions */}
            <Card className="shadow-elegant border-border/50 hover:shadow-glow transition-all duration-300 animate-fade-in">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-2xl">Screening Questions</CardTitle>
                <CardDescription>Ask candidates key questions to filter applications</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {screeningQuestions.map((question, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder={`Question ${index + 1}`}
                        value={question}
                        onChange={(e) => updateQuestion(index, e.target.value)}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    {screeningQuestions.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeQuestion(index)}
                        className="shrink-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
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
                  className="gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </CardContent>
            </Card>

            {/* Hiring Criteria */}
            <Card className="shadow-elegant border-border/50 hover:shadow-glow transition-all duration-300 animate-fade-in">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-2xl">AI Matching Criteria</CardTitle>
                <CardDescription>Configure how candidates will be scored</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="skillsWeight" className="text-sm font-semibold">
                      Skills Matching Weight (%)
                    </Label>
                    <Input
                      id="skillsWeight"
                      name="skillsWeight"
                      type="number"
                      placeholder="e.g., 40"
                      min={0}
                      max={100}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceWeight" className="text-sm font-semibold">
                      Experience Weight (%)
                    </Label>
                    <Input
                      id="experienceWeight"
                      name="experienceWeight"
                      type="number"
                      placeholder="e.g., 30"
                      min={0}
                      max={100}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="px-8 hover:bg-red-500"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !selectedDepartment || !jobTitle}
              >
                {isLoading ? "Creating..." : "Create Job Posting"}
              </Button>
            </div>
          </form>

          {/* LinkedIn Post Generator Modal */}
          {showLinkedInGenerator && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="max-w-2xl w-full">
                <LinkedInPostPreview
                  jobTitle={jobTitle || "New Position"}
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
          <div className="my-3">
              {/* LinkedIn Post Generator */}
            <Card className="shadow-elegant border-border/50 hover:shadow-accent transition-all duration-300 animate-fade-in bg-gradient-to-br from-card to-accent/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-accent rounded-lg shrink-0">
                    <Sparkles className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">Share on LinkedIn</h3>
                      <p className="text-muted-foreground text-sm">
                        Generate an AI-powered post to attract top talent on LinkedIn
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setShowLinkedInGenerator(true)}
                      variant="outline"
                      className="border-accent/30 hover:border-accent hover:bg-accent/10 text-accent hover:text-accent"
                      disabled={!jobCreated || !linkedinConnected}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      { linkedinConnected ? "Generate LinkedIn Post" : "LinkedIn not connected" }
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
