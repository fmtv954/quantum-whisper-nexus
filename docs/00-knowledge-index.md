# Knowledge Index

This folder contains the canonical documentation for the Quantum Voice AI Platform. These documents serve as the single source of truth for all development, design, and architectural decisions.

## Documentation Files

### `01-vision-and-product-overview.md`
**What it covers:** Product vision, value proposition, target market, use cases, and business model.

**Use this when:**
- Onboarding new team members or stakeholders
- Explaining the platform's core value proposition
- Defining product scope and non-goals
- Pitching to investors or customers
- Making product prioritization decisions

---

### `02-tech-stack-and-integrations.md`
**What it covers:** Complete technology stack, service providers, versions, and integration details.

**Use this when:**
- Setting up development environments
- Evaluating technology choices or alternatives
- Troubleshooting service integration issues
- Planning infrastructure scaling
- Documenting dependencies for security audits

---

### `03-architecture-and-core-flows.md`
**What it covers:** System architecture, component interactions, data flows, and core user journeys.

**Use this when:**
- Understanding how data flows through the system
- Designing new features that interact with existing components
- Debugging complex multi-service issues
- Planning scaling or performance optimizations
- Onboarding engineers to the system architecture

---

### `04-design-system-and-ux-principles.md`
**What it covers:** "Cyber Luxury" design aesthetic, UI components, design tokens, interaction patterns, and UX guidelines.

**Use this when:**
- Building new UI components or pages
- Ensuring visual consistency across the platform
- Making design decisions about colors, typography, or spacing
- Implementing responsive layouts
- Creating accessibility-compliant interfaces

---

### `05-page-inventory-and-routing.md`
**What it covers:** Complete list of all 87 pages, routes, priorities, and API endpoints.

**Use this when:**
- Planning sprint work or feature development
- Understanding the full scope of the platform
- Routing or navigation implementation
- Determining build priorities (MVP vs. later phases)
- Creating sitemaps or navigation structures

---

### `06-prompting-and-agent-guidelines.md`
**What it covers:** AI agent behavior, conversational tone, prompt engineering best practices, and guardrails.

**Use this when:**
- Configuring conversation flows or AI agent personalities
- Writing system prompts for GPT models
- Defining AI response patterns and constraints
- Implementing RAG (Retrieval Augmented Generation) logic
- Training or onboarding conversation designers

---

### `07-data-model-reference.md`
**What it covers:** Complete database schema, table relationships, RLS policies, TypeScript types, and data flow examples.

**Use this when:**
- Implementing database queries or mutations
- Understanding multi-tenant data isolation
- Creating new tables or modifying schema
- Working with TypeScript types for data
- Debugging data access or permission issues
- Planning data migrations

---

## Critical Guidelines

### For All Development Work:
1. **Always reference these docs first** before implementing new features
2. **Do not contradict** architectural decisions documented here
3. **Update docs immediately** when making significant architectural changes
4. **Use canonical terminology** from these docs in code and comments
5. **Link to specific doc sections** in PR descriptions and technical discussions

### For AI-Assisted Development:
- Reference these docs by name in prompts (e.g., "See docs/05-page-inventory-and-routing.md for route structure")
- Use exact token names from the design system (space_black, matrix_blue, etc.)
- Follow the architectural patterns defined in 03-architecture-and-core-flows.md
- Implement prompting patterns from 06-prompting-and-agent-guidelines.md

---

## AI (Lovable) Behavior Rules

**MANDATORY:** When generating or modifying code, Lovable AI MUST follow these rules:

### 1. Route & Page Structure (docs/05)
- ✅ **ONLY create routes** explicitly listed in `docs/05-page-inventory-and-routing.md`
- ✅ **Use correct paths** exactly as specified (e.g., `/flows/designer/[campaignId]`, not `/flow-builder/[id]`)
- ✅ **Follow build priorities** (Phase 1 MVP first, then Phase 2, etc.)
- ❌ **DO NOT invent** new top-level routes or sections not in the page inventory
- ⚠️ **If a new route is needed:** Ask to update `docs/05` first, then implement

### 2. Architecture & Data Flows (docs/03)
- ✅ **Respect subsystem boundaries** (e.g., Voice Pipeline, Flow Engine, Knowledge Base are separate concerns)
- ✅ **Follow established data flows** (e.g., Call flow: User → LiveKit → Deepgram STT → GPT → RAG → TTS → User)
- ✅ **Use correct state management** (React Context for global, TanStack Query for server state, Zustand for complex UI)
- ❌ **DO NOT bypass** the voice pipeline or create alternative architectures
- ⚠️ **If architecture changes:** Document in `docs/03` before implementing

