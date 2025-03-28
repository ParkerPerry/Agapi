# AI Labs Feature: Technical Implementation Plan

## Implementation Approach

This document outlines the technical implementation plan for the AI Labs feature, with a focus on practical, manageable implementation steps. The implementation will be divided into phases, with each phase building on the previous one and delivering specific functionality.

## Recommended Implementation Sequence

### Phase 1: Database Schema and Core API Implementation (2-3 weeks)

#### Database Implementation

**Key Task**: Create the necessary database tables using direct SQL commands (not `db:push`)

```sql
-- Labs table
CREATE TABLE IF NOT EXISTS labs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab-Circle association table
CREATE TABLE IF NOT EXISTS lab_circles (
  id SERIAL PRIMARY KEY,
  lab_id INTEGER NOT NULL REFERENCES labs(id),
  circle_id INTEGER NOT NULL REFERENCES circles(id),
  role TEXT NOT NULL DEFAULT 'treatment' CHECK (role IN ('control', 'treatment', 'observation')),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab-Collective association table
CREATE TABLE IF NOT EXISTS lab_collectives (
  id SERIAL PRIMARY KEY,
  lab_id INTEGER NOT NULL REFERENCES labs(id),
  collective_id INTEGER NOT NULL REFERENCES ai_follower_collectives(id),
  role TEXT NOT NULL DEFAULT 'treatment' CHECK (role IN ('control', 'treatment', 'observation')),
  response_rate FLOAT,
  response_delay JSONB,
  relevance_threshold FLOAT,
  interaction_mode TEXT,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab content table
CREATE TABLE IF NOT EXISTS lab_content (
  id SERIAL PRIMARY KEY,
  lab_id INTEGER NOT NULL REFERENCES labs(id),
  content_type TEXT NOT NULL,
  content TEXT NOT NULL,
  schedule_time TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS idx_labs_user_id ON labs(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_circles_lab_id ON lab_circles(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_circles_circle_id ON lab_circles(circle_id);
CREATE INDEX IF NOT EXISTS idx_lab_collectives_lab_id ON lab_collectives(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_collectives_collective_id ON lab_collectives(collective_id);
CREATE INDEX IF NOT EXISTS idx_lab_content_lab_id ON lab_content(lab_id);
```

**Note**: Always use direct SQL commands with `CREATE TABLE IF NOT EXISTS` to ensure safe schema updates rather than relying on ORM-based migration tools that might cause data loss.

#### Schema Definition in Code

Update the Drizzle schema definition in `shared/schema.ts` to reflect the database changes for new setups:

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

// Join table for labs and AI follower collectives
export const labCollectives = pgTable("lab_collectives", {
  id: serial("id").primaryKey(),
  labId: integer("lab_id").references(() => labs.id).notNull(),
  collectiveId: integer("collective_id").references(() => aiFollowerCollectives.id).notNull(),
  role: text("role", { 
    enum: ["control", "treatment", "observation"] 
  }).default("treatment").notNull(),
  responseRate: real("response_rate"),
  responseDelay: jsonb("response_delay"),
  relevanceThreshold: real("relevance_threshold"),
  interactionMode: text("interaction_mode"),
  addedAt: timestamp("added_at").defaultNow(),
});
```

#### Core Storage Implementation

Update the `IStorage` interface and `DatabaseStorage` class in `server/storage.ts` to include lab management methods:

```typescript
// Lab methods for IStorage interface
createLab(userId: number, lab: InsertLab): Promise<Lab>;
getLab(id: number): Promise<Lab | undefined>;
getUserLabs(userId: number): Promise<Lab[]>;
updateLab(id: number, updates: Partial<InsertLab>): Promise<Lab>;
deleteLab(id: number): Promise<void>;

// Lab-Circle methods
addCircleToLab(labId: number, circleId: number, role?: string): Promise<LabCircle>;
removeCircleFromLab(labId: number, circleId: number): Promise<void>;
getLabCircles(labId: number): Promise<(Circle & { role: string })[]>;

// Lab-Collective methods
addCollectiveToLab(labId: number, collectiveId: number, config?: CollectiveConfig): Promise<LabCollective>;
updateLabCollective(labId: number, collectiveId: number, config: Partial<CollectiveConfig>): Promise<LabCollective>;
removeCollectiveFromLab(labId: number, collectiveId: number): Promise<void>;
getLabCollectives(labId: number): Promise<(AiFollowerCollective & { role: string, config?: CollectiveConfig })[]>;
```

#### API Implementation

Implement the core API endpoints for lab management in `server/routes.ts`:

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
    
    res.status(201).json(lab);
  } catch (error) {
    console.error("Error creating lab:", error);
    res.status(500).json({ message: "Failed to create lab" });
  }
});

// Circle association endpoints
app.post("/api/labs/:labId/circles", ensureAuthenticated, async (req, res) => {
  try {
    const { labId } = req.params;
    const { circleId, role } = req.body;
    
    // Check permissions
    const lab = await storage.getLab(parseInt(labId));
    if (!lab || lab.userId !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to modify this lab" });
    }
    
    const labCircle = await storage.addCircleToLab(parseInt(labId), circleId, role);
    res.status(201).json(labCircle);
  } catch (error) {
    console.error("Error adding circle to lab:", error);
    res.status(500).json({ message: "Failed to add circle to lab" });
  }
});
```

