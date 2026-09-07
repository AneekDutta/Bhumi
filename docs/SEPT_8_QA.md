# KOSH (SIH26016) — September 8 Evaluator Q&A Cheat Sheet
**Concise 20–30 Second Spoken Answers for Evaluator Inquiries**
**Guiding Principle:** Total transparency regarding synthetic data, deterministic engines, mock integrations, and legal boundaries.

---

### 1. What problem are you solving?
> *"Linear infrastructure in India suffers massive cost and time overruns because land acquisition is managed in disconnected operational silos. Revenue officers, highway engineers, and legal teams have no shared visibility. A single unaddressed statutory deadline or disputed compensation award can quietly stall an entire multi-hundred-crore corridor. KOSH unifies GIS parcel geometry, RFCTLARR statutory limitation clocks, and construction CPM schedules into an active decision-intelligence platform."*

---

### 2. How is KOSH different from Bhoomi Rashi?
> *"Bhoomi Rashi is an administrative workflow and gazette publication management system. It digitizes notifications and records approvals sequentially, but it has no spatial digital twin, no CPM project scheduling engine, no automated statutory lapse detection, and no counterfactual simulation. KOSH is not an administrative document tracker; it is an active decision-support system that predicts corridor bottlenecks and models the impact of officer interventions."*

---

### 3. How is KOSH different from SIH26017?
> *"SIH26017 focuses primarily on multi-modal corridor planning and route optimization before acquisition starts. KOSH solves the post-alignment execution phase under SIH26016: handling statutory notifications under RFCTLARR 2013, objection disposals under Section 15, valuation calculations under Section 26/30, title grievance mediation, and physical possession clearance under Section 38."*

---

### 4. Where does the data come from?
> *"For this demonstration prototype, the data is generated from a synthetic benchmark modeling the NH-927A Kota–Jhalawar 4-Lane Greenfield corridor in Rajasthan. Cadastral parcel polygons, gazette notifications, award matrices, and grievance records follow the exact statutory structure of Rajasthan revenue records and India Code gazettes."*

---

### 5. Is the data real?
> *"No, all records shown in this evaluation prototype are synthetic demonstration models based on real-world NH-927A corridor parameters. We clearly disclose this in our top interface banner. We do not use live citizen PII or real court proceedings without administrative authorization. However, the statutory rules, CPM algorithms, and mathematical compensation engines are 100% real and production-grade."*

---

### 6. How does the system scale nationally?
> *"KOSH is architected for horizontal tenancy: projects belong to national corridors, districts, and states. The PostgreSQL/PostGIS backend uses spatial indexing (R-Tree / GiST) and corridor-level sharding. Critical Path algorithms run per corridor sub-graph in milliseconds using NetworkX. State-specific rules—such as Rajasthan's rural distance multiplier slabs—are decoupled into database rule tables without changing core engine code."*

---

### 7. How does GIS actually affect decision-making?
> *"In KOSH, GIS is not an aesthetic backdrop. Every parcel polygon is an active topological node tied to the linear highway centerline and the CPM project graph. If a parcel is blocked, the GIS visually identifies downstream landlocked stretches and computes the exact linear kilometer deficit holding up contractor physical handover."*

---

### 8. How does the AI avoid hallucinations?
> *"KOSH enforces strict Retrieval-Augmented Grounding and an Epistemic Safety Contract. The LLM is never allowed to generate facts from memory. Every query builds a data-minimized context from registered database rows—the gazette hash, CPM node float, and India Code section citations. The model outputs explicit source provenance tags and refuses to answer unsupported questions outside its context."*

---

### 9. Can AI change government records?
> *"Strictly NO. Under our AI Governance Protocol, the AI Assistant and Document Intelligence modules have zero write privileges to the authoritative database. The AI is explanation-only. Any modification to legal boundaries, acquisition statuses, or compensation awards requires explicit digital sign-off by an authorized acquisition officer in the Action Center."*

---

### 10. How does OCR verification work?
> *"When a gazette or deed is uploaded, an immutable SHA-256 checksum is computed to detect tampering. The OCR parses tabular text and attributes, placing them into state `PENDING_REVIEW`. An officer must inspect the side-by-side bounding boxes and click 'Certify & Verify'. Only after this human governance gate does the data update system state."*

---

