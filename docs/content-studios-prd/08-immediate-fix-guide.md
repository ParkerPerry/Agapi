# Immediate Fix Guide for Content Studios Feature Error

## Current Issue

Based on the error logs, there's an immediate issue preventing the Content Studios feature from functioning:

```
[Storage] Error adding studio to content test: ReferenceError: studioTables is not defined
    at DatabaseStorage.addStudioToContentTest (/home/runner/workspace/server/storage.ts:1295:17)
```

## Root Cause

The error occurs because the `studioTables` table is referenced in the implementation, but it hasn't been defined in the database schema yet. This table is essential for associating studios with content tests in the experiments.

## Recommended Fix

### 1. Update Schema

First, add the missing `contentTests` and `studioTables` tables to `shared/schema.ts`:

```typescript
// Content testing tables
export const contentTests = pgTable("content_tests", {
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

// Join table for content tests and studios (circles)
export const studioTables = pgTable("studio_tables", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").references(() => contentTests.id).notNull(),
  studioId: integer("studio_id").references(() => circles.id).notNull(),
  role: text("role", { 
    enum: ["control", "experimental", "observation"] 
  }).default("experimental").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Add relations
export const contentTestsRelations = relations(contentTests, ({ one, many }) => ({
  owner: one(users, {
    fields: [contentTests.userId],
    references: [users.id],
  }),
  studios: many(studioTables),
}));

export const studioTablesRelations = relations(studioTables, ({ one }) => ({
  test: one(contentTests, {
    fields: [studioTables.testId],
    references: [contentTests.id],
  }),
  studio: one(circles, {
    fields: [studioTables.studioId],
    references: [circles.id],
  }),
}));

// Create insert schemas
export const insertContentTestSchema = createInsertSchema(contentTests).pick({
  name: true,
  description: true,
});

export const insertStudioTableSchema = createInsertSchema(studioTables).pick({
  testId: true,
  studioId: true,
  role: true,
});

// Export types
export type ContentTest = typeof contentTests.$inferSelect;
export type InsertContentTest = z.infer<typeof insertContentTestSchema>;
export type StudioTable = typeof studioTables.$inferSelect;
export type InsertStudioTable = z.infer<typeof insertStudioTableSchema>;
```

### 2. Update Storage Implementation

Next, ensure the `DatabaseStorage` class in `server/storage.ts` implements the necessary methods:

```typescript
// Add these methods to the IStorage interface
interface IStorage {
  // ... existing methods
  
  // Content Test methods
  createContentTest(userId: number, test: InsertContentTest): Promise<ContentTest>;
  getContentTest(id: number): Promise<ContentTest | undefined>;
  getUserContentTests(userId: number): Promise<ContentTest[]>;
  updateContentTest(id: number, updates: Partial<InsertContentTest>): Promise<ContentTest>;
  deleteContentTest(id: number): Promise<void>;
  
  // Studio Table methods
  addStudioToContentTest(testId: number, studioId: number, role?: string): Promise<StudioTable>;
  removeStudioFromContentTest(testId: number, studioId: number): Promise<void>;
  getContentTestStudios(testId: number): Promise<(Circle & { role: string })[]>;
}

// Implement the methods in DatabaseStorage class
async createContentTest(userId: number, test: InsertContentTest): Promise<ContentTest> {
  try {
    console.log("[Storage] Creating content test for user:", userId);
    const [newTest] = (await db
      .insert(contentTests)
      .values({ ...test, userId })
      .returning()) as ContentTest[];
    
    console.log("[Storage] Created content test:", newTest.id);
    return newTest;
  } catch (error) {
    console.error("[Storage] Error creating content test:", error);
    throw error;
  }
}

async getContentTest(id: number): Promise<ContentTest | undefined> {
  try {
    const [test] = await db
      .select()
      .from(contentTests)
      .where(eq(contentTests.id, id));
    
    return test;
  } catch (error) {
    console.error("[Storage] Error getting content test:", error);
    throw error;
  }
}

async getUserContentTests(userId: number): Promise<ContentTest[]> {
  try {
    console.log("[Storage] Getting content tests for user:", userId);
    const userTests = await db
      .select()
      .from(contentTests)
      .where(eq(contentTests.userId, userId))
      .orderBy(desc(contentTests.createdAt));
    
    console.log("[Storage] Retrieved content tests count:", userTests.length);
    return userTests;
  } catch (error) {
    console.error("[Storage] Error getting user content tests:", error);
    throw error;
  }
}

async addStudioToContentTest(testId: number, studioId: number, role: string = "experimental"): Promise<StudioTable> {
  try {
    console.log("[Storage] Adding studio to content test. TestId:", testId, "StudioId:", studioId);
    const [studioTable] = (await db
      .insert(studioTables)
      .values({ 
        testId, 
        studioId, 
        role: role as any 
      })
      .returning()) as StudioTable[];
    
    return studioTable;
  } catch (error) {
    console.error("[Storage] Error adding studio to content test:", error);
    throw error;
  }
}

async getContentTestStudios(testId: number): Promise<(Circle & { role: string })[]> {
  try {
    const results = await db
      .select({
        ...circles,
        role: studioTables.role
      })
      .from(studioTables)
      .innerJoin(circles, eq(circles.id, studioTables.studioId))
      .where(eq(studioTables.testId, testId));
    
    return results as (Circle & { role: string })[];
  } catch (error) {
    console.error("[Storage] Error getting content test studios:", error);
    throw error;
  }
}
```

### 3. Update API Routes

Finally, ensure the API routes in `server/routes.ts` properly handle the Content Studios endpoints:

```typescript
// Content Studios endpoints
app.get("/api/content-tests", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const tests = await storage.getUserContentTests(userId);
    res.json(tests);
  } catch (error) {
    console.error("Error getting content tests:", error);
    res.status(500).json({ message: "Failed to get content tests" });
  }
});

app.post("/api/content-tests", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const testData = insertContentTestSchema.parse(req.body);
    
    // Create the content test
    const test = await storage.createContentTest(userId, testData);
    
    // If a studio ID was provided, add it to the content test
    if (req.body.studioId) {
      await storage.addStudioToContentTest(test.id, req.body.studioId);
    }
    
    res.status(201).json(test);
  } catch (error) {
    console.error("Error creating content test:", error);
    res.status(500).json({ message: "Failed to create content test" });
  }
});
```

### 4. Run Direct SQL Commands

After implementing these changes, use direct SQL commands to create the new tables. The `db:push` command is destructive and should not be used. Instead, execute the following SQL commands:

```sql
-- Create content_tests table
CREATE TABLE IF NOT EXISTS content_tests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create studio_tables table
CREATE TABLE IF NOT EXISTS studio_tables (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES content_tests(id),
  studio_id INTEGER NOT NULL REFERENCES circles(id),
  role TEXT NOT NULL DEFAULT 'experimental' CHECK (role IN ('control', 'experimental', 'observation')),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_tests_user_id ON content_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_tables_test_id ON studio_tables(test_id);
CREATE INDEX IF NOT EXISTS idx_studio_tables_studio_id ON studio_tables(studio_id);
```

These SQL commands will create the necessary tables without risking existing data.

## Testing the Fix

After implementing the fixes:

1. Restart the application
2. Navigate to the Content Studios section
3. Attempt to create a new content test
4. Try adding a studio to a test

The error should be resolved, and the basic Content Studios functionality should now work correctly.