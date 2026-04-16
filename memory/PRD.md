# Tilt — AI Decision Layer PRD

## Original Problem Statement
Build "Tilt" — a browser-based AI decision layer that observes user context via screen sharing and helps users make better decisions in real-time. Not a chatbot — a decision system. Single-page, keyboard-first, minimal, fast.

## Architecture
- **Frontend**: React 18 + Tailwind CSS (Outfit/Satoshi/JetBrains Mono fonts)
- **Backend**: FastAPI (Python) with Claude Sonnet 4.5 via Emergent LLM key
- **State**: localStorage for memory/adaptation (no auth, no DB needed for user data)
- **Screen Sharing**: `navigator.mediaDevices.getDisplayMedia` with periodic captures every 7s

## User Personas
- Professionals composing important messages/replies
- Anyone needing structured decision options for communication

## Core Requirements
1. Landing page with dark premium aesthetic
2. Screen sharing flow with context capture
3. Command palette (Cmd+K / Ctrl+K)
4. Decision engine: Safe / Smart / Bold options
5. Output view with copy + reasoning
6. Memory layer tracking preferences
7. Adaptation system pre-selecting preferred style

## What's Been Implemented (Apr 16, 2026)
- [x] Full landing page with Tilt branding, headline, CTA
- [x] Screen sharing via getDisplayMedia with animated border overlay
- [x] Periodic screen capture every 7 seconds with context labels
- [x] Global Cmd+K / Ctrl+K command palette with glassmorphism
- [x] Decision engine using Claude Sonnet 4.5 (GPT-5.2 fallback)
- [x] 3-option decision UI (Safe/Smart/Bold) with bento grid layout
- [x] Output view with copy-to-clipboard and reasoning
- [x] localStorage memory system tracking preferences
- [x] Adaptation: pre-highlights preferred style, biases prompts
- [x] Reflection layer showing "You usually prefer: X" insight
- [x] All interactive elements have data-testid attributes
- [x] 100% backend tests passed, 95% frontend tests passed

## Prioritized Backlog
### P0 (Critical)
- None — MVP complete

### P1 (High)
- Real screen OCR/vision for context extraction (currently simulated)
- Decision history view/recall

### P2 (Nice to have)
- Export decision history
- Keyboard navigation within decision cards
- Sound/haptic feedback on selection
- Custom tone profiles

## Next Tasks
- User testing and feedback collection
- Enhance context capture with actual screen content analysis
- Add decision history sidebar
