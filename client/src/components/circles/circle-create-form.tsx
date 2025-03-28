import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Circle } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CircleCreateFormProps {
  onCircleCreated?: (circle: Circle) => void;
}

export function CircleCreateForm({ onCircleCreated }: CircleCreateFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form validation schema
  const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
    description: z.string().optional(),
    visibility: z.enum(["private", "shared"]).default("private"),
    color: z.string().default("#f3f4f6"),
  });
  
  // Set up form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "private",
      color: "#f3f4f6",
    }
  });
  
  // Mutation for creating a circle
  const createCircleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      setIsSubmitting(true);
      return await apiRequest("/api/circles", "POST", data);
    },
    onSuccess: (data: Circle) => {
      // Invalidate circles query cache
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      
      // Reset form
      form.reset();
      
      // Show success toast
      toast({
        title: "Circle created",
        description: `${data.name} has been created successfully.`,
      });
      
      // Call callback if provided
      if (onCircleCreated) {
        onCircleCreated(data);
      }
      
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error creating circle",
        description: "There was a problem creating your circle. Please try again.",
        variant: "destructive"
      });
      
      setIsSubmitting(false);
    }
  });
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createCircleMutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Circle Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter circle name" {...field} />
              </FormControl>
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
                  placeholder="Describe the purpose of this circle" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visibility</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-2" />
                      <span>Private</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="shared">
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      <span>Shared</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Circle Color</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="color" 
                    {...field} 
                    className="w-10 h-10 p-1" 
                  />
                  <Input 
                    type="text" 
                    value={field.value} 
                    onChange={field.onChange}
                    className="flex-1" 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Create Circle
        </Button>
      </form>
    </Form>
  );
}