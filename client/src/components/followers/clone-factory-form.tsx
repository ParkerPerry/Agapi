import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCloneFollower } from "@/lib/mutations/follower-mutations";
import type { AiFollower } from "@shared/schema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, ChevronsUpDown, Info, Search, User } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Form schema for clone factory
const cloneFactorySchema = z.object({
  templateFollowerId: z.number().min(1, "Please select a template follower"),
  collectiveName: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be at most 50 characters"),
  description: z.string().default(""),
  cloneCount: z.number().min(1, "Must create at least 1 clone").max(20, "Maximum of 20 clones allowed"),
  variationLevel: z.number().min(0.1, "Variation level must be at least 0.1").max(1, "Variation level must be at most 1"),
  customInstructions: z.string().default(""),
  namingOption: z.enum(['dynamic', 'sequential']).default('dynamic'),
  generateDynamicAvatars: z.boolean().default(true)
});

type CloneFactoryFormValues = z.infer<typeof cloneFactorySchema>;

export function CloneFactoryForm() {
  const { toast } = useToast();
  const cloneFollowerMutation = useCloneFollower();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [followerSelectOpen, setFollowerSelectOpen] = useState(false);

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
    setValue,
    control,
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
      namingOption: 'dynamic',
      generateDynamicAvatars: true
    },
  });

  const variationLevel = watch("variationLevel");
  const selectedTemplateId = watch("templateFollowerId");
  const namingOption = watch("namingOption");
  
  // Get the selected template follower
  const selectedTemplate = followers?.find(f => f.id === Number(selectedTemplateId));

  // Automatically update avatar generation based on naming option
  useEffect(() => {
    // If sequential naming is selected, disable dynamic avatars
    if (namingOption === 'sequential') {
      setValue('generateDynamicAvatars', false);
    } else {
      setValue('generateDynamicAvatars', true);
    }
  }, [namingOption, setValue]);

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
        
        <Popover open={followerSelectOpen} onOpenChange={setFollowerSelectOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={followerSelectOpen}
              className="w-full justify-between text-left font-normal"
              disabled={isLoadingFollowers || isSubmitting}
            >
              {selectedTemplate ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedTemplate.avatarUrl} alt={selectedTemplate.name} />
                    <AvatarFallback>{selectedTemplate.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{selectedTemplate.name}</span>
                </div>
              ) : (
                "Select a follower as template"
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[300px]">
            <Command>
              <CommandInput placeholder="Search followers..." icon={Search} />
              <CommandEmpty>No followers found.</CommandEmpty>
              <CommandGroup>
                <CommandList>
                  {followers?.map((follower) => (
                    <CommandItem
                      key={follower.id}
                      value={follower.name}
                      onSelect={() => {
                        setValue("templateFollowerId", follower.id);
                        setFollowerSelectOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={follower.avatarUrl} alt={follower.name} />
                          <AvatarFallback>{follower.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span>{follower.name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {follower.personality.substring(0, 40)}...
                          </span>
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            selectedTemplateId === follower.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandList>
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        
        {/* Hidden input for form handling */}
        <input 
          type="hidden" 
          {...register("templateFollowerId", { valueAsNumber: true })}
        />
        
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
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Naming Option</label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-80">
                  <strong>Dynamic:</strong> AI generates unique names for each clone and creates unique avatars<br />
                  <strong>Sequential:</strong> Names like "{selectedTemplate?.name || 'Template'} 01", "{selectedTemplate?.name || 'Template'} 02" with the original avatar
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <RadioGroup 
          defaultValue="dynamic" 
          value={namingOption} 
          onValueChange={(value) => setValue('namingOption', value as 'dynamic' | 'sequential')}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dynamic" id="dynamic" />
            <Label htmlFor="dynamic" className="cursor-pointer">Generate unique names (AI-created)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sequential" id="sequential" />
            <Label htmlFor="sequential" className="cursor-pointer">Name sequentially (e.g., {selectedTemplate?.name || 'Template'} 01, {selectedTemplate?.name || 'Template'} 02)</Label>
          </div>
        </RadioGroup>
        
        <input 
          type="hidden" 
          {...register("namingOption")} 
        />
        
        <input 
          type="hidden" 
          {...register("generateDynamicAvatars")} 
        />
        
        <p className="text-xs text-muted-foreground">
          {namingOption === 'dynamic' 
            ? "Each follower will have a unique AI-generated name and avatar" 
            : `All followers will use the same avatar as ${selectedTemplate?.name || 'the template'} with numbered names`}
        </p>
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