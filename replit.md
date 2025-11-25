# VibeMatch - Coder Matching Platform

## Overview

VibeMatch is a professional networking and matching platform designed to connect three distinct user types: vibe coders (entrepreneurs/builders), investors, and technical leads. The platform facilitates project collaboration, team formation, and community discussions through a modern web application.

The application enables users to create profiles, discover potential matches, collaborate on projects, track contributions, and participate in community discussions. It emphasizes professional credibility, clear role differentiation, and seamless matching discovery.

**Recent Enhancements (November 2025)**
- **Authentication**: Implemented Replit OIDC authentication with development testing fallback
- **Analytics Backend**: Comprehensive platform metrics tracking:
  - User counts by role (vibe coders, investors, tech leads)
  - Project hosting statistics
  - Match/connection tracking system
  - Demographic breakdowns by location and skills/tags
  - Growth metrics over configurable time periods (7d, 30d, 90d, 1y)
- **Matches System**: Added database table and API endpoints for user connections
  - Match types: collaboration, investment, technical, mentorship
  - Status tracking: pending, accepted, rejected
- **Enhanced Project Profiles (November 11, 2025)**:
  - 5-tab project creation wizard: Basic Info → Vision → Team Needs → Links & Platform → Documents
  - **Investor Targeting**: target funding stage, investor types (angel/VC/strategic/accelerator), investment range ($minInvestmentAmount-$maxInvestmentAmount), custom preferences
  - **Technical Requirements**: experience level (junior/mid/senior/lead), time commitment (full-time/part-time/contract/advisor), technical roles (backend/frontend/DevOps/mobile/AI-ML), required skills array, custom requirements
  - **Links & Platform**: project links array (GitHub, demo, website), development platform (Replit, VS Code, etc.)
  - **Project Info Tab**: New default dashboard tab displaying vision, tech stack, target users, stage, funding goal, links, platform, investor targeting, and technical requirements with conditional rendering
  - **Documents**: Backend API endpoints for project document upload/retrieval/deletion (UI integration in progress)
  - Array input helpers with deduplication for techStack, projectLinks, requiredSkills, targetInvestorTypes, technicalRoles
  - Backend auto-creates test user profiles when x-user-id header is present (development/testing support)
- Professional blue color scheme (HSL: 217 91% 60%) applied throughout the application
- Consolidated dashboard with role-based conditional rendering:
  - Non-team members: Access Denied (no data access)
  - Team members without hasAccess: Limited view (Tasks assigned to them, their own Team info only)
  - Team members with hasAccess or Owner: Full view (all tabs, all data, all controls)
- Known Security Limitations (frontend-only filtering):
  - Tasks endpoint returns all tasks to team members (filtered in UI to show only assigned)
  - Members endpoint returns full team roster (needed for access control)
  - Backend authorization recommended for production (401/403 responses based on user role)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server, providing fast HMR and optimized production builds
- Client-side routing using Wouter (lightweight alternative to React Router)
- Single-page application (SPA) architecture with route-based code splitting

**UI Component System**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component library built on Radix UI with Tailwind CSS styling
- Custom design system following professional networking patterns (LinkedIn, AngelList, Linear, Notion)
- Typography system using Inter font from Google Fonts for headings/UI, system fonts for body text
- Tailwind CSS for styling with custom theme configuration supporting light/dark modes

**State Management**
- TanStack Query (React Query) for server state management, data fetching, and caching
- Local component state using React hooks (useState, useEffect)
- Form state managed by React Hook Form with Zod schema validation
- Theme state managed through React Context (ThemeProvider)

**Design Approach**
- Mobile-first responsive design with Tailwind breakpoints
- Consistent spacing primitives (2, 4, 6, 8, 12, 16 units)
- Role-based visual differentiation (distinct card styles for coders, investors, technical leads)
- Elevation system using subtle shadows for hierarchy and interaction feedback

### Backend Architecture

**Server Framework**
- Express.js running on Node.js for HTTP server
- TypeScript for type safety across the stack
- RESTful API design pattern with resource-based routing
- Custom middleware for request logging and JSON parsing

**API Structure**
- Resource-based endpoints following REST conventions:
  - `/api/profiles` - User profile management
  - `/api/projects` - Project CRUD operations
  - `/api/projects/:id/members` - Project team management
  - `/api/projects/:id/repositories` - Code repository uploads
  - `/api/projects/:id/tasks` - Task tracking
  - `/api/projects/:id/contributions` - Contribution logging
  - `/api/matches` - User connection/matching management
  - `/api/analytics/overview` - Platform metrics (users by role, projects, matches)
  - `/api/analytics/demographics` - User demographics (location, tags)
  - `/api/analytics/growth` - Growth metrics over time periods (7d, 30d, 90d, 1y)
  - `/api/analytics/users-by-role` - User counts by role type
- Query parameter filtering (e.g., filter profiles by role, filter matches by status)
- Validation using Zod schemas shared between client and server

