# CARNALYSYS WEBSITE DEVELOPMENT AGREEMENT

---

## Document Header

| Field | Details |
| --- | --- |
| Agreement Ref | [Reference No.] |
| Date | [DD MMM YYYY] |
| Prepared By | [Service Provider Legal Name] |
| Office Address | [Address Line 1], [Address Line 2], [City, State, PIN] |
| Contact | [Email] \| [Website URL] \| [Contact Number] |

### Parties

| Role | Party |
| --- | --- |
| **To** | [Client Contact Name], [Client Organization Name], [City] |
| **Provider** | [Service Provider Legal Name] |
| **Client** | [Client Legal Name] |

**Purpose**

- Agreement between **Provider** and **Client** for development, deployment, and one-year handling of the **CARNALYSYS Website Platform**.

---

## 1) Project Scope (Website Only)

**In one line:** A commerce website with public catalog and policies, signed-in users who can save favorites and complete a **purchase flow** (cart → checkout → order), backed by payments and order handling, an admin console for catalog and operations, and a stable secure API layer.

### Public Website

- Branded home and key marketing sections for first impressions and trust.
- Live catalog browsing with categories and product detail views.
- Search and filters so customers can find parts without friction.
- Policy and static pages (e.g. terms, shipping, contact) as agreed.

### User Account

- OTP-based sign-in with secure session handling.
- Profile management and saved delivery addresses.
- Favorites and wishlist tied to the signed-in user.
- End-to-end **purchase flow**: cart, checkout, order placement, and confirmation.
- Order history and order detail views with current status.

### Commerce

- Cart lifecycle: add/update/remove lines and persist state through checkout.
- Checkout and order placement with validation and clear customer feedback.
- Payment initiation and order/payment status handling (as per agreed provider/mode).
- Audit-ready order flow and records suitable for support and reconciliation.

### Admin Website

- Admin dashboard surfacing operational visibility (e.g. catalog and order activity as agreed).
- Product and category management (create, edit, organize, publish/unpublish as agreed).
- Order management and customer/user administration as agreed.
- Tools for day-to-day storefront operations without exposing full system internals publicly.

### Security & Stability

- Consistent global API error handling and customer-safe error messaging patterns.
- Request validation on critical inputs at API boundaries.
- Idempotency on agreed critical write paths to reduce duplicate charges or duplicate orders.
- Rate limiting on agreed sensitive endpoints (e.g. auth, OTP, and other abuse-prone APIs) to reduce brute-force and overload risk.
- Transaction boundaries and locking where needed to protect inventory and order integrity under concurrency.

**Notes**

- Website platform only; mobile application is out of base scope.
- Deliverables follow the scope modules above unless amended in writing.

---

## 2) Current Implementation Summary (Till Date)

**Note:** This subsection describes **frontend (UI) basics** delivered to date only. Backend, security hardening, and release/operations status are outside this summary.

- **Storefront (public)**
  - Core layout, navigation, and branded home/landing sections in place.
  - Catalog browsing and product detail views at basic completion level.
- **Search & discovery (UI)**
  - Search and catalog filter controls present in the UI at foundation level.
- **Account & sign-in (UI)**
  - OTP / sign-in and account-related screens (e.g. profile, addresses) at UI foundation level.
- **Cart & orders (UI)**
  - Cart drawer/summary and checkout-style flows represented in the UI at foundation level.
  - Order history and order detail screens at foundation level where wired.
- **Content pages (UI)**
  - Policy and other static/content pages available in the UI as agreed.
- **Admin (UI basics)**
  - Admin layout and primary screens for catalog, categories, orders, and users at foundation level.

---

## 3) Assumptions and Exclusions

**Assumptions**

- Agreement is for **website platform only** (not a mobile application).
- Scope is limited to requirements **discussed and mutually agreed**.

**Exclusions**

- Cloud, server, domain, SSL, and third-party charges are **excluded** unless explicitly included in writing.

**Process**

- Major enhancements outside this scope follow the **Change Request** process.

---

## 4) Commercials and Cost Estimation

### 4.1 Base Package (Included in INR 60,000)

The base package is **one fixed deliverable** billed as a **single line** in the table below (no per-phase invoicing split unless Parties agree otherwise in writing).

| Phase / Item | Description | Cost (INR) |
| --- | --- | ---: |
| **Single base package (all scope)** | Discovery, requirement freeze, and architecture baseline. **(a)** Core website implementation (frontend + backend modules). **(b)** Security hardening, testing, stabilization, documentation; production readiness, deployment, and handover. **(c)** One-year handling/support reserve (quarterly releases per this Agreement). | **60,000** |

### 4.2 Add-On Modules (Optional, Fixed Price)

| Add-On | Module | Scope | Fixed Price (INR) | Timeline |
| --- | --- | --- | ---: | --- |
| A1 | Advanced Analytics Dashboard | KPI and trend reporting views | 18,000 | 2–3 weeks |
| A2 | Production Payment Gateway Integration | Provider-specific live integration + callback hardening | 15,000 | 2 weeks |
| A3 | WhatsApp/SMS Automation | Customer/admin notification workflows | 9,000 | 1–2 weeks |
| A4 | SEO + Performance Optimization | Core Web Vitals and technical SEO improvements | 12,000 | 2 weeks |
| A5 | Multi-language Website | Multi-locale content and language switching | 14,000 | 2–3 weeks |
| A6 | Advanced Approval Workflow | Multi-role approval and escalation model | 16,000 | 2–3 weeks |

