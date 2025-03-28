import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Lab } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { 
  Button 
} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  CalendarClock,
  ChevronRight, 
  MoreVertical, 
  MessageSquare, 
  Users,
  FlaskConical,
  PlayCircle,
  Pencil,
  Trash2 
} from "lucide-react";
import { formatRelativeTime } from "@/utils/date";

interface LabCardProps {
  lab: Lab;
}

export function LabCard({ lab }: LabCardProps) {
  const [, navigate] = useLocation();
  
  // Fetch additional lab data (extended stats)
  const { data: labExtended } = useQuery({
    queryKey: [`/api/labs/${lab.id}/stats`],
    queryFn: async () => {
      try {
        return await apiRequest(`/api/labs/${lab.id}/stats`);
      } catch (error) {
        // Return empty stats if endpoint doesn't exist yet
        return {
          followerCount: 0,
          postCount: 0,
          commentCount: 0,
          likeCount: 0
        };
      }
    },
  });
  
  // Handle card click
  const handleCardClick = () => {
    navigate(`/labs/${lab.id}`);
  };
  
  // Handle view details
  const handleViewDetails = () => {
    navigate(`/labs/${lab.id}`);
  };
  
  // Handle edit
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/labs/${lab.id}`);
  };
  
  // Handle delete
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Delete will be implemented when backend API is ready
  };
  
  // Get status badge styling
  const getStatusBadge = () => {
    switch (lab.status) {
      case "draft":
        return "bg-muted text-muted-foreground";
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  
  // Get status label
  const getStatusLabel = () => {
    switch (lab.status) {
      case "draft":
        return "Draft";
      case "active":
        return "Running";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };
  
  // Calculate extended numbers with fallbacks
  const postCount = labExtended?.postCount || 0;
  const followerCount = labExtended?.followerCount || 0;
  
  return (
    <Card 
      className="hover:border-primary/50 cursor-pointer transition-all"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div className="space-y-1">
            <CardTitle>{lab.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {lab.description || "No description provided"}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" className="h-8 w-8 p-0" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleViewDetails}>
                <ChevronRight className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Lab
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete} 
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Lab
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex space-x-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            <CalendarClock className="mr-1 h-3 w-3" />
            <span>{formatRelativeTime(lab.createdAt || new Date())}</span>
          </div>
          <div className="flex items-center">
            <FlaskConical className="mr-1 h-3 w-3" />
            <span>{getStatusLabel()}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-2">
            <Users className="h-4 w-4 mb-1 text-muted-foreground" />
            <span className="text-xl font-medium">{followerCount}</span>
            <span className="text-xs text-muted-foreground">Followers</span>
          </div>
          
          <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-2">
            <MessageSquare className="h-4 w-4 mb-1 text-muted-foreground" />
            <span className="text-xl font-medium">{postCount}</span>
            <span className="text-xs text-muted-foreground">Posts</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t p-4 pt-4">
        <div 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium me-2 ${getStatusBadge()}`}
        >
          {getStatusLabel()}
        </div>
        
        {lab.status === "draft" && (
          <Button size="sm" variant="outline" className="ml-auto" onClick={handleEdit}>
            <PlayCircle className="mr-1 h-3.5 w-3.5" />
            Continue Setup
          </Button>
        )}
        
        {lab.status !== "draft" && (
          <Button size="sm" variant="outline" className="ml-auto" onClick={handleViewDetails}>
            <ChevronRight className="mr-1 h-3.5 w-3.5" />
            View Results
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}