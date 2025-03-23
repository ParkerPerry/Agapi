import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { AiFollower } from "@shared/schema";
import { useCloneFollower } from "@/lib/mutations/follower-mutations";

// UI Components
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Copy, Braces, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Form schema for clone factory
const cloneFormSchema = z.object({
  templateFollowerId: z.number({
    required_error: "Please select a template follower",
  }),
  collectiveName: z.string().min(3, {
    message: "Collective name must be at least 3 characters",
  }),
  description: z.string().optional(),
  cloneCount: z.number().min(1).max(20),
  variationLevel: z.number().min(0.1).max(1),
  customInstructions: z.string().optional(),
});

type CloneFormValues = z.infer<typeof cloneFormSchema>;

export function CloneFactoryForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get existing followers to use as templates
  const { data: followers, isLoading: isLoadingFollowers } = useQuery<AiFollower[]>({
    queryKey: ["/api/followers"],
  });
  
  // Clone follower mutation hook (to be implemented)
  const cloneFollowerMutation = useCloneFollower();

  // Form definition
  const form = useForm<CloneFormValues>({
    resolver: zodResolver(cloneFormSchema),
    defaultValues: {
      collectiveName: "",
      description: "",
      cloneCount: 5,
      variationLevel: 0.5,
      customInstructions: "",
    },
  });

  // Form submission handler
  async function onSubmit(data: CloneFormValues) {
    setIsSubmitting(true);
    
    try {
      // Call the mutation to clone followers
      await cloneFollowerMutation.mutateAsync({
        templateFollowerId: data.templateFollowerId,
        collectiveName: data.collectiveName,
        description: data.description || "",
        cloneCount: data.cloneCount,
        variationLevel: data.variationLevel,
        customInstructions: data.customInstructions || "",
      });
      
      toast({
        title: "Success!",
        description: `Created ${data.cloneCount} clones based on your template.`,
      });
      
      // Reset form
      form.reset({
        collectiveName: "",
        description: "",
        cloneCount: 5,
        variationLevel: 0.5,
        customInstructions: "",
      });
    } catch (error) {
      console.error("Error cloning followers:", error);
      toast({
        title: "Error",
        description: "Failed to create clones. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Get the selected template follower
  const selectedFollowerId = form.watch("templateFollowerId");
  const selectedFollower = followers?.find(f => f.id === selectedFollowerId);

  // Format the variation level as a percentage
  const variationLevelPercentage = Math.round(form.watch("variationLevel") * 100);

  if (isLoadingFollowers) {
    return <div className="text-center py-4">Loading your followers...</div>;
  }

  if (!followers || followers.length === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/50">
        <CardHeader>
          <CardTitle>No Template Followers Available</CardTitle>
          <CardDescription>
            You need to create at least one AI follower first to use as a template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please create an individual AI follower and then return to the Clone Factory.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - template selection and settings */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="templateFollowerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Follower</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a follower as template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {followers.map((follower) => (
                        <SelectItem 
                          key={follower.id} 
                          value={follower.id.toString()}
                        >
                          {follower.name} - {follower.personality.substring(0, 30)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose an existing follower as the base template for cloning
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collectiveName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collective Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Clone Collective" {...field} />
                  </FormControl>
                  <FormDescription>
                    Name for the new collective of cloned followers
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A group of clones based on my favorite AI follower"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description of this clone collective
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right column - clone settings */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="cloneCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Clones</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    How many clones to generate (1-20)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="variationLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variation Level: {variationLevelPercentage}%</FormLabel>
                  <FormControl>
                    <Slider
                      min={0.1}
                      max={1}
                      step={0.05}
                      defaultValue={[field.value]}
                      onValueChange={(values) => field.onChange(values[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    How much each clone will vary from the template (10% = very similar, 100% = very different)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Make each clone have different hobbies but keep the same core personality"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Specific instructions for how clones should vary from the template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Template preview */}
        {selectedFollower && (
          <Card className="border border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Template Preview
                  </CardTitle>
                  <CardDescription>
                    Your clones will be based on this follower
                  </CardDescription>
                </div>
                <Badge variant="outline" className="ml-2">
                  {selectedFollower.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="font-semibold">{selectedFollower.name}</div>
                <div className="text-sm">{selectedFollower.personality}</div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-1 mt-2">
                  {selectedFollower.interests?.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || !form.formState.isValid}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cloning...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Clone Followers
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}