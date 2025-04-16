import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Beaker, 
  AlertCircle, 
  Info, 
  BarChart,
  FlaskConical, 
  Eye, 
  Users, 
  ZoomIn,
  Shield,
  Sparkles,
  MoveHorizontal,
} from "lucide-react";
import { Lab, LabCircle } from "@shared/schema";
import { Control } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface PostFormValues {
  content: string;
  circleId?: number;
  labId?: number;
  labExperiment?: boolean;
  targetRole?: "control" | "treatment" | "observation" | "all";
}

interface LabPostTargetingSelectorProps {
  control: Control<PostFormValues>;
  circleId?: number;
  onChange?: (labId: number | undefined) => void;
}

// Role information for the UI
const roleInfo = {
  control: {
    name: "Control",
    description: "The baseline group that doesn't receive the experimental content",
    icon: <Shield className="h-4 w-4" />,
    color: "blue",
    bgClass: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  },
  treatment: {
    name: "Treatment",
    description: "The experimental group that receives the content being tested",
    icon: <Sparkles className="h-4 w-4" />,
    color: "amber",
    bgClass: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  },
  observation: {
    name: "Observation",
    description: "A group that can observe the experiment without actively participating",
    icon: <Eye className="h-4 w-4" />,
    color: "violet",
    bgClass: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  },
  all: {
    name: "All Circles",
    description: "Content will be distributed to all circles regardless of role",
    icon: <Users className="h-4 w-4" />,
    color: "gray",
    bgClass: "bg-gray-50 text-gray-600 dark:bg-gray-950 dark:text-gray-400",
  }
};

