import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateCollective } from "@/lib/mutations/follower-mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

// Define form schema for creating a collective
// Define responsiveness values and their labels
export const responsivenessLabels: Record<string, string> = {
  "instant": "Instant (responds immediately)",
  "active": "Active (responds within minutes)",
  "casual": "Casual (responds within hours)",
  "zen": "Zen (responds within a day)"
};

// Define response times in minutes for the slider
export const responsivenessValues: Record<string, number> = {
  "instant": 1,   // 1 minute
  "active": 30,   // 30 minutes
  "casual": 180,  // 3 hours
  "zen": 1440     // 24 hours
};

// Get responsiveness level based on delay minutes
export const getResponsivenessFromDelay = (delay: number): string => {
  if (delay <= 5) return "instant";
  if (delay <= 60) return "active";
  if (delay <= 360) return "casual";
  return "zen";
};

const collectiveFormSchema = z.object({
  collectiveName: z
    .string()
    .min(3, { message: "Collective name must be at least 3 characters" })
    .max(50, { message: "Collective name must be no more than 50 characters" }),
  personality: z
    .string()
    .min(10, { message: "Personality description must be at least 10 characters" })
    .max(500, { message: "Personality description must be no more than 500 characters" }),
  count: z
    .number()
    .min(2, { message: "Must create at least 2 followers in a collective" })
    .max(100, { message: "Cannot create more than 100 followers at once" }),
  avatarPrefix: z.string().optional(),
  responsiveness: z.enum(["instant", "active", "casual", "zen"]).default("active"),
  responseDelay: z.number().min(1).max(1440).default(30), // in minutes
  responseChance: z.number().min(0).max(100).default(80),
  namingOption: z.enum(["sequential", "dynamic"]).default("sequential"),
  generateDynamicAvatars: z.boolean().default(false)
});

type CollectiveFormValues = z.infer<typeof collectiveFormSchema>;

export function CollectiveCreateForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const collectiveCreateMutation = useCreateCollective();

  const defaultValues: Partial<CollectiveFormValues> = {
    collectiveName: "",
    personality: "",
    count: 5,
    avatarPrefix: "",
    responsiveness: "active",
    responseDelay: responsivenessValues["active"],
    responseChance: 80,
    namingOption: "sequential",
    generateDynamicAvatars: false
  };

  const form = useForm<CollectiveFormValues>({
    resolver: zodResolver(collectiveFormSchema),
    defaultValues
  });

  // Get form values for dynamic UI updates
  const namingOption = form.watch("namingOption");
  const responsiveness = form.watch("responsiveness");
  const responseDelay = form.watch("responseDelay");

  // Synchronize responsiveness dropdown with the response delay slider
  useEffect(() => {
    // Update responseDelay when responsiveness changes
    const newDelay = responsivenessValues[responsiveness];
    if (newDelay !== responseDelay) {
      form.setValue('responseDelay', newDelay);
    }
  }, [responsiveness, responseDelay, form]);

  // Update responsiveness when delay slider changes
  useEffect(() => {
    const newResponsiveness = getResponsivenessFromDelay(responseDelay);
    if (newResponsiveness !== responsiveness) {
      form.setValue('responsiveness', newResponsiveness as "instant" | "active" | "casual" | "zen");
    }
  }, [responseDelay, responsiveness, form]);

  // Automatically update avatar generation based on naming option
  useEffect(() => {
    // If sequential naming is selected, disable dynamic avatars
    if (namingOption === 'sequential') {
      form.setValue('generateDynamicAvatars', false);
    }
  }, [namingOption, form]);

  const onSubmit = async (data: CollectiveFormValues) => {
    setIsSubmitting(true);
    try {
      await collectiveCreateMutation.mutateAsync(data);
      setLocation("/ai-followers");
    } catch (error) {
      console.error("Error creating collective:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Create AI Collective
        </CardTitle>
        <CardDescription>
          Create multiple AI followers at once with similar characteristics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="collectiveName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collective Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Team Alpha" {...field} />
                  </FormControl>
                  <FormDescription>
                    This name will be used as a base for all followers in this collective
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collective Personality</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Analytical and detail-oriented, each member brings a different perspective while maintaining core values of precision and thoughtfulness."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the shared personality traits for this collective
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Followers ({field.value})</FormLabel>
                    <FormControl>
                      <Slider
                        min={2}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      How many followers to create (2-100)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="namingOption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naming Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select naming method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sequential">Sequential (Team Alpha 1, Team Alpha 2...)</SelectItem>
                          <SelectItem value="dynamic">Dynamic (AI-generated unique names)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How to name followers in this collective
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {namingOption === 'dynamic' && (
                  <FormField
                    control={form.control}
                    name="generateDynamicAvatars"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Generate Unique Avatars</FormLabel>
                          <FormDescription>
                            Create unique avatars for each AI follower
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            
            {namingOption === 'sequential' && (
              <FormField
                control={form.control}
                name="avatarPrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL Prefix (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/avatar" {...field} />
                    </FormControl>
                    <FormDescription>
                      Will be used like: prefix-1.png, prefix-2.png, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="responseDelay"
                render={({ field }) => {
                  // Format the response delay for display
                  const formatDelay = (delay: number): string => {
                    if (delay < 60) return `${delay} minute${delay === 1 ? '' : 's'}`;
                    const hours = Math.floor(delay / 60);
                    return `${hours} hour${hours === 1 ? '' : 's'}`;
                  };
                  
                  return (
                    <FormItem>
                      <FormLabel>Responsiveness - {responsivenessLabels[responsiveness]}</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={1440}
                          step={1}
                          value={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Fast ({formatDelay(1)})</span>
                        <span>Medium ({formatDelay(60)})</span>
                        <span>Slow ({formatDelay(1440)})</span>
                      </div>
                      <FormDescription>
                        Response time: {formatDelay(field.value)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="responseChance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Response Chance ({field.value}%)</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Never (0%)</span>
                      <span>Sometimes (50%)</span>
                      <span>Always (100%)</span>
                    </div>
                    <FormDescription>
                      Likelihood of followers responding to relevant content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Collective ({form.watch("count")} AI followers)
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}