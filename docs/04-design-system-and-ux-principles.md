# Design System and UX Principles

## Visual Style: "Cyber Luxury"

**Design Philosophy:** Blend the precision of SpaceX Mission Control, the usability of Google Cloud Console, and the conversion optimization of Amazon—all wrapped in a futuristic, premium aesthetic.

**Tone:** Cutting-edge but approachable, technical but not intimidating, premium but not cold.

---

## Design Tokens

### Color Palette

```typescript
DesignTokens {
  primary_palette: {
    space_black: '#000000',      // Primary background
    matrix_blue: '#00D4FF',      // Primary accent, CTAs, glows
    cyber_green: '#00FF88',      // Success states, positive metrics
    electric_purple: '#8B5CF6',  // Highlight, secondary accent
    neon_pink: '#FF0080',        // Errors, warnings, danger actions
    carbon_gray: '#1A1A1A',      // Surface backgrounds, cards
    steel: '#2D2D2D',            // Borders, dividers, inactive elements
    silver: '#E5E5E5'            // Secondary text, muted content
  }
}
```

**Usage Guidelines:**
- **space_black:** Main app background, deep contrast areas
- **matrix_blue:** Primary buttons, active states, focus rings, brand elements
- **cyber_green:** Success messages, upward trends, positive metrics, active calls
- **electric_purple:** Feature highlights, premium badges, secondary CTAs
- **neon_pink:** Error states, delete actions, critical warnings
- **carbon_gray:** Card backgrounds, panels, elevated surfaces
- **steel:** Borders, dividers, disabled states, subtle separators
- **silver:** Body text, labels, placeholder text, secondary info

### Typography

**Primary Font:** Inter (sans-serif)
- **Usage:** Headers, body text, UI labels
- **Weights:** 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)

**Monospace Font:** JetBrains Mono
- **Usage:** Code snippets, API keys, technical data, transcript text
- **Weights:** 400 (Regular), 600 (Semi-Bold)

**Scale:**
```css
h1: 2.5rem (40px) - Page titles
h2: 2rem (32px) - Section headers
h3: 1.5rem (24px) - Card titles
h4: 1.25rem (20px) - Subsection headers
body: 1rem (16px) - Body text
small: 0.875rem (14px) - Labels, captions
xs: 0.75rem (12px) - Micro-copy, timestamps
```

### Spacing System

```css
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
3xl: 4rem (64px)
```

### Visual Effects

**Glow Effects:**
```css
matrix_blue_glow: 0 0 20px rgba(0, 212, 255, 0.3)
hologram_effect: 0 0 30px rgba(0, 255, 136, 0.2)
danger_glow: 0 0 20px rgba(255, 0, 128, 0.4)
```

**Glass Morphism:**
```css
backdrop-filter: blur(10px)
background: rgba(26, 26, 26, 0.7)
border: 1px solid rgba(229, 229, 229, 0.1)
```

**Grid Lines (Background):**
```css
repeating-linear-gradient(
  0deg,
  transparent,
  transparent 49px,
  rgba(0, 212, 255, 0.05) 49px,
  rgba(0, 212, 255, 0.05) 50px
)
```

---

## Core Layout Patterns

### 1. Mission Control Layout (Dashboard)

**Structure:**
```
┌────────────────────────────────────────────────────┐
│  Header: Logo, Nav, Status Indicator, User Menu   │
├──────────┬─────────────────────────────┬───────────┤
│  Left    │  Central Workspace          │  Right    │
│  Panel:  │  (Main metrics/content)     │  Panel:   │
│  Quick   │                             │  System   │
│  Actions │                             │  Health   │
│          │                             │           │
├──────────┴─────────────────────────────┴───────────┤
│  Bottom: Recent Activity Stream / Notifications    │
└────────────────────────────────────────────────────┘
```

**Use Cases:** Dashboard, Admin Panel, Monitoring

### 2. Three-Panel Workspace (Flow Designer)

**Structure:**
```
┌──────────┬──────────────────────────┬──────────────┐
│  Node    │  Visual Flow Designer    │  Properties  │
│  Library │  (Canvas)                │  Panel       │
│          │                          │              │
│  [Drag]  │  [Node-based editor]     │  [Configure] │
│          │                          │              │
└──────────┴──────────────────────────┴──────────────┘
```

**Use Cases:** Flow Designer, Knowledge Management

### 3. Centered Single-Column (Call Interface)