**Database Layer**
- Drizzle ORM for type-safe database queries and migrations
- PostgreSQL as the primary database (via Neon serverless)
- WebSocket connection pooling for serverless PostgreSQL
- Schema-first design with TypeScript type inference

**Database Schema**
- `users` - Authentication and user accounts (email, firstName, lastName, profileImageUrl, timestamps)
- `profiles` - Extended user profiles with role-based fields (coder, investor, technical)
- `projects` - Project entities owned by vibe coders with enhanced vibe coding fields (vision, techStack, targetUsers, currentStage, lookingFor, fundingGoal)
- `projectMembers` - Many-to-many relationship for project teams with compensation tracking
- `codeRepositories` - Code file uploads with metadata, cost estimation, and drag-and-drop upload support
- `tasks` - Project task management with status tracking
- `contributions` - Contribution logging for equity/compensation calculation
- `matches` - User connections/matches (initiatorId, receiverId, status, matchType, message, timestamps)

### Key Architectural Decisions

**Monorepo Structure**
- Shared schema definitions in `/shared` directory accessible to both client and server
- Type safety enforced across API boundaries using Zod and TypeScript
- Unified TypeScript configuration with path aliases (@/, @shared/, @assets/)

**Development Environment**
- Optimized for Replit deployment with custom Vite plugins
- Development-only features (error overlay, cartographer, dev banner) conditionally loaded
- Hot module replacement for rapid iteration

**Authentication Strategy**
- **Production**: Replit OIDC (OpenID Connect) authentication via Passport.js
  - Users log in with Replit accounts (supports Google, GitHub, email)
  - Session-based authentication with PostgreSQL session storage (connect-pg-simple)
  - Token refresh handled automatically via openid-client
  - User data synced to local database on login (email, firstName, lastName, profileImageUrl)
- **Development/Testing**: Fallback mode for testing without full OIDC flow
  - Backend accepts `x-user-id` header when NODE_ENV=development
  - Frontend sends user ID via localStorage (set from URL parameter `?testUserId=user-id`)
  - Test users auto-created in database on first request
  - To test as different users: navigate to `/?testUserId=demo-member-1` (or any user ID)
- **Known Limitations**:
  - OIDC test framework integration incomplete (requires additional test harness setup)
  - Development fallback bypasses authentication (acceptable for local testing only)
  - Production requires real Replit login - no fallback available

**Validation & Type Safety**
- Zod schemas defined in shared directory for runtime validation
- drizzle-zod for automatic schema generation from database models
- React Hook Form resolver integration for client-side form validation
- TypeScript strict mode enabled throughout

**Data Fetching Strategy**
- Centralized query client configuration with custom fetch wrapper
- Infinite stale time to prevent unnecessary refetches
- Manual cache invalidation after mutations
- Optimistic updates not implemented (prefer server confirmation)

**Alternatives Considered**

- **GraphQL vs REST**: Chose REST for simplicity and widespread tooling support
- **Prisma vs Drizzle**: Selected Drizzle for better TypeScript integration and lighter footprint
- **Next.js vs Vite+Express**: Chose separate frontend/backend for clearer separation of concerns
- **TailwindCSS vs CSS-in-JS**: Selected Tailwind for utility-first approach and smaller bundle size

## External Dependencies

### Database & ORM
- **PostgreSQL** (via @neondatabase/serverless) - Primary data store with WebSocket support for serverless environments
- **Drizzle ORM** (drizzle-orm, drizzle-kit) - Type-safe database queries, migrations, and schema management
- **connect-pg-simple** - PostgreSQL session store for Express sessions

### Frontend Libraries
- **React** (@vitejs/plugin-react) - UI framework
- **TanStack Query** (@tanstack/react-query) - Server state management and data synchronization
- **Wouter** - Lightweight client-side routing
- **Radix UI** - Comprehensive set of accessible component primitives (accordion, dialog, dropdown, popover, etc.)
- **shadcn/ui** - Pre-built component library based on Radix UI
- **React Hook Form** (react-hook-form, @hookform/resolvers) - Form state management
- **Zod** - Schema validation and TypeScript type inference
- **date-fns** - Date formatting and manipulation
- **Lucide React** - Icon library
- **cmdk** - Command palette component

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **class-variance-authority** - Type-safe variant management for components
- **tailwind-merge & clsx** - Conditional class name utilities

### Build Tools
- **Vite** - Frontend build tool and dev server
- **TypeScript** - Type system and compiler
- **esbuild** - Fast JavaScript bundler for production builds
- **PostCSS & Autoprefixer** - CSS processing

### Development Tools
- **tsx** - TypeScript execution for development server
- **@replit/vite-plugin-runtime-error-modal** - Development error overlay
- **@replit/vite-plugin-cartographer** - Replit-specific development tooling

### Third-Party Services
- **Google Fonts** - Inter font family for typography
- **Neon Database** - Serverless PostgreSQL hosting with WebSocket support