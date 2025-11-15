import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShareModal } from "@/components/ui/modal"
import type { Department } from "../utils/types";

const CreateJob = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([""]);
  const [postToLinkedIn, setPostToLinkedIn] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkToShare, setLinkToShare] = useState('');

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/departments/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
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

    fetchDepartments();
  }, []);

  const addQuestion = () => setScreeningQuestions([...screeningQuestions, ""]);
  const removeQuestion = (index: number) => setScreeningQuestions(screeningQuestions.filter((_, i) => i !== index));
  const updateQuestion = (index: number, value: string) => {
    const updated = [...screeningQuestions];
    updated[index] = value;
    setScreeningQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const deadline = formData.get("deadline") as string;

  const jobData = {
    department_id: Number(selectedDepartment),
    title: formData.get("title") as string,
    description: formData.get("description") as string || undefined,
    requirements: formData.get("skills") as string || undefined,
    location: formData.get("jobType") as string || undefined,
    salary_range: formData.get("salary") as string || undefined,
    deadline: deadline ? new Date(deadline).toISOString() : undefined,
    application_fee: formData.get("fees") ? Number(formData.get("fees")) : undefined,
    skills_weight: formData.get("skillsWeight") ? Number(formData.get("skillsWeight")) : undefined,
    experience_weight: formData.get("experienceWeight") ? Number(formData.get("experienceWeight")) : undefined,
    hr_id: Number(localStorage.getItem("hr_id")) || undefined,
    questions_form: screeningQuestions.length > 0
      ? { questions: screeningQuestions.map(q => ({ question_text: q })) }
      : undefined,
  };

    try {
    
      const response = await fetch("http://127.0.0.1:8000/jobs/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create job");
      }

      const resData = await response.json();
      setLinkToShare("http://127.0.0.1:8000/apply/" + resData.job_link);

      toast({
        title: "Success!",
        description: "Job has been created successfully.",
      });

      //navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error!",
        description: error.message,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create Job Posting</h1>
          <p className="text-muted-foreground mt-1">
            Fill in the details to create a new job posting
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input id="title" name="title" placeholder="e.g., Senior Frontend Developer" required />
                </div>
                <div className="space-y-2">
                  <Card className="shadow-[var(--shadow-elegant)] border-border/50 transition-all duration-300 hover:shadow-xl">
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-2xl font-bold bg-[var(--gradient-primary)] bg-clip-text text-transparent">
                        Select Department
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Choose from existing departments in your organization
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="department-select" className="text-sm font-medium">
                          Department
                        </Label>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                          <SelectTrigger id="department-select" className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {departments.map((dept) => (
                              <SelectItem
                                key={dept.department_id}
                                value={String(dept.department_id)}
                                className="cursor-pointer hover:bg-accent/50 focus:bg-accent/50"
                              >
                                {dept.department_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedDepartment && (
                          <p className="text-sm text-muted-foreground mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            Selected: <span className="font-medium text-foreground">{departments.find(d => String(d.department_id) === selectedDepartment)?.department_name}</span>
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea id="description" name="description" placeholder="Describe the role, responsibilities, and requirements..." rows={6} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Required Experience</Label>
                  <Input id="experience" name="experience" placeholder="e.g., 5+ years" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobType">Job Type</Label>
                  <Input id="jobType" name="jobType" placeholder="e.g., Full-time, Remote" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Required Skills</Label>
                <Input id="skills" name="skills" placeholder="React, TypeScript, Node.js (comma separated)" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary Range</Label>
                  <Input id="salary" name="salary" placeholder="e.g., $120k - $150k" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Application Deadline</Label>
                  <Input id="deadline" name="deadline" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fees">Job Fees</Label>
                  <Input id="fees" name="fees" type="number" min={0} placeholder="0" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Screening Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {screeningQuestions.map((question, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Question ${index + 1}`}
                    value={question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                  />
                  {screeningQuestions.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeQuestion(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addQuestion} className="gap-2">
                <Plus className="h-4 w-4" /> Add Question
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hiring Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="skillsWeight">Skills Matching Weight (%)</Label>
                  <Input id="skillsWeight" name="skillsWeight" type="number" placeholder="e.g., 40" min={0} max={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experienceWeight">Experience Weight (%)</Label>
                  <Input id="experienceWeight" name="experienceWeight" type="number" placeholder="e.g., 30" min={0} max={100} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="linkedin"
                  checked={postToLinkedIn}
                  onCheckedChange={(checked) => setPostToLinkedIn(checked as boolean)}
                />
                <Label htmlFor="linkedin" className="cursor-pointer">
                  Post this job to LinkedIn automatically
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button type="submit" 
              onClick={handleOpenModal}>
              Create Job Posting
            </Button>
          </div>
        </form>
        <ShareModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        link={linkToShare}
        />
      </div>
    </DashboardLayout>
  );
};

export default CreateJob;
