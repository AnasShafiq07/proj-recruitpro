import React, { useState, useEffect } from 'react';
import { 
  Calendar, Mail, Phone, MapPin, FileText, Clock, 
  CheckCircle, Award, Briefcase, GraduationCap, 
  Download, ChevronLeft, Video, ExternalLink, 
  Loader2, MessageSquare, User, AlertCircle,
  ArrowUpRight
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from '@/components/layout/DashboardLayout';

import { candidateViewApi, CandidateWithAnswers } from "@/services/candidateViewApi";
import { jobApi, Question } from '@/services/jobApi';

const CandidateView = () => {
  const [googleAuthenticated, setGoogleAuthenticated] = useState<boolean>(false);
  const [candidate, setCandidate] = useState<CandidateWithAnswers | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  
  const [resumeBlobUrl, setResumeBlobUrl] = useState<string | null>(null);
  const [isResumeLoading, setIsResumeLoading] = useState(false);
  
  const [interviewForm, setInterviewForm] = useState({
    summary: '',
    description: 'Technical Interview Discussion',
    start_time: '',
    end_time: '',
  });

  // --- Effects ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const candidateId = urlParams.get('candidate');
    
    if(candidateId) {
      fetchData(candidateId);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (resumeBlobUrl) URL.revokeObjectURL(resumeBlobUrl);
    };
  }, [resumeBlobUrl]);

  const fetchData = async (id: string) => {
    try {
      setLoading(true);
      
      const authData = await candidateViewApi.getGoogleAuthStatus();
      setGoogleAuthenticated(authData.authenticated);

      const candidateData = await candidateViewApi.getCandidateById(id);
      setCandidate(candidateData);
      setInterviewForm(prev => ({ ...prev, summary: `Interview with ${candidateData.name}` }));

      if (candidateData.job_id) {
        try {
          const questionsData = await jobApi.getJobQuestions(candidateData.job_id);
          setQuestions(questionsData);
        } catch (err) {
          console.error("Failed to fetch job questions", err);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!candidate || !interviewForm.start_time || !interviewForm.end_time) {
      alert('Please fill in all required fields');
      return;
    }

    setScheduling(true);
    try {
      await candidateViewApi.scheduleInterview({
        candidate_id: candidate.candidate_id,
        job_id: candidate.job_id,
        email: candidate.email,
        summary: interviewForm.summary,
        description: interviewForm.description,
        start_time: new Date(interviewForm.start_time).toISOString(),
        end_time: new Date(interviewForm.end_time).toISOString(),
      });

      setScheduleSuccess(true);
      await handleStatusUpdate('interview_scheduled', true);

      setTimeout(() => {
        setShowScheduleModal(false);
        setScheduleSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert('Failed to schedule interview. Please try again.');
    } finally {
      setScheduling(false);
    }
  };

  const handleStatusUpdate = async (field: string, value: boolean) => {
    if (!candidate) return;
    
    setCandidate((prev: any) => ({ ...prev, [field]: value }));

    try {
      await candidateViewApi.updateStatus(candidate.candidate_id, { [field]: value });
    } catch (error) {
      console.error('Error updating status:', error);
      setCandidate((prev: any) => ({ ...prev, [field]: !value })); // Revert
    }
  };

  const handleOpenResume = async () => {
    if (!candidate?.resume_url) return alert("No resume URL found.");
    try {
      setIsResumeLoading(true);
      const { url } = await candidateViewApi.getResumeBlob(candidate.resume_url);
      if (resumeBlobUrl) URL.revokeObjectURL(resumeBlobUrl);
      setResumeBlobUrl(url);
      setShowResumeModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load resume.");
    } finally {
      setIsResumeLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!candidate?.resume_url) return;
    try {
      const { url } = await candidateViewApi.getResumeBlob(candidate.resume_url);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Resume-${candidate.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to download resume.");
    }
  };

    const getAnswerForQuestion = (qId: number) => {
    const answer = candidate?.answers?.find(a => a.question_id === qId);
    return answer ? answer.answer_text : null;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!candidate) return <DashboardLayout><div className="p-8 text-center">Candidate not found</div></DashboardLayout>;

  const aiScore = candidate.ai_score || 0;
  let scoreColorClass = 'bg-red-50 text-red-700 border-red-200';
  if (aiScore >= 80) scoreColorClass = 'bg-green-50 text-green-700 border-green-200';
  else if (aiScore >= 60) scoreColorClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';


  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 pb-12 animate-in fade-in duration-300">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-3 flex items-center gap-2">
           <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="text-muted-foreground hover:text-foreground -ml-2">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
           </Button>
           <Separator orientation="vertical" className="h-4 mx-2" />
           <h1 className="text-lg font-semibold text-foreground">{candidate.name}</h1>
           <Badge variant="outline" className="ml-2 font-normal text-muted-foreground">
             Applied {new Date(candidate.created_at ?? '').toLocaleDateString()}
           </Badge>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
              
              <Card className="overflow-hidden border-t-4 border-t-primary shadow-sm relative">
                <CardContent className="pt-12 px-6 pb-6 text-center">
                  <div className="relative inline-block mb-5">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-xl mx-auto relative z-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${candidate.name}`} />
                      <AvatarFallback className="text-4xl bg-primary/10 text-primary">{candidate.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {candidate.ai_score !== null && (
                      <div className="absolute -bottom-3 -right-3 z-20 bg-background p-1 rounded-full shadow-sm">
                        <div className={`flex items-center justify-center h-12 w-12 rounded-full text-sm font-bold border-4 ${scoreColorClass}`}>
                          {aiScore}%
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-foreground mb-1">{candidate.name}</h2>
                  <p className="text-sm text-muted-foreground mb-6 flex items-center justify-center gap-1">
                    <Briefcase className="h-3 w-3" /> Candidate ID: {candidate.candidate_id}
                  </p>

                  <div className="space-y-3 text-left bg-muted/50 p-5 rounded-xl border border-border/50 shadow-inner">
                    <div className="flex items-start gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="truncate font-medium" title={candidate.email}>{candidate.email}</span>
                    </div>
                    {candidate.phone && (
                      <div className="flex items-start gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="font-medium">{candidate.phone}</span>
                      </div>
                    )}
                    {candidate.location && (
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="font-medium">{candidate.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full shadow-sm" onClick={handleOpenResume}>
                      <FileText className="mr-2 h-4 w-4" /> View CV
                    </Button>
                    <Button variant="outline" className="w-full shadow-sm" onClick={handleDownloadResume}>
                      <Download className="mr-2 h-4 w-4" /> PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-primary" /> Hiring Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    <div className={`p-4 flex items-center justify-between transition-colors ${candidate.selected_for_interview ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
                      <div className="flex items-center gap-4">
                         <div className={`h-10 w-10 rounded-full flex items-center justify-center ${candidate.selected_for_interview ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                           <Award className="h-5 w-5" />
                         </div>
                         <div>
                           <p className="font-medium text-sm">Shortlist Application</p>
                           <p className="text-xs text-muted-foreground">Mark as qualified</p>
                         </div>
                      </div>
                      <Button size="sm" variant={candidate.selected_for_interview ? "default" : "secondary"} onClick={() => handleStatusUpdate('selected_for_interview', !candidate.selected_for_interview)}>
                         {candidate.selected_for_interview ? "Shortlisted" : "Select"}
                      </Button>
                    </div>

                    <div className={`p-4 transition-colors ${candidate.interview_scheduled ? 'bg-purple-50' : 'hover:bg-muted/50'}`}>
                       <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${candidate.interview_scheduled ? 'bg-purple-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                            <Video className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Interview Stage</p>
                            <p className="text-xs text-muted-foreground">{candidate.interview_scheduled ? 'Scheduled' : 'Not scheduled yet'}</p>
                          </div>
                        </div>
                        <Button size="sm" variant={candidate.interview_scheduled ? "outline" : "secondary"} disabled={!googleAuthenticated} onClick={() => setShowScheduleModal(true)} className={!googleAuthenticated ? "opacity-50 cursor-not-allowed" : ""}>
                          {candidate.interview_scheduled ? "Reschedule" : "Schedule"}
                        </Button>
                      </div>
                       {candidate.meet_link && (
                        <div className="ml-14 mt-2">
                           <a href={candidate.meet_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 hover:underline bg-purple-100 px-2 py-1 rounded-md">
                             <Video className="h-3 w-3" /> Join Google Meet <ExternalLink className="h-3 w-3" />
                           </a>
                        </div>
                      )}
                    </div>

                     <div className={`p-4 flex items-center justify-between transition-colors ${candidate.selected ? 'bg-green-50' : 'hover:bg-muted/50'}`}>
                      <div className="flex items-center gap-4">
                         <div className={`h-10 w-10 rounded-full flex items-center justify-center ${candidate.selected ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                           <CheckCircle className="h-5 w-5" />
                         </div>
                         <div>
                           <p className="font-medium text-sm">Final Decision</p>
                           <p className="text-xs text-muted-foreground">{candidate.selected ? 'Offer Accepted' : 'Make offer'}</p>
                         </div>
                      </div>
                      <Button size="sm" variant={candidate.selected ? "default" : "secondary"} className={candidate.selected ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => handleStatusUpdate('selected', !candidate.selected)}>
                         {candidate.selected ? "Hired" : "Hire Candidate"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-8 order-1 lg:order-2">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/80 backdrop-blur-sm">
                  <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                    <User className="h-4 w-4" /> Candidate Overview
                  </TabsTrigger>
                  <TabsTrigger value="screening" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                    <MessageSquare className="h-4 w-4" /> Screening Responses
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 h-auto min-w-[1.25rem]">{questions.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <Card className="shadow-sm border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Briefcase className="h-5 w-5" /></div>
                        Work Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {candidate.experience ? (
                        <div className="prose prose-slate prose-sm max-w-none whitespace-pre-line">
                          {candidate.experience}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic flex items-center gap-2"><AlertCircle className="h-4 w-4" /> No experience provided.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-l-4 border-l-purple-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-lg">
                         <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><GraduationCap className="h-5 w-5" /></div>
                         Education History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                       {candidate.education ? (
                        <div className="prose prose-slate prose-sm max-w-none whitespace-pre-line">
                          {candidate.education}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic flex items-center gap-2"><AlertCircle className="h-4 w-4" /> No education details provided.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-l-4 border-l-emerald-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Award className="h-5 w-5" /></div>
                        Skills & Expertise
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                         {candidate.skills ? (
                            typeof candidate.skills === 'string' 
                              ? candidate.skills.split(',').map((skill: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="px-3 py-1.5 text-sm bg-muted hover:bg-muted-foreground/20">
                                    {skill.trim()}
                                  </Badge>
                                ))
                              : <span className="text-foreground">{candidate.skills}</span>
                          ) : (
                            <span className="text-muted-foreground italic flex items-center gap-2"><AlertCircle className="h-4 w-4" /> No skills listed</span>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="screening" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle>Screening Questionnaire</CardTitle>
                      <CardDescription>
                        Review the candidate's responses to the required job questions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 pl-2">
                      {questions.length > 0 ? (
                        <div className="space-y-8 border-l-2 border-muted pl-6 ml-4 relative">
                          {questions.map((q, index) => {
                            const answer = getAnswerForQuestion(q.question_id);
                            return (
                              <div key={q.question_id} className="relative group">
                                <div className={`absolute -left-[33px] top-1 h-6 w-6 rounded-full border-4 border-background flex items-center justify-center z-10 transition-colors ${answer ? 'bg-primary' : 'bg-muted-foreground'}`}>
                                  <span className="text-[10px] font-bold text-primary-foreground">{index + 1}</span>
                                </div>
                                
                                <div className="space-y-3 pt-1">
                                  <h4 className="text-base font-semibold text-foreground leading-snug">
                                    {q.question_text}
                                  </h4>
                                  {answer ? (
                                    <div className="bg-muted/40 p-4 rounded-xl text-sm text-foreground leading-relaxed border shadow-sm group-hover:border-primary/30 transition-colors relative">
                                       <MessageSquare className="h-4 w-4 text-muted-foreground absolute top-4 left-4 opacity-50" />
                                      <div className="pl-8">{answer}</div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3 text-sm text-amber-700 bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
                                      <AlertCircle className="h-5 w-5 shrink-0" />
                                      <span className="font-medium">Candidate did not provide an answer for this question.</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <h3 className="text-lg font-medium mb-1">No Questions Configured</h3>
                          <p className="text-sm">There are no screening questions attached to this job position.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
          <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0">
            <DialogHeader className="p-6 pb-2 bg-muted/30 border-b">
              <DialogTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Schedule Interview</DialogTitle>
              <CardDescription>Send a Google Calendar invite to {candidate.email}</CardDescription>
            </DialogHeader>
            
            {scheduleSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                <div className="h-20 w-20 bg-green-100/80 rounded-full flex items-center justify-center mb-6 shadow-sm animate-bounce-slow">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Interview Scheduled!</h3>
                <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                  The invitation has been successfully sent.
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="summary" className="font-medium">Event Title</Label>
                  <Input 
                    id="summary"
                    value={interviewForm.summary} 
                    onChange={(e) => setInterviewForm({...interviewForm, summary: e.target.value})}
                    className="bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium">Description / Agenda</Label>
                  <Textarea 
                    id="description"
                    value={interviewForm.description} 
                    onChange={(e) => setInterviewForm({...interviewForm, description: e.target.value})}
                    rows={4}
                    className="bg-muted/30 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="start_time" className="font-medium">Start Time</Label>
                    <Input 
                      id="start_time"
                      type="datetime-local"
                      value={interviewForm.start_time}
                      onChange={(e) => setInterviewForm({...interviewForm, start_time: e.target.value})}
                       className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time" className="font-medium">End Time</Label>
                    <Input 
                      id="end_time"
                      type="datetime-local"
                      value={interviewForm.end_time}
                      onChange={(e) => setInterviewForm({...interviewForm, end_time: e.target.value})}
                       className="bg-muted/30"
                    />
                  </div>
                </div>
              </div>
            )}
            {!scheduleSuccess && (
               <DialogFooter className="p-6 pt-2 bg-muted/30 border-t sm:justify-between">
                  <Button variant="ghost" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
                  <Button onClick={handleScheduleInterview} disabled={scheduling || !interviewForm.start_time || !interviewForm.end_time} className="min-w-[140px]">
                    {scheduling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Video className="mr-2 h-4 w-4" /> Send Invite</>}
                  </Button>
                </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* Resume Modal */}
        <Dialog open={showResumeModal} onOpenChange={setShowResumeModal}>
          <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden flex flex-col bg-background">
            <div className="px-6 py-3 border-b flex items-center justify-between bg-muted/30">
               <h3 className="font-semibold text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Resume Preview</h3>
               <Button size="sm" variant="outline" onClick={handleDownloadResume} className="shadow-sm">
                 <Download className="h-4 w-4 mr-2" /> Download PDF
               </Button>
            </div>
            <div className="flex-1 bg-muted/50 flex items-center justify-center relative p-4">
              {isResumeLoading ? (
                 <div className="text-muted-foreground flex flex-col items-center gap-3">
                   <Loader2 className="h-10 w-10 animate-spin text-primary" /> 
                   <p className="font-medium">Fetching document...</p>
                 </div>
              ) : resumeBlobUrl ? (
                <iframe src={resumeBlobUrl} className="w-full h-full rounded shadow-sm border" title="Resume PDF" />
              ) : (
                <div className="text-center p-12 border-2 border-dashed rounded-xl bg-background/50">
                   <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                   <h3 className="text-lg font-medium">Unable to load preview</h3>
                   <p className="text-muted-foreground mt-1">The resume file could not be displayed.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default CandidateView;