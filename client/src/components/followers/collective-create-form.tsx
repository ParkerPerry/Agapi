import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateCollective } from "@/lib/mutations/follower-mutations";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Users, LayoutGrid, LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ResponsivenessCardSelector } from "./responsiveness-card-selector";

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

// Get default delay range based on responsiveness level
export const getDefaultDelay = (responsiveness: string): { min: number; max: number } => {
  switch (responsiveness) {
    case "instant":
      return { min: 0, max: 5 };
    case "active":
      return { min: 5, max: 60 };
    case "casual":
      return { min: 60, max: 480 }; // 1-8 hours
    case "zen":
      return { min: 480, max: 1440 }; // 8-24 hours
    default:
      return { min: 5, max: 60 };
  }
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
  responsivenessMulti: z.array(z.enum(["instant", "active", "casual", "zen"])).default(["active"]),
  responseDelayMin: z.number().min(1).max(1440).default(30), // min response time in minutes
  responseDelayMax: z.number().min(1).max(1440).default(30), // max response time in minutes
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
    responsivenessMulti: ["active"],
    responseDelayMin: getDefaultDelay("active").min,
    responseDelayMax: getDefaultDelay("active").max,
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
  const responseDelayMin = form.watch("responseDelayMin");
  const responseDelayMax = form.watch("responseDelayMax");

  // Synchronize responsiveness dropdown with the response delay sliders
  useEffect(() => {
    // Update responseDelay when responsiveness changes
    const newDelay = getDefaultDelay(responsiveness);
    form.setValue('responseDelayMin', newDelay.min);
    form.setValue('responseDelayMax', newDelay.max);
  }, [responsiveness, form]);

  // Update responsiveness when delay slider changes (use min value for UI indication)
  useEffect(() => {
    // Only update responsiveness based on min value to avoid conflicts
    const newResponsiveness = getResponsivenessFromDelay(responseDelayMin);
    if (newResponsiveness !== responsiveness) {
      form.setValue('responsiveness', newResponsiveness as "instant" | "active" | "casual" | "zen");
    }
  }, [responseDelayMin, responsiveness, form]);

  // Automatically update avatar generation based on naming option
  useEffect(() => {
    // If sequential naming is selected, disable dynamic avatars
    if (namingOption === 'sequential') {
      form.setValue('generateDynamicAvatars', false);
    }
  }, [namingOption, form]);

  // Create a direct submit handler instead of using form's onSubmit
  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    
    // Make sure form is valid
    const formState = form.getValues();
    const validation = collectiveFormSchema.safeParse(formState);
    
    if (!validation.success) {
      console.error("Form validation failed:", validation.error);
      alert("Please fill out all required fields correctly");
      return;
    }
    
    setIsSubmitting(true);
    console.log("Form submit clicked - custom handler");
    
    try {
      // Check authentication
      const authCheck = await fetch('/api/user', { credentials: 'include' });
      console.log("Auth check response:", authCheck.status);
      
      if (authCheck.status === 401) {
        alert('Please log in before creating a collective.');
        setLocation('/auth');
        return;
      }
      
      // Get form values
      const data = form.getValues();
      
      // Create payload
      const payload = {
        collectiveName: data.collectiveName,
        personality: data.personality,
        count: data.count,
        avatarPrefix: data.avatarPrefix,
        responsiveness: data.responsiveness,
        responsivenessOptions: data.responsivenessMulti,
        responseDelay: {
          min: data.responseDelayMin,
          max: data.responseDelayMax
        },
        namingOption: data.namingOption,
        generateDynamicAvatars: data.generateDynamicAvatars,
        responseChance: 80
      };
      
      console.log("Submitting data:", payload);
      
      // Make the API call
      const response = await fetch('/api/followers/collective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        alert(`Error creating collective: ${errorText}`);
      } else {
        const result = await response.json();
        console.log("API success:", result);
        
        // Update UI and redirect
        queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
        alert("Collective created successfully!");
        setLocation("/ai-followers");
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Legacy onSubmit kept for reference but not used
  const onSubmit = async (data: CollectiveFormValues) => {
    console.log("Legacy onSubmit called - NOT USED");
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
          <form onSubmit={handleFormSubmit} className="space-y-6">
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

            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="responsivenessMulti"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Response Time Options</FormLabel>
                    <FormDescription>
                      Select the response options for how quickly followers will respond to posts and comments
                    </FormDescription>
                    <FormControl>
                      <ResponsivenessCardSelector 
                        values={field.value} 
                        onChange={(values) => {
                          field.onChange(values);
                          // If there's at least one value selected, use the first one to set primary responsiveness
                          if (values.length > 0) {
                            form.setValue('responsiveness', values[0]);
                            const delay = getDefaultDelay(values[0]);
                            form.setValue('responseDelayMin', delay.min);
                            form.setValue('responseDelayMax', delay.max);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Collective ({form.watch("count")} AI followers)
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  console.log("Debug button clicked - testing direct API call");
                  
                  try {
                    // First check if we're authenticated
                    const authCheckResponse = await fetch('/api/user', {
                      credentials: 'include'
                    });
                    
                    console.log("Auth check response:", authCheckResponse.status);
                    
                    if (authCheckResponse.status === 401) {
                      console.error('User not authenticated. Please log in.');
                      alert('Please log in before creating a collective.');
                      return;
                    }
                    
                    // Test API with a simple direct call
                    const testData = {
                      collectiveName: "Test Collective",
                      personality: "Test personality description for debugging",
                      count: 3,
                      avatarPrefix: "",
                      responsiveness: "active",
                      responsivenessOptions: ["active"],
                      responseDelay: {
                        min: 5,
                        max: 60
                      },
                      namingOption: "sequential",
                      generateDynamicAvatars: false,
                      responseChance: 80
                    };
                    
                    console.log("Making test API call with data:", testData);
                    
                    const response = await fetch('/api/followers/collective', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify(testData)
                    });
                    
                    console.log('API response status:', response.status);
                    
                    if (!response.ok) {
                      const errorText = await response.text();
                      console.error('API error:', response.status, errorText);
                      alert(`Error testing API: ${response.status} ${errorText}`);
                    } else {
                      const result = await response.json();
                      console.log('API success:', result);
                      alert("API test successful! Check console for details.");
                    }
                  } catch (error) {
                    console.error("Error in test API call:", error);
                    alert(`Error in test API call: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
              >
                Debug API Connection
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}