**Add-ons**

- Outside base INR 60,000; billable only after **written Client approval**.

---

## 5) Schedule and Deployment Cadence

- **Website development (core implementation):** **6 to 8 weeks** (calendar weeks) from project **kickoff**, for the base website scope in this Agreement, subject to the **approved sprint/milestone plan** and **timely Client inputs** (content, approvals, access). If the Client causes delay, the timeline may be extended accordingly.
- **Initial delivery:** Against scope **mutually agreed at contract sign-off**.
- **Implementation:** Per **approved sprint/milestone plan**.
- **Production cadence:** **Quarterly** (every 3 months) unless both Parties agree otherwise in writing.

### Planned Production Release Windows

- **Quarter 1:** Initial production launch
- **Quarter 2:** Planned production update
- **Quarter 3:** Planned production update
- **Quarter 4:** Planned production update + annual closure review

---

## 6) Terms and Conditions

- **When the Client must give feedback on defects:** During active development, or within **two weeks** after a delivery milestone. After that window, fixes for issues already known or reported may be treated as out of scope or a Change Request unless Parties agree otherwise.
- **Who pays for third-party costs:** Fees for third-party APIs, messaging/SMS, payment gateways, SSL certificates, domain registration, hosting, and similar services are paid by the **Client at actual cost** (what the vendor bills), unless this Agreement explicitly says a specific item is included in the Provider’s fixed price.
- **What the one-year period covers:** The **12-month handling period** (from production go-live) covers only what is listed under **§8 One-Year Handling and Support**—for example: **minor bug fixes**, **stability improvements**, **help coordinating quarterly releases**, and **triage / guidance on production issues**. It does **not** include building **new features**, **large redesigns**, or **re-platforming**; those need a **Change Request** or a separate agreement. In short: **keep the delivered product working and supported**, not **expand** it unless agreed.
- **Limit on Provider liability:** The Provider is **not responsible** for the Client’s lost revenue, lost profits, or other indirect business losses arising from use of the software, **except** where the law requires otherwise or where harm is caused by the Provider’s **gross negligence** or **deliberate wrongdoing** (**willful misconduct**).

---

## 7) Payment Terms

| Milestone | Amount (INR) | Condition |
| --- | ---: | --- |
| Advance Payment | 30,000 | At agreement sign-off / project kickoff |
| Final Payment | 30,000 | On completion of agreed scope and Client delivery sign-off |

**Payment**

- Invoices payable within **7 calendar days** of invoice date.
- **Non-refundable payments:** Any amount paid to the Provider under this Agreement (**advance**, **final**, or other agreed fees) is **earned and non-refundable** once paid, because work, capacity, and third-party commitments are allocated accordingly. **No return of payment** shall be required except where **mandatory law** requires otherwise or the **Parties agree in writing**.

---

## 8) One-Year Handling and Support

| Item | Detail |
| --- | --- |
| Period | **12 months** from **production go-live** |

### Included Support

| # | Item |
| --- | --- |
| 1 | Minor bug fixes and stability improvements |
| 2 | Quarterly deployment support and release coordination |
| 3 | Production issue triage and root-cause guidance |

### Response Targets (Business Hours)

| Priority | Initial Response |
| --- | --- |
| Critical | Within 4 hours |
| High | Within 1 business day |
| Medium / Low | Within 2 business days |

### Support Exclusions

| # | Exclusion |
| --- | --- |
| 1 | New feature builds outside agreed scope |
| 2 | Re-platforming / re-architecture work |
| 3 | Third-party vendor outages and external fee items |

---

## 9) Technology Stack Used

- **Frontend:** React, Vite, JavaScript, Tailwind-style tokenized CSS
- **Backend:** Java 17, Spring Boot, Spring Web, Spring Security
- **Data:** Spring Data JPA, PostgreSQL, Flyway
- **Auth:** OTP-based login flow with JWT/session handling
- **API architecture:** REST APIs with role-based admin/user separation
- **Reliability:** Validation, global exception handling, idempotency, rate limiting on agreed endpoints, transaction/locking controls

---

## 10) Acceptance, Change Requests, and Warranty

| # | Clause |
| --- | --- |
| 1 | Milestones accepted on **agreed deliverables** and closure of **critical defects**. |
| 2 | Requirements **outside agreed scope** = **Change Request (CR)**. |
| 3 | **Change Request pricing:** Enhancements/modifications/new requirements **after first delivery** → CR, **estimated and billed separately** after written approval. |
| 4 | Provider warrants **professional delivery** of agreed scope and support obligations. |

---

## 11) Legal and Sign-Off

| Field | For Service Provider | For Client |
| --- | --- | --- |
| Name | _____________________ | _____________________ |
| Designation | ______________ | ______________ |
| Signature | ________________ | ________________ |
| Date | _____________________ | _____________________ |

**Closing**

- Counter-sign and return within **2 business days** of receipt.
