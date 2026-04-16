# Tilt — AI Decision Layer PRD

## Original Problem Statement
Build "Tilt" — a browser-based AI decision layer that observes user context via screen sharing and helps users make better decisions in real-time. Evolved into a Cowork-style AI assistant that sees your screen and helps you get things done — not just decisions, but direct assistance.

## Architecture
- **Frontend**: React 18 + Tailwind CSS (Instrument Serif/Sans, Inter, JetBrains Mono fonts)
- **Backend**: FastAPI (Python) with Claude Sonnet 4.5 via Emergent LLM key
- **State**: localStorage for memory/adaptation (no auth, no DB)
- **Screen Sharing**: `navigator.mediaDevices.getDisplayMedia` with periodic captures every 10s
- **Vision Analysis**: Claude Sonnet 4.5 vision API analyzes captured screenshots
- **Floating Palette**: Document Picture-in-Picture API for cross-tab AI assistant

## Core Requirements
1. Landing page with Ghibli mountain aesthetic
2. Screen sharing with real AI vision context capture every 10s
3. **Floating PiP chat palette** that works on any tab/window
4. **Two modes**: Assist (direct conversational help) + Decide (Safe/Smart/Bold options)
5. **Continuous conversation** — input always visible, chat messages scroll
6. Memory layer tracking last 5 decisions, preferred style, tone traits
7. Adaptation system pre-selecting preferred style
8. Reflection layer showing usage patterns

## What's Been Implemented (Apr 16, 2026)
- [x] Landing page with Tilt branding, Ghibli background, CTA
- [x] Screen sharing with animated border overlay
- [x] **Real AI vision screen analysis** — captures every 10s, sends to Claude vision
- [x] `/api/analyze-screen` — accepts base64 JPEG, returns structured context
- [x] `/api/assist` — conversational AI endpoint (Cowork-style, uses screen context + history)
- [x] `/api/generate-decisions` — Safe/Smart/Bold decision engine
- [x] **Chat-style floating palette** with Assist / Decide mode toggle
- [x] **Continuous conversation** — input always at bottom, messages scroll above
- [x] Conversation history maintained throughout session
- [x] Screen context banner visible throughout conversation
- [x] Document Picture-in-Picture floating palette works on any tab
- [x] Cmd+K opens/focuses the floating palette
- [x] In-tab CommandPalette fallback for non-PiP browsers
- [x] **Keyboard arrow navigation** in decision mode
- [x] Copy-to-clipboard on any AI response
- [x] Memory layer — localStorage tracks last 5 decisions, preferences, tone traits
- [x] Adaptation — pre-highlights preferred style, biases LLM prompts
- [x] Reflection layer — "You usually prefer: Smart + Direct" insight chip

## Key API Endpoints
- `GET /api/health` — Health check
- `POST /api/analyze-screen` — `{image_base64}` → `{context, activity}` (Claude vision)
- `POST /api/assist` — `{message, screen_context, conversation, mode, user_preference, tone_traits}` → `{response, mode}` (conversational AI)
- `POST /api/generate-decisions` — `{input_text, context, user_preference, tone_traits}` → `{safe, smart, bold, reasoning}`

## Prioritized Backlog
### P1 (High)
- Drag-to-paste functionality

### P2 (Nice to have)
- Decision history sidebar
- Export decision history
- Custom tone profiles
