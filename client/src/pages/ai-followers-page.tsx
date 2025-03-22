import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { AiFollower } from "@shared/schema";
import { useState, useMemo } from "react";
import { FollowerCreateForm } from "@/components/followers/follower-create-form";
import { FollowerCard } from "@/components/followers/follower-card";
import { useUpdateFollower, useDeleteFollower } from "@/lib/mutations/follower-mutations";
import { TourProvider } from "@/components/tour/tour-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AiFollowersPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [personalityFilter, setPersonalityFilter] = useState<string>("");

  // Redirect to login if no user
  if (!user) {
    return null;
  }

  const { data: followers, isLoading } = useQuery<AiFollower[]>({
    queryKey: ["/api/followers"],
    enabled: !!user,
  });

  const updateFollowerMutation = useUpdateFollower();
  const deleteFollowerMutation = useDeleteFollower();

  // Filter and search followers
  const filteredFollowers = useMemo(() => {
    if (!followers) return [];
    
    return followers.filter(follower => {
      // Status filter
      if (statusFilter === "active" && !follower.active) return false;
      if (statusFilter === "inactive" && follower.active) return false;
      
      // Search query filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const nameMatch = follower.name.toLowerCase().includes(query);
        const personalityMatch = follower.personality.toLowerCase().includes(query);
        if (!nameMatch && !personalityMatch) return false;
      }
      
      return true;
    });
  }, [followers, searchQuery, statusFilter]);

  // Function to clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPersonalityFilter("");
  };

  return (
    <TourProvider>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-4 px-2 md:px-4">
          <div className="space-y-4 max-w-full">
            <Card>
              <CardHeader>
                <CardTitle>Create AI Follower</CardTitle>
              </CardHeader>
              <CardContent>
                <FollowerCreateForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle>AI Followers</CardTitle>
                  
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search followers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-full"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select
                        value={statusFilter}
                        onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={clearFilters}
                        title="Clear filters"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Display filter badges */}
                {(searchQuery || statusFilter !== "all") && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="text-sm text-muted-foreground">Filters:</div>
                    {searchQuery && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        Search: "{searchQuery}"
                      </Badge>
                    )}
                    {statusFilter !== "all" && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        Status: {statusFilter}
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading followers...</div>
                ) : filteredFollowers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {followers?.length ? "No followers match your filters" : "No followers found. Create one to get started!"}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredFollowers.map((follower) => (
                      <FollowerCard
                        key={follower.id}
                        follower={follower}
                        onEdit={(updatedFollower) => {
                          updateFollowerMutation.mutate({
                            id: updatedFollower.id,
                            name: updatedFollower.name,
                            personality: updatedFollower.personality,
                            responsiveness: updatedFollower.responsiveness,
                          });
                        }}
                        onToggleActive={(followerId) => {
                          deleteFollowerMutation.mutate(followerId);
                        }}
                        isUpdating={deleteFollowerMutation.isPending}
                      />
                    ))}
                  </div>
                )}
                
                {/* Results count indicator */}
                <div className="text-xs text-muted-foreground mt-4 text-right">
                  {filteredFollowers.length} followers {filteredFollowers.length !== followers?.length && `(out of ${followers?.length})`}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </TourProvider>
  );
}