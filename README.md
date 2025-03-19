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

## 📚 Component Documentation with Storybook

### Running Storybook in Replit
To view the interactive component documentation:

1. Start the Storybook server by running:
```bash
npx storybook dev -p 6006 --host 0.0.0.0
```

2. Once started, Storybook will be available at your Replit URL on port 6006. Look for the URL in your Replit workspace's "Webview" tab.

### Exploring Components
The components are organized into categories in the left sidebar:
- Components/Circles: Circle management components
  - CircleCard: Display circle information
  - CircleCreateForm: Form for creating new circles
  - CircleDetailsDialog: Detailed circle view
  - CircleMemberList: List of circle members
- Components/Posts: Post-related components
  - PostCard: Display posts and interactions
  - PostForm: Create and edit posts
- Components/Navigation: Navigation components
  - NavBar: Main navigation bar

Each component includes:
- Interactive preview
- Props documentation
- Different variations (stories)
- Control panel for testing different prop combinations

### Using Storybook
1. Navigate through components using the left sidebar
2. Click on a component to see its documentation
3. Use the "Canvas" tab to interact with the component
4. Use the "Controls" panel to modify component props
5. View component code in the "Docs" tab


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

## 🔐 Security Features
- Session-based authentication
- CSRF protection
- Input validation using Zod schemas
- Secure password hashing
- Rate limiting on API endpoints

## 🤝 Contributing
Contributions are welcome! Please read our contributing guidelines for details on our code of conduct and the process for submitting pull requests.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.