import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LabPostTargetingSelector } from "../labs/lab-post-targeting-selector";

interface PostFormProps {
  defaultCircleId?: number;
}

interface PostFormValues {
  content: string;
  circleId?: number;
  labId?: number;
  labExperiment?: boolean;
  targetRole?: "control" | "treatment" | "observation" | "all";
}

export function PostForm({ defaultCircleId }: PostFormProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  const form = useForm<PostFormValues>({
    resolver: zodResolver(insertPostSchema),
    defaultValues: {
      content: "",
      circleId: defaultCircleId,
      labExperiment: false,
      targetRole: "all"
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormValues) => {
      // Create the post data
      const postData: any = {
        content: data.content,
        circleId: defaultCircleId || data.circleId
      };

      // Add experiment-related fields if this is a lab experiment
      if (data.labExperiment && data.labId) {
        postData.labId = data.labId;
        postData.labExperiment = true;
        postData.targetRole = data.targetRole || "all";
      }

      // Submit the post
      const res = await apiRequest("/api/posts", "POST", postData);
      return res;
    },
    onSuccess: () => {
      // Invalidate the appropriate query depending on whether we're in a circle or not
      if (defaultCircleId) {
        queryClient.invalidateQueries({ queryKey: [`/api/circles/${defaultCircleId}/posts`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      }
      // Reset the form
      form.reset({ 
        content: "",
        circleId: defaultCircleId,
        labExperiment: false,
        targetRole: "all"
      });
      setIsAdvancedOpen(false);
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

            {defaultCircleId && (
              <div className="mt-4">
                <Collapsible
                  open={isAdvancedOpen}
                  onOpenChange={setIsAdvancedOpen}
                  className="w-full"
                >
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center p-1 hover:bg-transparent">
                        {isAdvancedOpen ? (
                          <ChevronUp className="h-4 w-4 mr-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 mr-1" />
                        )}
                        <span className="text-xs">
                          {isAdvancedOpen ? "Hide advanced options" : "Show advanced options"}
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent className="mt-2">
                    <LabPostTargetingSelector 
                      control={form.control}
                      circleId={defaultCircleId}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between py-2">
            <div className="flex-1">
              {form.formState.errors.content && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.content.message}
                </p>
              )}
            </div>
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