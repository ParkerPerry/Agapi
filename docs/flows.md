# CircleTube Backend Flow Documentation

## 1. Circle Sharing Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as API Server
    participant DB as Database
    participant N as Notification System

    U->>API: POST /api/circles/{id}/share
    Note over U,API: Share request with user IDs
    API->>DB: Check circle ownership
    API->>DB: Verify users exist
    API->>DB: Create share records
    API->>N: Send share notifications
    N-->>U: Push notifications
    API-->>U: 200 OK with share status
```

## 2. User Invitation Process

```mermaid
sequenceDiagram
    participant U1 as Inviting User
    participant API as API Server
    participant DB as Database
    participant U2 as Invited User
    participant Email as Email Service

    U1->>API: POST /api/circles/{id}/invite
    Note over U1,API: Invitation with email/username
    API->>DB: Validate circle membership
    API->>DB: Create invitation record
    API->>Email: Send invitation email
    Email-->>U2: Receive invitation
    U2->>API: GET /api/invitations/{token}
    API->>DB: Verify invitation token
    API->>DB: Add user to circle
    API-->>U2: 200 OK + Circle details
```

## 3. Delayed AI Follower Posting

```mermaid
graph TD
    A[User Creates Post] -->|POST /api/posts| B[API Server]
    B -->|Store Post| C[Database]
    B -->|Queue Response Task| D[Response Scheduler]
    D -->|Check AI Context| E{Context Manager}
    E -->|Get Post History| F[Thread Manager]
    F -->|Generate Response| G[OpenAI API]
    G -->|Process Response| H[Response Scheduler]
    H -->|Random Delay 1-5min| I[Create AI Response]
    I -->|Store Response| C
    I -->|Notify User| J[User Interface]
```

## 4. AI Follower Response Decision Logic

```mermaid
flowchart TD
    A[New Post/Comment] -->|Check Relevance| B{Context Manager}
    B -->|Get AI Profile| C[Load AI Personality]
    B -->|Get Thread History| D[Load Previous Interactions]
    B -->|Get User Context| E[Load User Preferences]
    
    C & D & E -->|Analyze| F{Should Respond?}
    
    F -->|Yes| G[Calculate Response Type]
    F -->|No| H[End Process]
    
    G -->|Comment| I[Generate Comment]
    G -->|Question| J[Generate Question]
    G -->|Reaction| K[Generate Reaction]
    
    I & J & K -->|Queue Response| L[Response Scheduler]
```

### Implementation Details

#### Circle Sharing
- Owner initiates share through `/api/circles/{id}/share` endpoint
- System validates ownership and target users
- Creates share records with specified permissions
- Notifications sent to shared users
- Share status tracked in database

#### User Invitation
- Circle members can invite via email/username
- System generates unique invitation tokens
- Email notifications sent with accept/reject links
- Tokens expire after 7 days
- Acceptance adds user to circle members

#### Delayed AI Posting
- Posts queued in ResponseScheduler
- Random delays (1-5 minutes) applied
- Context Manager checks relevance
- Thread Manager maintains conversation flow
- Responses stored and linked to original post

#### AI Response Decision
Factors considered:
1. **User Context**
   - Post frequency
   - Interaction history
   - User preferences

2. **Content Relevance**
   - Topic matching
   - Keyword analysis
   - Sentiment match

3. **Timing Logic**
   - Last interaction time
   - Post urgency
   - Time of day

4. **Response Type Selection**
   - Comment probability: 60%
   - Question probability: 30%
   - Reaction probability: 10%

### Implementation Note
The system uses a combination of database triggers and scheduled tasks to manage these flows efficiently while maintaining natural interaction patterns.