### Phase 2: UI Implementation (2-3 weeks)

#### Lab Management UI

Create the core UI components for lab management:

1. Lab listing page
2. Lab creation wizard
3. Lab detail page
4. Circle selection interface
5. Lab settings panel

#### Lab Creation Wizard

Implement a step-by-step wizard for lab creation:

1. Basic lab information (name, description)
2. Circle selection and role assignment
3. AI follower collective selection
4. Experiment configuration

### Phase 3: Collective Integration (2-3 weeks)

#### Collective Management

Integrate with the existing AI follower collectives feature:

1. Update `server/storage.ts` with collective management methods
2. Implement API endpoints for collective management in labs
3. Create UI components for collective selection and configuration

#### Enhanced API Endpoints

Implement additional API endpoints for collective management:

```typescript
// Collective management endpoints
app.post("/api/labs/:labId/collectives", ensureAuthenticated, async (req, res) => {
  try {
    const { labId } = req.params;
    const { collectiveId, role, config } = req.body;
    
    // Check permissions
    const lab = await storage.getLab(parseInt(labId));
    if (!lab || lab.userId !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to modify this lab" });
    }
    
    const labCollective = await storage.addCollectiveToLab(parseInt(labId), collectiveId, role, config);
    res.status(201).json(labCollective);
  } catch (error) {
    console.error("Error adding collective to lab:", error);
    res.status(500).json({ message: "Failed to add collective to lab" });
  }
});

app.patch("/api/labs/:labId/collectives/:collectiveId", ensureAuthenticated, async (req, res) => {
  try {
    const { labId, collectiveId } = req.params;
    const config = req.body;
    
    // Check permissions
    const lab = await storage.getLab(parseInt(labId));
    if (!lab || lab.userId !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to modify this lab" });
    }
    
    const updatedLabCollective = await storage.updateLabCollective(
      parseInt(labId), 
      parseInt(collectiveId), 
      config
    );
    
    res.json(updatedLabCollective);
  } catch (error) {
    console.error("Error updating lab collective:", error);
    res.status(500).json({ message: "Failed to update lab collective" });
  }
});
```

### Phase 4: Experimentation and Results (2-3 weeks)

#### Content Management

Implement experiment content management features:

1. Content creation interface
2. Content scheduling system
3. Content targeting to specific circles

#### Results Tracking

Develop the results tracking and analysis components:

1. Interaction metrics collection
2. Visualization components
3. Comparative analysis tools

## Implementation Considerations

### Performance

1. **Database Queries**
   - Use efficient joins and indexing for lab-related queries
   - Implement pagination for large result sets
   - Consider caching for frequently accessed labs and configurations

2. **Async Processing**
   - Use background processing for time-consuming operations like generating collective variations
   - Implement queuing for content scheduling to prevent resource contention

### Security

1. **Permission Checks**
   - Implement thorough permission checks for all lab operations
   - Ensure circles and collectives can only be accessed by authorized users
   - Implement rate limiting for API endpoints to prevent abuse

2. **Content Validation**
   - Validate all user-generated content for experiments
   - Implement content moderation for shared experiment content

### Error Handling

1. **Schema Changes**
   - Always use `IF NOT EXISTS` in SQL commands to prevent errors when tables already exist
   - Include proper error handling for schema updates and database operations

2. **User Feedback**
   - Provide clear error messages for failed operations
   - Implement comprehensive logging for debugging purposes

## Testing Strategy

1. **Unit Testing**
   - Test all storage methods individually
   - Test API endpoints with mock storage

2. **Integration Testing**
   - Test complete lab creation flow
   - Test circle and collective integration
   - Test experiment execution

3. **UI Testing**
   - Test all UI components and workflows
   - Test responsive design and mobile compatibility

## Monitoring and Analytics

1. **Usage Tracking**
   - Track lab creation and usage
   - Monitor experiment execution and completion

2. **Performance Monitoring**
   - Track database query performance
   - Monitor API response times
   - Track resource usage during experiments

## Rollout Strategy

1. **Alpha Release**
   - Internal testing with a limited set of users
   - Focus on core lab creation and management

2. **Beta Release**
   - Expanded user testing with early adopters
   - Include circle integration and basic experimentation

3. **General Release**
   - Full feature set available to all users
   - Include results analysis and advanced experimentation features