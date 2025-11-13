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

---

**Last Updated:** 2025-11-13  
**Maintained By:** Engineering Team  
**Status:** Canonical Reference - Do Not Contradict
