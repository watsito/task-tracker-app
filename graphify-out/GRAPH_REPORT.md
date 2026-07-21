# Graph Report - .  (2026-07-19)

## Corpus Check
- 153 files · ~103,535 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 849 nodes · 1393 edges · 53 communities (44 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Projects & Reports UI
- Core Architecture & Auth
- Finance API Routes
- Odoo Integration Panel
- Odoo Dashboard API
- NPM Dependencies
- TypeScript References
- Idea Refinement Framework
- Package & Config
- CI/CD Automation Skills
- Observability Skills
- Marketing Reports & jsPDF
- API Design Skills
- User Management UI
- Source/Spec Driven Dev
- Git & Versioning Skills
- Performance Optimization
- Security & Hardening
- Documentation Skills
- Debugging Skills
- Frontend UI Skills
- Code Review & Quality
- Planning & Task Breakdown
- Shipping & Launch
- Code Simplification
- Context Engineering
- Test Driven Dev
- Browser Testing
- Interview & Doubt Skills
- Incremental Implementation
- Skill Architecture
- Deprecation & Migration
- Documentation & ADRs
- Architecture Docs
- SOP Governance
- Lead Management
- Department System
- Odoo XML-RPC Service
- Prisma Schema & DB
- Next.js App Router
- Task Board UI
- Marketing Dashboard
- Management Dashboard
- Auth API Routes
- Lead Sources API
- SVG Assets
- Docker Configuration

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser()` - 39 edges
2. `useAuthStore` - 25 edges
3. `Dokumentasi Progress Kerja — Task Tracker App` - 25 edges
4. `AuthGuard()` - 17 edges
5. `useTaskStore` - 16 edges
6. `TaskStatus` - 16 edges
7. `Task` - 16 edges
8. `compilerOptions` - 16 edges
9. `TaskPriority` - 12 edges
10. `CI/CD and Automation Skill` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Agent Execution Model (Determine-Invoke-Follow-Proceed)` --semantically_similar_to--> `Mandatory Five-Phase Workflow`  [INFERRED] [semantically similar]
  AGENTS.md → Docs/SOP-DEV-AI-001.md
- `Anti-Rationalization Rules` --semantically_similar_to--> `SDD Governance Principles (8 Principles)`  [INFERRED] [semantically similar]
  AGENTS.md → Docs/SOP-DEV-AI-001.md
- `Prisma 7 + PostgreSQL Stack` --conceptually_related_to--> `Prisma Schema (schema.prisma)`  [INFERRED]
  Docs/dokumentasi.md → ARCHITECTURE.md
- `exportToPdf()` --references--> `jspdf`  [EXTRACTED]
  src/features/reports/utils/exportUtils.ts → package.json
- `Architecture Constitution` --references--> `ARCHITECTURE.md — Task Tracker App Constitution`  [EXTRACTED]
  Docs/SOP-DEV-AI-001.md → ARCHITECTURE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Authentication and Session Management Flow** — src_lib_auth, src_features_tasks_store_authstore, src_features_tasks_components_authguard, src_app_api_auth_login, src_app_api_auth_logout, src_app_api_auth_me [EXTRACTED 1.00]
- **Lead Management System (Form, API, Dashboard)** — concept_lead_source, concept_lead_entry, concept_draft_system, src_app_lead_sources_page, src_app_lead_sources_id_page, src_app_api_lead_sources, src_app_api_lead_sources_id, src_app_api_lead_entries, src_features_tasks_components_marketingdashboard [EXTRACTED 1.00]
- **Spec-Driven Development Governance Framework** — concept_spec_driven_development, concept_architecture_constitution, concept_change_proposal, concept_review_gate, rationale_mandatory_workflow, rationale_sdd_governance_principles, rationale_ai_code_review_checklist [EXTRACTED 1.00]
- **Security and Validation at Boundaries** — skills_api_and_interface_design_skill_md_validate_at_boundaries, skills_browser_testing_with_devtools_skill_md_untrusted_browser_data, skills_browser_testing_with_devtools_skill_md_profile_isolation, skills_code_review_and_quality_skill_md_five_axis_review [INFERRED 0.85]
- **CI Quality Enforcement System** — skills_ci_cd_and_automation_skill_md_quality_gate_pipeline, skills_ci_cd_and_automation_skill_md_github_actions, skills_ci_cd_and_automation_skill_md_shift_left, skills_ci_cd_and_automation_skill_md_build_cop, skills_code_review_and_quality_skill_md_five_axis_review [INFERRED 0.75]
- **Code Health Pipeline** — skills_code_review_and_quality_skill_md_structural_remedies, skills_code_simplification_skill_md_five_principles, skills_code_simplification_skill_md_chestertons_fence, skills_code_simplification_skill_md_simplification_process, skills_code_review_and_quality_skill_md_dead_code_hygiene [INFERRED 0.85]
- **he_doubt_debug_context_loop** — skills_doubt-driven-development_skill, skills_debugging-and-error-recovery_skill, skills_context-engineering_skill [INFERRED 0.75]
- **he_deprecation_versioning_docs_lifecycle** — skills_deprecation-and-migration_skill, skills_git-workflow-and-versioning_skill, skills_documentation-and-adrs_skill [INFERRED 0.85]
- **he_debug_git_context_agent_loop** — skills_debugging-and-error-recovery_skill, skills_git-workflow-and-versioning_skill, skills_context-engineering_skill [INFERRED 0.75]
- **Observability Telemetry Pillars** — skills_observability-and-instrumentation_skill_structured_logging, skills_observability-and-instrumentation_skill_red_metrics, skills_observability-and-instrumentation_skill_use_metrics, skills_observability-and-instrumentation_skill_distributed_tracing [INFERRED 1.00]
- **Security Defense-in-Depth Layers** — skills_security-and-hardening_skill_stride_analysis, skills_security-and-hardening_skill_rate_limiting, skills_security-and-hardening_skill_secrets_management, skills_security-and-hardening_skill_ssrf_prevention [INFERRED 1.00]
- **Shipping Readiness Gate** — skills_shipping-and-launch_skill_shipping, skills_observability-and-instrumentation_skill_observability, skills_security-and-hardening_skill_security, skills_performance-optimization_skill_performance_optimization [INFERRED 1.00]
- **Source-Driven Development Complete Process** — skills_source_driven_development_skill, skills_source_driven_development_detect_fetch_implement_cite, skills_source_driven_development_source_hierarchy, skills_source_driven_development_citation_rules [INFERRED 1.00]
- **Lifecycle Integration of Core Skills** — skills_using_agent_skills_lifecycle_sequence, skills_spec_driven_development_skill, skills_source_driven_development_skill, skills_test_driven_development_skill [INFERRED 1.00]
- **Test Quality Principles Cluster** — skills_test_driven_development_damp_over_dry, skills_test_driven_development_test_double_preference, skills_test_driven_development_test_pyramid, skills_test_driven_development_test_sizes [INFERRED 0.85]

## Communities (53 total, 9 thin omitted)

### Community 0 - "Projects & Reports UI"
Cohesion: 0.05
Nodes (53): Milestone, Project, ExportPanel(), ImportPanel(), ImportState, ReportsContent(), PRIORITY_CONFIG, ReportStats() (+45 more)

### Community 1 - "Core Architecture & Auth"
Cohesion: 0.06
Nodes (45): ARCHITECTURE.md — Task Tracker App Constitution, Prisma Schema (schema.prisma), GET(), POST(), GET(), GET(), EMPTY_CHANNELS, POST() (+37 more)

### Community 2 - "Finance API Routes"
Cohesion: 0.05
Nodes (48): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), FinanceProjectDetailContent(), formatCurrency() (+40 more)

