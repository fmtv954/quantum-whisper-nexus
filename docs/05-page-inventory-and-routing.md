# Page Inventory and Routing

Complete list of all 87 pages organized by functional section, with routes, descriptions, and build priorities.

---

## 1. Authentication & Onboarding

### `/login`
**Description:** Email/password authentication with social auth option.  
**Priority:** MVP (Phase 1)

### `/signup`
**Description:** Account creation with plan selection (Starter, Professional, Enterprise).  
**Priority:** MVP (Phase 1)

### `/forgot-password`
**Description:** Password reset flow with email verification.  
**Priority:** MVP (Phase 1)

### `/verify-email`
**Description:** Email confirmation page with token validation.  
**Priority:** MVP (Phase 1)

### `/onboarding/welcome`
**Description:** Post-signup welcome wizard with quick setup guide.  
**Priority:** MVP (Phase 1)

### `/onboarding/campaign-setup`
**Description:** First campaign creation wizard with step-by-step guidance.  
**Priority:** MVP (Phase 1)

---

## 2. Dashboard & Analytics

### `/dashboard`
**Description:** Main overview with live metrics: active calls, leads today, conversion rate, cost tracking. Quick campaign creation, recent leads, system health indicators.  
**Priority:** MVP (Phase 1)

### `/dashboard/analytics`
**Description:** Detailed analytics: call volume trends, lead conversion funnel, cost per lead, campaign performance comparison, ROI calculations.  
**Priority:** Phase 2

### `/dashboard/performance`
**Description:** Performance metrics: AI accuracy scores, call duration analytics, handoff rates, latency monitoring.  
**Priority:** Phase 2

### `/dashboard/cost-monitoring`
**Description:** Real-time cost tracking: usage by service (LiveKit, Deepgram, GPT), budget alerts, optimization tips.  
**Priority:** Phase 2

---

## 3. Campaign Management

### `/campaigns`
**Description:** Campaign list view with status, performance metrics, quick actions. Filter by status, date, performance.  
**Priority:** MVP (Phase 1)

### `/campaigns/new`
**Description:** Campaign creation wizard: basic info, target audience, integration setup.  
**Priority:** MVP (Phase 1)

### `/campaigns/[id]`
**Description:** Campaign detail & settings: overview tab, configuration, performance snapshot.  
**Priority:** MVP (Phase 1)

### `/campaigns/[id]/analytics`
**Description:** Campaign-specific analytics: detailed metrics, conversion tracking, A/B testing results.  
**Priority:** Phase 2

### `/campaigns/[id]/widget`
**Description:** Widget customization: color scheme, positioning, trigger settings, embed code generation.  
**Priority:** Phase 2

### `/campaigns/[id]/qr-codes`
**Description:** QR code management: generate, download, track performance by QR code.  
**Priority:** Phase 2

---

## 4. AI Agent Configuration (Flow Designer)

### `/flows`
**Description:** Flow templates library: pre-built templates (real estate, sales, support), community templates, recently used.  
**Priority:** MVP (Phase 1)

### `/flows/designer/[campaignId]` ⭐ **CORE PAGE**
**Description:** Visual node editor (drag & drop). Node types: Start, Lead Gate, RAG Answer, Clarify, Dispatch, End. Agent personality settings (tone, voice, speaking style). Greeting configuration, Q&A knowledge base connection, lead qualification logic, handoff triggers. Real-time testing panel.  
**Priority:** MVP (Phase 1)

### `/flows/templates/[templateId]`
**Description:** Template details with customization options before applying to campaign.  
**Priority:** Phase 2

### `/flows/[id]/test`
**Description:** Standalone flow testing interface with scenario simulation and debug mode.  
**Priority:** Phase 2

### `/flows/[id]/version`
**Description:** Version history with rollback capability, diff viewer, change log.  
**Priority:** Phase 3

---

## 5. Knowledge Base Management

### `/knowledge`
**Description:** Knowledge base overview: source performance, search analytics, gap analysis.  
**Priority:** Phase 2

### `/knowledge/documents`
**Description:** Document library: PDF, DOCX, TXT upload with automatic processing. Document status (processing, active, error), search and filter.  
**Priority:** Phase 2

### `/knowledge/upload`
**Description:** Bulk upload interface: drag & drop, URL import, text paste, batch processing.  
**Priority:** Phase 2

### `/knowledge/sources`
**Description:** Web source management: website URLs, sitemap imports, RSS feeds, crawling status.  
**Priority:** Phase 3

### `/knowledge/analytics`
**Description:** Knowledge performance: most used sources, unanswered questions, confidence scores, coverage analysis.  
**Priority:** Phase 3

### `/knowledge/qna`
**Description:** Manual Q&A management: add/edit questions and answers, organize by category, priority setting.  
**Priority:** Phase 2

