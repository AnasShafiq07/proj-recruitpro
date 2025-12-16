import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { departmentApi } from "@/services/departmentsApi"; // Import the new service

const DepartmentForm = () => {
  const [open, setOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDepartment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a department name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the API service instead of raw fetch
      await departmentApi.createDepartment(newDepartment);

      toast({
        title: "Success!",
        description: "New Department added successfully.",
      });
      
      // Close dialog and reset form on success
      setOpen(false); 
      setNewDepartment("");

    } catch (error: any) {
       toast({
        title: "Department not added!",
        description: error.message,
        variant: "destructive", // Added variant for better error visibility
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="hover:shadow-lg">
            <Plus className="h-5 w-5 mr-2" />
            Add New Department
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add New Department
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new department to add to your organization
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddDepartment} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="department-name" className="text-sm font-medium">
                Department Name
              </Label>
              <Input
                id="department-name"
                placeholder="e.g., Finance, Operations..."
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || newDepartment === ""}
            >
              {isLoading ? (
                <>Adding...</>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentForm;