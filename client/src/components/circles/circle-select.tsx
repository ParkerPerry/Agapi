import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Circle } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Globe } from "lucide-react";
import { formatRelativeTime } from "@/utils/date";

interface CircleSelectProps {
  onCircleSelect: (circle: Circle) => void;
  selectedCircleId?: number;
}

export function CircleSelect({ onCircleSelect, selectedCircleId }: CircleSelectProps) {
  const [selectedId, setSelectedId] = useState<number | undefined>(selectedCircleId);
  
  // Fetch available circles
  const { data: circles = [], isLoading } = useQuery<Circle[]>({
    queryKey: ["/api/circles"],
    queryFn: async () => {
      return await apiRequest("/api/circles");
    },
  });
  
  // Handle circle selection
  const handleSelect = (value: string) => {
    const circleId = parseInt(value, 10);
    setSelectedId(circleId);
    
    const selectedCircle = circles.find(circle => circle.id === circleId);
    if (selectedCircle) {
      onCircleSelect(selectedCircle);
    }
  };
  
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Select 
            value={selectedId?.toString()} 
            onValueChange={handleSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a circle" />
            </SelectTrigger>
            <SelectContent>
              {circles.map((circle) => (
                <SelectItem key={circle.id} value={circle.id.toString()}>
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage 
                        src={circle.icon || ""} 
                        alt={circle.name} 
                      />
                      <AvatarFallback 
                        className="bg-primary/10 text-primary text-xs"
                        style={{ backgroundColor: circle.color || "#f3f4f6" }}
                      >
                        {circle.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {circle.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedId && (
            <Card className="overflow-hidden">
              <div className="h-1 bg-primary" />
              <CardContent className="pt-4">
                {circles
                  .filter(circle => circle.id === selectedId)
                  .map((circle) => (
                    <div key={circle.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage 
                              src={circle.icon || ""} 
                              alt={circle.name} 
                            />
                            <AvatarFallback 
                              className="bg-primary/10 text-primary"
                              style={{ backgroundColor: circle.color || "#f3f4f6" }}
                            >
                              {circle.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{circle.name}</h3>
                            {circle.description && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {circle.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {circle.visibility === "private" ? (
                            <Lock className="h-3 w-3 mr-1" />
                          ) : (
                            <Globe className="h-3 w-3 mr-1" />
                          )}
                          {circle.visibility === "private" ? "Private" : "Shared"}
                        </Badge>
                      </div>
                      
                      {circle.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          Created {formatRelativeTime(circle.createdAt)}
                        </p>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}