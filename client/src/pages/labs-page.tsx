import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LabCard } from "@/components/labs/lab-card";
import { Container } from "@/components/ui/container";

export function LabsPage() {
  const [, navigate] = useLocation();
  
  // Fetch labs
  const { data: labs = [], isLoading } = useQuery({
    queryKey: ["/api/labs"],
    queryFn: async () => {
      // Placeholder for development until the backend API is ready
      try {
        return await apiRequest("/api/labs");
      } catch (error) {
        // Return empty array for now to allow UI development
        return [];
      }
    },
  });
  
  // Handle create new lab
  const handleCreateLab = () => {
    navigate("/labs/create");
  };
  
  return (
    <Container>
      <PageHeader
        title="Labs"
        description="Create and manage experiments with AI followers"
        action={{
          label: "New Lab",
          onClick: handleCreateLab,
          icon: <Plus className="h-4 w-4 mr-2" />,
        }}
      />
      
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[350px] rounded-xl" />
          ))
        ) : labs.length === 0 ? (
          // Empty state
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-10 w-10 text-muted-foreground"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-semibold">No labs yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              Create your first lab to start experimenting with AI followers. Labs allow you to set up controlled environments to test interactions.
            </p>
            <Button 
              onClick={handleCreateLab} 
              className="mt-6"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Lab
            </Button>
          </div>
        ) : (
          // Lab cards
          labs.map((lab) => (
            <LabCard key={lab.id} lab={lab} />
          ))
        )}
      </div>
    </Container>
  );
}