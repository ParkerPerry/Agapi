import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleFollowerManager } from "@/components/circles/circle-follower-manager";
import { useCircleFollowers } from "@/lib/queries/circle-queries";

interface CircleManagementComponentProps {
  circleId: number;
}

/**
 * A wrapper component that adapts the existing CircleFollowerManager component
 * for use in the Lab context. This allows reusing the existing follower management
 * functionality while providing a slightly different UI and behavior specific to labs.
 */
export function CircleManagementComponent({ circleId }: CircleManagementComponentProps) {
  const [isManaging, setIsManaging] = useState(false);
  const { data: followers, isLoading } = useCircleFollowers(circleId);
  const [followerCount, setFollowerCount] = useState(0);
  
  useEffect(() => {
    if (followers && Array.isArray(followers)) {
      setFollowerCount(followers.length);
    }
  }, [followers]);
  
  if (!circleId) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-md">
        <p className="text-muted-foreground">Please select a circle first</p>
      </div>
    );
  }
  
  return (
    <div>
      {isManaging ? (
        <div className="space-y-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsManaging(false)}
            className="mb-4"
          >
            ← Back to Summary
          </Button>
          
          <CircleFollowerManager 
            circleId={circleId} 
            onSuccess={() => {
              // Refresh follower count or handle success
            }}
          />
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? "..." : followerCount}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">Personality Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? "..." : "Varied"}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">Responsiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? "..." : "Mixed"}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Button 
            onClick={() => setIsManaging(true)} 
            className="w-full"
          >
            Manage Circle Followers
          </Button>
          
          {followerCount === 0 && !isLoading && (
            <div className="mt-4 p-4 bg-amber-50 text-amber-600 rounded-md">
              <p className="text-sm font-medium">No AI followers in this circle</p>
              <p className="text-xs mt-1">
                Click "Manage Circle Followers" to add AI followers to this experiment.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}