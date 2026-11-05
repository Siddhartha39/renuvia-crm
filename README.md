# ♻️ Renuvia Recycling CRM — Certified E-Waste & Corporate ITAD Platform

Production-ready, responsive, full-stack Customer Relationship Management (CRM) web application tailored for **Renuvia Recycling**.

> **Mission:** Renuvia was built to solve a growing problem — companies generating e-waste faster than they can manage it.
>
> What looks like scrap is actually a mix of sensitive data, valuable materials, and compliance risk. Most businesses discovered this too late — after a data breach, a regulatory fine, or a PR disaster.
>
> We step in to handle all of it. **Securely. Transparently. At scale.**
>
> From collection to certified recycling, every step is handled with precision, compliance, and accountability.
> We work with companies that don't have the time, systems, or expertise to deal with electronic waste internally — and can't afford to get it wrong.

Built with **React + Vite**, **Tailwind CSS**, and backed by **Google Firebase Cloud Firestore** & **Firebase Authentication** (`renuvia-crm`).

---

## 🎨 Neumorphic (Soft UI) Eco-Tech Design System

The application features a modern, tactile Neumorphic (Soft UI) digital workspace:
- **Base Surface:** Cool Clay Monochromatic canvas (`#E0E5EC`) where visual depth and hierarchy emerge from physical shadow play.
- **Eco-Tech Accents:** Emerald Green (`#059669` / `#10B981`) and Deep Teal (`#0D9488`) conveying environmental sustainability, certified security, and high reliability.
- **Dual Opposing Alpha Shadows:** Top-left white highlight (`rgba(255, 255, 255, 0.5)`) and bottom-right cool clay shadow (`rgba(163, 177, 198, 0.6)`).
- **Physical States:** Extruded surface for interactive cards, deep inset wells (`shadow-neu-pressed-deep`) for text inputs, and smooth active press states.
- **Typography:**
  - **Headings & Display:** Plus Jakarta Sans (`font-extrabold` / `font-bold`)
  - **Body & Forms:** DM Sans
- **High Operational Usability:** WCAG AA compliant contrast ratios (`#3D4852` text), touch targets (44px minimum), and high information density for rapid client telecalling and account management.

---

## 🚀 Key Features

### 1. Master Client & E-Waste Database (`/leads`)
- Central client registry with unique atomic sequential IDs (e.g. `RR-10001`).
- Real-time search across corporate client name, contact phone, RR ID, and disposal requirements.
- Multi-dimensional filters for Lead Category (Hot, Warm, Cold), Status (New, Contacted, Follow-up, Converted, Lost, Do Not Contact), and sorting.
- Phone number normalization (Indian 10-digit standard) with duplicate client detection.
- Specialized enterprise fields: corporate client type, e-waste volume/scope, estimated asset recovery budget, EPR compliance tags.

### 2. Hot, Warm, and Cold Lead Management
- **🔥 Hot Leads (`/leads/hot`):** Immediate disposal need, urgent bulk decommission, or impending compliance deadlines requiring rapid MOU signing.
- **⚡ Warm Leads (`/leads/warm`):** Evaluating ITAD proposals, estimating scrap weight, or seeking EPR compliance documentation.
- **❄️ Cold Leads (`/leads/cold`):** Long-term corporate pipeline with scheduled callbacks for upcoming IT hardware refresh cycles.
- Lead categories are independent of follow-up dates and preserve historical progression.

### 3. Date-Wise Daily Follow-Up Engine (`/followups/*`)
- Fully calibrated to the **Asia/Kolkata (IST)** business timezone.
- **Today's Follow-ups (`/followups/today`):** Real-time calling queue due today.
- **Overdue Follow-ups (`/followups/overdue`):** Incomplete past-due tasks that remain prominently flagged until worked or rescheduled.
- **Upcoming Follow-ups (`/followups/upcoming`):** Dynamic forward pipeline (7, 15, 30 days).
- **Completed Follow-ups (`/followups/completed`):** Audit trail of resolved tasks.
- **Interactive Calendar (`/followups/calendar`):** Monthly grid with live task counts per day; click any date to open its scheduled outreach list.

### 4. Permanent Corporate Calling History & Disposition Modal
- Complete client outreach timeline with audit records.
- Atomic multi-document writes: records call log, updates client's latest feedback and lead category, creates or updates scheduled follow-up tasks, and writes to `auditLogs`.
- Call outcomes tailored for e-waste & ITAD:
  - *Interested (Quote Requested)*
  - *Site Audit / Inspection Scheduled*
  - *Compliance & Data Destruction Review*
  - *Converted / Contract & MOU Signed*
  - *Follow-up with IT / Facility Head*
  - *Call Back Later*
  - *No Scrap Generated at Present*
  - *No Answer / Busy*
  - *Not Interested / Existing Vendor*
- **Data Integrity:** Historical call feedback is strictly append-only and never overwritten by subsequent calls.

### 5. Excel (.xlsx, .xls) & CSV Bulk Import/Export Hub (`/import-export`)
- **Multi-Format Support:** Ingestion of `.xlsx`, `.xls`, and `.csv` files up to 15MB via **SheetJS (`xlsx`)** and **Papa Parse**.
- **Multi-Worksheet Selector:** Automatically detects all sheets in an Excel workbook, allowing instant switching and sheet-level row counts.
- **Auto-Mapping & Preview:** Automatically aligns columns for company name, phone, e-waste requirement, volume, budget, and follow-up dates.
- **Downloadable Templates:** One-click pre-configured Excel and CSV templates featuring corporate e-waste clients.
- **Comprehensive Export:** Export all clients or filtered categories with full call logs and timestamps.

### 6. Reports & Operational Analytics (`/reports`)
- Conversion rates, lead distribution by category (Hot/Warm/Cold), and acquisition source breakdowns.
- Visual charts (Recharts) integrated into the Neumorphic Soft UI design.
- Performance statistics for account managers and operations executives.

### 7. Access Control & Team Management (`/settings`)
- Admin vs. Operations Executive role separation.
- Pending approval gate for new employee signups with admin activation.
- Real-time Firebase diagnostic showing status for project `renuvia-crm`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18 (SPA) |
| **Build & Tooling** | Vite 5 |
| **Styling & Neumorphism** | Tailwind CSS 3 with custom soft dual-shadow tokens |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Spreadsheets** | SheetJS (xlsx) & Papa Parse |
| **Notifications** | Sonner |
| **Date & Timezone** | date-fns & Intl API (`Asia/Kolkata`) |
| **Backend / Database** | Google Firebase Modular SDK v10 (Cloud Firestore) |
| **Authentication** | Firebase Authentication |

---

## ⚙️ Environment Configuration

In `.env`:

```env
VITE_FIREBASE_API_KEY="AIzaSyAgKIE1gqLjsgbvLcoOEBMHudFNWKkxQcA"
VITE_FIREBASE_AUTH_DOMAIN="renuvia-crm.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="renuvia-crm"
VITE_FIREBASE_STORAGE_BUCKET="renuvia-crm.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="963936969635"
VITE_FIREBASE_APP_ID="1:963936969635:web:f8f27f0433521b68f8b016"
VITE_FIREBASE_MEASUREMENT_ID="G-3B5ZH88FFS"

VITE_APP_TITLE="Renuvia Recycling CRM"
VITE_SHOP_CITY="Kanpur / Pan-India Operations"
VITE_DEFAULT_TIMEZONE="Asia/Kolkata"
```

---

## 🚦 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   ```

4. **Preview Production Build:**
   ```bash
   npm run preview
   ```
