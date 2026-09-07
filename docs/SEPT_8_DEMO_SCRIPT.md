# KOSH (SIH26016) — September 8 Evaluation Script
**Live Demo Rehearsal & Presentation Walkthrough**
**Total Target Duration:** 8 minutes 30 seconds (Leaves 1m 30s for Q&A)
**Primary Presentation Story:** *"One unresolved statutory acquisition issue can stall an entire national infrastructure corridor."*
**Canonical Demo Case:** Project `P-NH927A` | Parcel `P00001` (Survey No. `V02-KH-0001`, `Bardoli Khera`, Kota, Rajasthan)

---

## 10-Second Architecture Anchor (Keep this in mind for all answers)
> **"KOSH uses PostgreSQL/PostGIS as the operational source of truth, deterministic statutory and CPM engines for authoritative calculations, and AI strictly as an evidence-grounded explanation layer."**

---

## A. 30-Second Opening (00:00 – 00:30)
> *"Good morning, respected evaluators. I am presenting **KOSH**, our operational decision intelligence platform for linear land acquisition under problem statement SIH26016.*
> *In India today, mega infrastructure projects—highways, freight corridors, transmission lines—are rarely delayed by engineering. They are delayed because acquisition is managed in bureaucratic silos: revenue records in one office, gazette notifications in another, court stays in paper files, and project scheduling in isolated Gantt charts.*
> *KOSH bridges this disconnect by linking every land parcel directly to statutory law and corridor critical-path dependencies."*

---

## B. 2-Minute Problem Explanation (00:30 – 02:30)
> *"Consider the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013—the RFCTLARR Act.*
> *The Act establishes strict, non-negotiable statutory timelines: 60 days under Section 15 for hearing objections, 12 months under Section 19(7) before a preliminary notification lapses, and mandatory full compensation payment under Section 38 before physical possession can be taken.*
>
> *In practice, Competent Authorities for Land Acquisition (CALA) oversee thousands of survey numbers across hundreds of kilometers. When a title dispute arises or an heir challenges apportionment, an officer has no live view of whether that single disputed parcel lies on the construction critical path or on a non-critical side-chain with 90 days of float.*
>
> *If a Section 19 declaration lapses on a critical parcel, the entire corridor acquisition restarts from Day Zero. That costs hundreds of crores in contractor idle charges and years of delay.*
>
> *KOSH solves this with four core pillars:*
> 1. *A **Spatial Digital Twin** connecting cadastral parcels to linear construction CPM networks.*
> 2. *A **Deterministic Statutory Engine** encoding RFCTLARR 2013 limitation clocks.*
> 3. *A **Human-in-the-Loop Document Intelligence Gate** with tamper-evident SHA-256 integrity.*
> 4. *An **Explainable AI Assistant & What-If Simulator** that never invents data, but translates complex graph mathematics and legal statutes into plain-language officer guidance."*

---

## C & D. Exact Click-by-Click Demo Sequence & Spoken Words (02:30 – 07:30)

### Screen 1: Executive Operations Console (`/dashboard`) [02:30 – 03:15]
- **Action:** Open browser to `/dashboard`. Point cursor to Section A (National Infrastructure Projects) and Section B (Citizen Grievance Stream).
- **Words to Say:**
  > *"Here is the MoRTH/CALA Command Console. Notice the clean, strict government ledger aesthetic—no consumer fluff. The platform separates national linear corridors from citizen land claims.*
  > *Across our portfolio, we track 6 strategic national corridors. Look at corridor **NH-927A: Kota–Jhalawar 4-Lane Greenfield Bypass**. The system flags it with an active bottleneck: while 72% of the corridor length is acquired, the handover date is delayed by 25 days due to unresolved critical-path parcels."*

### Screen 2: Spatial Corridor GIS (`/projects/P-NH927A/spatial`) [03:15 – 04:00]
- **Action:** Click "Project Spatial Map" or navigate to `/projects/P-NH927A/spatial`. Click on the red-highlighted parcel `P00001`.
- **Words to Say:**
  > *"Opening the spatial digital twin for NH-927A. Every cadastral parcel is mapped with PostGIS coordinates alongside the highway centerline alignment.*
  > *Parcels in green are possessed; amber are in valuation enquiry; red are critical-path blockers.*
  > *Let us zoom into **Parcel P00001**, Survey Number **V02-KH-0001** in village **Bardoli Khera**, Kota.*
  > *Notice the badge: `is_critical_path: True` and `total_float: 0 days`. This means any single day of delay on P00001 pushes back the completion of the entire 4-lane corridor by one full day."*

### Screen 3: Document Intelligence & Tamper-Guard (`/document-intelligence`) [04:00 – 04:45]
- **Action:** Click on "Document Intelligence" in navigation. Click "Load Synthetic Prototype Scan (NH-927A)" for Section 11 Preliminary Gazette.
- **Words to Say:**
  > *"How did this parcel enter the system? Through our Document Intelligence module.*
  > *When a statutory gazette notification is ingested, KOSH runs three checks: first, it computes an immutable SHA-256 checksum to ensure tamper detection; second, it defangs adversarial prompt injection strings embedded in untrusted PDF text; third, it extracts statutory entities like notification dates, affected survey numbers, and public purpose.*
  > *Crucially: **KOSH never permits AI to modify legal land records automatically.** All extracted attributes enter state `PENDING_REVIEW`. They become legal facts only when an authorized acquisition officer inspects the bounding boxes and certifies the extraction."*

