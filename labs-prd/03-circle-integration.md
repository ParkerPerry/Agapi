# Lab-Circle Integration

## Overview

The Circle Integration component enables Labs to work with CircleTube's content circles for experimentation. This document outlines how labs will integrate with circles, allowing controlled content environments for running AI follower experiments.

## Circle Roles in Labs

Circles can serve different roles within lab experiments:

1. **Control Circle**: A baseline content environment where standard follower behavior is observed
2. **Treatment Circle**: An experimental content environment where modified follower behavior is tested
3. **Observation Circle**: A circle where interactions can be monitored but not directly influenced

## Database Schema

The lab-circle relationship is managed through a dedicated joining table:

```sql
-- Create lab-circles association table
CREATE TABLE IF NOT EXISTS lab_circles (
  id SERIAL PRIMARY KEY,
  lab_id INTEGER NOT NULL REFERENCES labs(id),
  circle_id INTEGER NOT NULL REFERENCES circles(id),
  role TEXT NOT NULL DEFAULT 'treatment' CHECK (role IN ('control', 'treatment', 'observation')),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lab_circles_lab_id ON lab_circles(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_circles_circle_id ON lab_circles(circle_id);
```

## Key Functionality

### Circle Selection

Labs will allow users to:

- Select existing circles for experiments
- Create new circles specifically for experimentation
- Associate circles with different experimental roles

### Content Isolation

The integration ensures that:

- Experimental content is contained within designated circles
- Control and treatment groups can be clearly separated
- Interactions are channeled to the appropriate environments

### Permission Management

The feature will:

- Respect existing circle permissions
- Allow lab-specific temporary access grants
- Enable circle owners to control experiment access

## API Endpoints

The following API endpoints will support circle integration:

1. **Get Lab Circles**
   - `GET /api/labs/:labId/circles`
   - Returns all circles associated with a lab, including their roles

2. **Add Circle to Lab**
   - `POST /api/labs/:labId/circles`
   - Associates a circle with a lab and assigns an experimental role

3. **Update Circle Role**
   - `PATCH /api/labs/:labId/circles/:circleId`
   - Updates the role of a circle within the lab experiment

4. **Remove Circle from Lab**
   - `DELETE /api/labs/:labId/circles/:circleId`
   - Removes a circle from a lab experiment

## Integration with AI Follower Collectives

Circles in lab experiments will be populated with AI followers from the following sources:

1. **Collective Assignment**: Entire AI follower collectives assigned to specific circles
2. **Role-Based Distribution**: Collectives distributed across circles based on experimental roles
3. **Behavioral Configuration**: Followers' behaviors adjusted based on their circle's experimental role

The integration leverages the `lab_collectives` table to connect labs, circles, and AI follower collectives:

```sql
-- Query to get all followers assigned to a circle in a lab
SELECT 
  af.*,
  lc.role as lab_role,
  labs.name as lab_name
FROM ai_followers af
JOIN ai_follower_collectives afc ON af.collective_id = afc.id
JOIN lab_collectives lc ON afc.id = lc.collective_id
JOIN lab_circles lcirc ON lc.lab_id = lcirc.lab_id
JOIN labs ON lc.lab_id = labs.id
WHERE lcirc.circle_id = :circleId
  AND lc.lab_id = :labId;
```

## User Interface

### Circle Selection Interface

A user interface component that allows users to:
- Browse available circles
- View circle details (members, content count, etc.)
- Select circles for inclusion in the lab
- Assign experimental roles to selected circles

### Circle Role Configuration

A configuration panel that enables users to:
- Define the purpose of each circle in the experiment
- Configure content visibility settings
- Adjust follower behavior parameters specific to each circle

### Circle Management Dashboard

A dashboard component that displays:
- All circles associated with the lab
- Their experimental roles
- Content and interaction statistics
- Performance metrics during the experiment

## Implementation Considerations

### Circle Membership

1. **Lab Member Access**
   - Lab creators automatically get access to all associated circles
   - Lab participants can be granted specific circle access permissions

2. **Temporary Membership**
   - Support for temporary circle access during experiments
   - Automatic membership revocation after experiment completion

### Content Management

1. **Targeted Content**
   - Support for targeting specific content to control vs. treatment circles
   - Cross-posting capabilities with controlled visibility

2. **Content Lifecycle**
   - Experiment-specific content can be automatically archived
   - Support for exporting successful content to permanent circles

### Analytics Integration

1. **Circle-Level Metrics**
   - Track engagement metrics at the circle level
   - Compare performance across control and treatment circles

2. **Heatmaps and Visualizations**
   - Visualize interaction patterns within circles
   - Highlight differences between experimental groups

## Integration with Collective Management

The Circle Integration component will work closely with the Collective Management component to provide a seamless experimental environment:

1. **Circle-Collective Mapping**
   - Map AI follower collectives to specific circles
   - Configure different behaviors for the same collective in different circles

2. **Behavioral Context**
   - Adjust follower behavior based on circle context
   - Apply circle-specific response parameters

## Future Enhancements

1. **Automated Circle Creation**
   - Automatically generate circles with predefined settings for experiments
   - Template-based circle configuration for common experiment types

2. **Circle Cloning**
   - Clone existing circles for A/B testing with identical initial conditions
   - Differential circle analysis to identify behavior changes

3. **Circle Merging**
   - Merge successful experimental circles back into main content spaces
   - Graduated introduction of experimental followers to wider audiences