import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Timer,
  Coffee,
  Edit,
  Trash2,
  CheckCircle2,
} from "lucide-react";

interface AvailabilityCardProps {
  id: number;
  days: string[];
  start_time: string;
  end_time: string;
  duration_minutes: number;
  break_minutes: number;
  start_date: string;
  end_date: string;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onSelect: (id: number) => void;
}

export const AvailabilityCard = ({
  id,
  days,
  start_time,
  end_time,
  duration_minutes,
  break_minutes,
  start_date,
  end_date,
  isSelected = false,
  onClick,
  onEdit,
  onDelete,
  onSelect,
}: AvailabilityCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card
      className={`p-5 shadow-[var(--shadow-card)] border-border/50 hover:shadow-[var(--shadow-elevated)] transition-all duration-300 group cursor-pointer`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg text-foreground">
                Availability Slot
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {days.map((day) => (
                <Badge
                  key={day}
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  {day.substring(0, 3)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 transition-all">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(id);
              }}
              className={`${
                isSelected
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "hover:bg-primary/10 hover:text-primary"
              }`}
              title={
                isSelected ? "Already selected" : "Select this availability"
              }
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(id);
              }}
              className="hover:bg-primary/10 hover:text-primary"
            >
              <Edit className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 text-primary" />
            <span>
              {start_time} - {end_time}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Timer className="w-4 h-4 text-primary" />
            <span>{duration_minutes} min slots</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Coffee className="w-4 h-4 text-primary" />
            <span>{break_minutes} min break</span>
          </div>
        </div>

        <div className="pt-3 border-t border-border/50">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(start_date)} - {formatDate(end_date)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
