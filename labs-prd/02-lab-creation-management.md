# Lab Creation and Management

## 1. Feature Overview

The Lab Creation and Management component enables users to create, configure, and manage AI experimentation labs. This component serves as the foundation for the entire Labs feature, providing the core functionality for setting up and organizing experiments.

## 2. User Stories

- As a user, I want to create a new lab with a descriptive name and purpose.
- As a user, I want to set specific goals and hypotheses for my experiment.
- As a user, I want to manage the lifecycle of my labs (draft, active, complete, archived).
- As a user, I want to view a dashboard of all my labs and their statuses.
- As a user, I want to duplicate successful labs to iterate on experiments.

## 3. Requirements

### 3.1 Functional Requirements

#### Lab Creation
- Users can create a new lab with a name, description, and experiment goals.
- Users can define the type of experiment (A/B test, multivariate, exploration).
- Users can set up success metrics for the experiment.

#### Lab Management
- Users can view a list of all their labs with status indicators.
- Users can edit lab details (name, description, goals).
- Users can change the status of labs (draft, active, complete, archived).
- Users can duplicate existing labs with all settings.
- Users can delete labs that are no longer needed.

#### Lab Dashboard
- Users can see a summary of all labs with key metrics.
- Users can filter and sort labs by status, creation date, and other parameters.
- Users can quickly access lab details and experiment results.

### 3.2 Non-Functional Requirements

- Lab creation process should be completed in less than 5 steps.
- Lab management interface should load in under 2 seconds.
- System should support at least 50 concurrent labs per user.

## 4. User Interface

### 4.1 Lab Creation Flow

1. **Lab Creation Entry Point**
   - Button on dashboard: "Create New Lab"
   - Initiates a multi-step wizard

2. **Basic Information (Step 1)**
   - Lab name field
   - Description field
   - Experiment goal field

3. **Experiment Type (Step 2)**
   - Selection of experiment type:
     - A/B Test (comparing two variations)
     - Multivariate (testing multiple variables)
     - Exploration (open-ended exploration)

4. **Success Metrics (Step 3)**
   - Define what metrics indicate success:
     - Response rate
     - Response time
     - Response quality
     - Custom metrics

5. **Review & Create (Step 4)**
   - Summary of all configured options
   - "Create Lab" button to finalize

### 4.2 Lab Management Dashboard

1. **Labs List View**
   - Table with columns:
     - Lab name
     - Status indicator (color-coded)
     - Creation date
     - Last modified date
     - Quick action buttons

2. **Lab Card View**
   - Card-based layout showing:
     - Lab name and description
     - Visual status indicator
     - Progress bar (if active)
     - Key metrics summary

3. **Lab Detail View**
   - Comprehensive overview of a specific lab
   - Tabs for different aspects (Setup, Circles, AI Followers, Content, Results)
   - Edit buttons for each section
   - Lab lifecycle management controls

## 5. Data Model

```typescript
// New tables for Labs functionality
export const labs = pgTable("labs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  experimentType: text("experiment_type", { 
    enum: ["a_b_test", "multivariate", "exploration"] 
  }).notNull(),
  status: text("status", { 
    enum: ["draft", "active", "completed", "archived"] 
  }).default("draft").notNull(),
  goals: text("goals"),
  successMetrics: json("success_metrics").$type<{
    metrics: Array<{
      name: string;
      target: number;
      priority: "high" | "medium" | "low";
    }>;
  }>(),
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
```

## 6. API Endpoints

### Lab Management

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/labs` | GET | Get all labs for user | - | Array of lab objects |
| `/api/labs` | POST | Create a new lab | Lab details | Created lab object |
| `/api/labs/:id` | GET | Get lab details | - | Lab object |
| `/api/labs/:id` | PATCH | Update lab details | Updated fields | Updated lab object |
| `/api/labs/:id` | DELETE | Delete a lab | - | Success message |
| `/api/labs/:id/duplicate` | POST | Duplicate a lab | New name (optional) | New lab object |

### Lab Circles

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/labs/:id/circles` | GET | Get circles in lab | - | Array of circle objects |
| `/api/labs/:id/circles` | POST | Add circle to lab | Circle ID, role | Updated lab object |
| `/api/labs/:id/circles/:circleId` | DELETE | Remove circle from lab | - | Success message |
| `/api/labs/:id/circles/:circleId` | PATCH | Update circle role | New role | Updated circle association |

## 7. Implementation Plan

### Phase 1: Core Lab Management
- Implement data model for labs
- Create API endpoints for basic CRUD operations
- Build UI for lab creation wizard
- Implement lab management dashboard

### Phase 2: Lab-Circle Integration
- Implement data model for lab-circle associations
- Create API endpoints for managing circles within labs
- Build UI for adding/removing circles to labs
- Implement circle role management within labs

### Phase 3: Lab Lifecycle Management
- Implement status transitions for labs
- Create lab duplication functionality
- Build archiving and cleanup processes
- Implement lab metrics dashboard

## 8. Dependencies

- User authentication system
- Circles management functionality
- Database with support for JSON data types
- Frontend components for forms and wizards