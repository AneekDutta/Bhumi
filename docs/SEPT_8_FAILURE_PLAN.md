# KOSH (SIH26016) — September 8 Live Demo Failure Contingency Plan
**Presenter Emergency Playbook for Live Evaluation**
**Guiding Principle:** Stay calm, do not attempt to live-debug code during the presentation, and immediately pivot to deterministic built-in fallbacks.

---

## 1. If the AI Assistant Request Times Out or Fails
- **Symptom:** Spinner spins indefinitely or an error message ("Failed to communicate with KOSH Assistant") appears on `/intelligence/assistant`.
- **Presenter Action:**
  1. Click one of the predefined intent pills immediately (e.g. *"Why is this parcel high risk?"* or *"What if compensation is resolved?"*).
  2. The frontend automatically routes through the built-in deterministic provider `MockAIProvider` if external API fails.
  3. **Spoken Pivot:** *"Notice that when an external LLM connection fluctuates, KOSH's grounded architecture automatically falls back to our deterministic rule engine, outputting verified system records without halting the officer's workflow."*
  4. If the page is unresponsive, navigate directly to `/intelligence/golden-demo` (Step 5: Explainable Risk Dossier) which displays the exact same grounded rationale statically.

---

## 2. If the Database / API Response is Slow
- **Symptom:** Loading spinners take more than 3 seconds on `/dashboard` or `/projects`.
- **Presenter Action:**
  1. Do not repeatedly click or spam refresh.
  2. Continue speaking your narrative smoothly: explain the RFCTLARR statutory mandate (Section 15, Section 19(7), Section 38).
  3. The Next.js frontend has client-side cached fallback datasets (`mockProjectData` and `sih26016` synthetic collections) that automatically fulfill render requests if the network request exceeds timeout.

---

## 3. If GIS Map Tiles (MapTiler / OpenStreetMap) Fail to Load
- **Symptom:** The map background shows a blank gray grid or missing satellite imagery.
- **Presenter Action:**
  1. Do not apologize or attempt to reload the page.
  2. Zoom into the center of the corridor where the PostGIS vector GeoJSON layer renders.
  3. **Spoken Pivot:** *"Here you see our pure cadastral vector topological layer rendered directly from PostGIS. Notice how the linear highway centerline and individual parcel boundaries remain fully interactive and color-coded by acquisition status even in an offline or tile-server-constrained tactical environment."*
  4. Alternatively, click on `/intelligence/golden-demo` Step 6 (Digital Twin GIS & CPM Topology) which showcases the corridor graph with zero tile dependency.

---

## 4. If Microphone / Voice Recognition Fails
- **Symptom:** Clicking the microphone icon shows browser permission denied, silence, or an error notice.
- **Presenter Action:**
  1. Do not struggle with browser settings or microphone permissions.
  2. Immediately click on any of the 6 predefined query pills right below the input box.
  3. **Spoken Pivot:** *"In an operational revenue office, voice input is an optional convenience tool. Officers typically execute one-click predefined statutory intents, as shown here."*
  4. Type the query directly if you wish to show natural language handling: `Why is this parcel high risk?` or `What if compensation is resolved?`.

---

## 5. If Authentication Fails or Shows Unauthorized (401/403)
- **Symptom:** A route redirects to `/login` or shows an access restriction notice.
- **Presenter Action:**
  1. On `/login`, click the quick-login card: **"Sign In as CALA Acquisition Officer (MoRTH/NHAI)"** or **"Field Revenue Officer"**.
  2. This instantly populates official session tokens and redirects directly to `/dashboard`.
  3. If testing field routes, navigate to `/field/login` and click the pre-configured officer profile.

---

## 6. If Any Individual Sub-Page Throws a Render Error
- **Symptom:** An unexpected React runtime crash or blank page on an edge route.
- **Presenter Action:**
  1. Immediately navigate to the primary presentation route:
     **`/intelligence/golden-demo`**
  2. The Golden Demo is completely self-contained, statically prerendered, and walks through all 8 stages of the presentation story sequentially:
     - Stage 1: Document Ingestion & Tamper Guard (SHA-256)
     - Stage 2: Human Review Gate (PENDING_REVIEW -> VERIFIED)
     - Stage 3: Statutory Deadline Engine (Sec 15 / Sec 19(7))
     - Stage 4: Officer Action Center
     - Stage 5: Explainable Risk Engine (10 Dimensions)
     - Stage 6: Digital Twin GIS & CPM Topology
     - Stage 7: Identity Verification & Privacy Gate (Aadhaar Data Minimization)
     - Stage 8: Grounded Intelligence & Voice Safety Contract
  3. **Spoken Pivot:** *"Let us walk through the unified end-to-end audit lifecycle in our Golden Showcase console."*

---

## Quick Checklist Before Going Live on Zoom/Meet
- [ ] Backend running on `http://localhost:8000` (`uvicorn app.main:app`)
- [ ] Frontend running on `http://localhost:3000` (`npm run start` or `npm run dev`)
- [ ] Browser tabs pre-opened:
  - Tab 1: `http://localhost:3000/dashboard` (Console overview)
  - Tab 2: `http://localhost:3000/projects/P-NH927A/spatial` (Corridor GIS)
  - Tab 3: `http://localhost:3000/intelligence/assistant` (AI Assistant & What-If)
  - Tab 4: `http://localhost:3000/intelligence/golden-demo` (Ultimate fallback)
- [ ] Browser zoom set to 100% or 110% for crisp projector/screen-share readability.
