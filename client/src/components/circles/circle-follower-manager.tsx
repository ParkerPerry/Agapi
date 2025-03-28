import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Circle, AiFollower, CircleMember } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Search, 
  UserRoundPlus, 
  UserRoundMinus, 
  Users, 
  Plus, 
  Filter 
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CircleFollowerManagerProps {
  circle: Circle;
  readOnly?: boolean;
}

export function CircleFollowerManager({ circle, readOnly = false }: CircleFollowerManagerProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedFollowerIds, setSelectedFollowerIds] = useState<number[]>([]);
  
  // Fetch current circle members (followers)
  const {
    data: circleMembers = [],
    isLoading: isLoadingMembers,
    refetch: refetchMembers
  } = useQuery<CircleMember[]>({
    queryKey: [`/api/circles/${circle.id}/members`],
    queryFn: async () => {
      return await apiRequest(`/api/circles/${circle.id}/members`);
    },
  });
  
  // Extract follower IDs from circle members
  const circleFollowerIds = circleMembers
    .filter(member => member.type === "ai_follower")
    .map(member => member.aiFollowerId)
    .filter((id): id is number => id !== null);
  
  // Fetch available AI followers
  const {
    data: followers = [],
    isLoading: isLoadingFollowers
  } = useQuery<AiFollower[]>({
    queryKey: ["/api/followers"],
    queryFn: async () => {
      return await apiRequest("/api/followers");
    },
  });
  
  // Filter followers that are not already in the circle
  const availableFollowers = followers.filter(
    follower => !circleFollowerIds.includes(follower.id)
  );
  
  // Further filter by search and category
  const filteredAvailableFollowers = availableFollowers.filter(follower => {
    const matchesSearch = 
      follower.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (follower.personality && follower.personality.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = 
      filterCategory === "all" || 
      (follower.category && follower.category === filterCategory);
    
    return matchesSearch && matchesCategory;
  });
  
  // Extract unique categories for the filter dropdown
  const followerCategories = Array.from(
    new Set(followers.map(f => f.category).filter(Boolean))
  );
  
  // Mutation for adding followers to circle
  const addFollowersMutation = useMutation({
    mutationFn: async (followerIds: number[]) => {
      return await apiRequest(`/api/circles/${circle.id}/followers`, "POST", { followerIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${circle.id}/members`] });
      setSelectedFollowerIds([]);
      toast({
        title: "Followers added",
        description: `${selectedFollowerIds.length} followers have been added to the circle.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add followers to the circle.",
        variant: "destructive"
      });
    }
  });
  
  // Mutation for removing a follower from circle
  const removeFollowerMutation = useMutation({
    mutationFn: async (followerId: number) => {
      return await apiRequest(`/api/circles/${circle.id}/followers/${followerId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${circle.id}/members`] });
      toast({
        title: "Follower removed",
        description: "The follower has been removed from the circle.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove follower from the circle.",
        variant: "destructive"
      });
    }
  });
  
  // Handle follower selection
  const handleFollowerSelect = (followerId: number) => {
    setSelectedFollowerIds(prev => {
      if (prev.includes(followerId)) {
        return prev.filter(id => id !== followerId);
      } else {
        return [...prev, followerId];
      }
    });
  };
  
  // Handle bulk add followers
  const handleAddFollowers = () => {
    if (selectedFollowerIds.length > 0) {
      addFollowersMutation.mutate(selectedFollowerIds);
    }
  };
  
  // Get circle followers with their full information
  const circleFollowers = circleMembers
    .filter(member => member.type === "ai_follower" && member.aiFollowerId)
    .map(member => {
      const follower = followers.find(f => f.id === member.aiFollowerId);
      return { ...member, follower };
    })
    .filter(member => member.follower);
  
  // Loading state
  if (isLoadingMembers || isLoadingFollowers) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Current Followers Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">
            Circle Followers ({circleFollowers.length})
          </h3>
        </div>
        
        {circleFollowers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                This circle has no AI followers yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {circleFollowers.map(member => (
              <Card key={member.id} className="overflow-hidden">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3"
                    >
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.follower?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.follower?.personality?.substring(0, 60)}
                        {member.follower?.personality && member.follower.personality.length > 60 ? "..." : ""}
                      </p>
                    </div>
                  </div>
                  
                  {!readOnly && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <UserRoundMinus className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove Follower
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {member.follower?.name} from this circle?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => removeFollowerMutation.mutate(member.aiFollowerId!)}
                          >
                            {removeFollowerMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Followers Section */}
      {!readOnly && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">
              Add Followers to Circle
            </h3>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAddFollowers}
              disabled={selectedFollowerIds.length === 0 || addFollowersMutation.isPending}
            >
              {addFollowersMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserRoundPlus className="h-4 w-4 mr-2" />
              )}
              Add Selected ({selectedFollowerIds.length})
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search followers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex-shrink-0 w-full md:w-auto">
              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {followerCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredAvailableFollowers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  No followers found matching your criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredAvailableFollowers.map(follower => (
                <Card key={follower.id} className="overflow-hidden">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <Checkbox 
                        id={`follower-${follower.id}`}
                        checked={selectedFollowerIds.includes(follower.id)}
                        onCheckedChange={() => handleFollowerSelect(follower.id)}
                        className="mr-3"
                      />
                      <div>
                        <label 
                          htmlFor={`follower-${follower.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {follower.name}
                        </label>
                        <div className="flex items-center text-xs text-muted-foreground">
                          {follower.category && (
                            <Badge variant="outline" className="mr-2 text-xs">
                              {follower.category}
                            </Badge>
                          )}
                          <p>
                            {follower.personality?.substring(0, 60)}
                            {follower.personality && follower.personality.length > 60 ? "..." : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}