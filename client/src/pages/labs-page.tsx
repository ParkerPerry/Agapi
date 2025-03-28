import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import LabCreateWizard from "@/components/labs/lab-create-wizard";
import LabCard from "@/components/labs/lab-card";
import { Lab } from "@shared/schema";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
// Note: Using the standard layout from other pages

const LabsPage = () => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "draft" | "completed" | "archived">("all");

  // Fetch labs
  const {
    data: labs,
    isLoading,
    error,
    refetch: refetchLabs,
  } = useQuery<Lab[]>({
    queryKey: ["/api/labs"],
  });

  const handleCreateSuccess = () => {
    refetchLabs();
    toast({
      title: "Lab created",
      description: "Your new experiment lab has been created successfully.",
    });
  };

  const handleLabUpdate = () => {
    refetchLabs();
  };

  // Filter labs based on active tab
  const filteredLabs = labs?.filter((lab) => {
    if (activeTab === "all") return true;
    return lab.status === activeTab;
  });

  // Count labs by status
  const labCounts = {
    all: labs?.length || 0,
    active: labs?.filter((lab) => lab.status === "active").length || 0,
    draft: labs?.filter((lab) => lab.status === "draft").length || 0,
    completed: labs?.filter((lab) => lab.status === "completed").length || 0,
    archived: labs?.filter((lab) => lab.status === "archived").length || 0,
  };

  return (
    <>
      <div className="container py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Content Labs</h1>
            <p className="text-muted-foreground">
              Experiment with different content strategies and measure their impact
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Lab
          </Button>
        </div>

        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="all">
              All ({labCounts.all})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({labCounts.active})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft ({labCounts.draft})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({labCounts.completed})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({labCounts.archived})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              // Loading state
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              // Error state
              <div className="text-center py-8">
                <p className="text-lg text-destructive">
                  Failed to load labs. Please try again.
                </p>
                <Button
                  variant="outline"
                  onClick={() => refetchLabs()}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            ) : filteredLabs?.length === 0 ? (
              // No labs state
              <div className="text-center py-12 border rounded-md bg-muted/20">
                <h3 className="text-lg font-medium mb-2">No labs found</h3>
                {activeTab === "all" ? (
                  <p className="text-muted-foreground mb-4">
                    Create your first content experiment lab to get started.
                  </p>
                ) : (
                  <p className="text-muted-foreground mb-4">
                    No labs with '{activeTab}' status. Switch tabs to see other labs.
                  </p>
                )}
                {activeTab === "all" && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Lab
                  </Button>
                )}
              </div>
            ) : (
              // Labs grid
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLabs?.map((lab) => (
                  <LabCard
                    key={lab.id}
                    lab={lab}
                    onUpdate={handleLabUpdate}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <LabCreateWizard
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default LabsPage;