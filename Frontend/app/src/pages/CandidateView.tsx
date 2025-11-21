import React, { useState, useEffect } from 'react';
import { Calendar, Mail, Phone, MapPin, FileText, Clock, CheckCircle, XCircle, Award, Briefcase, GraduationCap, Download, Link } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const API_BASE_URL = "http://127.0.0.1:8000";

const CandidateView = () => {
  const [googleAuthenticated, setGoogleAuthenticated] = useState<boolean>(false);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [resumeBlobUrl, setResumeBlobUrl] = useState(null);
  const [isResumeLoading, setIsResumeLoading] = useState(false);
  
  const [interviewForm, setInterviewForm] = useState({
    summary: 'Interview Session',
    description: 'Technical Interview Discussion',
    start_time: '',
    end_time: '',
  });

  // Get candidate_id from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const candidateId = urlParams.get('candidate') || '1';
    fetchCandidateDetails(candidateId);
    fetchGoogleDetails();
  }, []);

  const fetchGoogleDetails  = async () => {
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
      console.error('Error fetching candidate:', error);
    }
  }
  const fetchCandidateDetails = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCandidate(data);
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
        const result = await response.json();
        setScheduleSuccess(true);
        
        // Update candidate interview status
        await fetch(`${API_BASE_URL}/candidates/update/${candidate.candidate_id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ interview_scheduled: true }),
        });

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

  const handleStatusUpdate = async (field, value) => {
    try {
      await fetch(`${API_BASE_URL}/candidates/update/${candidate.candidate_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
      fetchCandidateDetails(candidate.candidate_id);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Fetch resume as blob with auth header and return object URL
  const fetchResumeBlob = async () => {
    if (!candidate?.resume_url) {
      throw new Error('No resume available for this candidate');
    }
    console.log(candidate.resume_url);
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
      // revoke any previous blob URL
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
      alert("Resume not available.");
    }
  };

  const handleDownload = async () => {
    try {
      const { url, blob } = await fetchResumeBlob();
      // derive filename from resume_url
      const parts = candidate.resume_url.split('/');
      const fileName = parts[parts.length - 1] || `resume_${candidate.candidate_id}`;

      const a = document.createElement('a');
      a.href = url;
      a.download = decodeURIComponent(fileName);
      document.body.appendChild(a);
      a.click();
      a.remove();

      // revoke object URL after a short delay
      setTimeout(() => {
        if (url) URL.revokeObjectURL(url);
        setResumeBlobUrl(null);
      }, 1500);
    } catch (err) {
      console.error('Error downloading resume:', err);
      alert("Resume not available.");
    }
  };

  // Cleanup blob URL when modal closes or component unmounts
  useEffect(() => {
    return () => {
      if (resumeBlobUrl) {
        URL.revokeObjectURL(resumeBlobUrl);
        setResumeBlobUrl(null);
      }
    };
  }, [resumeBlobUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading candidate details...</div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Candidate not found</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button 
            onClick={() => window.history.back()}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Candidates
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Candidate Profile</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {candidate.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
                    <div className="flex items-center space-x-4 mt-2 text-gray-600">
                      <span className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {candidate.email}
                      </span>
                      {candidate.phone && (
                        <span className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {candidate.phone}
                        </span>
                      )}
                    </div>
                    {candidate.location && (
                      <div className="flex items-center mt-1 text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        {candidate.location}
                      </div>
                    )}
                  </div>
                </div>
                {candidate.ai_score !== null && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{candidate.ai_score}</div>
                    <div className="text-sm text-gray-600">AI Score</div>
                  </div>
                )}
              </div>
            </div>

            {/* Education */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="w-6 h-6 mr-2 text-blue-600" />
                Education
              </h3>
              <p className="text-gray-700">{candidate.education || 'Not specified'}</p>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-6 h-6 mr-2 text-blue-600" />
                Experience
              </h3>
              <p className="text-gray-700 whitespace-pre-line">{candidate.experience || 'Not specified'}</p>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Award className="w-6 h-6 mr-2 text-blue-600" />
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills ? (
                  typeof candidate.skills === 'string' 
                    ? candidate.skills.split(',').map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {skill.trim()}
                        </span>
                      ))
                    : <span className="text-gray-700">{candidate.skills}</span>
                ) : (
                  <span className="text-gray-500">No skills listed</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Status */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  disabled={!googleAuthenticated}
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {googleAuthenticated === true ? "Schedule Interview" : "Google account not connected"}
                </button>
                
                <button
                  onClick={handleOpenResume}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  {isResumeLoading ? 'Loading...' : 'View Resume'}
                </button>

                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Resume
                </button>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Candidate Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Selected for Interview</span>
                  <button
                    onClick={() => handleStatusUpdate('selected_for_interview', !candidate.selected_for_interview)}
                    className={`p-1 rounded ${candidate.selected_for_interview ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {candidate.selected_for_interview ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Interview Scheduled</span>
                  <span className={`p-1 rounded ${candidate.interview_scheduled ? 'text-green-600' : 'text-gray-400'}`}>
                    {candidate.interview_scheduled ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </span>
                </div>
                {candidate.meet_link && (
                                <div className="flex flex-col border-t pt-4">
                                    <span className="text-gray-700 flex items-center mb-2">
                                        <Link className="w-4 h-4 mr-2 text-blue-600" />
                                        Meeting Link:
                                    </span>
                                    <a 
                                        href={candidate.meet_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 truncate hover:underline"
                                        title={candidate.meet_link}
                                    >
                                        {candidate.meet_link}
                                    </a>
                                </div>
                            )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Final Selection</span>
                  <button
                    onClick={() => handleStatusUpdate('selected', !candidate.selected)}
                    className={`p-1 rounded ${candidate.selected ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {candidate.selected ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline</h3>
              <div className="text-sm text-gray-600">
                <div className="flex items-center mb-2">
                  <Clock className="w-4 h-4 mr-2" />
                  Applied: {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            {scheduleSuccess ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Interview Scheduled!</h3>
                <p className="text-gray-600">Calendar invite sent to {candidate.email}</p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Schedule Interview</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interview Title
                    </label>
                    <input
                      type="text"
                      value={interviewForm.summary}
                      onChange={(e) => setInterviewForm({...interviewForm, summary: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={interviewForm.description}
                      onChange={(e) => setInterviewForm({...interviewForm, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={interviewForm.start_time}
                      onChange={(e) => setInterviewForm({...interviewForm, start_time: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={interviewForm.end_time}
                      onChange={(e) => setInterviewForm({...interviewForm, end_time: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    disabled={scheduling}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleInterview}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
                    disabled={scheduling}
                  >
                    {scheduling ? 'Scheduling...' : 'Schedule'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-xl font-bold text-gray-900">Resume - {candidate.name}</h3>
              <button
                onClick={() => setShowResumeModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {isResumeLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-gray-600">Loading resume...</div>
                </div>
              ) : resumeBlobUrl ? (
                <iframe
                  src={resumeBlobUrl}
                  className="w-full h-full"
                  title="Resume"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-gray-600">No resume available</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
};

export default CandidateView;