import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InsertCircle } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useCreateCircle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertCircle) => {
      const res = await apiRequest("POST", "/api/circles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      toast({
        title: "Circle created",
        description: "Your new circle has been created successfully.",
      });
    },
  });
}

export function useDeleteCircle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (circleId: number) => {
      await apiRequest("DELETE", `/api/circles/${circleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      toast({
        title: "Circle deleted",
        description: "Your circle has been deleted successfully.",
      });
    },
  });
}

export function useRespondToInvitation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invitationId,
      status,
    }: {
      invitationId: number;
      status: "accepted" | "declined";
    }) => {
      const res = await apiRequest("PATCH", `/api/circles/invitations/${invitationId}`, {
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles/invitations/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      toast({
        title: "Invitation response sent",
        description: "Your response has been recorded.",
      });
    },
  });
}

export function useDeactivateCircleMember() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ circleId, userId }: { circleId: number; userId: number }) => {
      await apiRequest(
        "POST",
        `/api/circles/${circleId}/members/${userId}/deactivate`
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/circles/${variables.circleId}/details`] 
      });
      toast({
        title: "Member deactivated",
        description: "The member has been deactivated from this circle.",
      });
    },
  });
}

export function useReactivateCircleMember() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ circleId, userId }: { circleId: number; userId: number }) => {
      await apiRequest(
        "POST",
        `/api/circles/${circleId}/members/${userId}/reactivate`
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/circles/${variables.circleId}/details`] 
      });
      toast({
        title: "Member reactivated",
        description: "The member has been reactivated in this circle.",
      });
    },
  });
}