**Structure:**
```
┌────────────────────────────────────────────────────┐
│  Header: Call Info, Status, Timer                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Central: Real-time Transcript                     │
│  (Scrollable, with speaker labels)                 │
│                                                    │
├────────────────────────────────────────────────────┤
│  Bottom: Minimal Controls (Mute, End, Handoff)    │
└────────────────────────────────────────────────────┘
```

**Use Cases:** Call Interface, Agent Handoff View

### 4. Table-Centric (Leads Management)

**Structure:**
```
┌────────────────────────────────────────────────────┐
│  Header + Filters/Search Bar                       │
├────────────────────────────────────────────────────┤
│                                                    │
│  Data Table (sortable, filterable)                 │
│  [Rows with hover actions]                         │
│                                                    │
├────────────────────────────────────────────────────┤
│  Pagination + Bulk Actions                         │
└────────────────────────────────────────────────────┘
```

**Use Cases:** Leads Management, Campaign List, Knowledge Base Library

---

## Component Library

### Metric Card
**Visual:** Carbon gray background, steel 1px border, matrix blue glow on hover  
**Content:** Large value (2rem, electric purple), label (0.875rem, silver), optional delta badge (cyber green up, neon pink down)  
**Use Cases:** Dashboard KPIs, analytics summaries

### CTA Button (Primary)
**Visual:** Matrix blue gradient background, white text, subtle glow, scale transform on hover  
**States:** Default, Hover (brighter glow), Active (pressed scale), Disabled (steel bg, silver text)  
**Use Cases:** "Create Campaign," "Start Call," "Publish Flow"

### CTA Button (Secondary)
**Visual:** Steel background, silver text, matrix blue border on hover  
**States:** Default, Hover (matrix blue ring), Active, Disabled  
**Use Cases:** "Cancel," "Save Draft," "Export Data"

### CTA Button (Danger)
**Visual:** Neon pink gradient, white text, pulse animation on hover  
**States:** Default, Hover (stronger glow), Active, Disabled  
**Use Cases:** "Delete Campaign," "End Call," "Remove Agent"

### Data Table
**Visual:** Carbon gray rows, steel borders, silver text, matrix blue active row highlight  
**Features:** Sortable headers, hover row highlight, inline actions on hover, selection checkboxes  
**States:** Loading skeleton, empty state with illustration, error state  
**Use Cases:** Leads, Campaigns, Knowledge Base documents

### Modal/Dialog
**Visual:** Glass morphism background (blur), carbon gray surface, steel border, matrix blue header accent  
**Layout:** Header (title + close), body (content), footer (actions)  
**Animations:** Fade in + scale from 0.95 to 1.0  
**Use Cases:** Confirmations, forms, detail views

### Toast Notification
**Visual:** Floating card with glass effect, auto-dismiss after 5s  
**Variants:**
- Success: Cyber green left border, checkmark icon
- Error: Neon pink left border, alert icon
- Info: Matrix blue left border, info icon
- Warning: Electric purple left border, warning icon  
**Position:** Top-right corner, stacked vertically

### Audio Visualizer
**Visual:** Real-time waveform bars (matrix blue), reactive to audio volume, smooth animations  
**States:** Idle (minimal pulse), Speaking (active bars), Listening (blue glow)  
**Use Cases:** Call interface, voice preview

### Status Indicator (SpaceX-style)
**Visual:** Small circular dot with glow  
**States:**
- Active: Cyber green glow, pulsing
- Warning: Electric purple, steady
- Error: Neon pink, rapid pulse
- Offline: Steel, dim  
**Use Cases:** System health, agent availability, call status

### Progress Bar
**Visual:** Thin bar (4px), matrix blue fill, steel track, rounded ends  
**Animation:** Smooth fill transition, optional indeterminate state (sliding gradient)  
**Use Cases:** File upload, processing status, campaign progress

---

## Interaction Patterns

### Hover States
- **Cards:** Subtle lift (2px translateY), matrix blue glow on border
- **Buttons:** Scale 1.02, brighter glow, cursor pointer
- **Table Rows:** Carbon gray → steel background transition, show inline actions
- **Icons:** Rotate or scale slightly, color shift to matrix blue

### Loading States
- **Sequential Dot Animation:** Three dots (•••) fade in/out in sequence (SpaceX-inspired)
- **Skeleton Screens:** Gray shimmer effect on placeholder content
- **Spinner:** Rotating matrix blue ring (for full-page loads)