### Community 3 - "Odoo Integration Panel"
Cohesion: 0.08
Nodes (28): EMPTY_CONFIG, OdooIntegrationPanel(), STATUS_CONFIG, SyncStatusBadge(), SyncStatusBadgeProps, mapPriorityToOdoo(), TODO: [IMPLEMENT] Ganti simulasi di bawah dengan fetch nyata ke Odoo., TODO: [IMPLEMENT] Ganti blok ini dengan fetch nyata: (+20 more)

### Community 4 - "Odoo Dashboard API"
Cohesion: 0.11
Nodes (31): GET(), OdooMany2One, OdooProject, OdooStage, OdooTaskGroup, GET(), getInitials(), OdooMany2One (+23 more)

### Community 5 - "NPM Dependencies"
Cohesion: 0.06
Nodes (31): bcryptjs, chart.js, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, jspdf-autotable, next, dependencies (+23 more)

### Community 6 - "TypeScript References"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 7 - "Idea Refinement Framework"
Cohesion: 0.09
Nodes (29): ideation session examples, Analogous Inspiration, Constraint-Based Ideation, First Principles Thinking, How Might We framework, Jobs to Be Done (JTBD), Pre-mortem, SCAMPER framework (+21 more)

### Community 8 - "Package & Config"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/bcryptjs (+19 more)

