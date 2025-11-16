import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Coffee, Timer } from "lucide-react";

interface AvailabilityFormProps {
  onSubmit: (data: AvailabilityFormData) => void;
  initialData?: AvailabilityFormData;
  isEditing?: boolean;
}

export interface AvailabilityFormData {
  days: string[];
  start_time: string;
  end_time: string;
  duration_minutes: number;
  break_minutes: number;
  start_date: string;
  end_date: string;
}

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const AvailabilityForm = ({ onSubmit, initialData, isEditing = false }: AvailabilityFormProps) => {
  const [formData, setFormData] = useState<AvailabilityFormData>(
    initialData || {
      days: [],
      start_time: "09:00",
      end_time: "17:00",
      duration_minutes: 30,
      break_minutes: 10,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }
  );

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-6 shadow-[var(--shadow-card)] border-border/50 hover:shadow-[var(--shadow-elevated)] transition-shadow duration-300">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label className="text-base font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Select Days
          </Label>
          <div className="flex flex-wrap gap-2">
            {weekdays.map(day => (
              <label
                key={day}
                className={`flex items-center px-4 py-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  formData.days.includes(day)
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                <Checkbox
                  checked={formData.days.includes(day)}
                  onCheckedChange={() => handleDayToggle(day)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{day}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_time" className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              Start Time
            </Label>
            <Input
              id="start_time"
              type="time"
              value={formData.start_time}
              onChange={e => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              className="border-border/50 focus:border-primary"
              required
            />
          </div>
          <div>
            <Label htmlFor="end_time" className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              End Time
            </Label>
            <Input
              id="end_time"
              type="time"
              value={formData.end_time}
              onChange={e => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              className="border-border/50 focus:border-primary"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration" className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-primary" />
              Slot Duration (minutes)
            </Label>
            <Input
              id="duration"
              type="number"
              min="15"
              step="5"
              value={formData.duration_minutes}
              onChange={e => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
              className="border-border/50 focus:border-primary"
              required
            />
          </div>
          <div>
            <Label htmlFor="break" className="flex items-center gap-2 mb-2">
              <Coffee className="w-4 h-4 text-primary" />
              Break Between (minutes)
            </Label>
            <Input
              id="break"
              type="number"
              min="0"
              step="5"
              value={formData.break_minutes}
              onChange={e => setFormData(prev => ({ ...prev, break_minutes: parseInt(e.target.value) }))}
              className="border-border/50 focus:border-primary"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date" className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              Start Date
            </Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              className="border-border/50 focus:border-primary"
              required
            />
          </div>
          <div>
            <Label htmlFor="end_date" className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              End Date
            </Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              className="border-border/50 focus:border-primary"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-[image:var(--gradient-primary)] hover:opacity-90 transition-opacity"
          size="lg"
        >
          {isEditing ? "Update Availability" : "Create Availability"}
        </Button>
      </form>
    </Card>
  );
};
