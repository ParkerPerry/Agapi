import React, { useState } from "react";
import { Lab, InsertLabTemplate } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrashIcon, PlusCircle, SparklesIcon } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import LabTemplateSelector from "./lab-template-selector";
import { useToast } from "@/hooks/use-toast";

interface LabMetric {
  name: string;
  target: string;
  priority: "high" | "medium" | "low";
}

// Schema for the form
const formSchema = z.object({
  goals: z.string().min(1, "Goals are required"),
  metrics: z.array(
    z.object({
      name: z.string().min(1, "Metric name is required"),
      target: z.string().min(1, "Target is required"),
      priority: z.enum(["high", "medium", "low"]),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

interface LabGoalsEditorProps {
  lab: Lab;
  onUpdate: (goals: string, successMetrics: { metrics: LabMetric[] }) => Promise<void>;
}

const LabGoalsEditor: React.FC<LabGoalsEditorProps> = ({ lab, onUpdate }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Convert any numeric targets to strings for form
  const initialMetrics = lab.successMetrics?.metrics?.map(metric => ({
    name: metric.name,
    target: typeof metric.target === 'number' ? String(metric.target) : metric.target,
    priority: metric.priority
  })) || [];

  // Initialize form with current lab data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goals: lab.goals || "",
      metrics: initialMetrics,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "metrics",
  });

  // Handle template selection
  const handleTemplateSelect = (template: Omit<InsertLabTemplate, "isDefault">) => {
    form.setValue("goals", template.goals);
    
    // Clear existing metrics and add new ones from template
    remove();
    if (template.successMetrics && template.successMetrics.metrics) {
      template.successMetrics.metrics.forEach((metricItem: { 
        name: string; 
        target: string | number; 
        priority: "high" | "medium" | "low" 
      }) => {
        append({
          name: metricItem.name,
          target: typeof metricItem.target === 'number' ? String(metricItem.target) : metricItem.target,
          priority: metricItem.priority
        });
      });
    }
    
    setIsTemplateDialogOpen(false);
    
    toast({
      title: "Template Applied",
      description: `Applied template: ${template.name}`,
    });
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsUpdating(true);
    try {
      await onUpdate(data.goals, { metrics: data.metrics });
      toast({
        title: "Goals Updated",
        description: "Lab goals and metrics have been updated successfully",
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update lab goals and metrics",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Add a new empty metric
  const addMetric = () => {
    append({ name: "", target: "", priority: "medium" });
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsDialogOpen(true)}
        className="w-full justify-start"
      >
        Edit Goals & Metrics
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Goals & Metrics</DialogTitle>
            <DialogDescription>
              Define what you want to achieve with this experiment and how you'll measure success.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <Button 
              variant="outline"
              className="mb-4 w-full flex items-center gap-2 justify-center"
              onClick={() => setIsTemplateDialogOpen(true)}
            >
              <SparklesIcon className="h-4 w-4" />
              Apply a Template
            </Button>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goals</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What do you want to achieve with this experiment?" 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Clearly define the objectives for this experiment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel>Success Metrics</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addMetric}
                      className="flex items-center gap-1"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Metric
                    </Button>
                  </div>
                  
                  {fields.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40%]">Metric</TableHead>
                            <TableHead className="w-[30%]">Target</TableHead>
                            <TableHead className="w-[20%]">Priority</TableHead>
                            <TableHead className="w-[10%]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`metrics.${index}.name`}
                                  render={({ field }) => (
                                    <FormItem className="m-0">
                                      <FormControl>
                                        <Input {...field} placeholder="Metric name" />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`metrics.${index}.target`}
                                  render={({ field }) => (
                                    <FormItem className="m-0">
                                      <FormControl>
                                        <Input {...field} placeholder="Target value" />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`metrics.${index}.priority`}
                                  render={({ field }) => (
                                    <FormItem className="m-0">
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Priority" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="high">High</SelectItem>
                                          <SelectItem value="medium">Medium</SelectItem>
                                          <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => remove(index)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="border rounded-md p-4 text-center text-muted-foreground">
                      No metrics defined. Click 'Add Metric' to add success metrics.
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-3xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              Apply a template to quickly set up goals and metrics for your experiment
            </DialogDescription>
          </DialogHeader>
          
          <LabTemplateSelector onSelectTemplate={handleTemplateSelect} />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LabGoalsEditor;