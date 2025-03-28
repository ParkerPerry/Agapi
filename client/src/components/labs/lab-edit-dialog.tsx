import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertLabSchema, Lab } from "@shared/schema";
import { Trash2, Plus } from "lucide-react";

// Edit schema with validation rules
const editLabSchema = insertLabSchema.extend({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  experimentType: z.enum(["a_b_test", "multivariate", "exploration"]),
  goals: z.string().optional(),
  successMetrics: z.object({
    metrics: z.array(
      z.object({
        name: z.string(),
        target: z.number(),
        priority: z.enum(["high", "medium", "low"])
      })
    ).optional()
  }).optional(),
});

interface LabEditDialogProps {
  lab: Lab;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const LabEditDialog = ({ lab, open, onOpenChange, onUpdate }: LabEditDialogProps) => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<Array<{
    name: string;
    target: number;
    priority: "high" | "medium" | "low";
  }>([]);
  const [metric, setMetric] = useState({
    name: "",
    target: 0,
    priority: "medium" as "high" | "medium" | "low",
  });
  const [activeTab, setActiveTab] = useState("basic");

  // Initialize the form with existing lab data
  const form = useForm<z.infer<typeof editLabSchema>>({
    resolver: zodResolver(editLabSchema),
    defaultValues: {
      name: lab.name,
      description: lab.description || "",
      experimentType: lab.experimentType,
      goals: lab.goals || "",
      successMetrics: lab.successMetrics || { metrics: [] },
    },
  });

  // Update form and metrics when lab changes
  useEffect(() => {
    form.reset({
      name: lab.name,
      description: lab.description || "",
      experimentType: lab.experimentType,
      goals: lab.goals || "",
      successMetrics: lab.successMetrics || { metrics: [] },
    });

    setMetrics(lab.successMetrics?.metrics || []);
  }, [lab, form.reset]);

  const addMetric = () => {
    if (!metric.name) return;
    
    setMetrics([...metrics, { ...metric }]);
    setMetric({
      name: "",
      target: 0,
      priority: "medium",
    });
  };

  const removeMetric = (index: number) => {
    const updatedMetrics = [...metrics];
    updatedMetrics.splice(index, 1);
    setMetrics(updatedMetrics);
  };

  const onSubmit = async (data: z.infer<typeof editLabSchema>) => {
    try {
      // Include the metrics in the data
      data.successMetrics = { metrics };
      
      // Submit the form
      await apiRequest(`/api/labs/${lab.id}`, {
        method: "PATCH",
        body: data,
      });
      
      toast({
        title: "Lab updated",
        description: "Your lab has been updated successfully.",
      });
      
      // Close dialog and trigger update
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Failed to update lab",
        description: "There was an error updating the lab. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Edit Lab</DialogTitle>
          <DialogDescription>
            Make changes to your experiment lab.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="experiment">Experiment</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lab Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear, descriptive name for your experiment lab.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide details about the purpose of this lab.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="experiment" className="space-y-4">
                <FormField
                  control={form.control}
                  name="experimentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experiment Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select experiment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="a_b_test">
                            A/B Test - Compare two variations
                          </SelectItem>
                          <SelectItem value="multivariate">
                            Multivariate - Test multiple variables
                          </SelectItem>
                          <SelectItem value="exploration">
                            Exploration - Open-ended experiment
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === "a_b_test" && "Compare two variations of content to determine which performs better."}
                        {field.value === "multivariate" && "Test how multiple variables interact and affect outcomes."}
                        {field.value === "exploration" && "Conduct open-ended exploration with less structured testing."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experiment Goals</FormLabel>
                      <FormControl>
                        <Textarea
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Be specific about what you're hoping to learn or improve.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <div className="p-4 border rounded-md space-y-2">
                  <h4 className="font-medium">Add Success Metric</h4>
                  <div className="grid grid-cols-6 gap-2">
                    <div className="col-span-3">
                      <label className="text-sm font-medium">Metric Name</label>
                      <Input
                        value={metric.name}
                        onChange={(e) => setMetric({ ...metric, name: e.target.value })}
                        placeholder="e.g., Response Rate"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-sm font-medium">Target</label>
                      <Input
                        type="number"
                        value={metric.target || ""}
                        onChange={(e) => setMetric({ ...metric, target: Number(e.target.value) })}
                        placeholder="Target"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select
                        value={metric.priority}
                        onValueChange={(value: "high" | "medium" | "low") => 
                          setMetric({ ...metric, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMetric}
                    disabled={!metric.name}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Metric
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Current Metrics</h4>
                  {metrics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No metrics added yet. Add at least one metric to measure success.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {metrics.map((m, i) => (
                        <div
                          key={i}
                          className="p-3 border rounded-md flex justify-between items-center"
                        >
                          <div className="space-y-1">
                            <div className="font-medium">{m.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Target: {m.target} • Priority: {m.priority}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMetric(i)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LabEditDialog;