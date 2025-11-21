import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Candidate, candidateApi } from "@/services/candidatesApi";
import { Search, Download, Filter } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const getStatusColor = (status: boolean) => {
  if (status === true)
    return "bg-accent text-accent-foreground";
  else
    return "bg-primary text-primary-foreground";
    
};

const Candidates = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchParams] = useSearchParams();
  const [jobId, setJobId] = useState<String>();


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

    fetchCandidates();
  }, [searchParams]);
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
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
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
                    <Badge className={getStatusColor(candidate.selected_for_interview)}>
                      {candidate.selected_for_interview === true ? "Selected": "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>{candidate.interview_scheduled === true ? "Scheduled": "Pending"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(candidate.created_at ?? new Date()).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={()=> navigate(`/candidates/view?candidate=${candidate.candidate_id}`)}>
                        View
                      </Button>
                      <Button size="sm">Select</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Candidates;
