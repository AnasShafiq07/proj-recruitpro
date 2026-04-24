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
import {
  Search,
  CalendarCheck,
  Link,
  ArrowUpDown,
  Sparkles,
  ExternalLink,
  XCircle,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  ChevronRight,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { schedulingApi } from "@/services/slotSchedulingApi";
import { availabilityApi } from "@/services/avalibilityApi";
import { jobApi } from "@/services/jobApi";
import { googleApi, type GoogleAuthStatus } from "@/services/googleApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_CONFIG } from "@/config";

const API_BASE_URL = API_CONFIG.BASE_URL;

// --- Sourcing Modal ---
const SourcingModal = ({
  isOpen,
  onOpenChange,
  onResultsFound,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onResultsFound: (candidates: any[]) => void;
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/talent/sourcing/himalayas/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiter_query: query }),
      });
      const data = await response.json();
      if (data.status === "success") {
        onResultsFound(data.candidates);
        onOpenChange(false);
        setQuery("");
        toast.success(`Found ${data.candidates.length} potential candidates!`);
      }
    } catch (error) {
      toast.error("Failed to fetch candidates from AI service");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-0 shadow-2xl">
        <div className="bg-gradient-to-br from-primary/5 via-background to-background p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
              </span>
              AI Talent Sourcing
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Describe the talent you need. Our AI will scan external platforms to surface the best matches.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 py-4">
          <Textarea
            placeholder="e.g., Find me remote React developers with 5+ years of experience..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[130px] bg-muted/50 border-border/60 resize-none text-sm focus-visible:ring-primary/30 rounded-xl"
          />
        </div>
        <DialogFooter className="px-6 pb-6 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-lg">Cancel</Button>
          <Button onClick={handleSearch} disabled={isLoading || !query.trim()} className="rounded-lg gap-2 min-w-[150px]">
            {isLoading ? <span className="h-3 w-3 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {isLoading ? "Searching..." : "Search Candidates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Score Bar ---
const ScoreBar = ({ score }: { score: number }) => {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-400";
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground">{score}%</span>
    </div>
  );
};

// --- Stat Card ---
const StatCard = ({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: any; accent: string }) => (
  <div className="relative bg-card rounded-2xl border border-border/60 p-5 overflow-hidden group hover:border-border transition-colors">
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 ${accent} -translate-y-6 translate-x-6`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-foreground mt-1.5 tracking-tight">{value}</p>
      </div>
      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${accent} bg-opacity-10`}>
        <Icon className="h-4 w-4 text-foreground/60" />
      </span>
    </div>
  </div>
);

const getStatusBadge = (selected: boolean) =>
  selected ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Selected
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Pending
    </span>
  );