### 3. Technology Stack (docs/02)
- ✅ **ONLY use services** listed in the tech stack (LiveKit, Deepgram, GPT-4-mini, Gemini, Tavily, Supabase, Redis)
- ✅ **Use specified versions** and configurations from `docs/02`
- ❌ **DO NOT substitute** providers (e.g., don't use Twilio instead of LiveKit, or Anthropic instead of OpenAI)
- ❌ **DO NOT add** new major dependencies without explicit approval
- ⚠️ **If a technology change is proposed:** Update `docs/02` with rationale first

### 4. Design System & Visual Style (docs/04)
- ✅ **ALWAYS use design tokens** (space_black, matrix_blue, cyber_green, electric_purple, neon_pink, carbon_gray, steel, silver)
- ✅ **NEVER use direct colors** like `text-white`, `bg-white`, `text-black` - use semantic tokens instead
- ✅ **Follow layout patterns** (Mission Control, Three-Panel Workspace, Centered Single-Column, Table-Centric)
- ✅ **Reuse component patterns** (Metric Card, CTA Button variants, Data Table, Modal, Toast, etc.)
- ✅ **Apply "Cyber Luxury" aesthetic** (SpaceX precision + Google Cloud usability + Amazon conversion)
- ❌ **DO NOT create** entirely new design languages or ignore the token system
- ⚠️ **If design needs change:** Propose updates to `docs/04` first

### 5. AI Agent Prompts & Behavior (docs/06)
- ✅ **Follow prompting guidelines** for conversation flows (concise, helpful, bounded)
- ✅ **Use specified node types** (Start, Lead Gate, RAG Answer, Clarify, Dispatch, End)
- ✅ **Apply cost-aware strategies** (GPT-4-mini primary, escalate to larger models only when needed)
- ✅ **Respect guardrails** (never invent info, never pretend to be human, handle sensitive data properly)
- ❌ **DO NOT create** custom node types or conversation patterns not in `docs/06`
- ⚠️ **If new AI patterns are needed:** Document in `docs/06` first

### 6. Conflict Resolution
- ⚠️ **When a prompt conflicts with docs:**
  1. **Flag the conflict** explicitly in the response
  2. **Explain which doc section** is being contradicted
  3. **Ask for clarification** or confirmation before proceeding
  4. **Prefer the docs** as the default unless user explicitly overrides

### 7. Documentation Updates
- ✅ **If implementing a significant new feature:** Suggest updating relevant docs
- ✅ **If discovering a doc inaccuracy:** Note it and suggest a correction
- ✅ **Keep docs in sync** with code as the project evolves

---

## Copy-Paste Rule Set for Future Prompts

**Use this template when prompting Lovable:**

```
[Reference Docs]
- Route structure: docs/05-page-inventory-and-routing.md
- Design system: docs/04-design-system-and-ux-principles.md
- Architecture: docs/03-architecture-and-core-flows.md
- Tech stack: docs/02-tech-stack-and-integrations.md

[Task]
Build [feature name] according to the docs above.

[Requirements]
- Use design tokens from docs/04 (space_black, matrix_blue, etc.)
- Follow [layout pattern] from docs/04
- Implement [data flow] from docs/03
- Use [specific technologies] from docs/02
- Respect route structure in docs/05

[Verification]
- Route matches docs/05: [yes/no]
- Design tokens from docs/04: [yes/no]
- Architecture from docs/03: [yes/no]
- Stack from docs/02: [yes/no]
```

### Document Maintenance:
- **Owner:** Technical Lead / Engineering Manager
- **Review Cycle:** After major feature releases or architectural changes
- **Version Control:** Track changes in Git with descriptive commit messages
- **Access:** All engineering team members should have read access

---

## Quick Reference

| Need to...                          | See Document |
|-------------------------------------|--------------|
| Understand the product value        | 01           |
| Set up a dev environment            | 02           |
| Trace a data flow                   | 03           |
| Build a new UI component            | 04           |
| Find a specific route/page          | 05           |
| Configure AI agent behavior         | 06           |
| Query or modify database schema     | 07           |

---

**Last Updated:** 2025-11-13  
**Maintained By:** Engineering Team  
**Status:** Canonical Reference - Do Not Contradict
