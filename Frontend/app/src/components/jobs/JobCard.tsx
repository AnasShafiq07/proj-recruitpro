import { Briefcase, MapPin, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  applicants: number;
  selected: number;
  createdAt: string;
  urgent?: boolean;
  onClick?: () => void;
}

export const JobCard = ({
  title,
  company,
  location,
  type,
  applicants,
  selected,
  createdAt,
  urgent,
  onClick,
}: JobCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{company}</p>
          </div>
          {urgent && (
            <Badge variant="destructive" className="shrink-0">
              URGENT
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            <span>{type}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{applicants} Applicants</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-accent font-medium">{selected} Selected</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{createdAt}</span>
          </div>
          <Button size="sm" variant="outline">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
