import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const CreateJob = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([""]);
  const [postToLinkedIn, setPostToLinkedIn] = useState(false);

  const addQuestion = () => {
    setScreeningQuestions([...screeningQuestions, ""]);
  };

  const removeQuestion = (index: number) => {
    setScreeningQuestions(screeningQuestions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, value: string) => {
    const updated = [...screeningQuestions];
    updated[index] = value;
    setScreeningQuestions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Job posting created!",
      description: "Your job has been successfully posted.",
    });
    navigate("/dashboard");
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
                  <Input id="title" placeholder="e.g., Senior Frontend Developer" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" placeholder="e.g., Engineering" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Required Experience</Label>
                  <Input id="experience" placeholder="e.g., 5+ years" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobType">Job Type</Label>
                  <Input id="jobType" placeholder="e.g., Full-time, Remote" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Required Skills</Label>
                <Input
                  id="skills"
                  placeholder="React, TypeScript, Node.js (comma separated)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary Range</Label>
                  <Input id="salary" placeholder="e.g., $120k - $150k" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Application Deadline</Label>
                  <Input id="deadline" type="date" />
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeQuestion(index)}
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
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Question
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
                  <Input
                    id="skillsWeight"
                    type="number"
                    placeholder="e.g., 40"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experienceWeight">Experience Weight (%)</Label>
                  <Input
                    id="experienceWeight"
                    type="number"
                    placeholder="e.g., 30"
                    min="0"
                    max="100"
                  />
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
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </Button>
            <Button type="submit">Create Job Posting</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateJob;
