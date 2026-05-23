# Project Documentation Reference

A plain-English guide to the standard documents used when scoping, designing, and handing off a project to a developer or team.

---

## The Documents at a Glance

| Doc | Full Name | Purpose | Required? |
|-----|-----------|---------|-----------|
| **Brief** | Creative Brief | Vision, tone, story — the "what are we making and why" | Almost always |
| **Spec** | Technical Specification | How to build it — architecture, components, acceptance criteria | For dev handoffs |
| **SOW** | Statement of Work | Legal/contractual scope, deliverables, timeline, price | When paying someone |
| **PRD** | Product Requirements Document | What the product must do — features, behaviors, edge cases | Larger teams/products |
| **Design Spec** | Design Specification | Exact visual rules — spacing, colors, breakpoints, component states | When a designer is involved |
| **Handoff Package** | (various names) | The bundle of all relevant docs passed to the developer | When handing off to someone else |

---

## Each Document in Detail

---

### Creative Brief

**What it is:**
The "north star" document. Describes the vision, the story, the audience, and the tone. Answers: *What are we making? Who is it for? How should it feel?*

**When to write it:**
Before any design or development starts. It aligns everyone on the destination before anyone starts building.

**Who writes it:**
The client, producer, or creative director.

**Who reads it:**
Designers, developers, animators — anyone making something.

**What it contains:**
- One-sentence pitch / the core story
- Audience description
- Tone and aesthetic direction (examples: "clean and technical, not salesy")
- Scene or section breakdown (for video/animation)
- Visual style notes
- Asset list (what needs to be gathered before work starts)

**Typical length:** 1–4 pages

**Example filename:** `creative-brief.md`

---

### Technical Specification (Spec)

**What it is:**
The "how to build it" document. Translates the creative brief into concrete technical instructions — file structure, component breakdown, data, configuration, and acceptance criteria.

**When to write it:**
After the creative brief is approved, before development starts.

**Who writes it:**
A tech lead, architect, or senior developer.

**Who reads it:**
The developer(s) building the project.

**What it contains:**
- Tech stack and framework details
- File/folder structure
- Component breakdown with props
- Configuration (e.g., timing tables, Remotion composition config)
- Data files (the actual data structures, ready to use)
- Acceptance criteria (a checklist of "done" conditions)

**Typical length:** 3–10 pages depending on project size

**Example filename:** `technical-spec.md`

---

### Statement of Work (SOW)

**What it is:**
A legal/contractual document. Protects both sides by defining exactly what is being built, by when, for how much, and what happens if things change.

**When to write it:**
When hiring a contractor, freelancer, or agency. Not needed for internal/solo work.

**Who writes it:**
Usually drafted by the client, reviewed and signed by both parties.

**Who reads it:**
Client + contractor (and sometimes lawyers).

**What it contains:**
- Project description and objectives
- Scope of work (what's included and explicitly what's NOT included)
- Deliverables list with acceptance criteria
- Timeline and milestones
- Payment terms
- Revision policy (how many rounds of changes are included)
- Ownership / IP clause (who owns the final work)
- Kill clause (what happens if the project is cancelled)

**Typical length:** 2–5 pages

**Example filename:** `sow.md` or `statement-of-work.pdf`

> **Note:** For small freelance gigs, a simpler "project agreement" or even a detailed email can substitute. SOWs are most important for larger contracts or when legal protection matters.

---

### Product Requirements Document (PRD)

**What it is:**
Describes *what* the product must do from a user and business perspective — not how to build it (that's the spec). Common in product management and larger teams.

**When to write it:**
When building a product with multiple stakeholders, or when features need to be formally approved before development.

**Who writes it:**
A product manager (PM).

**Who reads it:**
The whole team — design, engineering, QA, leadership.

**What it contains:**
- Problem statement (what user problem does this solve?)
- Goals and success metrics
- User stories ("As a user, I want to...")
- Feature list with priority (must-have vs. nice-to-have)
- Out of scope (what this version does NOT do)
- Open questions / dependencies

**Typical length:** 3–15 pages

**Example filename:** `prd.md`

> **Note:** For solo projects or small teams, a PRD is usually overkill. A good creative brief + technical spec covers the same ground more efficiently.

---

### Design Specification (Design Spec)

**What it is:**
The exact visual rules for the UI — spacing, colors, typography, component states, responsive breakpoints. Often exported directly from Figma or Sketch.

**When to write it:**
After design is finalized, before development starts.

**Who writes it:**
The designer.

**Who reads it:**
The front-end developer.

**What it contains:**
- Color palette with exact hex/RGB values
- Typography scale (font family, sizes, weights, line heights)
- Spacing system (padding, margins, grid)
- Component states (default, hover, active, disabled, error)
- Breakpoints for responsive layouts
- Icon set and usage rules
- Animation specs (duration, easing, which elements animate)

**Typical length:** Varies — often a Figma file with annotations, or a style guide document

**Example filename:** `design-spec.md` or a Figma link

> **Note:** For this Remotion project, the design tokens in `creative-brief.md` (colors, fonts, easing) serve as the design spec — it's small enough to not need a separate file.

---

### Handoff Package

**What it is:**
Not a single document — it's the organized bundle of everything a developer needs to start work. The "you have everything you need in this folder" moment.

**When to create it:**
When transitioning work from planning/design to development, especially when handing off to someone else.

**Who creates it:**
The PM, producer, or tech lead.

**What it contains:**
- All relevant docs (brief, spec, SOW if applicable)
- Design assets (screenshots, mockups, icons, fonts)
- Data files ready to drop in
- A `README.md` that explains what order to read things

**Example folder structure:**
```
handoff/
├── README.md              ← "Start here"
├── creative-brief.md
├── technical-spec.md
├── sow.md                 ← only if contractor
├── assets/
│   ├── screenshot-dashboard.png
│   ├── screenshot-terminal.png
│   └── logo.svg
└── data/
    └── folders.ts         ← ready to drop into src/data/
```

---

## Which Docs Do You Actually Need?

| Situation | Docs needed |
|-----------|-------------|
| Solo project, personal use | Brief + Spec |
| Handing off to a developer you trust | Brief + Spec + Handoff folder |
| Hiring a freelancer | Brief + Spec + SOW |
| Agency or larger team | Brief + Spec + SOW + PRD |
| Has a dedicated designer | Add Design Spec |

---

## The Order Documents Are Created

```
1. Creative Brief      ← What are we making?
2. PRD (if needed)     ← What must it do?
3. Design Spec         ← What does it look like?
4. Technical Spec      ← How do we build it?
5. SOW (if needed)     ← What are we agreeing to?
6. Handoff Package     ← Here's everything, go build it.
```

Each document depends on the one before it. You can't write a good technical spec without a clear creative brief. You can't write a meaningful SOW without a scope defined in the spec.

---

## Quick Reference: File Naming Conventions

| Document | Common filenames |
|----------|-----------------|
| Creative Brief | `creative-brief.md`, `brief.md` |
| Technical Spec | `technical-spec.md`, `spec.md`, `build-spec.md` |
| SOW | `sow.md`, `statement-of-work.md`, `contract.pdf` |
| PRD | `prd.md`, `requirements.md`, `product-brief.md` |
| Design Spec | `design-spec.md`, `style-guide.md`, Figma link |
| Handoff README | `README.md`, `HANDOFF.md`, `START-HERE.md` |
