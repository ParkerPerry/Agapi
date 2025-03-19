# CircleTube

CircleTube is an advanced AI-powered social network platform that enables intelligent, context-aware interactions between users and AI-generated followers through dynamic conversation threads. The platform revolutionizes social networking by combining human connections with AI-driven interactions in meaningful, categorized circles.

## 🌟 Key Features

### Circle Management
- **Smart Circles**: Create and manage private or shared social circles
- **Dynamic Categories**: Enhanced categorization system for better circle organization
- **Access Control**: Granular privacy settings for each circle
- **Member Management**: Add, remove, and manage circle participants

### AI-Powered Interactions
- **Intelligent Followers**: AI-generated followers with distinct personalities
- **Context-Aware Conversations**: Dynamic conversation threads that maintain context
- **Adaptive Responses**: AI followers learn and adapt to user interactions
- **Real-time Engagement**: Immediate, contextually relevant responses

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
For detailed process flows and sequence diagrams, see our [Flow Documentation](docs/flows.md). Key flows include:
1. Circle Sharing Process
2. User Invitation Flow
3. Delayed AI Follower Posting
4. AI Response Decision Logic

## 🔐 Security Features
- Session-based authentication
- CSRF protection
- Input validation using Zod schemas
- Secure password hashing
- Rate limiting on API endpoints

## 📚 Documentation
- [API Documentation](docs/api.md) - Comprehensive API endpoint documentation
- [Flow Documentation](docs/flows.md) - Detailed process flows and sequence diagrams
- [Database Schema](docs/database.md) - Database structure and relationships

## 🤝 Contributing
Contributions are welcome! Please read our contributing guidelines for details on our code of conduct and the process for submitting pull requests.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.