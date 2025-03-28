# Experimentation Content Management

## 1. Feature Overview

The Experimentation Content Management component enables users to create, organize, and schedule content for their labs. This component provides tools for generating test posts, scheduling automated content publication, and managing content variations to test AI follower responses under controlled conditions.

## 2. User Stories

- As a user, I want to create test posts specifically for my experiment.
- As a user, I want to schedule automated content posting to simulate natural activity.
- As a user, I want to create variations of content to test different AI responses.
- As a user, I want to organize content into experimental scenarios.
- As a user, I want to trigger specific interactions to test AI behavior.

## 3. Requirements

### 3.1 Functional Requirements

#### Content Creation
- Users can create individual test posts for experiments.
- Users can generate sets of related posts around themes.
- Users can define content variations for A/B testing.
- Users can import content from templates or existing posts.

#### Content Scheduling
- Users can schedule automated content posting.
- Users can define posting frequency and patterns.
- Users can create publishing rules based on time and conditions.
- Users can pause or modify scheduling during the experiment.

#### Content Organization
- Users can categorize content by purpose or theme.
- Users can tag content for analysis purposes.
- Users can organize content into test scenarios.
- Users can associate content with specific experimental goals.

#### Interaction Triggering
- Users can trigger specific AI interactions with content.
- Users can simulate user responses to test conversation threads.
- Users can create controlled conversation scenarios.
- Users can reset or replay interaction sequences.

### 3.2 Non-Functional Requirements

- Content creation interface should be intuitive and responsive.
- Scheduling system should support precise timing down to the minute.
- System should handle at least 100 scheduled posts per lab.
- Content variation generation should complete in under 5 seconds.

## 4. User Interface

### 4.1 Content Creation Interface

1. **Post Creation Panel**
   - Rich text editor for post content
   - Tags and categories selectors
   - Visibility and targeting options
   - Save as draft/template option

2. **Batch Content Generator**
   - Topic input field
   - Number of posts to generate
   - Tone and style options
   - Preview and editing panel

3. **Variation Creator**
   - Original content display
   - Variation parameters:
     - Tone shifts
     - Length modifications
     - Subject emphasis changes
   - Side-by-side comparison

### 4.2 Content Scheduling Interface

1. **Schedule Calendar View**
   - Visual calendar with scheduled posts
   - Drag and drop scheduling
   - Color coding by content category
   - Time interval selectors

2. **Schedule Configuration**
   - Frequency settings:
     - One-time
     - Recurring (hourly, daily, custom)
   - Distribution patterns (even, random, clustered)
   - Active periods setup

3. **Publishing Rules Manager**
   - Condition builder:
     - Time-based rules
     - Response-dependent rules
     - Sequence rules
   - Rule testing simulator

### 4.3 Content Organization Interface

1. **Content Library**
   - List/grid view of all experiment content
   - Search and filter options
   - Batch selection tools
   - Quick actions menu

2. **Scenario Builder**
   - Group posts into interaction scenarios
   - Define scenario flow and dependencies
   - Set trigger conditions
   - Preview scenario sequence

3. **Content Analytics Preview**
   - Expected engagement metrics
   - Target follower indicators
   - Hypothesis alignment check
   - Previous performance comparison

## 5. Data Model

```typescript
// Experimentation content tables
export const labPosts = pgTable("lab_posts", {
  id: serial("id").primaryKey(),
  labId: integer("lab_id").references(() => labs.id).notNull(),
  circleId: integer("circle_id").references(() => circles.id),
  originalPostId: integer("original_post_id").references(() => posts.id),
  content: text("content").notNull(),
  variationOf: integer("variation_of").references((): any => labPosts.id),
  variationType: text("variation_type", {
    enum: ["tone", "length", "emphasis", "structure", "custom"]
  }),
  category: text("category"),
  tags: text("tags").array(),
  experimentRole: text("experiment_role", {
    enum: ["control", "test", "baseline", "custom"]
  }).default("test"),
  status: text("status", {
    enum: ["draft", "scheduled", "published", "archived"]
  }).default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

// Scheduling for lab posts
export const labPostSchedules = pgTable("lab_post_schedules", {
  id: serial("id").primaryKey(),
  labId: integer("lab_id").references(() => labs.id).notNull(),
  labPostId: integer("lab_post_id").references(() => labPosts.id).notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  recurring: boolean("recurring").default(false),
  recurrencePattern: json("recurrence_pattern").$type<{
    frequency: "hourly" | "daily" | "weekly" | "custom";
    interval: number;
    endAfter?: number;
    endDate?: Date;
  }>(),
  published: boolean("published").default(false),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Content scenarios for organizing test flows
export const labContentScenarios = pgTable("lab_content_scenarios", {
  id: serial("id").primaryKey(),
  labId: integer("lab_id").references(() => labs.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  sequence: json("sequence").$type<{
    steps: Array<{
      order: number;
      labPostId: number;
      waitTime?: number;
      conditions?: any;
    }>;
  }>(),
  status: text("status", {
    enum: ["draft", "active", "completed", "archived"]
  }).default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});
```

## 6. API Endpoints

### Content Management

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/labs/:id/posts` | GET | Get lab posts | - | Array of lab posts |
| `/api/labs/:id/posts` | POST | Create lab post | Post details | Created post |
| `/api/labs/:id/posts/:postId` | GET | Get post details | - | Post object |
| `/api/labs/:id/posts/:postId` | PATCH | Update post | Updated fields | Updated post |
| `/api/labs/:id/posts/:postId` | DELETE | Delete post | - | Success message |
| `/api/labs/:id/posts/:postId/variations` | GET | Get post variations | - | Array of variations |
| `/api/labs/:id/posts/:postId/variations` | POST | Create variation | Variation details | Created variation |

### Content Scheduling

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/labs/:id/schedules` | GET | Get scheduled posts | - | Array of schedules |
| `/api/labs/:id/schedules` | POST | Schedule post | Schedule details | Created schedule |
| `/api/labs/:id/schedules/:scheduleId` | PATCH | Update schedule | Updated fields | Updated schedule |
| `/api/labs/:id/schedules/:scheduleId` | DELETE | Delete schedule | - | Success message |
| `/api/labs/:id/schedules/calendar` | GET | Get calendar view | Start/end dates | Calendar data |

### Content Scenarios

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/labs/:id/scenarios` | GET | Get scenarios | - | Array of scenarios |
| `/api/labs/:id/scenarios` | POST | Create scenario | Scenario details | Created scenario |
| `/api/labs/:id/scenarios/:scenarioId` | GET | Get scenario | - | Scenario object |
| `/api/labs/:id/scenarios/:scenarioId` | PATCH | Update scenario | Updated fields | Updated scenario |
| `/api/labs/:id/scenarios/:scenarioId` | DELETE | Delete scenario | - | Success message |
| `/api/labs/:id/scenarios/:scenarioId/execute` | POST | Run scenario | - | Execution status |

## 7. Implementation Plan

### Phase 1: Basic Content Creation
- Implement post creation interface
- Build data model for lab-specific posts
- Create API endpoints for post management
- Develop content organization tools

### Phase 2: Content Scheduling
- Implement scheduling calendar UI
- Build scheduling backend system
- Create recurring post functionality
- Develop publishing queue

### Phase 3: Content Variations
- Implement variation creation interface
- Build variation generation logic
- Create comparison tools
- Develop variation analysis features

### Phase 4: Scenarios and Advanced Features
- Implement scenario builder
- Build scenario execution engine
- Create conditional content publication
- Develop interactive simulation tools

## 8. Dependencies

- Lab Management system
- Circle Integration system
- AI Follower management
- OpenAI API for content generation