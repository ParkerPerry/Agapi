# Immediate Fix Guide for Labs Feature Error

## Current Issue

Based on the error logs, there's an immediate issue preventing the Labs feature from functioning:

```
[Storage] Error adding circle to lab: ReferenceError: labCircles is not defined
    at DatabaseStorage.addCircleToLab (/home/runner/workspace/server/storage.ts:1295:17)
```

## Root Cause

The error occurs because the `labCircles` table is referenced in the implementation, but it hasn't been defined in the database schema yet. This table is essential for associating circles with labs in the experiments.

## Recommended Fix

### 1. Update Schema

First, add the missing `labs` and `labCircles` tables to `shared/schema.ts`:

```typescript
// Lab experiment tables
export const labs = pgTable("labs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", { 
    enum: ["draft", "active", "completed", "archived"] 
  }).default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Join table for labs and circles
export const labCircles = pgTable("lab_circles", {
  id: serial("id").primaryKey(),
  labId: integer("lab_id").references(() => labs.id).notNull(),
  circleId: integer("circle_id").references(() => circles.id).notNull(),
  role: text("role", { 
    enum: ["control", "treatment", "observation"] 
  }).default("treatment").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Add relations
export const labsRelations = relations(labs, ({ one, many }) => ({
  owner: one(users, {
    fields: [labs.userId],
    references: [users.id],
  }),
  circles: many(labCircles),
}));

export const labCirclesRelations = relations(labCircles, ({ one }) => ({
  lab: one(labs, {
    fields: [labCircles.labId],
    references: [labs.id],
  }),
  circle: one(circles, {
    fields: [labCircles.circleId],
    references: [circles.id],
  }),
}));

// Create insert schemas
export const insertLabSchema = createInsertSchema(labs).pick({
  name: true,
  description: true,
});

export const insertLabCircleSchema = createInsertSchema(labCircles).pick({
  labId: true,
  circleId: true,
  role: true,
});

// Export types
export type Lab = typeof labs.$inferSelect;
export type InsertLab = z.infer<typeof insertLabSchema>;
export type LabCircle = typeof labCircles.$inferSelect;
export type InsertLabCircle = z.infer<typeof insertLabCircleSchema>;
```

### 2. Update Storage Implementation

Next, ensure the `DatabaseStorage` class in `server/storage.ts` implements the necessary methods:

```typescript
// Add these methods to the IStorage interface
interface IStorage {
  // ... existing methods
  
  // Lab methods
  createLab(userId: number, lab: InsertLab): Promise<Lab>;
  getLab(id: number): Promise<Lab | undefined>;
  getUserLabs(userId: number): Promise<Lab[]>;
  updateLab(id: number, updates: Partial<InsertLab>): Promise<Lab>;
  deleteLab(id: number): Promise<void>;
  
  // Lab-Circle methods
  addCircleToLab(labId: number, circleId: number, role?: string): Promise<LabCircle>;
  removeCircleFromLab(labId: number, circleId: number): Promise<void>;
  getLabCircles(labId: number): Promise<(Circle & { role: string })[]>;
}

// Implement the methods in DatabaseStorage class
async createLab(userId: number, lab: InsertLab): Promise<Lab> {
  try {
    console.log("[Storage] Creating lab for user:", userId);
    const [newLab] = (await db
      .insert(labs)
      .values({ ...lab, userId })
      .returning()) as Lab[];
    
    console.log("[Storage] Created lab:", newLab.id);
    return newLab;
  } catch (error) {
    console.error("[Storage] Error creating lab:", error);
    throw error;
  }
}

async getLab(id: number): Promise<Lab | undefined> {
  try {
    const [lab] = await db
      .select()
      .from(labs)
      .where(eq(labs.id, id));
    
    return lab;
  } catch (error) {
    console.error("[Storage] Error getting lab:", error);
    throw error;
  }
}

async getUserLabs(userId: number): Promise<Lab[]> {
  try {
    console.log("[Storage] Getting labs for user:", userId);
    const userLabs = await db
      .select()
      .from(labs)
      .where(eq(labs.userId, userId))
      .orderBy(desc(labs.createdAt));
    
    console.log("[Storage] Retrieved labs count:", userLabs.length);
    return userLabs;
  } catch (error) {
    console.error("[Storage] Error getting user labs:", error);
    throw error;
  }
}

async addCircleToLab(labId: number, circleId: number, role: string = "treatment"): Promise<LabCircle> {
  try {
    console.log("[Storage] Adding circle to lab. LabId:", labId, "CircleId:", circleId);
    const [labCircle] = (await db
      .insert(labCircles)
      .values({ 
        labId, 
        circleId, 
        role: role as any 
      })
      .returning()) as LabCircle[];
    
    return labCircle;
  } catch (error) {
    console.error("[Storage] Error adding circle to lab:", error);
    throw error;
  }
}

async getLabCircles(labId: number): Promise<(Circle & { role: string })[]> {
  try {
    const results = await db
      .select({
        ...circles,
        role: labCircles.role
      })
      .from(labCircles)
      .innerJoin(circles, eq(circles.id, labCircles.circleId))
      .where(eq(labCircles.labId, labId));
    
    return results as (Circle & { role: string })[];
  } catch (error) {
    console.error("[Storage] Error getting lab circles:", error);
    throw error;
  }
}
```

### 3. Update API Routes

Finally, ensure the API routes in `server/routes.ts` properly handle the Labs endpoints:

```typescript
// Labs endpoints
app.get("/api/labs", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const labs = await storage.getUserLabs(userId);
    res.json(labs);
  } catch (error) {
    console.error("Error getting labs:", error);
    res.status(500).json({ message: "Failed to get labs" });
  }
});

app.post("/api/labs", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const labData = insertLabSchema.parse(req.body);
    
    // Create the lab
    const lab = await storage.createLab(userId, labData);
    
    // If a circle ID was provided, add it to the lab
    if (req.body.circleId) {
      await storage.addCircleToLab(lab.id, req.body.circleId);
    }
    
    res.status(201).json(lab);
  } catch (error) {
    console.error("Error creating lab:", error);
    res.status(500).json({ message: "Failed to create lab" });
  }
});
```

### 4. Run Direct SQL Commands

After implementing these changes, use direct SQL commands to create the new tables. The `db:push` command is destructive and should not be used. Instead, execute the following SQL commands:

```sql
-- Create labs table
CREATE TABLE IF NOT EXISTS labs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lab_circles table
CREATE TABLE IF NOT EXISTS lab_circles (
  id SERIAL PRIMARY KEY,
  lab_id INTEGER NOT NULL REFERENCES labs(id),
  circle_id INTEGER NOT NULL REFERENCES circles(id),
  role TEXT NOT NULL DEFAULT 'treatment' CHECK (role IN ('control', 'treatment', 'observation')),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_labs_user_id ON labs(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_circles_lab_id ON lab_circles(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_circles_circle_id ON lab_circles(circle_id);
```

These SQL commands will create the necessary tables without risking existing data.

## Testing the Fix

After implementing the fixes:

1. Restart the application
2. Navigate to the Labs section
3. Attempt to create a new lab
4. Try adding a circle to a lab

The error should be resolved, and the basic Labs functionality should now work correctly.