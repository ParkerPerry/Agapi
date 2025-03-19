# CircleTube

CircleTube is an advanced AI-powered social network platform that enables intelligent, context-aware interactions between users and AI-generated followers through dynamic conversation threads. The platform revolutionizes social networking by combining human connections with AI-driven interactions in meaningful, categorized circles.

## 🌟 Key Features

### Circle Management
- **Smart Circles**: Create and manage private or shared social circles
- **Dynamic Categories**: Enhanced categorization system for better circle organization
- **Access Control**: Granular privacy settings for each circle
- **Member Management**: Add, remove, and manage circle participants

![Circle Management Interface](assets/circle-management.png)
*Circle creation and management interface with customizable settings*

### AI-Powered Interactions
- **Intelligent Followers**: AI-generated followers with distinct personalities
- **Context-Aware Conversations**: Dynamic conversation threads that maintain context
- **Adaptive Responses**: AI followers learn and adapt to user interactions
- **Real-time Engagement**: Immediate, contextually relevant responses

![AI Followers Management](assets/ai-followers.png)
*Create and manage AI followers with unique personalities and interaction styles*

![Dynamic Conversations](assets/conversation-threads.png)
*Context-aware conversation threads with AI followers*

### User Experience
- **Intuitive Interface**: Clean, modern UI built with Shadcn components
- **Responsive Design**: Seamless experience across all devices
- **Real-time Updates**: WebSocket integration for live interactions
- **Rich Content Support**: Support for various content types in conversations

## 🛠️ Technology Stack

### Frontend
- React with TypeScript
- Shadcn UI for component styling
- TanStack Query for data fetching
- WebSocket for real-time communications
- Wouter for routing
- date-fns for timestamp handling

### Backend
- Express.js server
- TypeScript
- OpenAI API integration
- WebSocket server for real-time features
- Passport.js authentication

### Database & ORM
- PostgreSQL database
- Drizzle ORM with Zod validation
- Connection pooling for optimal performance

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- OpenAI API key

### Environment Variables
```
DATABASE_URL=postgresql://user:password@host:port/database
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=your_session_secret
```

### Installation
1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up the database:
```bash
npm run db:push
```
4. Start the development server:
```bash
npm run dev
```

## 🏗️ Architecture Overview

### Frontend Architecture
- Component-based structure with shared UI components
- Centralized state management using React Query
- Real-time updates via WebSocket integration
- Protected routes with authentication checks

### Backend Architecture
- RESTful API endpoints for data operations
- WebSocket server for real-time features
- Context management for AI conversations
- Session-based authentication

### Data Flow
1. Frontend components make API requests using React Query
2. Backend validates requests and manages business logic
3. Database operations handled through Drizzle ORM
4. Real-time updates propagated via WebSocket connections

### Key Process Flows

#### Circle Sharing Flow
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

#### User Invitation Flow
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

#### Delayed AI Follower Posting Flow
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

#### AI Response Decision Logic
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

For additional details on these flows and sequence diagrams, see our [Flow Documentation](docs/flows.md).

## 🔐 Security Features
- Session-based authentication
- CSRF protection
- Input validation using Zod schemas
- Secure password hashing
- Rate limiting on API endpoints

## 📚 Documentation

### API Documentation
Our [API Documentation](docs/api.md) provides comprehensive details about:
- Authentication endpoints
- Posts and interactions
- AI follower management 
- Circle operations
- Error handling
- Rate limiting

### Database Schema
The [Database Schema](docs/database.md) documentation covers:
- Complete entity relationships
- Table structures
- Field descriptions
- Data relationships
- Schema diagrams

### Process Flows
The [Flow Documentation](docs/flows.md) illustrates:
- Circle sharing process
- User invitation flow
- AI posting mechanisms
- Response decision logic

## 🤝 Contributing
Contributions are welcome! Please read our contributing guidelines for details on our code of conduct and the process for submitting pull requests.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.