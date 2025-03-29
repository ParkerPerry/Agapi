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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beaker, AlertCircle } from "lucide-react";
import { Lab, LabCircle } from "@shared/schema";
import { Control } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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

export function LabPostTargetingSelector({
  control,
  circleId,
  onChange,
}: LabPostTargetingSelectorProps) {
  const [selectedLabId, setSelectedLabId] = useState<number | undefined>(undefined);
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

  useEffect(() => {
    // Show a warning if the lab doesn't have both control and treatment circles
    if (selectedLabId && labCircles && !hasRequiredCircleRoles && !isLabCirclesLoading) {
      toast({
        title: "Lab Configuration Warning",
        description: "This lab doesn't have both control and treatment circles, which is recommended for experiments.",
      });
    }
  }, [selectedLabId, labCircles, hasRequiredCircleRoles, isLabCirclesLoading, toast]);

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="labExperiment"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-3">
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
          </FormItem>
        )}
      />

      {control._formValues.labExperiment && (
        <>
          <FormField
            control={control}
            name="labId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lab</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(parseInt(value) || undefined);
                    handleLabChange(value);
                  }}
                  value={field.value?.toString() || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lab" />
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
                          {lab.name}
                          {lab.status !== "active" && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({lab.status})
                            </span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedLabId && currentCircleRole && (
            <Card className="border-dashed">
              <CardContent className="pt-4 pb-2">
                <div className="flex items-center justify-between">
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
                        {currentCircleRole.charAt(0).toUpperCase() + currentCircleRole.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <FormField
                    control={control}
                    name="targetRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target audience</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "all"}
                          defaultValue="all"
                        >
                          <FormControl>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="All circles" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All circles</SelectItem>
                            <SelectItem value="control">Control only</SelectItem>
                            <SelectItem value="treatment">Treatment only</SelectItem>
                            <SelectItem value="observation">Observation only</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!hasRequiredCircleRoles && (
                  <div className="flex items-center mt-2 text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>This lab is missing control or treatment circles</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}