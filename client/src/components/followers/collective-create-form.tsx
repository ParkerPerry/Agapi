import { useState } from "react";
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

// Define form schema for creating a collective
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
  responseChance: z.number().min(0).max(100).default(80)
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
    responseChance: 80
  };

  const form = useForm<CollectiveFormValues>({
    resolver: zodResolver(collectiveFormSchema),
    defaultValues
  });

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
                    <FormLabel>Number of Followers</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          type="number"
                          min={2}
                          max={100}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value || "5"))}
                        />
                      </FormControl>
                      <span className="text-sm text-muted-foreground">({field.value} followers)</span>
                    </div>
                    <FormDescription>
                      How many followers to create (2-100)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="responsiveness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsiveness</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select responsiveness level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="instant">Instant (responds immediately)</SelectItem>
                        <SelectItem value="active">Active (responds within minutes)</SelectItem>
                        <SelectItem value="casual">Casual (responds within hours)</SelectItem>
                        <SelectItem value="zen">Zen (responds within a day)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How quickly all followers will respond to posts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
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