---

## 6. Leads Management

### `/leads`
**Description:** Leads table with advanced filtering: sort by date, score, status, campaign. Bulk actions, export, assign to team.  
**Priority:** MVP (Phase 1)

### `/leads/[id]`
**Description:** Lead detail page: full conversation transcript, collected data, lead score, qualification status, next steps, activity timeline, follow-up tasks.  
**Priority:** MVP (Phase 1)

### `/leads/import`
**Description:** Bulk lead import: CSV upload, field mapping, validation, error handling.  
**Priority:** Phase 3

### `/leads/export`
**Description:** Export leads: filter selection, format options (CSV, XLSX), scheduling for recurring exports.  
**Priority:** Phase 2

### `/leads/qualification`
**Description:** Lead scoring settings: score criteria, weighting, automation rules, threshold configuration.  
**Priority:** Phase 2

---

## 7. Team & Collaboration

### `/team`
**Description:** Team member management: invite team members, role assignment, activity tracking, status indicators.  
**Priority:** Phase 2

### `/team/roles`
**Description:** Role permissions: custom roles, permission templates, access levels (view, edit, admin).  
**Priority:** Phase 3

### `/settings/account`
**Description:** Account settings: company info, branding (logo, colors), default campaign settings.  
**Priority:** Phase 2

### `/settings/billing`
**Description:** Billing & subscription: plan details, usage metrics, payment methods, invoices, upgrade/downgrade.  
**Priority:** Phase 2

### `/settings/integrations`
**Description:** Integration configuration: Asana project mapping, Slack channel selection, CRM connections, webhook setup.  
**Priority:** Phase 2

### `/settings/security`
**Description:** Security settings: 2FA setup, session management, audit logs, API key management.  
**Priority:** Phase 3

---

## 8. Call Interface & Experience

### `/call/[campaignId]` ⭐ **CORE PAGE**
**Description:** Main call interface for end-users: voice AI with real-time transcript, audio visualizer, call controls (mute, end, handoff), information display. Responsive for mobile.  
**Priority:** MVP (Phase 1)

### `/call/ringing/[ticketId]`
**Description:** Ringing/loading state: professional pulsing animation, wait time estimation, cancel option.  
**Priority:** Phase 2

### `/call/ended`
**Description:** Call completion page: thank you message, next steps, follow-up options, feedback form (optional).  
**Priority:** Phase 2

### `/call/error`
**Description:** Error handling: friendly error messages, troubleshooting tips, retry button, support contact.  
**Priority:** Phase 2

### `/call/consent/[email]`
**Description:** Consent validation: email verification, privacy policy acceptance, terms acknowledgment before call starts.  
**Priority:** MVP (Phase 1)

---

## 9. Voice Settings & Configuration

### `/voice/settings`
**Description:** Voice AI configuration: TTS voice selection (Aura-1 female, Aura-2 male), speaking rate, pitch, emotion settings, audio quality preferences.  
**Priority:** Phase 2

### `/voice/preview`
**Description:** Voice preview tool: test different voices with custom text, compare voices side-by-side, save preferences.  
**Priority:** Phase 3

---

## 10. Agent Workspace (Human Handoff)

### `/agent/dashboard`
**Description:** Agent overview: pending handoffs, active calls, personal performance metrics, availability status.  
**Priority:** Phase 2

### `/agent/calls`
**Description:** Call queue management: prioritized handoff queue, filter by urgency/skill, accept/reject actions.  
**Priority:** Phase 2

### `/agent/handoff/[handoffId]`
**Description:** Handoff acceptance interface: live call interface with customer context, transcript history, lead information, knowledge base access, call controls, disposition options, CRM integration.  
**Priority:** Phase 2

### `/agent/availability`
**Description:** Availability management: status setting (available, busy, offline), working hours, skill tags, max concurrent calls.  
**Priority:** Phase 3

### `/agent/performance`
**Description:** Personal analytics: handoff metrics, resolution rates, customer satisfaction, average handle time.  
**Priority:** Phase 3

---

## 11. Handoff Administration

### `/handoff/rules`
**Description:** Handoff rule engine: automatic routing rules, skill-based assignment, escalation protocols, business hours configuration.  
**Priority:** Phase 3

### `/handoff/queue`
**Description:** Global queue view: all pending handoffs, assignment history, SLA monitoring, reassignment tools.  
**Priority:** Phase 3

### `/handoff/analytics`
**Description:** Handoff performance: wait time analytics, first-contact resolution, agent performance comparison, peak hours.  
**Priority:** Phase 3

---

## 12. System Administration

### `/admin/dashboard`
**Description:** System overview (super admin): system health, user activity across all accounts, billing overview, platform-wide metrics.  
**Priority:** Phase 3

