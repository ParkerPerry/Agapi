  // Add a circle to a lab
  app.post("/api/labs/:id/circles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const labId = parseInt(req.params.id);
      const { circleId, role } = req.body;

      if (!circleId) {
        return res.status(400).json({ message: "Circle ID is required" });
      }

      if (role && !["control", "treatment", "observation"].includes(role)) {
        return res.status(400).json({ message: "Invalid role value" });
      }

      const lab = await storage.getLab(labId);
      if (!lab) {
        return res.status(404).json({ message: "Lab not found" });
      }

      // Verify ownership of the lab
      if (lab.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized to access this lab" });
      }

      // Verify the user has permission to access the circle
      const hasPermission = await hasCirclePermission(circleId, req.user!.id, storage);
      if (!hasPermission) {
        return res.status(403).json({ message: "Unauthorized to access this circle" });
      }

      const labCircle = await storage.addCircleToLab(labId, circleId, role);
      
      // Grant appropriate access to the lab creator for this circle
      // based on the role of the circle in the lab
      const accessRole = role === "observation" ? "viewer" : "collaborator";
      
      try {
        console.log(`[API] Granting ${accessRole} access to user ${req.user!.id} for circle ${circleId}`);
        await storage.grantCircleAccessToUser(req.user!.id, circleId, accessRole);
      } catch (accessError) {
        console.error("[API] Error granting circle access:", accessError);
        // Continue even if access granting fails, as the circle was already added to the lab
      }
      
      res.status(201).json(labCircle);
    } catch (error) {
      console.error("[API] Error adding circle to lab:", error);
      res.status(500).json({ message: "Failed to add circle to lab" });
    }
  });