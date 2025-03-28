import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Lab } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  ThumbsUp, 
  Users, 
  Loader2, 
  BarChart3, 
  ListFilter, 
  Clock,
  FileBarChart
} from "lucide-react";
import { formatRelativeTime } from "@/utils/date";

interface LabStatsProps {
  lab: Lab;
}

// Type for lab post stats
interface LabPostStats {
  id: number;
  content: string;
  postedAt: string;
  commentCount: number;
  likeCount: number;
  totalInteractions: number;
  responseTime: number;
}

// Type for lab follower stats
interface LabFollowerStats {
  id: number;
  name: string;
  avatar: string;
  commentCount: number;
  likeCount: number;
  totalInteractions: number;
  avgResponseTime: number;
}

// Type for summary stats
interface LabSummaryStats {
  totalPosts: number;
  totalFollowers: number;
  totalComments: number;
  totalLikes: number;
  avgResponseTime: number;
  topFollowers: {
    name: string;
    interactions: number;
  }[];
  engagementByPost: {
    postId: number;
    interactions: number;
  }[];
}

export function LabStats({ lab }: LabStatsProps) {
  // Fetch lab stats
  const { data: labStats, isLoading: isLoadingStats } = useQuery<LabSummaryStats>({
    queryKey: [`/api/labs/${lab.id}/stats/summary`],
    queryFn: async () => {
      try {
        return await apiRequest(`/api/labs/${lab.id}/stats/summary`);
      } catch (error) {
        // Return empty stats if endpoint doesn't exist yet
        return {
          totalPosts: 0,
          totalFollowers: 0,
          totalComments: 0,
          totalLikes: 0,
          avgResponseTime: 0,
          topFollowers: [],
          engagementByPost: []
        };
      }
    },
  });
  
  // Fetch post stats
  const { data: postStats = [], isLoading: isLoadingPostStats } = useQuery<LabPostStats[]>({
    queryKey: [`/api/labs/${lab.id}/stats/posts`],
    queryFn: async () => {
      try {
        return await apiRequest(`/api/labs/${lab.id}/stats/posts`);
      } catch (error) {
        // Return empty array if endpoint doesn't exist yet
        return [];
      }
    },
  });
  
  // Fetch follower stats
  const { data: followerStats = [], isLoading: isLoadingFollowerStats } = useQuery<LabFollowerStats[]>({
    queryKey: [`/api/labs/${lab.id}/stats/followers`],
    queryFn: async () => {
      try {
        return await apiRequest(`/api/labs/${lab.id}/stats/followers`);
      } catch (error) {
        // Return empty array if endpoint doesn't exist yet
        return [];
      }
    },
  });
  
  // Prepare chart data
  const engagementChartData = (labStats?.engagementByPost || []).map((item, index) => ({
    name: `Post ${index + 1}`,
    interactions: item.interactions
  }));
  
  const followerEngagementData = (followerStats || []).map(follower => ({
    name: follower.name,
    comments: follower.commentCount,
    likes: follower.likeCount,
    total: follower.totalInteractions
  }));
  
  // Placeholder for when there's no data
  const renderNoDataPlaceholder = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <FileBarChart className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium">No Data Available</h3>
      <p className="text-muted-foreground max-w-md">
        There are no stats to display yet. Stats will appear here once the lab is active and followers start interacting with posts.
      </p>
    </div>
  );
  
  // Loading skeleton for cards
  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Skeleton className="h-[100px] rounded-lg" />
        <Skeleton className="h-[100px] rounded-lg" />
        <Skeleton className="h-[100px] rounded-lg" />
        <Skeleton className="h-[100px] rounded-lg" />
      </div>
      <Skeleton className="h-[250px] rounded-lg" />
    </div>
  );
  
  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-4">
        <TabsTrigger value="overview">
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="posts">
          <MessageSquare className="h-4 w-4 mr-2" />
          Posts
        </TabsTrigger>
        <TabsTrigger value="followers">
          <Users className="h-4 w-4 mr-2" />
          Followers
        </TabsTrigger>
      </TabsList>
      
      {/* Overview Tab */}
      <TabsContent value="overview">
        <div className="space-y-6">
          {isLoadingStats ? (
            renderSkeleton()
          ) : !labStats || (
            labStats.totalPosts === 0 && 
            labStats.totalFollowers === 0 && 
            labStats.totalComments === 0
          ) ? (
            renderNoDataPlaceholder()
          ) : (
            <>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Posts</CardDescription>
                    <CardTitle className="text-2xl">{labStats?.totalPosts || 0}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      <span>Content shared in the lab</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Followers</CardDescription>
                    <CardTitle className="text-2xl">{labStats?.totalFollowers || 0}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      <span>AI followers in the lab</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Comments</CardDescription>
                    <CardTitle className="text-2xl">{labStats?.totalComments || 0}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      <span>Comments on lab posts</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Average Response Time</CardDescription>
                    <CardTitle className="text-2xl">
                      {labStats?.avgResponseTime ? `${labStats.avgResponseTime.toFixed(1)}s` : "N/A"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>Time to first response</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Engagement by Post</CardTitle>
                  <CardDescription>
                    Total interactions per post
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {engagementChartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <BarChart3 className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">No engagement data available yet</p>
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={engagementChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="interactions" fill="#8884d8" name="Interactions" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </TabsContent>
      
      {/* Posts Tab */}
      <TabsContent value="posts">
        <Card>
          <CardHeader>
            <CardTitle>Post Performance</CardTitle>
            <CardDescription>
              How followers are engaging with each post
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPostStats ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : postStats.length === 0 ? (
              renderNoDataPlaceholder()
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Post</TableHead>
                      <TableHead className="w-[100px]">Comments</TableHead>
                      <TableHead className="w-[100px]">Likes</TableHead>
                      <TableHead className="w-[120px]">Total</TableHead>
                      <TableHead className="w-[120px]">Response Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postStats.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <div className="line-clamp-1 font-medium">{post.content}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatRelativeTime(post.postedAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MessageSquare className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <span>{post.commentCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <ThumbsUp className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <span>{post.likeCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {post.totalInteractions}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {post.responseTime > 0 ? (
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>{post.responseTime.toFixed(1)}s</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Followers Tab */}
      <TabsContent value="followers">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Follower Engagement</CardTitle>
              <CardDescription>
                How followers are interacting with lab posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFollowerStats ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : followerStats.length === 0 ? (
                renderNoDataPlaceholder()
              ) : (
                <div className="space-y-6">
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Follower</TableHead>
                          <TableHead className="w-[100px]">Comments</TableHead>
                          <TableHead className="w-[100px]">Likes</TableHead>
                          <TableHead className="w-[120px]">Total</TableHead>
                          <TableHead className="w-[120px]">Avg Response</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {followerStats.map((follower) => (
                          <TableRow key={follower.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-medium text-muted-foreground">
                                  {follower.avatar ? (
                                    <img 
                                      src={follower.avatar} 
                                      alt={follower.name} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    follower.name.substring(0, 2).toUpperCase()
                                  )}
                                </div>
                                <span>{follower.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <MessageSquare className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                <span>{follower.commentCount}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <ThumbsUp className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                <span>{follower.likeCount}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {follower.totalInteractions}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {follower.avgResponseTime > 0 ? (
                                <div className="flex items-center">
                                  <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                  <span>{follower.avgResponseTime.toFixed(1)}s</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">N/A</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Follower Engagement Chart</CardTitle>
                      <CardDescription>
                        Comparing engagement across followers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {followerEngagementData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <BarChart3 className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p className="text-muted-foreground">No follower data available yet</p>
                        </div>
                      ) : (
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={followerEngagementData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="comments" fill="#8884d8" name="Comments" />
                              <Bar dataKey="likes" fill="#82ca9d" name="Likes" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}