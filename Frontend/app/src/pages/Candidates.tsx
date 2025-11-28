import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Candidate, candidateApi } from "@/services/candidatesApi";
import { Search, Download, CalendarCheck, Filter, Users, TrendingUp, CheckCircle2, Clock, Link } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { schedulingApi } from "@/services/schedulingApi";
import { availabilityApi } from "@/services/avalibilityApi";
import { jobApi } from "@/services/jobApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Job } from "@/utils/types";

const getStatusColor = (status: boolean) => {
  if (status === true) return "bg-success text-success-foreground";
  else return "bg-warning/10 text-warning border border-warning/20";
};

interface Selected {
  id: number;
  selected: boolean;
}

const Candidates = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchParams] = useSearchParams();
  const [jobId, setJobId] = useState<string>();
  const [job, setJob] = useState<Job>();
  const [currSelected, setSelected] = useState<Selected>();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleSummary, setScheduleSummary] = useState("");
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [availability, setAvailability] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const paramValue = searchParams.get("job");

    if (!paramValue) return;

    const numId = Number(paramValue);
    setJobId(paramValue);
    const fetchCandidates = async () => {
      try {
        const data = await candidateApi.getByJob(numId);
        setCandidates(data);
      } catch (err) {
        console.error("Failed to fetch candidates:", err);
      }
    };
    const fetchAvailability = async () => {
      try {
        const data = await availabilityApi.getSelected();
        setAvailability(data);
      } catch (err) {
        console.error("Failed to fetch availability:", err);
      }
    };
    fetchCandidates();
    fetchAvailability();
  }, [searchParams]);

  const selectCandidate = async (cand_id: number) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.candidate_id === cand_id ? { ...c, selected: true } : c
      )
    );

    try {
      await candidateApi.final_selection(cand_id);
      setSelected({ id: cand_id, selected: true });
    } catch (error) {
      console.error("Error selecting candidate:", error);
      setCandidates((prev) =>
        prev.map((c) =>
          c.candidate_id === cand_id ? { ...c, selected: false } : c
        )
      );
    }
  };

  const handleScheduleAllClick = () => {
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async () => {
    if (!jobId) return;

    setIsScheduling(true);
    try {
      await schedulingApi.scheduleAll({
        job_id: Number(jobId),
        summary: scheduleSummary,
        description: scheduleDescription,
      });

      setIsScheduleModalOpen(false);
      setScheduleSummary("");
      setScheduleDescription("");

    } catch (error) {
      console.error("Error scheduling interviews:", error);
    } finally {
      setIsScheduling(false);
    }
  };

  const deSelectCandidate = async (cand_id: number) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.candidate_id === cand_id ? { ...c, selected: false } : c
      )
    );

    try {
      await candidateApi.de_select(cand_id);
      setSelected({ id: cand_id, selected: false });
    } catch (error) {
      console.error("Error deselecting candidate:", error);
      setCandidates((prev) =>
        prev.map((c) =>
          c.candidate_id === cand_id ? { ...c, selected: true } : c
        )
      );
    }
  };

  const handleCopyJobLink = async () => {
    const data = await jobApi.getJobById(Number(jobId));
    const jobLink = `${window.location.origin}/apply/${data?.slug}`;
    navigator.clipboard.writeText(jobLink).then(() => {
      toast.success("Job link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  // Filter candidates based on search and status
  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      searchQuery === "" ||
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.education.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "selected" && candidate.selected === true) ||
      (statusFilter === "pending" && candidate.selected !== true) ||
      (statusFilter === "interviewed" && candidate.interview_scheduled === true);

    return matchesSearch && matchesStatus;
  });

  // Stats calculations
  const totalCandidates = candidates.length;
  const selectedCandidates = candidates.filter((c) => c.selected === true).length;
  const interviewedCandidates = candidates.filter((c) => c.interview_scheduled === true).length;
  const avgScore = candidates.length > 0
    ? Math.round(candidates.reduce((acc, c) => acc + (c.ai_score || 0), 0) / candidates.length)
    : 0;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header Section */}
        <div className="bg-card border-b border-border">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">Candidate Management</h1>
                <p className="text-muted-foreground">Track, review, and manage applicants for your positions</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/40 transition-all"
                  onClick={handleCopyJobLink}
                  disabled={!jobId}
                >
                  <Link className="h-4 w-4" />
                  Copy Job Link
                </Button>
                
                <div className="flex flex-col">
                  <Button
                    className="gap-2"
                    onClick={handleScheduleAllClick}
                    disabled={!availability}
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Schedule All Interviews
                  </Button>
                  {!availability && (
                    <span className="ml-2 text-xs text-destructive mt-1">
                      Add or select availability first
                    </span>
                  )}
                </div>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-background rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Candidates</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{totalCandidates}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Selected</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{selectedCandidates}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Interviewed</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{interviewedCandidates}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-info" />
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Avg AI Score</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{avgScore}%</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-8 py-6">
          {/* Search and Filter Bar */}
          <div className="bg-card rounded-lg border border-border p-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or education..."
                  className="pl-10 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px] bg-background">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Candidates</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="interviewed">Interviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Candidates Table */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Candidate</TableHead>
                  <TableHead className="font-semibold">Contact Information</TableHead>
                  <TableHead className="font-semibold">Education</TableHead>
                  <TableHead className="font-semibold">AI Match Score</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Interview</TableHead>
                  <TableHead className="font-semibold">Applied Date</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="h-12 w-12 mb-3 opacity-50" />
                        <p className="text-lg font-medium">No candidates found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.candidate_id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <span className="text-foreground">{candidate.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-foreground font-medium">{candidate.email}</div>
                          <div className="text-muted-foreground">{candidate.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{candidate.education}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
                            <div
                              className={`h-full transition-all ${
                                (candidate.ai_score || 0) >= 80
                                  ? "bg-success"
                                  : (candidate.ai_score || 0) >= 60
                                  ? "bg-accent"
                                  : "bg-warning"
                              }`}
                              style={{ width: `${candidate.ai_score || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-foreground min-w-[40px]">
                            {candidate.ai_score || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(candidate.selected_for_interview)}>
                          {candidate.selected === true ? "Selected" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {candidate.interview_scheduled === true ? (
                          <div className="flex items-center gap-1 text-success text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            Scheduled
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Clock className="h-4 w-4" />
                            Pending
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(candidate.created_at ?? new Date()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/candidates/view?candidate=${candidate.candidate_id}`)
                            }
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant={candidate.selected === true ? "outline" : "default"}
                            onClick={() => {
                              if (candidate.selected === true)
                                deSelectCandidate(candidate.candidate_id);
                              else selectCandidate(candidate.candidate_id);
                            }}
                          >
                            {candidate.selected === true ? "Deselect" : "Select"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Schedule Interviews Modal */}
        <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Schedule All Interviews</DialogTitle>
              <DialogDescription>
                Enter the summary and description for the interview invitations. This will be sent to all selected candidates.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="summary" className="text-sm font-medium text-foreground">
                  Interview Summary
                </label>
                <Input
                  id="summary"
                  placeholder="e.g., Interview for Software Engineer Position"
                  value={scheduleSummary}
                  onChange={(e) => setScheduleSummary(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium text-foreground">
                  Interview Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Enter interview details, agenda, and any preparation instructions..."
                  value={scheduleDescription}
                  onChange={(e) => setScheduleDescription(e.target.value)}
                  rows={5}
                  className="bg-background resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={isScheduling}
              >
                Cancel
              </Button>
              <Button
                onClick={handleScheduleSubmit}
                disabled={isScheduling || !scheduleSummary.trim()}
              >
                {isScheduling ? "Scheduling..." : "Schedule Interviews"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Candidates;
