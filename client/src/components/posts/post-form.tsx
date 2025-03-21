import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

interface PostFormProps {
  defaultCircleId?: number;
}

export function PostForm({ defaultCircleId }: PostFormProps) {
  const form = useForm({
    resolver: zodResolver(insertPostSchema),
    defaultValues: {
      content: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      // If defaultCircleId is provided, create a post in that circle
      // Otherwise, create a post in the user's default circle
      if (defaultCircleId) {
        // Use the regular posts endpoint with circleId in the body
        const res = await apiRequest("POST", "/api/posts", {
          content: data.content,
          circleId: defaultCircleId
        });
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/posts", {
          content: data.content,
        });
        return res.json();
      }
    },
    onSuccess: () => {
      // Invalidate the appropriate query depending on whether we're in a circle or not
      if (defaultCircleId) {
        queryClient.invalidateQueries({ queryKey: [`/api/circles/${defaultCircleId}/posts`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      }
      form.reset({ content: "" });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => createPostMutation.mutate(data))}>
        <Card className="shadow-sm">
          <CardContent className="pt-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="What's on your mind?"
                      className="min-h-[100px] resize-none focus-visible:ring-0"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end py-2">
            <Button 
              type="submit"
              disabled={createPostMutation.isPending}
            >
              {createPostMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Post
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}