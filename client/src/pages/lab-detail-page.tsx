import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useLab, useLabPosts, useLabMetrics, Lab, LabPost, LabMetrics } from "@/lib/queries/lab-queries";
import { useUpdateLabStatus, useCreateLabPost, usePublishLabPost, useCalculateLabMetrics } from "@/lib/mutations/lab-mutations";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CircleManagementComponent } from "@/components/circles/circle-follower-manager-wrapper";
import {
  ArrowLeftIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  SaveIcon,
  PencilIcon,
  SendIcon,
  PlusIcon,
  RefreshCw,
  BarChart4Icon
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function LabDetailPage() {
  const params = useParams<{ id: string }>();
  const labId = parseInt(params.id);
  const { data: lab, isLoading: isLabLoading } = useLab(labId);
  const { data: labPosts, isLoading: isPostsLoading } = useLabPosts(labId);
  const { data: metrics, isLoading: isMetricsLoading } = useLabMetrics(labId);
  const [, navigate] = useLocation();
  const [newPostContent, setNewPostContent] = useState("");
  const [activeTab, setActiveTab] = useState("setup");
  const { toast } = useToast();

  const updateLabStatusMutation = useUpdateLabStatus();
  const createLabPostMutation = useCreateLabPost();
  const publishLabPostMutation = usePublishLabPost();
  const calculateMetricsMutation = useCalculateLabMetrics();
  
  // Helper function to get post status
  const getPostStatus = (post: LabPost): "draft" | "published" => {
    return post.published ? "published" : "draft";
  };

  // Update active tab based on lab status
  useEffect(() => {
    if (lab) {
      if (lab.status === "active" && activeTab === "setup") {
        setActiveTab("posts");
      } else if (lab.status === "completed" && activeTab !== "results") {
        setActiveTab("results");
      }
    }
  }, [lab, activeTab]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Empty post",
        description: "Please enter content for your post.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createLabPostMutation.mutateAsync({
        labId,
        content: newPostContent,
        order: labPosts?.length || 0
      });
      
      setNewPostContent("");
      
      toast({
        title: "Post created",
        description: "Lab post has been created successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create lab post.",
        variant: "destructive"
      });
    }
  };

  const handlePublishPost = async (postId: number) => {
    try {
      await publishLabPostMutation.mutateAsync({ labId, postId });
      
      toast({
        title: "Post published",
        description: "Lab post has been published to the circle."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish lab post.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateLabStatus = async (status: "active" | "completed") => {
    const statusText = status === "active" ? "launch" : "complete";
    
    try {
      await updateLabStatusMutation.mutateAsync({ labId, status });
      
      toast({
        title: `Lab ${statusText}ed`,
        description: `The lab has been ${statusText}ed successfully.`
      });
      
      // If completing, calculate final metrics
      if (status === "completed") {
        await calculateMetricsMutation.mutateAsync(labId);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${statusText} the lab.`,
        variant: "destructive"
      });
    }
  };

  const handleRefreshMetrics = async () => {
    try {
      await calculateMetricsMutation.mutateAsync(labId);
      
      toast({
        title: "Metrics refreshed",
        description: "Lab metrics have been updated."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh metrics.",
        variant: "destructive"
      });
    }
  };

  if (isLabLoading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div>Loading lab information...</div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div>Lab not found</div>
        <Button 
          variant="outline" 
          onClick={() => navigate("/labs")} 
          className="mt-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Labs
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/labs")} 
              className="mr-4"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{lab.name}</h1>
              <p className="text-muted-foreground">{lab.description || "No description"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {lab.status === "draft" && (
              <Button 
                onClick={() => handleUpdateLabStatus("active")}
                disabled={updateLabStatusMutation.isPending}
                className="flex items-center"
              >
                <PlayCircleIcon className="mr-2 h-4 w-4" />
                Launch Lab
              </Button>
            )}
            {lab.status === "active" && (
              <Button 
                onClick={() => handleUpdateLabStatus("completed")}
                disabled={updateLabStatusMutation.isPending}
                variant="outline"
                className="flex items-center"
              >
                <CheckCircleIcon className="mr-2 h-4 w-4" />
                Complete Lab
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup" disabled={lab.status === "completed"}>
            Setup
          </TabsTrigger>
          <TabsTrigger value="posts" disabled={lab.status === "draft"}>
            Posts
          </TabsTrigger>
          <TabsTrigger value="results">
            Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Circle Configuration</CardTitle>
              <CardDescription>
                Manage the AI followers in the circle for this experiment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Circle: <strong>{lab.circleName || `Circle ID: ${lab.circleId}`}</strong></p>
              <CircleManagementComponent circleId={lab.circleId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prepare Content</CardTitle>
              <CardDescription>
                Create posts that will be published during the experiment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-post">New Post</Label>
                  <Textarea
                    id="new-post"
                    placeholder="Enter post content..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleCreatePost} 
                  disabled={createLabPostMutation.isPending || !newPostContent.trim()}
                  className="flex items-center"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Post
                </Button>

                <Separator className="my-4" />

                <div>
                  <h3 className="font-medium mb-2">Prepared Posts</h3>
                  {isPostsLoading ? (
                    <div>Loading posts...</div>
                  ) : labPosts && labPosts.length > 0 ? (
                    <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                      <div className="space-y-4">
                        {labPosts.map((post) => (
                          <Card key={post.id} className="border-2 border-muted">
                            <CardContent className="p-4">
                              <p>{post.content}</p>
                              <div className="mt-2 text-sm text-muted-foreground">
                                Status: {getPostStatus(post)}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-4 bg-muted rounded-md">
                      <p>No posts prepared yet</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex w-full justify-between">
                <span className="text-sm text-muted-foreground">
                  {labPosts?.length || 0} posts prepared
                </span>
                {lab.status === "draft" && labPosts && labPosts.length > 0 && (
                  <Button 
                    onClick={() => handleUpdateLabStatus("active")}
                    disabled={updateLabStatusMutation.isPending}
                    variant="default"
                    className="flex items-center"
                  >
                    <PlayCircleIcon className="mr-2 h-4 w-4" />
                    Launch Lab
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publish Posts</CardTitle>
              <CardDescription>
                Publish prepared posts to your circle to generate AI follower responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPostsLoading ? (
                <div>Loading posts...</div>
              ) : labPosts && labPosts.length > 0 ? (
                <div className="space-y-4">
                  {labPosts.map((post) => (
                    <Card key={post.id} className="border-2 border-muted">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium">Post #{post.order + 1}</CardTitle>
                          <div className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">
                            {getPostStatus(post)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <p>{post.content}</p>
                      </CardContent>
                      <CardFooter>
                        {getPostStatus(post) === "draft" ? (
                          <Button 
                            onClick={() => handlePublishPost(post.id)}
                            disabled={publishLabPostMutation.isPending}
                            className="flex items-center"
                            size="sm"
                          >
                            <SendIcon className="mr-2 h-4 w-4" />
                            Publish Now
                          </Button>
                        ) : post.publishedPostId ? (
                          <span className="text-sm text-muted-foreground">
                            Published (ID: {post.publishedPostId})
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Processing...
                          </span>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted rounded-md">
                  <p>No posts available</p>
                  <Button 
                    onClick={() => setActiveTab("setup")}
                    variant="outline"
                    className="mt-4"
                  >
                    Go to Setup
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                {labPosts?.filter(p => getPostStatus(p) === "published").length || 0}/{labPosts?.length || 0} posts published
              </span>
              <Button 
                onClick={() => handleRefreshMetrics()}
                disabled={calculateMetricsMutation.isPending}
                variant="outline"
                className="flex items-center"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Metrics
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Experiment Results</CardTitle>
                  <CardDescription>
                    Analysis of AI follower interactions with your posts
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => handleRefreshMetrics()}
                  disabled={calculateMetricsMutation.isPending}
                  variant="outline"
                  className="flex items-center"
                  size="sm"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isMetricsLoading ? (
                <div>Loading metrics...</div>
              ) : metrics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Posts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{metrics.postCount}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Comments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{metrics.commentCount}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Active Followers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{metrics.followerCount}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4">
                    {metrics.additionalMetrics && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Advanced Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {metrics.additionalMetrics.likeCount !== undefined && (
                              <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">
                                  Likes
                                </div>
                                <div className="text-2xl font-bold">
                                  {metrics.additionalMetrics.likeCount}
                                </div>
                              </div>
                            )}
                            
                            {metrics.additionalMetrics.avgResponseTime !== undefined && (
                              <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">
                                  Avg Response Time
                                </div>
                                <div className="text-2xl font-bold">
                                  {metrics.additionalMetrics.avgResponseTime.toFixed(1)} sec
                                </div>
                              </div>
                            )}
                            
                            {metrics.additionalMetrics.engagement !== undefined && (
                              <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">
                                  Engagement Score
                                </div>
                                <div className="flex items-center">
                                  <div className="text-2xl font-bold mr-2">
                                    {(metrics.additionalMetrics.engagement * 100).toFixed(0)}%
                                  </div>
                                  <Progress 
                                    value={metrics.additionalMetrics.engagement * 100} 
                                    className="h-2 w-24" 
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Experiment Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-1">Experiment Status</h4>
                            <p className="text-sm text-muted-foreground">
                              {lab.status === "completed" 
                                ? "This experiment has been completed. All metrics are final."
                                : "This experiment is still active. Metrics will update as followers respond."}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-1">Circle Information</h4>
                            <p className="text-sm text-muted-foreground">
                              This experiment was conducted on circle "{lab.circleName || "Unknown"}" with {metrics.followerCount} active AI followers.
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-1">Interaction Summary</h4>
                            <p className="text-sm text-muted-foreground">
                              A total of {metrics.postCount} posts were published, which received {metrics.commentCount} comments.
                              {metrics.additionalMetrics?.likeCount !== undefined ? ` The posts also received ${metrics.additionalMetrics.likeCount} likes.` : ""}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-1">Next Steps</h4>
                            <p className="text-sm text-muted-foreground">
                              To continue analyzing these results, you can export this data or create a new experiment with different parameters.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>No metrics available yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Metrics will be calculated after posts are published
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => navigate("/labs")}
                variant="outline"
                className="flex items-center"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Labs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}