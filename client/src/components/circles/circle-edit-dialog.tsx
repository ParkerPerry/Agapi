import { Circle, InsertCircle } from "@shared/schema";
import { Pencil, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CircleEditDialogProps {
  circle: Circle;
  onEdit?: (circle: Circle) => void;
}

export function CircleEditDialog({ circle, onEdit }: CircleEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const form = useForm<InsertCircle>({
    defaultValues: {
      name: circle.name,
      description: circle.description || "",
      icon: circle.icon || "🔵",
      color: circle.color || "#3b82f6",
    },
  });

  const updateCircleMutation = useMutation({
    mutationFn: async (data: InsertCircle) => {
      const res = await apiRequest(`/api/circles/${circle.id}`, "PATCH", data);
      return res.json();
    },
    onSuccess: (updatedCircle) => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      onEdit?.(updatedCircle);
      toast({
        title: "Circle updated",
        description: "Your circle has been updated successfully.",
      });
    },
  });
  
  // Mutation to set a circle as default
  const setDefaultCircleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/circles/${circle.id}/set-default`, "POST");
      
      // Check if the response was successful
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error occurred" }));
        console.error("Failed to set default circle:", errorData);
        throw new Error(errorData.message || "Failed to set default circle");
      }
      
      return res.json();
    },
    onSuccess: (updatedCircle) => {
      console.log("Successfully set default circle:", updatedCircle);
      
      // Invalidate multiple queries to ensure all components are updated
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/default-circle"] });
      queryClient.invalidateQueries({ queryKey: ["/api/circles/default"] });
      // Also invalidate the specific circle query
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${circle.id}`] });
      
      onEdit?.(updatedCircle);
      toast({
        title: "Default circle set",
        description: `${circle.name} is now your default circle.`,
      });
    },
    onError: (error) => {
      console.error("Error setting default circle:", error);
      toast({
        title: "Error",
        description: "Failed to set default circle. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Circle</DialogTitle>
          <DialogDescription>
            Update the details for {circle.name}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => updateCircleMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => {
                // Ensure we have a valid string value
                const value = typeof field.value === 'string' ? field.value : '';
                
                return (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        value={value}
                      />
                    </FormControl>
                  </FormItem>
                );
              }}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full text-left font-normal"
                          onClick={() => setShowEmojiPicker(true)}
                        >
                          {field.value || "Select an emoji"}
                        </Button>
                        <Dialog
                          open={showEmojiPicker}
                          onOpenChange={setShowEmojiPicker}
                        >
                          <DialogContent className="p-0 overflow-hidden">
                            <EmojiPicker
                              theme={Theme.LIGHT}
                              onEmojiClick={(emoji) => {
                                field.onChange(emoji.emoji);
                                setShowEmojiPicker(false);
                              }}
                              width="100%"
                              previewConfig={{ showPreview: false }}
                              searchPlaceholder="Search emoji..."
                              className="emoji-picker-custom"
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => {
                  // Ensure we have a valid string value
                  const value = typeof field.value === 'string' ? field.value : '#3b82f6';
                  
                  return (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input 
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          value={value}
                          type="color" 
                          className="h-10 px-2" 
                        />
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
            </div>
            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={updateCircleMutation.isPending}
              >
                {updateCircleMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Update Circle"
                )}
              </Button>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={circle.isDefault ? "outline" : "secondary"}
                      className="w-full"
                      disabled={circle.isDefault || setDefaultCircleMutation.isPending}
                      onClick={() => setDefaultCircleMutation.mutate()}
                    >
                      {setDefaultCircleMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Home className="mr-2 h-4 w-4" />
                          {circle.isDefault ? "Default Circle" : "Set as Default Circle"}
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {circle.isDefault 
                      ? "This is already your default circle" 
                      : "Make this your default circle that appears on your home page"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
