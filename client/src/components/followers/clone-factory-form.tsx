import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCloneFollower } from "@/lib/mutations/follower-mutations";
import type { AiFollower } from "@shared/schema";

// Form schema for clone factory
const cloneFactorySchema = z.object({
  templateFollowerId: z.number().min(1, "Please select a template follower"),
  collectiveName: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be at most 50 characters"),
  description: z.string().default(""),
  cloneCount: z.number().min(1, "Must create at least 1 clone").max(20, "Maximum of 20 clones allowed"),
  variationLevel: z.number().min(0.1, "Variation level must be at least 0.1").max(1, "Variation level must be at most 1"),
  customInstructions: z.string().default(""),
});

type CloneFactoryFormValues = z.infer<typeof cloneFactorySchema>;

export function CloneFactoryForm() {
  const { toast } = useToast();
  const cloneFollowerMutation = useCloneFollower();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available followers to use as templates
  const { data: followers, isLoading: isLoadingFollowers } = useQuery({
    queryKey: ["/api/followers"],
    select: (data: AiFollower[]) => data.filter(f => f.active),
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CloneFactoryFormValues>({
    resolver: zodResolver(cloneFactorySchema),
    defaultValues: {
      templateFollowerId: 0,
      collectiveName: "",
      description: "",
      cloneCount: 3,
      variationLevel: 0.5,
      customInstructions: "",
    },
  });

  const variationLevel = watch("variationLevel");
  const selectedTemplateId = watch("templateFollowerId");
  
  // Get the selected template follower
  const selectedTemplate = followers?.find(f => f.id === Number(selectedTemplateId));

  const onSubmit = async (data: CloneFactoryFormValues) => {
    try {
      setIsSubmitting(true);
      const result = await cloneFollowerMutation.mutateAsync(data);
      reset();
      toast({
        title: "Success!",
        description: `Successfully created ${result.followers?.length || data.cloneCount} variations of the selected AI follower.`,
      });
    } catch (error) {
      console.error("Error cloning followers:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clone followers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Descriptions for variation levels
  const getVariationDescription = (level: number) => {
    if (level < 0.3) return "Low variation - Clones will be very similar to the original";
    if (level < 0.7) return "Medium variation - Clones will have some distinct traits while preserving core personality";
    return "High variation - Clones will be significantly different while inspired by the original";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Template Follower</label>
        <select
          {...register("templateFollowerId", { valueAsNumber: true })}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoadingFollowers || isSubmitting}
        >
          <option value={0}>Select a follower as template</option>
          {followers?.map((follower) => (
            <option key={follower.id} value={follower.id}>
              {follower.name}
            </option>
          ))}
        </select>
        {errors.templateFollowerId && (
          <p className="text-sm text-red-500">{errors.templateFollowerId.message}</p>
        )}
      </div>

      {selectedTemplate && (
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
          <p className="font-medium">{selectedTemplate.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedTemplate.personality.substring(0, 100)}...
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Collective Name</label>
        <input
          type="text"
          {...register("collectiveName")}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Name for the collective of clones"
          disabled={isSubmitting}
        />
        {errors.collectiveName && (
          <p className="text-sm text-red-500">{errors.collectiveName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description (optional)</label>
        <input
          type="text"
          {...register("description")}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Brief description of this group of clones"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Number of Clones</label>
        <input
          type="number"
          {...register("cloneCount", { valueAsNumber: true })}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          min={1}
          max={20}
          disabled={isSubmitting}
        />
        {errors.cloneCount && (
          <p className="text-sm text-red-500">{errors.cloneCount.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Variation Level: {Math.round(variationLevel * 100)}%
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-xs">Low</span>
          <input
            type="range"
            {...register("variationLevel", { valueAsNumber: true })}
            min={0.1}
            max={1}
            step={0.05}
            className="flex-1"
            disabled={isSubmitting}
          />
          <span className="text-xs">High</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {getVariationDescription(variationLevel)}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Custom Instructions (optional)</label>
        <textarea
          {...register("customInstructions")}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Additional instructions for generating variations (e.g., 'Focus on scientific knowledge', 'Make them nature enthusiasts')"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        className="w-full py-2 mt-4 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
        disabled={isSubmitting || !selectedTemplateId}
      >
        {isSubmitting ? "Creating clones..." : "Create Clones"}
      </button>
    </form>
  );
}