// --- Main Component ---
const Candidates = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchParams] = useSearchParams();
  const [jobId, setJobId] = useState<string>();
  
  // New States for Invitation logic
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [inviteCount, setInviteCount] = useState<string>("5");
  const [inviteSubject, setInviteSubject] = useState("Invitation to Schedule Your Interview");
  const [isScheduling, setIsScheduling] = useState(false);
  
  const [availability, setAvailability] = useState(false);
  const [googleAuthenticated, setGoogleAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSourcingModalOpen, setIsSourcingModalOpen] = useState(false);
  const [sourcedCandidates, setSourcedCandidates] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("default");
  const [jobLink, setJobLink] = useState<string>("");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data: GoogleAuthStatus = await googleApi.getStatus();
        setGoogleAuthenticated(data.authenticated);
      } catch (err) {
        console.error("Failed to fetch google status:", err);
      }
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    const paramValue = searchParams.get("job");
    if (!paramValue) return;
    setJobId(paramValue);

    const fetchData = async () => {
      try {
        const [cData, jobData, availData] = await Promise.all([
          candidateApi.getByJob(Number(paramValue)),
          jobApi.getJobById(Number(paramValue)),
          availabilityApi.getSelected()
        ]);
        setCandidates(cData);
        setAvailability(availData);
        setJobLink(`${window.location.origin}/apply/${jobData?.slug}`);
      //setLinkToShare(`${window.location.origin}/apply/` + resData.job_link);
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    };
    fetchData();
  }, [searchParams]);

  const handleScheduleAllClick = () => setIsScheduleModalOpen(true);

  // --- Bulk Invitation Submission ---
  const handleInviteSubmit = async () => {
    if (!jobId) return;
    setIsScheduling(true);

    try {
      // Sort by AI score descending
      const sortedByScore = [...candidates].sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
      
      // Select top N who aren't already scheduled
      const targetCandidates = sortedByScore
        .filter(c => !c.interview_scheduled)
        .slice(0, parseInt(inviteCount));

      if (targetCandidates.length === 0) {
        toast.error("No eligible candidates found for invitation.");
        return;
      }

      await schedulingApi.sendBulkInvites({
        job_id: Number(jobId),
        candidate_ids: targetCandidates.map(c => c.candidate_id),
        subject: inviteSubject,
      });

      toast.success(`Success! Invitations sent to ${targetCandidates.length} candidates.`);
      setIsScheduleModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitations");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCopyJobLink = () => {
    navigator.clipboard.writeText(jobLink)
      .then(() => toast.success("Job link copied!"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const toggleSort = () => {
    if (sortOrder === "default") setSortOrder("desc");
    else if (sortOrder === "desc") setSortOrder("asc");
    else setSortOrder("default");
  };

  const processedCandidates = candidates
    .filter((c) => {
      const matchesSearch = searchQuery === "" || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || (statusFilter === "selected" && c.selected) || (statusFilter === "pending" && !c.selected);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "default") return 0;
      const scoreA = a.ai_score || 0;
      const scoreB = b.ai_score || 0;
      return sortOrder === "asc" ? scoreA - scoreB : scoreB - scoreA;
    });

  const totalCandidates = candidates.length;
  const selectedCount = candidates.filter(c => c.selected).length;
  const interviewedCount = candidates.filter(c => c.interview_scheduled).length;
  const avgScore = totalCandidates > 0 ? Math.round(candidates.reduce((acc, c) => acc + (c.ai_score || 0), 0) / totalCandidates) : 0;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Candidate Management</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Track applicants and discover talent via AI sourcing</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Button onClick={() => setIsSourcingModalOpen(true)} className="gap-2 rounded-xl h-9 text-sm font-medium shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" /> AI Sourcing
                </Button>
                <Button variant="outline" className="gap-2 rounded-xl h-9 text-sm font-medium" onClick={handleCopyJobLink} disabled={!jobId}>
                  <Link className="h-3.5 w-3.5" /> Copy Link
                </Button>
                <Button variant="outline" className="gap-2 rounded-xl h-9 text-sm font-medium" onClick={handleScheduleAllClick} disabled={!availability || !googleAuthenticated}>
                  <CalendarCheck className="h-3.5 w-3.5" /> Invite by Priority
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-7 space-y-8">
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Candidates" value={totalCandidates} icon={Users} accent="bg-blue-500" />
            <StatCard label="Interviewed" value={interviewedCount} icon={Clock} accent="bg-violet-500" />
            <StatCard label="Selected" value={selectedCount} icon={CheckCircle2} accent="bg-emerald-500" />
            <StatCard label="Avg AI Score" value={`${avgScore}%`} icon={TrendingUp} accent="bg-amber-500" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted border border-border/60">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Applied via Link</h3>
                <p className="text-xs text-muted-foreground">{processedCandidates.length} shown</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 h-9 w-56 rounded-xl text-sm bg-muted/40 border-border/60" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9 rounded-xl text-sm bg-muted/40 border-border/60">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/60 bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-5">Candidate</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Education</TableHead>
                  <TableHead onClick={toggleSort} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">AI Score <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right pr-5">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center text-muted-foreground text-sm">No candidates found</TableCell>
                  </TableRow>
                ) : (
                  processedCandidates.map((c) => (
                    <TableRow key={c.candidate_id} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors group">
                      <TableCell className="pl-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-xs">
                            {c.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3.5">{c.education || "—"}</TableCell>
                      <TableCell className="py-3.5"><ScoreBar score={c.ai_score || 0} /></TableCell>
                      <TableCell className="py-3.5">{getStatusBadge(c.selected)}</TableCell>
                      <TableCell className="text-right pr-5 py-3.5">
                        <Button size="sm" variant="outline" className="h-8 px-3 rounded-lg text-xs gap-1.5" onClick={() => navigate(`/candidates/view?candidate=${c.candidate_id}`)}>
                          View Profile <ChevronRight className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* --- Bulk Invite Modal --- */}
        <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-2xl">
            <div className="bg-gradient-to-br from-primary/5 via-background to-background p-6 pb-0">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20">
                    <Zap className="h-4 w-4 text-primary" />
                  </span>
                  Bulk Interview Invites
                </DialogTitle>
                <DialogDescription>
                  Invite top-scoring candidates to choose their own interview slots.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Number of Candidates</label>
                <Input type="number" value={inviteCount} onChange={(e) => setInviteCount(e.target.value)} className="rounded-xl bg-muted/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Email Subject</label>
                <Input value={inviteSubject} onChange={(e) => setInviteSubject(e.target.value)} className="rounded-xl bg-muted/50" />
              </div>
              <p className="text-[11px] text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
                Selection logic: Sorted by <strong>AI Score</strong>. Only un-scheduled candidates are contacted.
              </p>
            </div>
            <DialogFooter className="px-6 pb-6 gap-2">
              <Button variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
              <Button onClick={handleInviteSubmit} disabled={isScheduling || !inviteCount} className="min-w-[150px] gap-2">
                {isScheduling ? "Sending..." : "Send Invites"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SourcingModal isOpen={isSourcingModalOpen} onOpenChange={setIsSourcingModalOpen} onResultsFound={setSourcedCandidates} />
      </div>
    </DashboardLayout>
  );
};

export default Candidates;