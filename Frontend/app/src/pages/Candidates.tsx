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
import { Search, Download, Filter } from "lucide-react";

// Mock data
const mockCandidates = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1 (555) 123-4567",
    position: "Senior Frontend Developer",
    score: 92,
    status: "Selected",
    appliedDate: "2024-01-15",
    interviewStatus: "Scheduled",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 (555) 234-5678",
    position: "Product Manager",
    score: 88,
    status: "Interview",
    appliedDate: "2024-01-14",
    interviewStatus: "Pending",
  },
  {
    id: "3",
    name: "Michael Chen",
    email: "m.chen@email.com",
    phone: "+1 (555) 345-6789",
    position: "UX Designer",
    score: 95,
    status: "Selected",
    appliedDate: "2024-01-12",
    interviewStatus: "Completed",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@email.com",
    phone: "+1 (555) 456-7890",
    position: "Backend Engineer",
    score: 85,
    status: "Review",
    appliedDate: "2024-01-10",
    interviewStatus: "Pending",
  },
  {
    id: "5",
    name: "David Wilson",
    email: "d.wilson@email.com",
    phone: "+1 (555) 567-8901",
    position: "Data Analyst",
    score: 90,
    status: "Selected",
    appliedDate: "2024-01-08",
    interviewStatus: "Scheduled",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Selected":
      return "bg-accent text-accent-foreground";
    case "Interview":
      return "bg-primary text-primary-foreground";
    case "Review":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const Candidates = () => {
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
                <TableHead>Position</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interview</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell className="font-medium">{candidate.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{candidate.email}</div>
                      <div className="text-muted-foreground">{candidate.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{candidate.position}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${candidate.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{candidate.score}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(candidate.status)}>
                      {candidate.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{candidate.interviewStatus}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(candidate.appliedDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                      <Button size="sm">Contact</Button>
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
