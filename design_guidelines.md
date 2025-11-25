# Design Guidelines: Vibe Coder Matching Platform

## Design Approach

**Reference-Based Approach** drawing from professional networking and startup platforms:
- **LinkedIn** for professional profile structure and credibility
- **AngelList/Wellfound** for startup-investor matching patterns
- **Linear** for clean, modern interface and typography
- **Notion** for community discussion layout

**Core Principle**: Professional, trustworthy, and efficient with clear role differentiation and seamless matching discovery.

## Typography System

**Font Stack**: 
- Primary: Inter (headings, UI) via Google Fonts
- Secondary: System UI (body text for readability)

**Hierarchy**:
- Display: text-4xl to text-5xl, font-bold (hero sections, landing)
- H1: text-3xl, font-semibold (page titles)
- H2: text-2xl, font-semibold (section headers)
- H3: text-xl, font-medium (card titles, user names)
- Body: text-base, font-normal (content, descriptions)
- Small: text-sm (metadata, tags, timestamps)
- Micro: text-xs (labels, badges)

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistency
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16, py-20
- Element gaps: gap-4, gap-6, gap-8

**Grid Structure**:
- Container: max-w-7xl mx-auto px-4
- Profile cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Discussion threads: Single column max-w-4xl
- User dashboard: Two-column layout (sidebar + main)

## Component Library

### Navigation
- Sticky header with logo, main nav, user avatar/menu
- Role-based navigation items (Browse Coders/Investors/Tech Leads, Discussions, Matches)
- Prominent CTA: "Create Profile" or "Find Match"
- Mobile: Hamburger menu with slide-out drawer

### Profile Cards
**Three distinct card types** with visual differentiation:

**Vibe Coder Cards**:
- Prominent project title and tagline
- Tech stack tags (rounded-full badges)
- "Looking for" section (investors/tech leads)
- Portfolio preview thumbnails (2-3 images in grid)
- CTA: "View Profile" + "Connect"

**Investor Cards**:
- Investment focus areas (pill badges)
- Investment range indicator
- Industries of interest
- Portfolio companies count
- CTA: "View Profile" + "Connect"

**Technical Person Cards**:
- Role/specialization headline
- Skills grid (compact tags)
- Experience level indicator
- Work references preview (2-3 logos/links)
- CTA: "View Profile" + "Connect"

### Profile Pages

**Full-width hero section** (h-64):
- Cover image with gradient overlay
- Profile photo (absolute, bottom-left, rounded-full, border-4)
- Role badge (top-right corner)
- Edit button (for own profile)

**Content Grid** (max-w-5xl, two-column on desktop):

**Left Column** (wider, 2/3):
- About/Bio section
- Projects showcase (for coders) with image grids
- Investment portfolio (for investors)
- Work history & credentials (for tech persons)
- Community activity feed

**Right Column** (1/3, sticky):
- Quick stats card
- Contact information
- Skills/Interests tags
- Availability status
- Match compatibility score (if viewing from another user)

### Discussion Board

**Thread List** (max-w-4xl):
- Category filters (horizontal scroll on mobile)
- Thread cards with:
  - Author avatar and role badge
  - Title (text-lg, font-semibold)
  - Preview text (2 lines, text-ellipsis)
  - Metadata: replies, views, timestamp
  - Tags for categorization

**Thread Detail**:
- Original post with full formatting
- Author info sidebar (collapsed on mobile)
- Reply composer with rich text support
- Nested replies (indented, max 2 levels)
- Reaction buttons (upvote, bookmark)

### Matching Interface

**Discovery Feed**:
- Filter sidebar (collapsible on mobile):
  - Role type toggles
  - Skills/interests multi-select
  - Location filter
  - Availability status
- Card grid (responsive columns)
- "Match Score" indicator on cards
- Saved/favorited state

**Match Suggestions**:
- Horizontal scroll carousel of high-compatibility profiles
- "Why this match?" explanation card
- Quick action buttons (Connect, Pass, Save)

### Forms & Inputs

- Floating label inputs (Material Design style)
- Multi-select for tags (Combobox pattern)
- File upload with drag-and-drop zones
- Rich text editor for project/bio descriptions
- Form sections with clear dividers

## Images

**Hero Image**: Full-width header image on landing page showing diverse team collaboration (1920x600px)

**Profile Placement**:
- Cover images for all profile types (1200x400px)
- Project showcase images (600x400px, grid layout)
- Portfolio/work reference thumbnails (200x200px)
- User avatars throughout (circular, various sizes: 32px, 48px, 128px)

**Discussion Board**: Optional featured images for thread starters (800x400px)

## Key Interactions

**Micro-interactions** (subtle, purposeful):
- Card hover: slight scale (scale-105) + shadow increase
- Tag selection: background fill animation
- Match score: animated progress ring on reveal
- New message indicator: gentle pulse animation

**Smooth Transitions**:
- Page navigation: fade-in content
- Modal overlays: backdrop blur + scale-in
- Filter application: staggered card re-layout

## Accessibility

- Role badges with text + icon for color-blind users
- Focus states on all interactive elements (ring-2 ring-offset-2)
- Skip navigation link
- ARIA labels for icon-only buttons
- Keyboard navigation for all features
- Screen reader announcements for dynamic content updates

## Responsive Strategy

**Mobile-first breakpoints**:
- Base: Single column, stacked cards
- md (768px): Two-column grids, side-by-side forms
- lg (1024px): Three-column grids, persistent sidebars
- xl (1280px): Maximum container width, enhanced spacing

**Mobile Optimizations**:
- Bottom navigation for primary actions
- Swipeable card carousels
- Collapsible filter drawers
- Simplified profile layouts (single column)
- Larger touch targets (min-h-12)