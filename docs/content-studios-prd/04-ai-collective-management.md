# AI Follower Management in Labs

## Overview

The AI Follower Management component of the Labs feature provides tools for selecting, configuring, and organizing AI followers for experiments. This component leverages the existing AI follower collectives system rather than creating separate follower groups.

## Integration with AI Follower Collectives

Labs will directly integrate with the existing AI follower collectives feature to manage followers in experiments. This approach provides several advantages:

1. Reduces duplication of functionality
2. Leverages existing collective management tools
3. Provides a consistent user experience
4. Simplifies implementation complexity

## Key Functionality

### Collective Selection

Labs will allow users to:

- Select existing AI follower collectives for experiments via adding them to a circle
- Assign collectives to specific circles within a lab
- Configure different behavior parameters for collectives in different experimental contexts

### Collective Assignment to Experimental Roles

Users can assign AI follower collectives to specific experimental roles:

- **Control Collectives**: Baseline follower behavior for comparison
- **Treatment Collectives**: Experimental follower behavior being tested
- **Observer Collectives**: Followers that can view but not actively participate

### Parameterization

The following parameters can be adjusted for AI follower collectives within a lab:

- **Response Rate**: How frequently followers respond to content
- **Response Delay**: How quickly followers respond to content
- **Content Relevance Threshold**: Minimum relevance score for triggering a response
- **Interaction Mode**: How followers interact with content and other followers

## Database Schema

The labs feature will integrate with the existing `ai_follower_collectives` table and add a new joining table:

```sql
-- Association table for labs and follower collectives
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lab_collectives_lab_id ON lab_collectives(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_collectives_collective_id ON lab_collectives(collective_id);
```

## API Endpoints

The following API endpoints will be implemented to support AI follower collective management in labs:

1. **Get Lab Collectives**
   - `GET /api/labs/:labId/collectives`
   - Returns all collectives associated with a lab, including their roles and configurations

2. **Add Collective to Lab**
   - `POST /api/labs/:labId/collectives`
   - Associates an existing collective with a lab and assigns a role

3. **Update Collective Configuration**
   - `PATCH /api/labs/:labId/collectives/:collectiveId`
   - Updates experimental parameters for a collective in the lab

4. **Remove Collective from Lab**
   - `DELETE /api/labs/:labId/collectives/:collectiveId`
   - Removes an AI follower collective from a lab

## User Interface Components

### Collective Selection Interface

A modal interface that allows users to:
- Browse existing collectives
- View collective details (followers, configuration, etc.)
- Select collectives for inclusion in the lab
- Assign experimental roles to selected collectives

### Collective Configuration Panel

A configuration panel that allows users to:
- Adjust response parameters for collectives in the lab
- Configure interaction modes and behaviors
- Preview expected behavior based on configurations

### Collective Management Dashboard

A dashboard component that displays:
- All collectives assigned to the lab
- Their experimental roles
- Current configuration parameters
- Performance metrics during the experiment

## Integration with Clone Factory

The Labs feature will integrate with the existing Clone Factory service (server/clone-service.ts) to support:

1. Creating variations of template followers within collectives
2. Adjusting personality traits and behaviors for experimental purposes
3. Generating diverse follower sets for more robust testing

## Implementation Considerations

1. **Collective Permissions**
   - Labs should only have access to AI follower collectives owned by the lab creator or where appropriate permissions exist

2. **Performance Management**
   - Limit the number of followers per lab to prevent performance issues
   - Implement rate limiting for follower interactions in experimental contexts

3. **Debugging Tools**
   - Provide tools to diagnose follower behavior issues within experiments
   - Support manual override of follower actions for testing purposes

## Future Enhancements

1. **Behavioral Templates**
   - Predefined behavior patterns that can be applied to collectives
   - Common experimental configurations that can be reused

2. **Automatic Optimization**
   - Machine learning algorithms to optimize follower configurations based on experiment results
   - Automatic generation of variant collectives based on promising configurations

3. **Cross-Lab Analysis**
   - Tools to compare follower performance across multiple experiments
   - Historical tracking of collective performance over time