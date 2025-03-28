import { InsertCircle } from "@shared/schema";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useCreateCircle } from "@/lib/mutations/circle-mutations";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export function CircleCreateForm() {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const createCircleMutation = useCreateCircle();

  const form = useForm<InsertCircle>({
    defaultValues: {
      name: "",
      description: "",
      icon: "🔵",
      color: "#3b82f6",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          createCircleMutation.mutate(data);
          form.reset();
          setShowEmojiPicker(false);
        })}
        className="space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter circle name" />
                </FormControl>
              </FormItem>
            )}
          />
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
                      {field.value || "🔵"}
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
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe the purpose of this circle"
                />
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
              <FormDescription>
                Choose a color to represent this circle
              </FormDescription>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={createCircleMutation.isPending}
        >
          {createCircleMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Create Circle
        </Button>
      </form>
    </Form>
  );
}
