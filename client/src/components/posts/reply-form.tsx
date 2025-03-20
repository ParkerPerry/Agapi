import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Send } from "lucide-react";
import { ReplyFormProps } from "./post-types";

export function ReplyForm({ postId, commentId, aiFollowerName, onReply }: ReplyFormProps) {
  const { user } = useAuth();
  const form = useForm({
    defaultValues: {
      content: "",
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/reply`, {
        content,
        parentId: commentId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${user?.id}`] });
      form.reset();
      onReply();
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => replyMutation.mutate(data))} className="flex items-center space-x-2">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input {...field} placeholder={`Reply to ${aiFollowerName}...`} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" size="icon" disabled={replyMutation.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}