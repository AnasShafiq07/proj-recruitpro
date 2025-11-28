import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Award, 
  Briefcase, 
  GraduationCap, 
  Download, 
  Link as LinkIcon,
  ChevronLeft,
  MoreHorizontal,
  Video,
  ExternalLink,
  Loader2,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Bell
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from '@/components/layout/DashboardLayout';


const API_BASE_URL = "http://127.0.0.1:8000";

const CandidateView = () => {
  // State from your logic
  const [googleAuthenticated, setGoogleAuthenticated] = useState<boolean>(false);
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [resumeBlobUrl, setResumeBlobUrl] = useState<string | null>(null);
  const [isResumeLoading, setIsResumeLoading] = useState(false);
  
  const [interviewForm, setInterviewForm] = useState({
    summary: 'Interview Session',
    description: 'Technical Interview Discussion',
    start_time: '',
    end_time: '',
  });

  // --- REAL DATA FETCHING ---

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    // Defaulting to '1' for demo if no param exists
    const candidateId = urlParams.get('candidate') || '1'; 
    fetchCandidateDetails(candidateId);
    fetchGoogleDetails();
  }, []);

  const fetchGoogleDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/google/auth/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setGoogleAuthenticated(data.authenticated);
      }
    } catch (error) {
      console.error('Error fetching google status:', error);
    }
  }

  const fetchCandidateDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/candidates/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCandidate(data);
        // Pre-fill interview form title
        setInterviewForm(prev => ({
          ...prev,
          summary: `Interview with ${data.name}`
        }));
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!interviewForm.start_time || !interviewForm.end_time) {
      alert('Please fill in all required fields');
      return;
    }

    setScheduling(true);
    try {
      const response = await fetch(`${API_BASE_URL}/google/create_event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          candidate_id: candidate.candidate_id,
          job_id: candidate.job_id,
          email: candidate.email,
          summary: interviewForm.summary,
          description: interviewForm.description,
          start_time: new Date(interviewForm.start_time).toISOString(),
          end_time: new Date(interviewForm.end_time).toISOString(),
        }),
      });

      if (response.ok) {
        setScheduleSuccess(true);
        
        // Update candidate interview status locally and on backend
        await fetch(`${API_BASE_URL}/candidates/update/${candidate.candidate_id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ interview_scheduled: true }),
        });

        // Optimistic update
        setCandidate((prev: any) => ({ ...prev, interview_scheduled: true }));

        setTimeout(() => {
          setShowScheduleModal(false);
          setScheduleSuccess(false);
          fetchCandidateDetails(candidate.candidate_id);
        }, 2000);
      } else {
        alert('Failed to schedule interview. Please try again.');
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert('Error scheduling interview');
    } finally {
      setScheduling(false);
    }
  };

  const handleStatusUpdate = async (field: string, value: boolean) => {
    // Optimistic UI update
    setCandidate((prev: any) => ({ ...prev, [field]: value }));

    try {
      await fetch(`${API_BASE_URL}/candidates/update/${candidate.candidate_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
      // Re-fetch to ensure sync
      fetchCandidateDetails(candidate.candidate_id);
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert optimistic update on error
      setCandidate((prev: any) => ({ ...prev, [field]: !value }));
    }
  };

  // Fetch resume logic
  const fetchResumeBlob = async () => {
    if (!candidate?.resume_url) {
      throw new Error('No resume available for this candidate');
    }
    
    setIsResumeLoading(true);
    try {
      const res = await fetch(`${candidate.resume_url}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(`Failed to fetch resume (${res.status}) ${text || ''}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      if (resumeBlobUrl) URL.revokeObjectURL(resumeBlobUrl);
      setResumeBlobUrl(url);
      return { url, blob };
    } finally {
      setIsResumeLoading(false);
    }
  };

  const handleOpenResume = async () => {
    try {
      await fetchResumeBlob();
      setShowResumeModal(true);
    } catch (err) {
      console.error('Error opening resume:', err);
      alert("Resume not available or failed to load.");
    }
  };

  const handleDownload = async () => {
    try {
      const { url } = await fetchResumeBlob();
      const parts = candidate.resume_url.split('/');
      const fileName = parts[parts.length - 1] || `resume_${candidate.candidate_id}.pdf`;

      const a = document.createElement('a');
      a.href = url;
      a.download = decodeURIComponent(fileName);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Error downloading resume:', err);
      alert("Resume not available.");
    }
  };

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (resumeBlobUrl) {
        URL.revokeObjectURL(resumeBlobUrl);
      }
    };
  }, [resumeBlobUrl]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-500 font-medium">Loading candidate profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!candidate) return (
    <DashboardLayout>
      <div className="p-8 flex items-center justify-center h-[calc(100vh-4rem)] text-gray-500">
        Candidate not found
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Navigation Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="gap-2 text-gray-500 hover:text-gray-900 pl-0" onClick={() => window.history.back()}>
              <ChevronLeft className="h-4 w-4" />
              Back to Candidates
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: Main Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Header Card */}
              <Card className="border-l-4 border-l-blue-600 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex gap-5">
                      <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${candidate.name}`} />
                        <AvatarFallback>{candidate.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
                        <div className="flex flex-col gap-1 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" /> {candidate.email}
                          </div>
                          {candidate.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" /> {candidate.phone}
                            </div>
                          )}
                          {candidate.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" /> {candidate.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Score Badge */}
                    {candidate.ai_score !== null && (
                      <div className="flex flex-col items-end gap-2">
                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl flex flex-col items-center border border-blue-100">
                          <span className="text-3xl font-bold tracking-tight">{candidate.ai_score}</span>
                          <span className="text-xs font-semibold uppercase tracking-wider">AI Match</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Experience Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Work Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line leading-relaxed">
                    {candidate.experience || "No experience listed."}
                  </div>
                </CardContent>
              </Card>

              {/* Education Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line leading-relaxed">
                    {candidate.education || "No education listed."}
                  </div>
                </CardContent>
              </Card>

              {/* Skills Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills ? (
                      typeof candidate.skills === 'string' 
                        ? candidate.skills.split(',').map((skill: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200">
                              {skill.trim()}
                            </Badge>
                          ))
                        : <span className="text-gray-700">{candidate.skills}</span>
                    ) : (
                      <span className="text-gray-500 italic">No skills listed</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Actions & Status */}
            <div className="space-y-6">
              
              {/* Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                    disabled={!googleAuthenticated}
                    onClick={() => setShowScheduleModal(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {googleAuthenticated ? "Schedule Interview" : "Connect Google Calendar"}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleOpenResume}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {isResumeLoading ? 'Loading...' : 'View CV'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleDownload}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pipeline Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hiring Pipeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Stage 1 */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-gray-900">Shortlisted</p>
                      <p className="text-xs text-gray-500">Qualified for interview</p>
                    </div>
                    <Button
                      size="icon"
                      variant={candidate.selected_for_interview ? "default" : "outline"}
                      className={candidate.selected_for_interview ? "bg-green-600 hover:bg-green-700 h-8 w-8 rounded-full" : "h-8 w-8 rounded-full"}
                      onClick={() => handleStatusUpdate('selected_for_interview', !candidate.selected_for_interview)}
                    >
                      {candidate.selected_for_interview ? <CheckCircle className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                  </div>

                  <Separator />

                  {/* Stage 2 */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-gray-900">Interview</p>
                      <p className="text-xs text-gray-500">
                        {candidate.interview_scheduled ? 'Scheduled' : 'Pending scheduling'}
                      </p>
                    </div>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${candidate.interview_scheduled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {candidate.interview_scheduled ? <Video className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                  </div>

                  {candidate.meet_link && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                      <p className="text-xs font-medium text-blue-700 mb-1 flex items-center gap-1">
                        <Video className="h-3 w-3" /> Google Meet Link
                      </p>
                      <a href={candidate.meet_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline break-all flex items-center gap-1">
                        {candidate.meet_link} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  <Separator />

                  {/* Stage 3 */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-gray-900">Final Offer</p>
                      <p className="text-xs text-gray-500">Select to hire</p>
                    </div>
                    <Button
                      size="icon"
                      variant={candidate.selected ? "default" : "outline"}
                      className={candidate.selected ? "bg-green-600 hover:bg-green-700 h-8 w-8 rounded-full" : "h-8 w-8 rounded-full"}
                      onClick={() => handleStatusUpdate('selected', !candidate.selected)}
                    >
                      {candidate.selected ? <CheckCircle className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                  </div>

                </CardContent>
              </Card>

              {/* Timeline Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center text-sm text-gray-500 gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Applied on {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>

        {/* Schedule Interview Modal */}
        <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
            </DialogHeader>
            
            {scheduleSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Interview Scheduled!</h3>
                <p className="text-sm text-gray-500 mt-1">
                  A calendar invitation has been sent to {candidate.email}.
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Interview Title</Label>
                  <Input 
                    value={interviewForm.summary} 
                    onChange={(e) => setInterviewForm({...interviewForm, summary: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={interviewForm.description} 
                    onChange={(e) => setInterviewForm({...interviewForm, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input 
                      type="datetime-local"
                      value={interviewForm.start_time}
                      onChange={(e) => setInterviewForm({...interviewForm, start_time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input 
                      type="datetime-local"
                      value={interviewForm.end_time}
                      onChange={(e) => setInterviewForm({...interviewForm, end_time: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {!scheduleSuccess && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
                <Button onClick={handleScheduleInterview} disabled={scheduling} className="bg-blue-600 hover:bg-blue-700">
                  {scheduling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</> : 'Confirm Schedule'}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* Resume Modal */}
        <Dialog open={showResumeModal} onOpenChange={setShowResumeModal}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">Resume Preview</h3>
            </div>
            <div className="flex-1 bg-gray-100 flex items-center justify-center relative">
              {isResumeLoading ? (
                 <div className="text-gray-500 flex items-center gap-2">
                   <Loader2 className="h-5 w-5 animate-spin" /> Loading PDF...
                 </div>
              ) : resumeBlobUrl ? (
                <iframe 
                  src={resumeBlobUrl} 
                  className="w-full h-full" 
                  title="Resume PDF"
                />
              ) : (
                <div className="text-center p-8 bg-white shadow-sm rounded-lg">
                   <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                   <p className="text-gray-500">Unable to load resume preview.</p>
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