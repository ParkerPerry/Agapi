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
      const res = await apiRequest("PATCH", `/api/circles/${circle.id}`, data);
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input {...field} type="color" className="h-10 px-2" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
