import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Upload,
  Loader2,
} from "lucide-react";

// Import the API service
import { applicationApi } from "@/services/applyJobApi";

const ApplyJob = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const { data: jobData, isLoading, error } = useQuery({
    queryKey: ["public-job", slug],
    queryFn: ({ signal }) => applicationApi.getJobBySlug(slug!, signal),
    enabled: !!slug, // Only fetch if slug exists
    retry: 1,
  });

  const isDeadlineEnded = jobData?.job.deadline
    ? new Date(jobData.job.deadline) < new Date()
    : false;

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!jobData) throw new Error("Job data missing");

      let resumeUrl = "";
      if (resumeFile) {
        const uploadRes = await applicationApi.uploadResume(resumeFile);
        resumeUrl = uploadRes.url || uploadRes.file_url || "";
      }

      const candidateData = {
        job_id: jobData.job.job_id,
        company_id: jobData.job.company_id,
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: (formData.get("phone") as string) || undefined,
        location: (formData.get("location") as string) || undefined,
        skills: (formData.get("skills") as string) || undefined,
        experience: (formData.get("experience") as string) || undefined,
        education: (formData.get("education") as string) || undefined,
        resume_url: resumeUrl || undefined,
        answers: jobData.questions.map((q) => ({
          question_id: q.question_id,
          answer_text: answers[q.question_id] || "",
        })),
      };

      return await applicationApi.submitApplication(candidateData);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Application submitted successfully.",
      });

    },
    onError: (error: Error) => {
      toast({
        title: "Error!",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // --- Event Handlers ---

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    submitMutation.mutate(formData);
  };

  // --- Render States ---

  if (isLoading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (error || !jobData) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <p className="text-destructive">Job not found or failed to load.</p>
        </div>
    )
  }

  const { job, questions } = jobData;

  if (isDeadlineEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-6">
        <div className="bg-white shadow-lg p-10 rounded-xl border">
          <h1 className="text-3xl font-bold text-red-600 mb-3">
            Applications Closed
          </h1>
          <p className="text-lg text-gray-600">
            The deadline for this job has ended. You can no longer apply.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/10">
      {/* Header with Logo */}
      <div className="bg-gradient-to-r from-primary/95 via-primary to-primary/95 shadow-lg border-b border-primary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-2 shadow-md">
                <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                  RecruitPro
                </h1>
                <p className="text-xs sm:text-sm text-white/80 hidden sm:block">
                  Find Your Dream Career
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-5xl">
        {/* Job Details Header */}
        <Card className="mb-6 sm:mb-8 shadow-2xl border-border/40 hover:shadow-[var(--shadow-glow)] transition-all duration-500 overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
          <CardHeader className="space-y-4 sm:space-y-6 pb-4 sm:pb-6">
            <div className="space-y-3">
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2 leading-tight">
                {job.title}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Join our team and make an impact
              </CardDescription>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-border/50">
              {job.location && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors">
                  <div className="p-2 rounded-full bg-primary/10">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Location
                    </p>
                    <p className="text-sm sm:text-base text-foreground">
                      {job.location}
                    </p>
                  </div>
                </div>
              )}
              {job.salary_range && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors">
                  <div className="p-2 rounded-full bg-primary/10">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Salary
                    </p>
                    <p className="text-sm sm:text-base text-foreground">
                      {job.salary_range}
                    </p>
                  </div>
                </div>
              )}
              {job.deadline && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Deadline
                    </p>
                    <p className="text-sm sm:text-base text-foreground">
                        {new Date(job.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {job.application_fee !== undefined && job.application_fee > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Application Fee
                    </p>
                    <p className="text-sm sm:text-base text-foreground">
                      ${job.application_fee}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          {(job.description || job.requirements) && (
            <CardContent className="space-y-6 pt-0">
              {job.description && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-12 bg-gradient-to-r from-primary to-accent rounded-full"></div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      About the Role
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line pl-4 border-l-2 border-primary/20">
                    {job.description}
                  </p>
                </div>
              )}
              {job.requirements && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-12 bg-gradient-to-r from-primary to-accent rounded-full"></div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      Requirements
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line pl-4 border-l-2 border-primary/20">
                    {job.requirements}
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Application Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 sm:space-y-8 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <Card className="shadow-2xl border-border/40 hover:shadow-[var(--shadow-glow)] transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-primary to-accent"></div>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                <span className="inline-block w-1.5 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></span>
                Your Information
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Tell us about yourself and why you're a great fit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 group">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium flex items-center gap-1"
                  >
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="John Doe"
                    className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                  />
                </div>
                <div className="space-y-2 group">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium flex items-center gap-1"
                  >
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1">
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    required
                    placeholder="City, Country"
                    className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills" className="text-sm font-medium flex items-center gap-1">
                  Skills <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="skills"
                  name="skills"
                  required
                  placeholder="React, TypeScript, Node.js (comma separated)"
                  className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-medium flex items-center gap-1">
                    Years of Experience <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="experience"
                    name="experience"
                    required
                    placeholder="e.g., 5 years"
                    className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education" className="text-sm font-medium flex items-center gap-1">
                    Education <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="education"
                    name="education"
                    required
                    placeholder="e.g., Bachelor's in Computer Science"
                    className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume" className="text-sm font-medium flex items-center gap-1">
                  Resume/CV <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 sm:p-8 hover:border-primary/50 transition-all duration-300 bg-accent/5 hover:bg-accent/10">
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      required
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {resumeFile
                            ? resumeFile.name
                            : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, or DOCX (max 10MB)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Screening Questions */}
          {questions && questions.length > 0 && (
            <Card
              className="shadow-2xl border-border/40 hover:shadow-[var(--shadow-glow)] transition-all duration-500 overflow-hidden animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <span className="inline-block w-1.5 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></span>
                  Screening Questions
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Please answer the following questions thoughtfully
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 sm:space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={question.question_id}
                    className="space-y-2 p-4 sm:p-5 rounded-lg bg-accent/5 border border-border/40"
                  >
                    <Label
                      htmlFor={`question-${question.question_id}`}
                      className="text-sm sm:text-base font-medium flex items-start gap-2"
                    >
                      <span className="flex items-center justify-center min-w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="flex-1">{question.question_text}</span>
                    </Label>
                    <Textarea
                      id={`question-${question.question_id}`}
                      placeholder="Your answer..."
                      required
                      value={answers[question.question_id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(question.question_id, e.target.value)
                      }
                      rows={4}
                      className="transition-all duration-300 focus:scale-[1.01] focus:shadow-lg resize-none"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div
            className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-[var(--shadow-glow)] text-base sm:text-lg py-5 sm:py-6"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Submitting Application...
                </>
              ) : (
                <>Submit Application</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyJob;