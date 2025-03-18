import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Circle, CircleInvitation } from "@shared/schema";
import { TourProvider } from "@/components/tour/tour-context";
import { CircleCard } from "@/components/circles/circle-card";
import { CircleCreateForm } from "@/components/circles/circle-create-form";
import { CircleInvitationsList } from "@/components/circles/circle-invitations-list";
import { useDeleteCircle } from "@/lib/mutations/circle-mutations";
import { useLocation } from "wouter";

type CircleGroups = {
  private: Circle[];
  shared: Circle[];
  sharedWithYou: Circle[];
  invited: Circle[];
};

export default function CirclesPage() {
  const { user } = useAuth();
  const deleteCircleMutation = useDeleteCircle();
  const [, navigate] = useLocation();

  if (!user) {
    return null;
  }

  const { data: circles, isLoading: isLoadingCircles } = useQuery<CircleGroups>({
    queryKey: ["/api/circles"],
    enabled: !!user,
  });

  const { data: invitations } = useQuery<CircleInvitation[]>({
    queryKey: ["/api/circles/invitations/pending"],
    enabled: !!user,
  });

  const renderCircleSection = (title: string, circleList: Circle[] = [], showShareButton = true) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {circleList.map((circle) => (
            <CircleCard
              key={circle.id}
              circle={circle}
              onDelete={deleteCircleMutation.mutate}
              isDeleting={deleteCircleMutation.isPending}
              showShareButton={showShareButton}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <TourProvider>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {invitations && invitations.length > 0 && (
              <CircleInvitationsList invitations={invitations} />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Create Circle</CardTitle>
              </CardHeader>
              <CardContent>
                <CircleCreateForm />
              </CardContent>
            </Card>

            {circles?.private && renderCircleSection("Private Circles", circles.private)}
            {circles?.shared && renderCircleSection("Shared Circles", circles.shared)}
            {circles?.sharedWithYou && renderCircleSection("Circles Shared with You", circles.sharedWithYou, false)}
            {circles?.invited && renderCircleSection("Invited Circles", circles.invited, false)}

          </div>
        </main>
      </div>
    </TourProvider>
  );
}