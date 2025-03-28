import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Circle } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { CircleSelect } from "./circle-select";
import { CircleFollowerManager } from "./circle-follower-manager";
import { CircleCreateForm } from "./circle-create-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { CirclePlus, Loader2 } from "lucide-react";

interface CircleFollowerManagerWrapperProps {
  selectedCircleId?: number | null;
  onCircleSelect?: (circle: Circle) => void;
  readOnly?: boolean;
}

export function CircleFollowerManagerWrapper({ 
  selectedCircleId,
  onCircleSelect,
  readOnly = false 
}: CircleFollowerManagerWrapperProps) {
  const [activeTab, setActiveTab] = useState<string>("select");
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  
  // Fetch the selected circle if ID is provided
  const { 
    data: fetchedCircle,
    isLoading: isLoadingCircle 
  } = useQuery<Circle>({
    queryKey: [`/api/circles/${selectedCircleId}`],
    queryFn: async () => {
      return await apiRequest(`/api/circles/${selectedCircleId}`);
    },
    enabled: !!selectedCircleId,
    onSuccess: (data) => {
      setSelectedCircle(data);
    }
  });
  
  // Handle circle selection
  const handleCircleSelect = (circle: Circle) => {
    setSelectedCircle(circle);
    
    // Call parent handler if provided
    if (onCircleSelect) {
      onCircleSelect(circle);
    }
  };
  
  // Handle circle creation
  const handleCircleCreated = (circle: Circle) => {
    setSelectedCircle(circle);
    setActiveTab("select"); // Switch back to select tab
    
    // Call parent handler if provided
    if (onCircleSelect) {
      onCircleSelect(circle);
    }
  };
  
  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle>Circle Management</CardTitle>
        <CardDescription>
          Select an existing circle or create a new one for your lab.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingCircle ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {!readOnly && (
              <Tabs
                defaultValue="select"
                value={activeTab}
                onValueChange={setActiveTab}
                className="mb-6"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="select">Select Circle</TabsTrigger>
                  <TabsTrigger value="create">
                    <CirclePlus className="h-4 w-4 mr-2" />
                    Create New
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="select" className="mt-4">
                  <CircleSelect
                    onCircleSelect={handleCircleSelect}
                    selectedCircleId={selectedCircle?.id}
                  />
                </TabsContent>
                <TabsContent value="create" className="mt-4">
                  <CircleCreateForm
                    onCircleCreated={handleCircleCreated}
                  />
                </TabsContent>
              </Tabs>
            )}
            
            {selectedCircle ? (
              <div className="mt-4">
                <CircleFollowerManager
                  circle={selectedCircle}
                  readOnly={readOnly}
                />
              </div>
            ) : (
              <div className="p-6 text-center bg-muted/30 rounded-md">
                <p className="text-muted-foreground">
                  {readOnly 
                    ? "No circle selected." 
                    : "Select or create a circle above to manage followers."}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}