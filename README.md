# EXAMER

EXAMER is a cutting-edge, AI-powered educational and tutoring application designed to provide personalized mentoring and interactive study experiences. Built with a modern web stack, it leverages an intelligent agentic architecture to guide students through their learning journey.

## 🚀 Features

- **AI-Powered Mentorship**: Utilizes Google's Gemini models to provide a React-style (Reasoning and Acting) single-agent tutoring experience.
- **Interactive Study Engine**: Features active recall, concept cards, reading panes, and a dedicated Feynman Technique input tool (`/api/feynman`) to test and solidify understanding.
- **Personalized Dashboards**: Real-time analytics, kinetic score displays, speed tracking (`useSpeedTracker`), and predicted score calculations (`usePredictedScore`).
- **Comprehensive Assessment**: Generates mock tests, custom routines, and study questions dynamically via deterministic AI tool calls.
- **Syllabus Parsing**: Upload and parse syllabi to create tailored study pathways.
- **WhatsApp Integration**: Hooks into WhatsApp (`/api/webhook/whatsapp`) for accessible studying on the go.
- **Onboarding Flow**: Step-by-step onboarding (Syllabus Upload -> MCQ Test -> Favorite Subject -> Study Time) to uniquely profile each user.
- **Observability**: Integrated OpenTelemetry tracing (`lib/tracing.ts`) to monitor and assure the reliability of the agent loops.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI & Styling**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/), [GSAP](https://gsap.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (Auth, Mentor, Metrics, Study stores)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Auth, Firestore), Mongoose
- **AI Integration**: Google Generative AI (`@google/genai`, `@google/generative-ai`)

## 🧠 Agentic Design Strategy

EXAMER follows practical design patterns for agentic AI systems adapted from Google Cloud's guidance, balancing autonomy with deterministic reliability:

1. **Single-Agent + ReAct Loop**: The primary flow relies on a single intelligent tutor agent (`src/lib/agent/agent.ts`) that reasons, calls tools, observes results, and answers. This allows for fast product iteration and strong personalization.
2. **Deterministic Workflows**: Predictable operations (like generating quizzes, evaluating answers, or tracking study stats) use direct, deterministic tool calls (`src/app/api/agent/tools`) rather than full autonomous routing.
3. **Loop Guardrails**: Strict constraints (`maxToolLoopIterations`, `maxToolCallsPerTurn`, `maxToolLoopDurationMs`) protect against runaway reasoning loops, keeping latency and costs predictable.

## 📂 Project Structure

```text
src/
├── app/                  # Next.js App Router (Pages, Layouts, API routes)
│   ├── (auth)/           # Login, Signup, Onboarding flows
│   ├── (dashboard)/      # Analytics, Mock tests, Settings, Study hub
│   └── api/              # API endpoints (Agent, Feynman, Mocks, Webhooks)
├── components/           # Reusable UI components
│   ├── analytics/        # Charts, score displays
│   ├── global/           # Navbars, Sidebars, Global Mentor
│   ├── mentor/           # Mentor messaging UI
│   ├── onboarding/       # Multi-step onboarding components
│   ├── study-engine/     # Active recall, concept cards, reading modes
│   └── ui/               # Core UI elements (Buttons, Cards, Modals)
├── hooks/                # Custom React hooks (Mentor sync, scores, speeds)
├── lib/                  # Core utilities and services
│   ├── agent/            # Prompting, tool configurations, memory
│   ├── firebase/         # Firebase admin, config, firestore operations
│   ├── gemini/           # Gemini client setup
│   ├── llm/              # LLM providers
│   └── scoring/          # Logic for predictive scoring
├── store/                # Zustand global state slices
└── types/                # TypeScript interfaces and type definitions
```

## 💻 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- Firebase Project Setup
- Google Gemini API Key

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables. Ensure you have the necessary keys for Firebase and Google Gemini API (Refer to the codebase or provide a `.env.example`).

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the outcome.

### Testing

Run the testing suite for the scoring predictor:
```bash
npm run test
```