### Success States
- **Checkmark Animation:** Scale in + bounce, cyber green color
- **Toast Notification:** Slide in from right with fade
- **Inline Feedback:** Icon change + color shift (matrix blue → cyber green)

### Error States
- **Shake Animation:** Horizontal shake on invalid input
- **Neon Pink Glow:** Error ring on input fields
- **Inline Error Message:** Below field, small text, neon pink color with alert icon

### Transitions
- **Duration:** 200-400ms for most interactions
- **Easing:** cubic-bezier(0.4, 0, 0.2, 1) - smooth acceleration/deceleration
- **Purpose:** Functional, not decorative; guide user attention

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- **Color Contrast:** Minimum 4.5:1 for body text, 3:1 for large text (18px+)
- **Focus Indicators:** Visible matrix blue ring (2px) on all interactive elements
- **Keyboard Navigation:** All actions accessible via keyboard, logical tab order
- **Screen Reader Support:** Semantic HTML, ARIA labels on custom components
- **Alt Text:** All images and icons have descriptive alternative text

### Dark Theme Considerations
- Ensure silver text (#E5E5E5) on carbon_gray (#1A1A1A) meets 4.5:1 contrast
- Avoid pure white (#FFFFFF) text; use silver for reduced eye strain
- Test with colorblind simulators (matrix blue / cyber green distinguishable)

---

## Responsive Design

### Breakpoints
```css
xs: 0-639px (Mobile)
sm: 640-767px (Large Mobile)
md: 768-1023px (Tablet)
lg: 1024-1279px (Small Desktop)
xl: 1280-1535px (Desktop)
2xl: 1536px+ (Large Desktop)
```

### Mobile Adaptations
- **Navigation:** Hamburger menu, full-screen overlay on space_black
- **Hero Sections:** Stack vertically, full-width buttons
- **Tables:** Horizontal scroll or card-based layout for narrow screens
- **Flow Designer:** Simplified node editor, properties panel as bottom sheet
- **Metric Cards:** Single column stack, full-width

---

## Animation Principles (SpaceX-Inspired)

### 1. Purpose Over Decoration
Every animation must serve a functional purpose: guide attention, indicate state change, provide feedback.

### 2. Performance First
- 60fps minimum for all animations
- Use CSS transforms (translateX/Y, scale, rotate) for hardware acceleration
- Avoid animating width/height; use transform: scale instead
- Debounce hover states on large lists

### 3. Subtle and Fast
- Quick interactions: 150-300ms
- Complex transitions: 400-600ms
- Avoid animations longer than 1 second (user impatience)

---

## Empty State Patterns

### No Data Yet
**Visual:** Centered illustration (simple line art, matrix blue accent), short copy, primary CTA  
**Example:** "No campaigns yet. Create your first campaign to get started."  
**CTA:** "Create Campaign" button

### Search/Filter No Results
**Visual:** Magnifying glass icon, "No results found" message, suggestion to adjust filters  
**CTA:** "Clear Filters" button

### Error State (Failed Load)
**Visual:** Alert icon (neon pink), error message, retry CTA  
**Example:** "Failed to load data. Please try again."  
**CTA:** "Retry" button (secondary style)

---

## UX Tone and Voice

### Conversational but Professional
- Use contractions ("You're all set" not "You are all set")
- Avoid jargon unless necessary (prefer "voice assistant" over "NLP agent")
- Be helpful without being condescending

### Actionable and Direct
- Use imperatives for actions ("Create campaign," not "You can create a campaign")
- Short sentences, clear instructions
- Avoid passive voice

### Confident but Not Arrogant
- Acknowledge errors honestly ("Something went wrong" not "Oops, our bad")
- Celebrate successes briefly ("Campaign created" not "Woohoo! You did it!")
- Empower users ("You can now…" not "We've allowed you to…")

---

## Figma Reference Frames

*Note: These are logical design groupings from the source documentation. Actual Figma URLs are not included here.*

- **"Mission Control"** - Dashboard and admin panel layouts
- **"Flow Designer v2"** - Node-based conversation editor
- **"Call Interface"** - Real-time voice conversation UI
- **"Component Library"** - Reusable UI components with variants
- **"Mobile Views"** - Responsive adaptations for xs/sm breakpoints

---

**Next Steps:**  
Proceed to `docs/05-page-inventory-and-routing.md` for complete route specifications.
