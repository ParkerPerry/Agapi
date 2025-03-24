import { useState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { getDefaultDelay } from "./collective-create-form";
import { BasicInfoSection } from "./form-sections/basic-info-section";
import { NamingOptionsSection } from "./form-sections/naming-options-section";
import { ResponsivenessSection } from "./form-sections/responsiveness-section";

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
  responsivenessMulti: z.array(z.enum(["instant", "active", "casual", "zen"])).min(1, { message: "Select at least one responsiveness option" }).default(["active"]),
  responseDelayMin: z.number().min(1).max(1440).default(30), // min response time in minutes
  responseDelayMax: z.number().min(1).max(1440).default(30), // max response time in minutes
  namingOption: z.enum(["sequential", "dynamic"]).default("sequential"),
  generateDynamicAvatars: z.boolean().default(false)
});

export type CollectiveFormValues = z.infer<typeof collectiveFormSchema>;

export function SimplifiedCollectiveForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();

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

  // Automatically update avatar generation based on naming option
  useEffect(() => {
    // If sequential naming is selected, disable dynamic avatars
    if (namingOption === 'sequential') {
      form.setValue('generateDynamicAvatars', false);
    }
  }, [namingOption, form]);

  // Basic form submission function
  const onSubmit = async (data: CollectiveFormValues) => {
    console.log("Form submitted with data:", data);
    setIsSubmitting(true);
    
    try {
      // Check authentication
      const authCheck = await fetch('/api/user', { credentials: 'include' });
      console.log("Auth check response:", authCheck.status);
      
      if (authCheck.status === 401) {
        alert('Please log in before creating a collective.');
        setLocation('/auth');
        return;
      }
      
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Info Section */}
            <BasicInfoSection control={form.control} />
            
            {/* Naming Options Section */}
            <NamingOptionsSection control={form.control} namingOption={namingOption} />
            
            {/* Responsiveness Section */}
            <ResponsivenessSection control={form.control} form={form} />
            
            {/* Submit Button */}
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