### Community 9 - "CI/CD Automation Skills"
Cohesion: 0.10
Nodes (28): CI/CD and Automation Skill, Build Cop, CI Optimization, Dependabot / Renovate, Environment Management, Faster is Safer, Feature Flags, GitHub Actions CI (+20 more)

### Community 10 - "Observability Skills"
Cohesion: 0.10
Nodes (26): Correlation IDs, Distributed Tracing, Observability, RED Metrics, Structured Logging, Symptom-Based Alerting, USE Metrics, Core Web Vitals (+18 more)

### Community 11 - "Marketing Reports & jsPDF"
Cohesion: 0.11
Nodes (10): jspdf, jspdf, CHANNEL_LABELS, MarketingChannelPerformance(), CHANNEL_LABELS, LeadEntryExportItem, MarketingExportPanel(), MarketingLeadEntryDetail (+2 more)

### Community 12 - "API Design Skills"
Cohesion: 0.13
Nodes (21): API and Interface Design Skill, Branded Types for IDs, Consistent Error Semantics, Contract First, Discriminated Unions for Variants, Hyrum's Law, Input/Output Separation, One-Version Rule (+13 more)

### Community 13 - "User Management UI"
Cohesion: 0.15
Nodes (12): UserManagement(), PAGE_LABELS, PageAccess, PAGES, PERMISSION_COLORS, PERMISSION_LABELS, TEAM_LABELS, TeamName (+4 more)

### Community 14 - "Source/Spec Driven Dev"
Cohesion: 0.18
Nodes (19): Citation Rules, Detect-Fetch-Implement-Cite Process, Source-Driven Development, Source Hierarchy, Spec Gated Workflow, Spec-Driven Development, Spec Six Core Areas, Browser Testing with DevTools (+11 more)

### Community 15 - "Git & Versioning Skills"
Cohesion: 0.16
Nodes (7): LoginPage(), ProfileContent(), SettingsContent(), DepartmentSwitcher(), HeaderUser(), useAuthStore, DEPARTMENTS

### Community 16 - "Performance Optimization"
Cohesion: 0.12
Nodes (11): COMING_SOON, DEFAULT_ROLE_PAGE_ACCESS, OdooConnectionResponse, OdooConnectionStatus, ROLE_OPTIONS, RoleAndPermission(), RoleKey, RoleOption (+3 more)

### Community 17 - "Security & Hardening"
Cohesion: 0.12
Nodes (8): AppHeader(), hasPageAccess(), NAV_ALL, NAV_FINANCE, NAV_MANAGEMENT, NAV_MARKETING, NAV_OPERATIONAL, NotificationEntry

### Community 18 - "Documentation Skills"
Cohesion: 0.15
Nodes (8): COMING_SOON, metadata, AuthGuard(), hasPageAccess(), PAGE_DEPARTMENT_MAP, ROUTE_TO_PAGE, PAGE_ROUTES, PageKey

### Community 19 - "Debugging Skills"
Cohesion: 0.16
Nodes (12): inter, metadata, Theme, ThemeContext, ThemeContextValue, ThemeProvider(), useTheme(), CHANNEL_ICONS (+4 more)

### Community 20 - "Frontend UI Skills"
Cohesion: 0.18
Nodes (12): ALL_ZERO_VALUES, ChannelKey, CHANNELS, createEmptyDirectInput(), createEmptyMultipleInputs(), createEmptySavedDrafts(), DirectLeadInput, filterLeadEntries() (+4 more)

### Community 21 - "Code Review & Quality"
Cohesion: 0.19
Nodes (11): COLUMN_STYLES, ColumnStyle, getColumnStyle(), OdooBoard(), OdooProjectsResponse, formatDateRange(), getAvatarColor(), OdooProjectCard() (+3 more)

### Community 22 - "Planning & Task Breakdown"
Cohesion: 0.20
Nodes (14): deprecation-and-migration, Adapter Pattern (Migration), Compulsory vs Advisory Deprecation, Feature Flag Migration, Hyrum's Law, Strangler Pattern, Zombie Code, git-workflow-and-versioning (+6 more)

