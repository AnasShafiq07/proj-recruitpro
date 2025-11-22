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
import { Search, Download, CalendarCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SchedulingDetails, schedulingApi } from "@/services/schedulingApi";
import { availabilityApi } from "@/services/avalibilityApi";

const getStatusColor = (status: boolean) => {
  if (status === true) return "bg-accent text-accent-foreground";
  else return "bg-primary text-primary-foreground";
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
  const [currSelected, setSelected] = useState<Selected>();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleSummary, setScheduleSummary] = useState("");
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [availability, setAvailability] = useState(false);

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

      const data = await candidateApi.getByJob(Number(jobId));
      setCandidates(data);
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

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Candidates</h1>
            <p className="text-muted-foreground mt-1">
              Manage and review all applicants
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleScheduleAllClick}
                disabled={!availability}
              >
                <CalendarCheck className="h-4 w-4" />
                Schedule All Interviews
              </Button>

              {!availability && (
                <span className="ml-2 text-xs text-red-500 mt-1">
                  Add or select availability first
                </span>
              )}
            </div>

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search candidates by name, email, or position..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Candidates Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Education</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interview</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.candidate_id}>
                  <TableCell className="font-medium">
                    {candidate.name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{candidate.email}</div>
                      <div className="text-muted-foreground">
                        {candidate.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{candidate.education}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${candidate.ai_score || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {candidate.ai_score || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={getStatusColor(
                        candidate.selected_for_interview
                      )}
                    >
                      {candidate.selected === true ? "Selected" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {candidate.interview_scheduled === true
                      ? "Scheduled"
                      : "Pending"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(
                      candidate.created_at ?? new Date()
                    ).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(
                            `/candidates/view?candidate=${candidate.candidate_id}`
                          )
                        }
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (candidate.selected === true)
                            deSelectCandidate(candidate.candidate_id);
                          else selectCandidate(candidate.candidate_id);
                        }}
                      >
                        {candidate.selected === true ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Schedule Interviews Modal */}
        <Dialog
          open={isScheduleModalOpen}
          onOpenChange={setIsScheduleModalOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule All Interviews</DialogTitle>
              <DialogDescription>
                Enter the summary and description for the interview invitations.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="summary" className="text-sm font-medium">
                  Summary
                </label>
                <Input
                  id="summary"
                  placeholder="e.g., Interview for Software Engineer Position"
                  value={scheduleSummary}
                  onChange={(e) => setScheduleSummary(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Enter interview details and instructions..."
                  value={scheduleDescription}
                  onChange={(e) => setScheduleDescription(e.target.value)}
                  rows={4}
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
