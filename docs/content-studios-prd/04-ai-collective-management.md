
# AI Follower Management in Labs

## Overview

The AI Follower Management component of the Labs feature provides tools for selecting and organizing AI followers for experiments through circles. This component leverages the existing AI follower collectives system and circle assignment workflow.

## Integration Approach

Labs will integrate with AI follower collectives through circles:

1. Users will add AI follower collectives to circles within a lab
2. Each circle in a lab serves a specific experimental purpose (control group, treatment group, etc.)
3. The existing circle-collective association functionality will be utilized in a guided, step-by-step wizard

## Key Functionality

### Circle-Based Collective Management

Labs will allow users to:

- Select existing AI follower collectives for experiments by adding them to circles
- Assign circles different experimental roles within a lab (control, treatment, observation)
- Configure circles to have specific content visibility and participation rules

### Experimental Circle Roles

Users can assign circles to specific experimental roles:

- **Control Circles**: Contain baseline follower collectives for comparison
- **Treatment Circles**: Contain experimental follower collectives being tested
- **Observer Circles**: Contain followers that can view but not actively participate

### Circle Configuration

The following circle settings can be adjusted within a lab:

- **Visibility Settings**: Who can see content in this circle
- **Participation Rules**: Who can post and comment in this circle
- **Content Filtering**: Types of content allowed in this circle

## Database Schema

The labs feature will utilize the existing tables for circles and circle-follower associations, without requiring a direct lab-to-collective relationship:

```sql
-- Lab-Circle association table (already defined in PRD 03)
CREATE TABLE IF NOT EXISTS lab_circles (
  id SERIAL PRIMARY KEY,
  lab_id INTEGER NOT NULL REFERENCES labs(id),
  circle_id INTEGER NOT NULL REFERENCES circles(id),
  role TEXT NOT NULL DEFAULT 'treatment' CHECK (role IN ('control', 'treatment', 'observation')),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lab_circles_lab_id ON lab_circles(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_circles_circle_id ON lab_circles(circle_id);
```

## API Endpoints

The following API endpoints will be used to manage circles within labs:

1. **Get Lab Circles**
   - `GET /api/labs/:labId/circles`
   - Returns all circles associated with a lab, including their roles

2. **Add Circle to Lab**
   - `POST /api/labs/:labId/circles`
   - Associates an existing circle with a lab and assigns a role

3. **Update Circle Role**
   - `PATCH /api/labs/:labId/circles/:circleId`
   - Updates the experimental role for a circle in the lab

4. **Remove Circle from Lab**
   - `DELETE /api/labs/:labId/circles/:circleId`
   - Removes a circle from a lab

## User Interface Components

### Lab Creation Wizard

A step-by-step wizard that guides users through:
- Creating a new lab with name, description, and goals
- Selecting or creating circles for different experimental roles
- Adding existing collectives to each circle
- Configuring circle visibility and participation settings

### Circle Configuration Panel

A configuration panel that allows users to:
- Adjust visibility settings for circles in the lab
- Configure participation rules
- Define content filtering rules

### Lab Management Dashboard

A dashboard component that displays:
- All circles assigned to the lab
- Their experimental roles
- Access to circle management tools
- Performance metrics during the experiment

## Integration with Existing Features

The Labs feature will integrate with:

1. **Circle Management**
   - Using existing circle creation and management functionality
   - Leveraging circle visibility and participation settings

2. **AI Follower Collectives**
   - Using existing collective management tools
   - Adding collectives to circles through established workflows

## Implementation Considerations

1. **Circle Permissions**
   - Labs should only have access to circles owned by the lab creator or where appropriate permissions exist

2. **Performance Management**
   - Limit the number of circles per lab to prevent performance issues
   - Implement rate limiting for content in experimental circles

3. **Debugging Tools**
   - Provide tools to diagnose issues within experimental circles
   - Support manual control of circle settings for testing purposes

## Future Enhancements

1. **Circle Templates**
   - Predefined circle configurations for common experimental setups
   - Quick-start templates with recommended settings

2. **Cross-Circle Analysis**
   - Tools to compare content performance across multiple circles
   - Visualization of differences between control and treatment circles

3. **Guided Experiment Setup**
   - AI-assisted setup of experiments based on research goals
   - Recommendation of circle configurations based on experiment type