### Community 23 - "Shipping & Launch"
Cohesion: 0.24
Nodes (13): Architecture Constitution, Change Proposal, Review Gate, Spec-Driven Development (SDD), SOP-DEV-AI-001 — Standar Penggunaan AI Coding Tools, AI Code Review Checklist, Anti-Rationalization Rules, Agent Execution Model (Determine-Invoke-Follow-Proceed) (+5 more)

### Community 24 - "Code Simplification"
Cohesion: 0.17
Nodes (12): Next.js 16 + React 19 Tech Stack, Odoo Integration (stub/bridge), Prisma 7 + PostgreSQL Stack, Dokumentasi Progress Kerja — Task Tracker App, Login API Route (src/app/api/auth/login/route.ts), Logout API Route (src/app/api/auth/logout/route.ts), Current User API Route (src/app/api/auth/me/route.ts), Lead Sources API Route (src/app/api/lead-sources/route.ts) (+4 more)

### Community 25 - "Context Engineering"
Cohesion: 0.18
Nodes (4): chartOptions, OdooDashboard(), OdooDashboardData, STAGE_COLORS

### Community 26 - "Test Driven Dev"
Cohesion: 0.18
Nodes (5): Lead Source Detail API Route (src/app/api/lead-sources/[id]/route.ts), ChannelKey, CHANNELS, LeadEntryItem, LeadSourceDetail

### Community 27 - "Browser Testing"
Cohesion: 0.25
Nodes (7): roles, RoleToggle(), AuthState, getDefaultDepartment(), getStoredDepartment(), AppUser, UserRole

### Community 28 - "Interview & Doubt Skills"
Cohesion: 0.22
Nodes (10): Trust Levels for Loaded Files, debugging-and-error-recovery, Safe Fallback Patterns, Stop-the-Line Rule, Triage Checklist, doubt-driven-development, Adversarial Review Prompt, Cross-Model Escalation (+2 more)

### Community 29 - "Incremental Implementation"
Cohesion: 0.22
Nodes (9): context-engineering, Confusion Management, Context Hierarchy, Context Packing Strategies, Inline Planning Pattern, documentation-and-adrs, Architecture Decision Records (ADRs), Documentation for Agents (+1 more)

### Community 30 - "Skill Architecture"
Cohesion: 0.28
Nodes (5): Check Deadlines API Route (src/app/api/notifications/check-deadlines/route.ts), HomePage(), ManagementDashboard(), BOARD_MODES, BoardMode

### Community 31 - "Deprecation & Migration"
Cohesion: 0.22
Nodes (4): ChannelKey, CHANNELS, LeadEntryItem, LeadSourceDetail

### Community 32 - "Documentation & ADRs"
Cohesion: 0.25
Nodes (8): contract-first slicing, feature flags for incomplete features, increment cycle, incremental-implementation skill, risk-first slicing, scope discipline, simplicity first principle, vertical slicing

### Community 34 - "SOP Governance"
Cohesion: 0.33
Nodes (6): Docker Dev Service, Node.js 18 Alpine, Docker Prod Service, Geist Font, Next.js, Vercel Platform

### Community 35 - "Lead Management"
Cohesion: 0.33
Nodes (5): client, milestones, projects, tasks, users

### Community 37 - "Odoo XML-RPC Service"
Cohesion: 0.50
Nodes (4): Draft System for Lead Input, Lead Entry, Lead Source, Lead Entries API Route (src/app/api/lead-entries/route.ts)

### Community 38 - "Prisma Schema & DB"
Cohesion: 0.50
Nodes (4): frontend-ui-engineering, WCAG 2.1 AA Accessibility, Component Architecture, State Management Hierarchy

### Community 39 - "Next.js App Router"
Cohesion: 1.00
Nodes (3): Department System (Marketing, Operational, Management), Role-Based Access Control, Revisian 1 — Revision Notes

## Knowledge Gaps
- **211 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+206 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `jspdf` connect `Marketing Reports & jsPDF` to `Projects & Reports UI`, `NPM Dependencies`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `dependencies` connect `NPM Dependencies` to `Package & Config`, `Marketing Reports & jsPDF`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `exportToPdf()` connect `Projects & Reports UI` to `Marketing Reports & jsPDF`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _211 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Projects & Reports UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05052125100240577 - nodes in this community are weakly interconnected._
- **Should `Core Architecture & Auth` be split into smaller, more focused modules?**
  _Cohesion score 0.06034801925212884 - nodes in this community are weakly interconnected._
- **Should `Finance API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.051360842844600525 - nodes in this community are weakly interconnected._