### `/admin/users`
**Description:** User management: all users across organization, account status, usage analytics, support actions (suspend, reset, delete).  
**Priority:** Phase 3

### `/admin/billing`
**Description:** Billing administration: organization billing, usage reports, invoice management, payment processing.  
**Priority:** Phase 3

### `/admin/analytics`
**Description:** System-wide analytics: platform usage, feature adoption, performance trends, growth metrics.  
**Priority:** Phase 3

### `/admin/health`
**Description:** System health monitoring: service status, performance metrics, error rates, uptime tracking, alert configuration.  
**Priority:** Phase 3

---

## 13. Developer & API

### `/developer/api`
**Description:** API documentation: interactive API docs, authentication guide, rate limits, endpoint reference, code examples.  
**Priority:** Phase 3

### `/developer/webhooks`
**Description:** Webhook configuration: event subscriptions, payload customization, testing sandbox, delivery logs.  
**Priority:** Phase 3

### `/developer/sandbox`
**Description:** API testing sandbox: live API testing, code examples in multiple languages, SDK documentation, response inspection.  
**Priority:** Phase 4

### `/developer/logs`
**Description:** API request logs: request history, error tracking, performance analysis, filtering and search.  
**Priority:** Phase 4

---

## 14. Testing & Quality Assurance

### `/tools/call-simulator`
**Description:** Call simulation tool: test conversations without real calls, scenario testing, variable injection, edge case testing.  
**Priority:** Phase 3

### `/tools/audio-test`
**Description:** Audio quality testing: microphone testing, speaker test, latency measurement, echo detection.  
**Priority:** Phase 3

### `/tools/flow-test`
**Description:** Flow testing interface: step-through testing, debug mode, variable inspection, conditional logic validation.  
**Priority:** Phase 2

### `/tools/diagnostics`
**Description:** Real-time system diagnostics: connection status, service health, performance metrics, network analysis.  
**Priority:** Phase 2

---

## 15. Analytics & Reporting

### `/analytics/calls`
**Description:** Call analytics deep dive: call recording playback, sentiment analysis, topic clustering, keyword tracking.  
**Priority:** Phase 3

### `/analytics/leads`
**Description:** Lead conversion analytics: conversion funnel visualization, lead source analysis, ROI calculation, cohort analysis.  
**Priority:** Phase 2

### `/analytics/cost`
**Description:** Cost analysis and optimization: cost by service, efficiency metrics, optimization suggestions, budget forecasting.  
**Priority:** Phase 2

### `/analytics/export`
**Description:** Data export tools: custom reports, scheduled exports, data visualization, shareable dashboards.  
**Priority:** Phase 3

---

## 16. Widget & Integration

### `/embed/widget/[campaignId]`
**Description:** Widget embed generator: embed code, customization options, installation guide, preview.  
**Priority:** Phase 2

### `/embed/qr/[campaignId]`
**Description:** QR code generator: style customization, tracking parameters, bulk generation, download formats.  
**Priority:** Phase 2

### `/embed/preview`
**Description:** Widget preview tool: real-time preview, mobile/desktop testing, A/B testing, performance simulation.  
**Priority:** Phase 3

### `/embed/settings`
**Description:** Widget behavior settings: trigger conditions (time delay, scroll, exit intent), display rules, targeting options, frequency capping.  
**Priority:** Phase 3

---

## 17. Development Tools

### `/dev/component-library`
**Description:** UI component library: all components with props documentation, examples, usage guidelines, accessibility notes.  
**Priority:** Phase 4

### `/dev/design-system`
**Description:** Design system documentation: design tokens, spacing, typography, color usage, interaction patterns.  
**Priority:** Phase 4

### `/dev/debug`
**Description:** Debugging tools: state inspection, event logs, performance profiling, React DevTools integration.  
**Priority:** Phase 4

### `/dev/performance`
**Description:** Performance monitoring: bundle analysis, load times, optimization suggestions, lighthouse scores.  
**Priority:** Phase 4

---

## 18. Live Monitoring

### `/monitor/live-calls`
**Description:** Real-time call monitoring: active calls map, call details, real-time transcripts, join-in capability for supervisors.  
**Priority:** Phase 3

### `/monitor/system-status`
**Description:** System status dashboard: service status indicators, uptime metrics, incident history, planned maintenance.  
**Priority:** Phase 2

### `/monitor/alerts`
**Description:** Alert management: alert rules configuration, notification settings (email, Slack, SMS), alert history, acknowledgment workflow.  
**Priority:** Phase 3

### `/monitor/performance`
**Description:** Live performance metrics: real-time dashboards, key metrics visualization, anomaly detection, threshold alerts.  
**Priority:** Phase 3

---

## 19. Security Center

### `/security/audit`
**Description:** Security audit log: user actions, data access logs, security events, IP tracking, compliance reporting.  
**Priority:** Phase 3

