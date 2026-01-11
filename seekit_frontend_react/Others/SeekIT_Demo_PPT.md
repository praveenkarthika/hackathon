# Seek-IT
### An AI Assisted IT platform

**Engineering Team:**
- SivaPriya
- Priti D
- Kishore
- Adhiyanman
- Akash Selvam

**Mentor:**
- Praveen Karthik A

# Slide 1 — Problem Statement & Scope

**Problem Statement**
IT teams manage a high volume of incidents across applications, infrastructure, access, and performance. Manual triage and categorization lead to inconsistent prioritization, delayed routing, SLA breaches, and increased mean time to response (MTTR).

**Scope**
- AI-assisted incident categorization and prioritization
- Automated routing and resolution suggestions
- Integration with IT ticketing workflows (mocked ITSM)
- Governance, auditability, and operational visibility

**Meetup with Real Users**
As an inevitable step, we had meeting with the real users to understand the pain points above and beyond the actual problem statement.
---

# Slide 2 — Solution Overview (What We Built)



- AI-assisted incident intake and triage via chatbot
- Automated ticket creation with structured categorization
- Priority assignment based on impact and urgency
- Intelligent routing to the appropriate support team
- Human-in-the-loop for all critical actions

**Outcome:** Faster response, consistent triage, and improved service reliability

---

# Slide 3 — System Framing (Core Value Proposition)

AI-assisted incident intake + triage (chatbot → ticket)

Structured ITSM workflow
- Categorization (primary & secondary)
- Priority assignment
- Agent assignment
- SLA tracking
- Audit logging

Governance & traceability layer
- Audit logs
- Comment history
- Status transitions

Additional pain points addressed
  Platform unification vision
  - IT Helpdesk
  - Asset register
  - Vendor & subscription tracking

**This is not just a chatbot.**

**This is an IT operations control plane prototype. And the chatbot can be integrated with any application for application specific user assitance.**



---

# Slide 4 — End-to-End Incident Flow

1. User raises IT query via chatbot (integrated with applications)
2. AI suggests resolution to the user (up to two attempts)
3. If unresolved, user confirms ticket creation
4. Ticket is automatically created in the IT Helpdesk portal
5. Incident is categorized, prioritized, and assigned
6. SLA, comments, and status changes are tracked
7. Audit logs capture all actions for traceability

---

# Slide 5 — High-Level Architecture

- Frontend
  - Chatbot interface
  - IT Helpdesk web portal
  - Dashboards and ticket management

- AI Assistance Layer
  - Incident understanding and categorization suggestions
  - Resolution and knowledge-base recommendations

- ITSM Core
  - Ticket lifecycle management
  - Categorization and priority logic
  - Assignment and SLA tracking

- Governance Layer
  - Audit logs
  - Comment history
  - User action traceability

---

# Slide 6 — Design & SDLC Highlights

- Clear separation of concerns across layers
- Rule-based logic with AI-assisted recommendations
- Human approval enforced
- Extensible design for additional IT operations modules
- Governance and auditability built into core workflows

---

# Slide 7 — Additional Pain Points Addressed

Beyond the core problem statement, the platform demonstrates extensibility by addressing additional IT operations challenges:

- Asset Register Management
  - Centralized tracking of IT assets

- Vendor & Subscription Management
  - Subscription expiry tracking
  - Proactive renewal and action readiness

- Unified Audit Register
  - Single view of operational and governance events

These modules are implemented as placeholders to demonstrate scalability and future integration.

---

# Slide 8 — Dashboards & Operational Visibility

- SLA compliance status
- Average resolution time trends
- Ticket distribution by category and agent
- Breach and performance indicators

**Result:** Improved visibility for IT teams and leadership

---

# Slide 9 — Security, Compliance & Governance

- Comprehensive audit logging for all ticket actions
- User attribution for create, edit, and status changes
- Comment tracking for incident collaboration
- Application Security Verification Standard: ASVS-aligned security considerations (input handling, access control, logging)

Designed for audit readiness and operational governance

---

# Slide 10 — Outcomes & Impact

- Reduced mean time to response (MTTR)
- Improved SLA adherence through consistent prioritization
- Faster and more accurate routing of incidents
- Strong foundation for AI-assisted IT operations
- Unified control plane for IT operations

---

# Slide 11 — Summary & Vision

- AI-assisted, not AI-autonomous
- Human-in-the-loop by design
- Governance-first IT operations platform
- Scalable foundation for future ITSM, asset, and vendor management integration

**A practical, enterprise-ready approach to intelligent IT incident management.**

