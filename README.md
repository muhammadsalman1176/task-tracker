# 📋 Task Tracker

A modern, feature-rich daily task tracking web application with AI-powered text enhancement and voice-to-text input capabilities.

![Task Tracker](https://img.shields.io/badge/Next.js-16.1.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎯 Core Functionality
- **Task Management**: Create, read, update, and delete daily tasks
- **Multiple Views**: 
  - Calendar view - Click on any date to see tasks for that day
  - List view - See all tasks grouped by date
- **Category System**: Organize tasks by Work, Personal, Health, Finance, Shopping, Learning, or Other
- **Date Tracking**: Associate tasks with specific dates for easy organization

### 🎤 Voice Input
- **Voice-to-Text**: Record your tasks using voice input
- **Easy Recording**: One-tap recording with visual feedback
- **Auto-stop**: Automatic recording stop after 30 seconds for convenience

### 🤖 AI-Powered Enhancement
- **Smart Text Enhancement**: Transform rough task descriptions into professional, actionable entries
- **First-Person Writing**: AI writes in first-person perspective (e.g., "Tested", "Converted", "Created")
- **Structured Output**: Uses bullet points and sub-bullets for clarity
- **Preview Before Apply**: Review the AI-enhanced version before committing to changes
- **Context-Aware**: Tailors enhancements based on task category

### 🎨 User Interface
- **Modern Design**: Clean, professional interface with smooth animations
- **Responsive Layout**: Fully responsive design that works on all devices
- **Dark Mode Support**: Built-in theme switching for comfortable viewing
- **Intuitive UX**: User-friendly interface with clear visual feedback
- **Toast Notifications**: Instant feedback for all user actions

## 🛠️ Technology Stack

### Frontend
- **Next.js 16.1.3** - React framework with App Router
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible UI components
- **Lucide React** - Icon library
- **Framer Motion** - Smooth animations
- **Next Themes** - Dark/light mode support
- **date-fns** - Date formatting and manipulation

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Prisma ORM** - Type-safe database operations
- **SQLite** - Lightweight database storage

### AI Integration
- **z-ai-web-dev-sdk** - AI capabilities for:
  - Speech-to-Text (ASR) for voice input
  - Large Language Model (LLM) for text enhancement

### State Management
- **React Hooks** - useState, useEffect, useRef
- **Sonner** - Toast notifications

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Bun package manager (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/muhammadsalman1176/task-tracker.git
cd task-tracker

# Install dependencies
bun install

# Set up the database
bun run db:push

# Start development server
bun run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
# Development server
bun run dev

# Build for production
bun run build

# Start production server
bun start

# Run linting
bun run lint

# Push database schema
bun run db:push

# Generate Prisma client
bun run db:generate
```

## 📖 Usage Guide

### Adding a Task

1. **Enter Task Description**: Type your task in the text area
2. **Select Date**: Choose the date for the task using the date picker
3. **Choose Category**: Select a category from the dropdown
4. **Add Task**: Click the "Add Task" button

### Using Voice Input

1. Click the **microphone icon** to start recording
2. Speak your task description
3. Click the **square icon** to stop recording
4. The text will automatically appear in the task description field

### Enhancing with AI

1. Type or dictate your task description
2. Click the **"Enhance with AI"** button (✨ icon)
3. Review the enhanced version in the preview dialog
4. Click **"Apply Enhanced Version"** to use it or **"Keep Original"** to discard

### Managing Tasks

**View Tasks by Date (Calendar View):**
- Click on any date in the calendar to see tasks for that day
- The selected date's tasks will appear on the right side

**View All Tasks (List View):**
- Switch to the "List View" tab
- Tasks are grouped and sorted by date (newest first)

**Edit a Task:**
- Hover over a task card
- Click the **pencil icon** to edit
- Modify the description as needed
- Click **"Save"** to update or **"Cancel"** to discard changes

**Delete a Task:**
- Hover over a task card
- Click the **trash icon** to delete

## 📁 Project Structure

```
task-tracker/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── dev.db                 # SQLite database
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── tasks/
│   │   │   │   ├── route.ts   # GET, POST tasks
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts # PUT, DELETE task
│   │   │   ├── transcribe/
│   │   │   │   └── route.ts   # Voice-to-text endpoint
│   │   │   └── enhance/
│   │   │       └── route.ts   # AI text enhancement
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main application
│   ├── components/
│   │   └── ui/                # shadcn/ui components
│   └── lib/
│       ├── db.ts              # Prisma client
│       └── utils.ts           # Utility functions
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🗄️ Database Schema

```prisma
model Task {
  id          String   @id @default(cuid())
  description String
  date        String
  category    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 🤖 AI Features

### Speech-to-Text
- Converts voice recordings to text using ASR (Automatic Speech Recognition)
- Supports multiple languages
- Fast and accurate transcription

### Text Enhancement
The AI enhancement feature transforms basic task descriptions into:
- **Professional & Clear**: Well-structured, readable descriptions
- **Action-Oriented**: Clear steps and next steps
- **Detailed**: Relevant context and resources
- **First-Person**: Written from your perspective (e.g., "Tested", "Created")

**Example:**
```
Input:  "fix bug in login"
Output: "• Tested and resolved the login page authentication bug
          - Reproduced the issue in staging environment
          - Reviewed authentication flow and error logs
          - Implemented and tested the fix
          - Verified with QA team before deploying to production"
```

## 🎨 Customization

### Adding Categories
Edit the `CATEGORIES` array in `src/app/page.tsx`:

```typescript
const CATEGORIES = [
  'Work',
  'Personal',
  'Health',
  'Finance',
  'Shopping',
  'Learning',
  'Other',
  // Add your categories here
]
```

### Modifying AI Prompts
Edit the system prompt in `src/app/api/enhance/route.ts` to customize how the AI enhances text.

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- 📱 Mobile phones (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1280px+)

## 🔒 Privacy & Security

- All data is stored locally in SQLite database
- Voice recordings are processed server-side and not stored
- No external tracking or analytics
- Your data stays on your machine

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Muhammad Salman**

- GitHub: [@muhammadsalman1176](https://github.com/muhammadsalman1176)
- Project: [Task Tracker](https://github.com/muhammadsalman1176/task-tracker)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- AI capabilities powered by [z-ai-web-dev-sdk](https://z.ai)

---

**Task Tracker** - Organize your daily tasks efficiently with AI-powered assistance! 🚀