### 11. How is ownership/title established?
> *"Title is established through verified Jamabandi / Record of Rights (RoR) mutation history and registered sale deeds. We enforce strict privacy and DPDP Act compliance through our Identity Adapter: Aadhaar is masked (showing only the last 4 digits) and used strictly for identity de-duplication. We display an explicit statutory notice: **Identity verification does not confer or verify land title**."*

---

### 12. How does compensation work?
> *"Compensation follows the First Schedule of the RFCTLARR Act 2013: base circle rate or registered sale average, multiplied by rural distance factors (1.0x to 2.0x, configured to Rajasthan 2016 rules), plus 100% Solatium under Section 30(1), plus 12% additional component per annum under Section 30(3) from preliminary notification to award date. All math is deterministic Python code, never estimated by LLMs."*

---

### 13. How does What-If work?
> *"When an officer asks a counterfactual question—like 'What if we resolve compensation on P00001?'—the natural language parser maps the intent into simulation parameters. The engine creates an in-memory deepcopy of the corridor dependency graph, executes topological sorting and a Critical Path pass, and computes the delta in project delay and float days. The live database remains completely untouched."*

---

### 14. Why use CPM (Critical Path Method)?
> *"Linear infrastructure acquisition is inherently a directed acyclic dependency graph. Road construction cannot begin on a continuous stretch if intervening parcels remain unpossessed. CPM calculates Early Start, Late Start, and Total Float for every parcel. It allows officers to focus immediately on zero-float critical-chain bottlenecks rather than wasting administrative resources on parcels with 90 days of float."*

---

### 15. What government APIs are actually integrated?
> *"In this prototype, we have built production-ready adapter schemas for Bhoomi Rashi (gazette ingestion), Rajasthan Apna Khata (RoR revenue records), PFMS (treasury DBT disbursal), and MapTiler/Bhuvan (GIS mapping). For this standalone evaluation sandbox, these external adapters run against mock responses to ensure 100% demo stability without external network dependencies."*

---

### 16. What is mocked?
> *"Three components use deterministic mocks in this evaluation sandbox: (1) Third-party government API gateways (Bhoomi Rashi / State Revenue portal), (2) External OCR engine infrastructure (we provide high-accuracy synthetic OCR extractions with bounding boxes), and (3) Live SMS/OTP gateways for landowner phone verification. Core calculation engines—PostGIS, CPM, Statutory Clocks, Valuation, and RBAC—are 100% functional live code."*

---

### 17. What happens if AI is unavailable?
> *"KOSH operates completely without AI. The core system—interactive GIS, statutory deadline tracking, compensation calculation, CPM critical path analysis, and the Officer Action Center—is completely deterministic. The AI is solely an assistive natural-language layer for convenience. If the LLM provider fails, the platform continues to run normally."*

---

### 18. What happens if GIS is unavailable?
> *"If external map tile servers or WebGL rendering fail, the platform degrades gracefully. Every parcel record, critical-path attribute, statutory deadline, and action item remains fully accessible via tabular ledger views and detail modals. Spatial coordinates remain preserved in PostGIS."*

---

### 19. How would this work offline?
> *"Field Revenue Officers (Patwaris / Amin) frequently operate in remote areas without internet connectivity. Our mobile field portal (`/field/dashboard`) uses local browser storage (localStorage/PWA) to capture geotagged boundary vertices, survey notes, and inspection photos offline, automatically syncing via conflict-resolved batches once 4G connectivity is re-established."*

---

### 20. How would you deploy this in a real government environment?
> *"KOSH is packaged as containerized microservices (FastAPI backend, Next.js frontend, PostgreSQL/PostGIS database) deployable on MeghRaj (NIC National Cloud) or state government data centers. Authentication integrates with e-Pramaan / Jan Parichay Single Sign-On, and database access is secured with role-based access control, TLS 1.3 encryption in transit, and AES-256 encryption at rest."*

---

### 21. What is the biggest limitation of the current prototype?
> *"The primary limitation is that revenue records across India's 28 states are non-standardized: Rajasthan uses Jamabandi, Bihar uses Khatian, Maharashtra uses 7/12 extract. While KOSH's data architecture is state-agnostic, rolling out nationally requires building state-specific ETL connectors for each state's land records portal."*

---

### 22. What would you build after the prototype?
> *"Our roadmap after this round focuses on three high-impact extensions: (1) Production integration with NIC e-Pramaan SSO and State Revenue APIs, (2) Direct PFMS integration for automated Aadhaar-linked compensation disbursals, and (3) Drone/UAV photogrammetry overlay for automated pre-acquisition tree and structure inventory enumeration."*