### `/security/compliance`
**Description:** Compliance documentation: GDPR, CCPA, SOC2 compliance status and controls, audit trail, certification downloads.  
**Priority:** Phase 4

### `/security/consent`
**Description:** Consent management: consent records by lead, privacy settings, data processing agreements, opt-out handling.  
**Priority:** Phase 3

### `/security/data`
**Description:** Data management: data export requests, deletion requests, retention policies, data anonymization.  
**Priority:** Phase 3

---

## 20. Education & Support

### `/learn/getting-started`
**Description:** Getting started guide: step-by-step tutorials, video guides, best practices, common use cases.  
**Priority:** Phase 2

### `/learn/tutorials`
**Description:** Video tutorials: feature walkthroughs, use case examples, advanced tips, recorded webinars.  
**Priority:** Phase 3

### `/learn/best-practices`
**Description:** Implementation best practices: industry-specific guides (real estate, healthcare, B2B), optimization tips, success metrics.  
**Priority:** Phase 3

### `/learn/faq`
**Description:** Frequently asked questions: searchable FAQ, common issues, troubleshooting, categorized by topic.  
**Priority:** Phase 2

---

## 21. Legal & Compliance

### `/privacy`
**Description:** Privacy policy with GDPR compliance details.  
**Priority:** MVP (Phase 1)

### `/terms`
**Description:** Terms of service for platform usage.  
**Priority:** MVP (Phase 1)

### `/gdpr`
**Description:** GDPR compliance information and user rights.  
**Priority:** Phase 2

### `/security-practices`
**Description:** Security practices documentation for enterprise customers.  
**Priority:** Phase 3

### `/accessibility`
**Description:** Accessibility statement (WCAG 2.1 AA compliance).  
**Priority:** Phase 2

---

## API Routes Structure

```
/app/api/
├── auth/[...nextauth]/route.ts          # Authentication
├── campaigns/
│   ├── route.ts                         # GET (list), POST (create)
│   ├── [id]/route.ts                    # GET, PUT, DELETE
│   ├── [id]/analytics/route.ts          # Campaign analytics
│   └── [id]/widget/route.ts             # Widget configuration
├── calls/
│   ├── start/route.ts                   # Initialize call
│   ├── end/route.ts                     # End call
│   ├── [id]/transcript/route.ts         # Get transcript
│   └── [id]/handoff/route.ts            # Request handoff
├── leads/
│   ├── route.ts                         # GET (list), POST (create)
│   ├── [id]/route.ts                    # GET, PUT, DELETE
│   ├── import/route.ts                  # Bulk import
│   └── export/route.ts                  # Export leads
├── knowledge/
│   ├── documents/route.ts               # Document CRUD
│   ├── search/route.ts                  # RAG search
│   ├── upload/route.ts                  # File upload
│   └── qna/route.ts                     # Manual Q&A pairs
├── flows/
│   ├── route.ts                         # GET (list), POST (create)
│   ├── [id]/route.ts                    # GET, PUT, DELETE
│   ├── [id]/test/route.ts               # Flow testing
│   └── templates/route.ts               # Flow templates
├── handoff/
│   ├── request/route.ts                 # Request handoff
│   ├── accept/route.ts                  # Accept handoff
│   ├── queue/route.ts                   # Handoff queue
│   └── rules/route.ts                   # Routing rules
├── voice/
│   ├── settings/route.ts                # Voice configuration
│   ├── tts/route.ts                     # TTS synthesis
│   └── stt/route.ts                     # STT processing
├── analytics/
│   ├── dashboard/route.ts               # Dashboard metrics
│   └── export/route.ts                  # Data export
├── billing/
│   ├── subscription/route.ts            # Subscription management
│   └── invoice/route.ts                 # Invoice generation
├── admin/
│   ├── users/route.ts                   # User management
│   └── system/route.ts                  # System administration
└── tools/
    ├── simulate/route.ts                # Call simulation
    └── diagnostics/route.ts             # System diagnostics
```

---

## Priority Build Order Summary

### Phase 1 (MVP Core): ~12 pages
Authentication, Dashboard, Campaigns, Flow Designer, Call Interface, Leads Management, Legal pages

### Phase 2 (Essential Features): ~18 pages
Knowledge Base, Voice Settings, Agent Handoff, Analytics, Settings, Widgets, Support pages

### Phase 3 (Advanced Features): ~35 pages
Admin tools, Handoff rules, Security, Testing tools, Monitoring, Advanced analytics

### Phase 4 (Enterprise & Scale): ~22 pages
Developer portal, Component library, Advanced compliance, Performance tools

**Total: 87 pages**

---

**Next Steps:**  
Proceed to `docs/06-prompting-and-agent-guidelines.md` for AI agent configuration best practices.
