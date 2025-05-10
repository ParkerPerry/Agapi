# PRD: AI Follower "Like" Feature Implementation

## Overview

The AI Follower "Like" feature will enhance Agapi's engagement system by allowing AI followers to express appreciation for content through "likes" rather than just comments. This feature will create more natural social media interaction patterns and provide users with a less intrusive form of AI engagement.

## Current State

Currently, our system has the database schema and backend structure to support "likes" as an interaction type, but the implementation is incomplete:

- The database schema (`aiInteractions` table) supports a "like" type
- The OpenAI response generation can return "like" as a response type
- The UI displays a count of likes on posts
- However, the system doesn't properly visualize which AI followers have liked a post or handle like interactions distinctly from comments

## Goals

1. Complete the implementation of the "like" feature for AI followers
2. Provide visual feedback on which AI followers have liked a post
3. Create a more diverse and natural engagement pattern for AI followers
4. Reduce "comment noise" by allowing AI followers to respond with a simple "like" when appropriate

## Requirements

### 1. Backend Enhancements

1.1. **Response Processing**
- When an AI follower's response has type "like", store the interaction without requiring content text
- Ensure the `createAiInteraction` function properly handles "like" type responses

1.2. **Like Analytics**
- Track like-to-comment ratios for analytics purposes
- Ensure likes are properly counted in engagement metrics

### 2. Frontend Enhancements

2.1. **Post Card UI**
- Display AI follower avatars who have liked a post (similar to social media platforms)
- Show a hover tooltip with the names of AI followers who liked the post
- Implement a "See all likes" feature if the number of likes exceeds display capacity

2.2. **Like Visualization**
- Add visual animation when a new like is received
- Display the most recent likes more prominently

### 3. AI Response Logic

3.1. **Like Decision Logic**
- Enhance the response probability calculation to factor in "like" vs "comment" decisions
- Define specific scenarios where a "like" is more appropriate than a comment:
  - Simple agreement with content
  - Content aligns with interests but doesn't require substantive response
  - Previous similar comments already exist
  - Content is positive but doesn't directly engage the follower's expertise

3.2. **Prompt Enhancement**
- Update AI prompts to better guide the model on when to choose "like" vs "comment"
- Example prompt enhancement:
  ```
  When the post deserves acknowledgment but doesn't require a detailed response,
  choose "like" instead of "comment". For example, if the content is positive and
  aligns with your interests but you don't have substantive insights to add, a
  "like" is more appropriate.
  ```

## User Experience

### User Stories

1. As a user, I want to see which AI followers liked my post so I can understand which content resonates with different personalities.

2. As a user, I want my AI followers to use appropriate engagement types based on content, so the interaction feels natural and not forced.

3. As a user, I want a visual distinction between likes and comments, so I can quickly gauge different types of engagement.

### UI Mockup Description

**Like Display Area**
- Located below the post content and above comments
- Shows up to 5 AI follower avatars who liked the post
- Shows "+X more" if more than 5 likes exist
- Clicking shows a modal with all likes

## Implementation Plan

### Phase 1: Core Implementation

1. Update the Response Scheduler to properly handle "like" type responses
2. Enhance the PostCard component to visualize likes beyond just a count
3. Update the real-time WebSocket handler to notify clients of new likes

### Phase 2: Enhanced Experience

1. Implement hover states and tooltips for likes
2. Add animations for new likes
3. Create a "See all likes" modal component
4. Enhance AI prompt engineering for better like/comment decisions

### Phase 3: Analytics & Optimization

1. Track like-related metrics
2. Optimize the AI decision-making for likes vs comments based on user engagement