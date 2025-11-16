import { useState, useEffect } from "react";
import {
  AvailabilityForm,
  AvailabilityFormData,
} from "@/components/availability/AvailabilityForm";
import { AvailabilityCard } from "@/components/availability/AvailabilityCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Clock, Loader2 } from "lucide-react";
import { availabilityApi } from "@/services/avalibilityApi";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface Availability extends AvailabilityFormData {
  isSelected: boolean;
  id: number;
  hr_id: number;
  created_at: string;
}

const normalizeAvailability = (item: any) => {
  return {
    id: item.id,
    hr_id: item.hr_id,
    created_at: item.created_at ?? new Date().toISOString(),
    // ensure days is always an array
    days: (() => {
  if (!item.days) return [];

  if (Array.isArray(item.days)) {
    return item.days;
  }

  if (typeof item.days === "string") {
    try {
      const parsed = JSON.parse(item.days);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
})(),


    start_time: item.start_time ?? "09:00",
    end_time: item.end_time ?? "17:00",
    duration_minutes: item.duration_minutes ?? 30,
    break_minutes: item.break_minutes ?? 0,
    // dates as ISO strings (AvailabilityCard formats them)
    start_date: typeof item.start_date === "string"
  ? item.start_date
  : new Date(item.start_date).toISOString(),

end_date: typeof item.end_date === "string"
  ? item.end_date
  : new Date(item.end_date).toISOString(),

    // camelCase flag expected by frontend
    isSelected: item.is_selected ?? false,
  };
};

const Index = () => {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch availabilities on mount
  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const fetchAvailabilities = async () => {
  try {
    setIsLoading(true);
    let data = await availabilityApi.getAll();

    // Normalize each item into the frontend shape
    const normalized = data.map((item: any) => normalizeAvailability(item));

    console.log("Normalized Days:", normalized.map(n => n.days));

    setAvailabilities(normalized);
  } catch (error) {
    console.error("Full error details:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    toast({
      title: "Error",
      description: `Failed to load availabilities: ${errorMessage}`,
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};


  const handleCreate = async (data: AvailabilityFormData) => {
    try {
      const newAvailability = await availabilityApi.create(data);
      const normalized = normalizeAvailability(newAvailability);
      setAvailabilities(prev => [...prev, normalized]);

      setIsFormOpen(false);
      toast({
        title: "Success!",
        description: "Availability created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create availability",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (data: AvailabilityFormData) => {
    if (!editingId) return;

    try {
      const updated = await availabilityApi.update(editingId, data);
      const normalized = normalizeAvailability(updated);
      setAvailabilities(prev => prev.map(a => a.id === editingId ? normalized : a));

      setEditingId(null);
      setIsFormOpen(false);
      toast({
        title: "Updated!",
        description: "Availability updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await availabilityApi.delete(id);
      setAvailabilities(availabilities.filter((a) => a.id !== id));
      if (selectedId === id) setSelectedId(null);
      toast({
        title: "Deleted",
        description: "Availability removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete availability",
        variant: "destructive",
      });
    }
  };

  const handleSelect = async (id: number) => {
    try {
      // Call backend to set this availability as selected
      const response = await availabilityApi.select(id);
      const normalized = normalizeAvailability(response);
      
      // Update all availabilities - set only the selected one to isSelected = true
      setAvailabilities(prev => prev.map(a => ({
        ...a,
        isSelected: a.id === id
      })));
      
      setSelectedId(id);
      toast({
        title: "Selected!",
        description: "Availability slot selected successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to select availability",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
    setIsFormOpen(true);
  };

  const editingAvailability = editingId
    ? availabilities.find((a) => a.id === editingId)
    : null;

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Offer Letters</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage offer letters for selected candidates
          </p>
        </div>
          {/* Main Content */}
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Add Availability Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Your Availability Slots
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {availabilities.length} active slot
                    {availabilities.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingId(null);
                    setIsFormOpen(true);
                  }}
                  size="lg"
                  className="bg-[image:var(--gradient-primary)] hover:opacity-90 transition-opacity gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Availability
                </Button>
              </div>

              {/* Availability Grid */}
              {isLoading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : availabilities.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No availability set yet
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first availability slot to start accepting
                    interview bookings.
                  </p>
                  <Button
                    onClick={() => setIsFormOpen(true)}
                    size="lg"
                    className="bg-[image:var(--gradient-primary)] hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Slot
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availabilities.map((availability) => (
                    <AvailabilityCard
                      key={availability.id}
                      {...availability}
                      isSelected={availability.isSelected || selectedId === availability.id}
                      onClick={() => setSelectedId(availability.id)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Dialog */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingId ? "Edit Availability" : "Create Availability"}
                </DialogTitle>
              </DialogHeader>
              <AvailabilityForm
                onSubmit={editingId ? handleUpdate : handleCreate}
                initialData={editingAvailability}
                isEditing={!!editingId}
              />
            </DialogContent>
          </Dialog>
        </div>
    </DashboardLayout>
  );
};

export default Index;