export function LabPostTargetingSelector({
  control,
  circleId,
  onChange,
}: LabPostTargetingSelectorProps) {
  const [selectedLabId, setSelectedLabId] = useState<number | undefined>(undefined);
  const [targetRoleInfo, setTargetRoleInfo] = useState<typeof roleInfo.all>(roleInfo.all);
  const { toast } = useToast();
  
  // Fetch labs where this circle is a member
  const { data: circleLabs, isLoading: isLabsLoading } = useQuery({
    queryKey: ["/api/circles", circleId, "labs"],
    queryFn: async () => {
      if (!circleId) return [];
      const res = await fetch(`/api/circles/${circleId}/labs`);
      if (!res.ok) {
        throw new Error("Failed to fetch circle labs");
      }
      return res.json();
    },
    enabled: !!circleId,
  });

  // Fetch the circle roles for selected lab
  const { data: labCircles, isLoading: isLabCirclesLoading } = useQuery({
    queryKey: ["/api/labs", selectedLabId, "circles"],
    queryFn: async () => {
      if (!selectedLabId) return [];
      const res = await fetch(`/api/labs/${selectedLabId}/circles`);
      if (!res.ok) {
        throw new Error("Failed to fetch lab circles");
      }
      return res.json();
    },
    enabled: !!selectedLabId,
  });

  // Find the current circle's role in the selected lab
  const currentCircleRole = labCircles?.find((lc: LabCircle) => lc.circleId === circleId)?.role;

  const handleLabChange = (labId: string) => {
    const parsedId = parseInt(labId);
    setSelectedLabId(parsedId || undefined);
    if (onChange) {
      onChange(parsedId || undefined);
    }
  };

  // Determine if the selected lab has at least one control and one treatment circle
  const hasRequiredCircleRoles = React.useMemo(() => {
    if (!labCircles) return false;
    const roles = labCircles.map((lc: LabCircle) => lc.role);
    return roles.includes("control") && roles.includes("treatment");
  }, [labCircles]);

  // Update targetRoleInfo when target role changes
  useEffect(() => {
    const currentTargetRole = control._formValues.targetRole || 'all';
    setTargetRoleInfo(roleInfo[currentTargetRole as keyof typeof roleInfo]);
  }, [control._formValues.targetRole]);

  useEffect(() => {
    // Show a warning if the lab doesn't have both control and treatment circles
    if (selectedLabId && labCircles && !hasRequiredCircleRoles && !isLabCirclesLoading) {
      toast({
        title: "Lab Configuration Warning",
        description: "This lab doesn't have both control and treatment circles, which is recommended for experiments.",
      });
    }
  }, [selectedLabId, labCircles, hasRequiredCircleRoles, isLabCirclesLoading, toast]);

  // Count the number of circles with each role
  const circleCounts = React.useMemo(() => {
    if (!labCircles) return { control: 0, treatment: 0, observation: 0 };
    
    return labCircles.reduce((counts, circle) => {
      counts[circle.role as keyof typeof counts]++;
      return counts;
    }, { control: 0, treatment: 0, observation: 0 });
  }, [labCircles]);

  // Get the selected lab
  const selectedLab = React.useMemo(() => {
    if (!selectedLabId || !circleLabs) return null;
    return circleLabs.find((lab: Lab) => lab.id === selectedLabId);
  }, [selectedLabId, circleLabs]);

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="labExperiment"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-3 relative overflow-hidden">
            {field.value && (
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            )}
            <div className="space-y-0.5">
              <FormLabel>
                <div className="flex items-center">
                  <Beaker className="w-4 h-4 mr-1" />
                  <span>Experiment Post</span>
                </div>
              </FormLabel>
              <p className="text-xs text-muted-foreground">
                Make this post part of a lab experiment
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p>Experiment posts are used to test content with specific audiences and measure responses</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (!checked) {
                      // Reset lab-related fields when turning off experiment
                      setSelectedLabId(undefined);
                      if (onChange) {
                        onChange(undefined);
                      }
                    }
                  }}
                />
              </FormControl>
            </div>
          </FormItem>
        )}
      />

      {control._formValues.labExperiment && (
        <>
          <Card className={`border-${selectedLabId ? 'solid' : 'dashed'} overflow-hidden`}>
            {selectedLabId && (
              <div className="w-full h-1 bg-primary"></div>
            )}
            <CardContent className="pt-4">
              <FormField
                control={control}
                name="labId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel className="flex items-center gap-1">
                        <FlaskConical className="w-4 h-4" />
                        Select Content Studio
                      </FormLabel>
                      {selectedLab && (
                        <Badge variant="outline" className="capitalize">
                          {selectedLab.status}
                        </Badge>
                      )}
                    </div>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(parseInt(value) || undefined);
                        handleLabChange(value);
                      }}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a content studio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLabsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : circleLabs?.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No labs available
                          </SelectItem>
                        ) : (
                          circleLabs?.map((lab: Lab) => (
                            <SelectItem key={lab.id} value={lab.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span>{lab.name}</span>
                                {lab.status !== "active" && (
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {lab.status}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedLabId && selectedLab && (
                <>
                  <div className="mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Experiment type: <strong>{selectedLab.experimentType.replace('_', '/').toUpperCase()}</strong></span>
                    </div>
                    {selectedLab.description && (
                      <p className="mt-1 ml-4 line-clamp-2">
                        {selectedLab.description}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>

            {selectedLabId && currentCircleRole && (
              <>
                <Separator className="my-2" />
                <CardContent className="py-3">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-md border p-2 text-center">
                      <div className="text-xs text-muted-foreground">Control</div>
                      <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        {circleCounts.control}
                      </Badge>
                    </div>
                    <div className="rounded-md border p-2 text-center">
                      <div className="text-xs text-muted-foreground">Treatment</div>
                      <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                        {circleCounts.treatment}
                      </Badge>
                    </div>
                    <div className="rounded-md border p-2 text-center">
                      <div className="text-xs text-muted-foreground">Observation</div>
                      <Badge variant="outline" className="mt-1 bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                        {circleCounts.observation}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <Label>Current circle role:</Label>
                      <div className="mt-1">
                        <Badge variant="outline" className={
                          currentCircleRole === "control"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                            : currentCircleRole === "treatment"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                            : "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
                        }>
                          {roleInfo[currentCircleRole as keyof typeof roleInfo].icon}
                          <span className="ml-1">
                            {currentCircleRole.charAt(0).toUpperCase() + currentCircleRole.slice(1)}
                          </span>
                        </Badge>
                      </div>
                    </div>

                    <FormField
                      control={control}
                      name="targetRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <MoveHorizontal className="w-3.5 h-3.5" />
                            <span>Target audience</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "all"}
                            defaultValue="all"
                          >
                            <FormControl>
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="All circles" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all" className="flex items-center">
                                <div className="flex items-center">
                                  {roleInfo.all.icon}
                                  <span className="ml-2">All circles</span>
                                </div>
                              </SelectItem>
                              
                              <SelectItem value="control" className="flex items-center">
                                <div className="flex items-center">
                                  {roleInfo.control.icon}
                                  <span className="ml-2">Control only</span>
                                </div>
                              </SelectItem>
                              
                              <SelectItem value="treatment" className="flex items-center">
                                <div className="flex items-center">
                                  {roleInfo.treatment.icon}
                                  <span className="ml-2">Treatment only</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>

                <CardFooter className="pt-0 pb-3">
                  <div className="w-full">
                    {!hasRequiredCircleRoles && (
                      <div className="flex items-center text-amber-600 text-sm">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span>This lab is missing control or treatment circles</span>
                      </div>
                    )}
                    
                    <div className={`mt-2 text-xs p-2 rounded-md flex items-start gap-2 ${targetRoleInfo.bgClass}`}>
                      <div className="mt-0.5">{targetRoleInfo.icon}</div>
                      <div>
                        <p className="font-semibold">{targetRoleInfo.name} targeting</p>
                        <p>{targetRoleInfo.description}</p>
                      </div>
                    </div>
                  </div>
                </CardFooter>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}