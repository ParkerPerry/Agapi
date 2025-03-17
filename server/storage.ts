async getPostPendingResponses(postId: number): Promise<PendingResponse[]> {
    console.log("[Storage] Getting pending responses for post:", postId);

    try {
      const responses = await db
        .select()
        .from(pendingResponses)
        .where(
          eq(pendingResponses.postId, postId) &&
          eq(pendingResponses.processed, false)
        )
        .orderBy(pendingResponses.scheduledFor);

      console.log("[Storage] Found pending responses for post", postId, ":", responses);
      return responses;
    } catch (error) {
      console.error("[Storage] Error getting post pending responses:", error);
      throw error;
    }
  }
