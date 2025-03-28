import { formatRelativeTime } from "@/utils/date";
import { useLocation } from "wouter";
import { CircleIcon, PlayIcon, ClockIcon, UsersIcon, CheckCircleIcon } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Lab {
  id: number;
  name: string;
  description: string | null;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
  status: "draft" | "active" | "completed";
  userId: number;
  circleId: number;
  circleName?: string;
  followerCount?: number;
  postCount?: number;
}

interface LabCardProps {
  lab: Lab;
}

export function LabCard({ lab }: LabCardProps) {
  const [, setLocation] = useLocation();
  
  // Handle click to view lab details
  const handleViewLab = () => {
    setLocation(`/labs/${lab.id}`);
  };
  
  // Determine status badge color
  const getStatusBadge = () => {
    switch (lab.status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "completed":
        return <Badge variant="secondary"><CheckCircleIcon className="h-3 w-3 mr-1" /> Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  return (
    <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{lab.name}</CardTitle>
          {getStatusBadge()}
        </div>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
          {lab.description || "No description provided."}
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          {lab.circleName && (
            <div className="flex items-center text-sm">
              <CircleIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Circle: {lab.circleName}</span>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center text-sm">
              <UsersIcon className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{lab.followerCount || 0} Followers</span>
            </div>
            
            <div className="flex items-center text-sm">
              <PlayIcon className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>{lab.postCount || 0} Posts</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <ClockIcon className="h-3 w-3 mr-1" />
          {lab.createdAt ? formatRelativeTime(lab.createdAt) : "Unknown date"}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleViewLab}
        >
          View Lab
        </Button>
      </CardFooter>
    </Card>
  );
}