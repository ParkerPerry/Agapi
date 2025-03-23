import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Users } from "lucide-react";
import { useCreateCollective } from "@/lib/mutations/follower-mutations";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Helper function to generate avatar URLs
function generateUniqueAvatarUrl() {
  const randomSeed = Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
}

// Define schema for the form
const collectiveFormSchema = z.object({
  name: z.string().min(1, "Collective name is required"),
  theme: z.string().min(1, "Theme is required"),
  count: z.number().min(1).max(100),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  responsiveness: z.enum(["instant", "active", "casual", "zen"]),
});

type CollectiveFormValues = z.infer<typeof collectiveFormSchema>;

export function CollectiveCreateForm() {
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const createCollectiveMutation = useCreateCollective();
  
  const form = useForm<CollectiveFormValues>({
    resolver: zodResolver(collectiveFormSchema),
    defaultValues: {
      name: "",
      theme: "",
      count: 10,
      skills: [],
      responsiveness: "active" as const,
    },
  });

  // Add a skill to the list
  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      const newSkills = [...skills, skillInput.trim()];
      setSkills(newSkills);
      form.setValue("skills", newSkills);
      setSkillInput("");
    }
  };

  // Remove a skill from the list
  const removeSkill = (skill: string) => {
    const newSkills = skills.filter(s => s !== skill);
    setSkills(newSkills);
    form.setValue("skills", newSkills);
  };

  // Handle key press (Enter) in the skill input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const onSubmit = (data: CollectiveFormValues) => {
    createCollectiveMutation.mutate({
      name: data.name,
      theme: data.theme,
      count: data.count,
      skills: data.skills,
      responsiveness: data.responsiveness,
      avatarUrlBase: generateUniqueAvatarUrl(),
    });
    
    // Reset form
    form.reset({
      name: "",
      theme: "",
      count: 10,
      skills: [],
      responsiveness: "active",
    });
    setSkills([]);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collective Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter collective name (e.g., 'Tech Enthusiasts')" />
              </FormControl>
              <FormDescription>
                This name will be used as a prefix for all followers in this collective
              </FormDescription>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Theme</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe the shared theme for AI followers (e.g., 'Technology professionals with diverse specialties')"
                />
              </FormControl>
              <FormDescription>
                This theme will be used to generate varied but cohesive personalities
              </FormDescription>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Followers ({field.value})</FormLabel>
              <FormControl>
                <Slider
                  min={1}
                  max={100}
                  step={1}
                  value={[field.value]}
                  onValueChange={(vals) => field.onChange(vals[0])}
                />
              </FormControl>
              <FormDescription>
                Number of AI followers to create in this collective (max 100)
              </FormDescription>
            </FormItem>
          )}
        />
        
        {/* Skills input with tags */}
        <FormField
          control={form.control}
          name="skills"
          render={() => (
            <FormItem>
              <FormLabel>Skills & Interests</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter a skill and press Enter"
                />
                <Button type="button" onClick={addSkill} variant="outline">
                  Add
                </Button>
              </div>
              
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => removeSkill(skill)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              <FormDescription>
                Skills and interests will be distributed among followers in the collective
              </FormDescription>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="responsiveness"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsiveness</FormLabel>
              <Select
                value={field.value} 
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select responsiveness level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="instant">
                    <div>
                      <div>Instant (&lt; 5 min)</div>
                      <div className="text-xs text-muted-foreground">
                        Quick to respond, always online
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="active">
                    <div>
                      <div>Active (5-60 min)</div>
                      <div className="text-xs text-muted-foreground">
                        Regular social media user
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="casual">
                    <div>
                      <div>Casual (1-8 hrs)</div>
                      <div className="text-xs text-muted-foreground">
                        Checks occasionally
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="zen">
                    <div>
                      <div>Zen (8-24 hrs)</div>
                      <div className="text-xs text-muted-foreground">
                        Mindful and deliberate responses
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Determines how quickly and often the AI followers respond to posts
              </FormDescription>
            </FormItem>
          )}
        />
        
        {createCollectiveMutation.isPending && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>Creating AI collective... This may take a moment as we generate {form.getValues().count} unique followers.</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={createCollectiveMutation.isPending || skills.length === 0}
        >
          {createCollectiveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Users className="mr-2 h-4 w-4" />
          )}
          Create AI Collective
        </Button>
      </form>
    </Form>
  );
}