### Screen 4: Human Review Gate & Legal Knowledge Center (`/legal-rights`) [04:45 – 05:30]
- **Action:** Click "Certify & Verify" button, then navigate to `/legal-rights`.
- **Words to Say:**
  > *"Once verified, the record links directly to our Legal Knowledge Center. Here, the RFCTLARR Act 2013 and Rajasthan State Rules 2016 are codified into verified statutory provisions.*
  > *Look at Section 38(1) and (2): the law strictly mandates that the Collector **shall not take physical possession** of land until full compensation is disbursed or deposited.*
  > *For Parcel P00001, an award of ₹1.06 Crore was declared under Section 23/30, but competing inheritance claims have stalled disbursal. Under Section 38, physical possession is legally barred."*

### Screen 5: Explainable Risk Dossier & CPM Topology (`/intelligence/golden-demo` Step 5 & 6) [05:30 – 06:15]
- **Action:** Switch to Golden Demo Step 5 & 6 or open Parcel Detail Risk Card.
- **Words to Say:**
  > *"This brings us to KOSH's 10-Dimensional Explainable Risk Engine.*
  > *Other systems show black-box percentages. KOSH answers the exact operational question: **'Why is this parcel high risk?'**.*
  > *It displays the exact causal chain: Statutory compensation is disputed under Section 77(2), triggering a Section 38 possession bar, which sits directly on Critical Path Edge E001 with zero float. The risk is not a statistical guess—it is a legal and operational certainty."*

### Screen 6: Grounded AI Assistant & Natural Language What-If (`/intelligence/assistant`) [06:15 – 07:30]
- **Action:** Navigate to `/intelligence/assistant`. Select canonical parcel `P00001`. Click predefined intent *"Why is this parcel high risk?"*, then *"Summarize this dispute"*, then *"What happens if the compensation issue is resolved?"*.
- **Words to Say:**
  > *"Now we consult the KOSH Intelligence Assistant.*
  > *Notice that the assistant displays explicit **Verified System Provenance** pills—every sentence is grounded in registered database records: the Gazette Notification, the PostGIS parcel node, and Section 38 of the RFCTLARR Act.*
  > *When I click 'Summarize this dispute', notice the strict epistemic separation: **Verified Facts** (area, gazette date, award sum) are kept separate from **Claimant Allegations** (competing family partition claims) and **Procedural Recommendations**.*
  > *Now let us ask the critical management question: **'What happens if the compensation issue is resolved?'**."*

---

## E. 30-Second What-If Explanation (07:30 – 08:00)
- **Action:** Click into the **What-If Counterfactual Rationale** tab showing `Corridor Delay Saved: -14 Calendar Days` and `Total Float Delta: 0d -> +14d`.
- **Words to Say:**
  > *"Watch this carefully. The AI did not guess these numbers. Behind the scenes, the system parsed the officer's natural language question into simulation parameters, cloned the corridor graph in-memory, executed a deterministic Critical Path forward and backward pass, and verified database invariance.*
  > *The result is deterministic: If the Competent Authority deposits the disputed ₹1.06 Crore with the LARR Authority under Section 77(2), Section 38 clearance is unlocked, recovering **14 calendar days of project float** and removing NH-927A from the national critical delay list."*

---

## F. 30-Second Conclusion (08:00 – 08:30)
- **Action:** Navigate to `/action-center` to show the final prioritized action card `ACT-P00001-COMP` with Form 19 evidence upload.
- **Words to Say:**
  > *"To close the loop, the officer doesn't need to write a memorandum from scratch. The prioritized resolution appears directly in the **Officer Action Center** with the exact statutory citations and evidence requirements.*
  > *In summary: KOSH replaces fragmented paper bureaucracy with a unified, legally grounded digital twin. It provides MoRTH and CALA officers with the foresight to resolve single-parcel bottlenecks before they become multi-crore national corridor delays.*
  > *Thank you. We are eager to take your questions."*

---

## G. Quick Technical Anchor for Judge Questions
- **Backend:** FastAPI, Python 3.11, NetworkX (DAG topological sorting & float calculation), SQLAlchemy 2.0 async.
- **Database & Spatial:** PostgreSQL 16 + PostGIS 3.4 for 2D parcel polygons and spatial linear referencing.
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, MapLibre GL for client-side vector rendering.
- **Security:** Strict RBAC, horizontal corridor tenant-scoping, SHA-256 document hashing, ES256 Supabase JWT verification.
- **AI / LLM Role:** Explanation and query grounding ONLY. Zero autonomous database mutations; zero algorithmic calculation of legal dates or financial awards.
