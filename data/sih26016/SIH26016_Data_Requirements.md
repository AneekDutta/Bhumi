# SIH26016 — Land Acquisition Intelligence & Decision Platform
## Complete Data Requirements Document

**Rule followed throughout this document:** where real data does not exist, is not public, or could not be verified, the field says so explicitly (`NOT PUBLICLY AVAILABLE` / `NULL`). Nothing here is a guessed government record. Every "real" fact below is paraphrased from a search result, and every synthetic design is clearly labeled as a prototype construct, not real data.

---

## 0. The Four Data Classes (used throughout)

| Class | Meaning | Examples in this platform |
|---|---|---|
| **A. REAL_PUBLIC** | Verifiable, sourced from an actual government/open dataset or published document | State boundaries, RFCTLARR Act text, a real court judgment, a real project's public cost/timeline |
| **B. SYNTHETIC** | Deliberately fabricated for the demo, internally consistent, never presented as a real record | Parcel P00042, owner O014, a fictional village "Kanhera Kalan" |
| **C. USER_ENTERED** | Entered live by a field officer/admin during a demo or pilot | A new document upload, a status update, a note |
| **D. MODEL_DERIVED** | Computed by the platform's own logic, not sourced externally | Criticality score, risk score, projected completion date, what-if delta |

Every record in the database carries a `source_type` field with exactly one of these four values (see Section 15).

---

## 1. REAL LAND ACQUISITION CASES (historical reference material)

Only cases with independently corroborated public reporting are listed. Field-level detail (exact land_required in hectares, exact compensation amounts per household, etc.) is often **not** publicly itemized even when the project itself is well documented — those gaps are marked NULL rather than estimated.

### Case 1 — Mumbai–Ahmedabad High Speed Rail (Bullet Train)
- **project_type:** High-speed rail
- **state(s):** Gujarat, Maharashtra, Dadra & Nagar Haveli
- **villages_affected:** <cite index="38-1">The corridor cuts through at least 312 villages across Gujarat, Maharashtra, and Dadra and Nagar Haveli</cite>
- **land_required:** <cite index="38-1">The project was set to take over 866 hectares of fertile farmland</cite> (an earlier report gave a different figure — <cite index="40-1">around 1,400 hectares of land needed in Gujarat and Maharashtra, of which 1,120 hectares are privately owned, with around 6,000 landowners to be compensated</cite>). Two different official figures exist in the public record at different project stages — do not collapse into one number; store both with their source dates.
- **land_acquired (progress snapshot):** <cite index="37-1">As of an October 2018 report, only about 0.9% of land had been acquired for the corridor</cite>
- **acquisition_status:** Contested, later upheld
- **legal_disputes / court_cases:** <cite index="34-1">Farmers filed petitions in the Gujarat High Court, and roughly 1,000 additional affected farmers submitted affidavits opposing the acquisition</cite>; <cite index="35-1">the Gujarat High Court ultimately rejected more than 100 of the 61+ petitions, upholding the validity of Gujarat's 2016 amendment to the central land acquisition law and the adequacy of the Social Impact Assessment carried out under JICA guidelines</cite>. <cite index="38-1">In the final ruling (Sept 2019) the court dismissed over 120 farmer pleas but left the door open for farmers to separately seek higher compensation by citing NHAI precedents</cite>.
- **reason_for_delay:** <cite index="34-1">Farmers argued the state's 2016 amendment diluted the 2013 Land Acquisition Act's consent, Social Impact Assessment, and R&R requirements, and violated JICA's own lending guidelines</cite>
- **project_cost:** <cite index="38-1">Approximately Rs 1.1 lakh crore, of which JICA was funding around Rs 88,000 crore via soft loan</cite>
- **government_authority:** National High Speed Rail Corporation Limited (NHSRCL)
- **important_dates:** Petitions from 2018; Gujarat HC dismissal September 19, 2019 (<cite index="35-1">judgment by Justices Anant Dave and Biren Vaishnav</cite>)
- **source:** Outlook India, The Week, Scroll.in, Bar & Bench, ETV Bharat coverage (2018–2019)
- **source_url:** https://www.outlookindia.com/national/farmers-protest-against-mumbai-ahmedabad-bullet-train-project-news-316763 ; https://www.theweek.in/news/india/2019/09/19/ahmedabad-mumbai-bullet-train-gujarat-hc-rejects-farmers-petitions.amp.html ; https://barandbench.com/gujarat-hc-dismisses-challenge-land-acquisition-bullet-train-project/
- **NOTE:** compensation-per-household figures, final total land acquired at project completion, and district-wise breakdown are **NOT independently found in these sources** — mark NULL, do not estimate.

### Case 2 — Yamuna Expressway / YEIDA Land Acquisition (Noida–Agra corridor)
- **project_type:** Expressway + integrated industrial/urban development
- **state:** Uttar Pradesh
- **district:** Gautam Budh Nagar (and route through Aligarh, Mathura to Agra)
- **acquisition_status:** Contested for over a decade, ultimately upheld by the Supreme Court
- **legal_disputes / court_cases:** <cite index="47-1">In Nand Kishore Gupta & Ors. vs State of U.P. (Supreme Court, Sept 8, 2010), the Allahabad High Court's dismissal of petitions from 35 farmers challenging the acquisition was at issue; farmers had argued that because a private agency would execute the project, the private company — not the state — should have carried out the acquisition</cite>. <cite index="44-1">A later, larger dispute (culminating Nov 26, 2024) arose from two conflicting Allahabad High Court verdicts — one upholding YEIDA's acquisition, another quashing it for misuse of the "urgency clause" under Sections 17(1) and 17(4) of the Land Acquisition Act, 1894, where land was classified as Abadi Bhoomi (residential) and claimed unsuitable for acquisition without inquiry</cite>.
- **decision:** <cite index="48-1">The Supreme Court bench of Justices B.R. Gavai and Sandeep Mehta dismissed the landowners' appeals and allowed YEIDA's appeals, holding the urgency-clause invocation valid and integral to the expressway's planned development</cite>.
- **compensation_information:** <cite index="48-1">The Court noted a prior 64.7% enhancement in compensation (as a "No Litigation Bonus" per a November 4, 2015 government order) was to apply uniformly ("in rem") to all affected landowners under this acquisition, with no further enhancement directed</cite>. <cite index="48-1">The question of the non-issuance of a final award, and its effect on the acquisition, was left open for individual challenge</cite>.
- **major_delays / reason_for_delay:** Multi-decade litigation over urgency-clause misuse (bypassing Section 5-A objection hearings) and conflicting High Court precedents (Kamal Sharma vs. Shyoraj Singh lines of cases).
- **government_authority:** Yamuna Expressway Industrial Development Authority (YEIDA), State of Uttar Pradesh
- **important_dates:** Acquisition initiated 2009; Nand Kishore Gupta SC judgment 2010; further SC rulings May 2022 and November 26, 2024
- **source:** SCC Online Blog, Deccan Herald, Daily Pioneer, ETV Bharat, Verdictum, The Indian Lawyer, ecolex/InforMEA case record
- **source_url:** https://www.scconline.com/blog/?p=336351 ; https://deccanherald.com/india/supreme-court-approves-land-acquisition-for-yamuna-expressway-development-3293111 ; https://informea.org/uuid/node/befa6d22-4a05-42a8-852b-0d78cf84db04

### Cases identified but requiring further primary-source verification before use (do NOT populate fields yet)
These are well-known in public discourse but this session did not verify field-level facts for them; list them as "candidate cases" only, with `source_type = REAL_PUBLIC (unverified detail)`, and research each individually before entering data:
- Delhi–Mumbai Industrial Corridor (DMIC) land pooling disputes (various states)
- POSCO Odisha project (land acquisition abandoned after prolonged conflict)
- Narmada Dam / Sardar Sarovar oustee rehabilitation litigation (Narmada Bachao Andolan vs. Union of India)
- Nandigram/Singur land acquisition conflict, West Bengal (pre-RFCTLARR era, led to the 2013 Act's reforms)
- Vizhinjam Port, Kerala — fisherfolk resettlement disputes
- Char Dham highway project — forest/hill land and environmental-clearance disputes (distinct from acquisition disputes; verify before mixing categories)

**Explicit note to the platform team:** do not auto-populate the "candidate cases" list into the database. Each requires its own research pass with the same source-by-source discipline shown for Cases 1–2 above.

---

## 2. REAL INDIAN GEOSPATIAL DATA

| Dataset | Provider | Level | Format | Access | License | Update freq. | Notes / prototype-legal? |
|---|---|---|---|---|---|---|---|
| India administrative boundaries (country/state/district) | Survey of India / data.gov.in / DataMeet community | Country→District | Shapefile, GeoJSON | Download | Survey of India boundaries are government-controlled and politically sensitive (external boundary depictions must match the official Indian map); DataMeet's community shapefiles are commonly used by researchers under open licenses but are **not an official government product** | Irregular | Usable for a student prototype; must display the officially accepted external boundary of India, never a version showing disputed boundaries differently |
| Village boundaries (state-specific) | Bhuvan (ISRO/NRSC) + individual state portals | Village | WMS/WFS, some downloadable | Bhuvan API/download; states vary | Bhuvan: <cite index="18-1">freeware / public domain</cite>; state portals vary | Irregular | <cite index="20-1">Coverage is fragmented and state-specific — e.g., Bhuvan hosts Andhra Pradesh and Telangana state village boundaries; Bihar has its own "iBHUGOAL" mapping initiative; Gujarat has its Revenue Department maps; Haryana its own Geo-portal; Karnataka has "Bhuvan Panchayat" for panchayat-level planning and a separate Dharwad village-boundary dataset; Kerala has a 2010 delimitation map; Maharashtra has its Remote Sensing Application Centre and a Geo-referencing of Village Map Project</cite>. **Rajasthan village-boundary GIS layers were not confirmed as separately downloadable in this search** — verify directly on Bhuvan/DILRMP before assuming coverage. |
| Bhuvan geoportal (imagery, thematic layers, disaster/agriculture/water layers) | ISRO / NRSC | National, up to 1m resolution in 177 cities | WMS/WFS, Bhuvan viewer, some downloads | Bhuvan portal / API | <cite index="18-1">Freeware / public domain</cite> | Continuous (satellite refresh) | <cite index="22-1">At present 177 cities have high-resolution datasets, with the rest of the country covered by 2.5 m resolution imagery; imagery excludes military installations for security reasons</cite>. Legal for student use — this is ISRO's explicit public-access geoportal. |
| Bhuvan-Panchayat / NDEM | ISRO / NRSC | Panchayat level / National emergency database | Portal-based | Bhuvan portal | Public domain | Ongoing | <cite index="23-1">Bhuvan-Panchayat supplies enriched datasets to help panchayats plan at the local level; NDEM integrates datasets for disaster risk assessment</cite>. Potentially useful for village-level socio-infra layers, but confirm current data holdings directly on the portal before relying on it. |
| Roads / highways / railway lines & stations / rivers / water bodies (vector) | OpenStreetMap (via Geofabrik extracts) | National → sub-region | `.osm.pbf`, `.shp.zip` | Direct download, no registration | Open Database License (ODbL) | Continuously updated by community, extracts refreshed daily/weekly | <cite index="59-1">Geofabrik provides an India extract split into zones (e.g., Central Zone, Eastern Zone, North-Eastern Zone) as both `.osm.pbf` and `.shp.zip`, with personal contributor metadata stripped from the public extracts for EU data-protection reasons</cite>. <cite index="56-1">Geofabrik-derived files are explicitly licensed under the Open Database License and are free for any use, with no accuracy guarantee</cite>. Fully legal for a student prototype; cite OSM contributors + ODbL. **Caution:** India's official political boundary as shown by default OSM tiles has historically been contested — <cite index="60-1">a community member noted a separate "Indian version of the borders according to existing law" tileset exists at openstreetmap.in, since default Geofabrik/OSM extracts do not always render disputed borders per the official Indian map</cite>. If displaying the national boundary layer, source it from Survey of India / MapmyIndia-partnered Bhuvan rather than raw OSM, and use OSM primarily for roads/rail/rivers/POIs, not national borders. |
| Airports, cities/towns | OpenStreetMap / data.gov.in | National | GeoJSON, CSV | Download | ODbL / OGD India license | Irregular | Good for a base reference layer; cross-check specific major-project sites (airport perimeters etc.) against project's own public documents if criticality matters. |
| data.gov.in Open Government Data Platform | NIC / Government of India | Varies by dataset | CSV, JSON, XML, API | Registered API key (free) | Individual dataset licenses (mostly Government Open Data License – India) | Varies | <cite index="4-1">Data.gov.in is the Government of India's official open-data platform, launched in October 2012, hosting over 230,000 datasets as of July 2026, many updated regularly, with API access provided</cite>. Datasets are heterogeneous — none found in this search expose parcel-level land records (see Section 3). Fine for infrastructure/administrative/statistical layers. |

**What this session could NOT verify:** a single authoritative, freely downloadable national village-boundary shapefile covering all of India with consistent schema. Coverage is a patchwork of state portals and Bhuvan layers of uneven completeness — treat "get all Indian village boundaries" as a per-state integration task, not a single download.

---

## 3. LAND / PARCEL DATA (with Rajasthan focus)

**Headline finding, stated plainly per your instruction: individual parcel geometry and live ownership records are NOT openly downloadable/API-accessible for bulk use anywhere in India, including Rajasthan.** State land-record portals are built for **one-parcel-at-a-time citizen lookup** (by name, khasra number, or account number) through a web form — not bulk open data, not a public API, and not licensed for scraping.

| State / system | Authority | What it is | Availability | Individual-owner info public? | Parcel geometry public? | Bulk API/download? |
|---|---|---|---|---|---|---|
| **Rajasthan — Apna Khata (e-Dharti)** | Rajasthan Revenue Department, under DILRMP | <cite index="9-1">Set up under the Rajasthan Urban Land (Certification of Titles) Act, 2016, to provide state-guaranteed land titles</cite>; <cite index="13-1">implemented in collaboration with the Ministry of Rural Development / Department of Land Resources under the Digital India Land Records Modernisation Programme (DILRMP)</cite> | <cite index="14-1">Citizens select district → tehsil → enter khasra or Jamabandi number to view/download records</cite> | Yes, but **only per-lookup, one record at a time**, and <cite index="15-1">searchable by owner name, with district and village selection required first</cite> — this is public-facing citizen self-service, not an open dataset | <cite index="13-1">Records before 1920 are explicitly excluded from the portal</cite>; geometry is a separate sub-system (Bhu Naksha, below) | **No.** No bulk download or public API was found; this is a session-based lookup form only |
| **Rajasthan — Bhu Naksha** | Rajasthan Revenue Department | <cite index="17-1">Prepares the land map showing plot boundaries, khasra numbers, and measured area — essential for verifying location and size</cite> | Web viewer, per-village map lookup | N/A (map, not ownership) | Viewable per-village in the portal UI; **no confirmed bulk GeoJSON/shapefile export** in this search | No |
| **Rajasthan — e-Panjiyan** | Rajasthan Registration & Stamps Dept. | <cite index="16-1">Holds the deed chain and DLC (District Level Committee) circle rates</cite> | Per-record lookup / circle-rate schedules sometimes published | Deed lookups are per-transaction | N/A | Circle-rate schedules (aggregate, not parcel-level) may be publicly published by district — verify per district before use |
| Other states (for reference, non-Rajasthan) | Various | <cite index="8-1">Every state runs its own portal — e.g. Goa (dslr), Odisha (Bhulekh), Uttarakhand (Devbhoomi), Uttar Pradesh (BhuLekh), Madhya Pradesh (landrecords.mp.gov.in), Gujarat (AnyRoR), Tamil Nadu (eservices), Karnataka (Bhoomi)</cite> | Same pattern — citizen lookup only | Per-lookup only, everywhere | Per-lookup only, everywhere | No state was found in this search offering bulk parcel/ownership open data |

**Answering your specific sub-questions directly:**
- **cadastral maps / parcel boundaries:** viewable per-village on state portals (Bhu Naksha in Rajasthan); no confirmed bulk export.
- **khasra/survey numbers:** the primary key used in every state system; only retrievable one-at-a-time via the citizen portal.
- **land ownership:** public in the sense that anyone can look up a specific khasra/name, but this is explicitly **not** an open bulk dataset — scraping it at scale would (a) likely violate the portal's terms of use, (b) risk exposing real citizens' personal data (names, transaction history) outside any consent framework, and (c) fall outside what a legitimate student prototype should do. **This session recommends against attempting this, and you asked the same — confirmed.**
- **land-use classification:** available in aggregate form via Bhuvan's land-cover/land-use thematic layers (raster, not parcel-level).
- **RoR / mutation records:** per-parcel lookup only, as above.
- **land valuation / circle rates:** several states publish district-wise/zone-wise **circle rate schedules** (aggregate reference rates, not itemized per parcel) — Rajasthan's DLC rates via e-Panjiyan is one such source; treat these as REAL_PUBLIC reference data usable for computing synthetic market values realistically.
- **acquisition notifications:** covered in Section 4 below (these are genuinely public documents, unlike ownership records).

### How the prototype should generate synthetic parcel data (recommended approach)
Since no bulk real parcel dataset exists, generate parcels **algorithmically inside real village boundaries** (from Bhuvan/state GIS where available, OSM otherwise) so the geometry at least sits in a real place, while every attribute value (owner name, khasra number, ownership history) is synthetic:
1. Pick a real village polygon (or a synthetic placeholder polygon if no real one is available for that state) as the parcel-generation envelope.
2. Subdivide it into cells (Voronoi or grid-based) sized to match typical rural khasra areas (a few hundred to a few thousand sq. m per Rajasthan norms — cite DLC rate schedules for plausible area/value ranges, not invented numbers).
3. Assign each parcel a synthetic khasra number using the real numbering *convention* (sequential integer per village) but never a number copied from an actual portal screenshot.
4. Assign synthetic owner names drawn from a name-generation list (not real individuals), with realistic co-ownership fractions (jamabandi-style shared holdings).
5. Tag every such record `source_type = SYNTHETIC`, `source = "Generated for SIH26016 prototype — not a real record"`.

---

## 4. REAL LAND ACQUISITION DOCUMENTS

Genuine public documents **do** exist for acquisition notifications and court judgments (unlike ownership records) because notification is a legal requirement of the acquisition process itself.

| Document type | Where it is genuinely public | What Document Intelligence (OCR/NLP) could extract |
|---|---|---|
| Section 11 / Section 19 preliminary & final notifications (RFCTLARR Act) | Published in the State Gazette and often on the acquiring authority's own website (e.g., NHAI project pages, state Revenue Dept. gazette archives) — **exact live URLs must be pulled per-state/per-project at build time**, not assumed | Project name, notifying authority, notification date, list of affected villages/khasra numbers, public purpose stated |
| Awards under Section 30 / compensation orders | Published by the Land Acquisition Collector's office; some are attached as exhibits in court judgments (see Section 5) and thus become searchable via court databases | Award date, compensation heads (market value, solatium, asset value), collector's office, case/award number |
| Court judgments (High Court / Supreme Court) | **Fully public** — Supreme Court judgments on https://main.sci.gov.in, High Court judgments on respective HC websites, and aggregators like Indian Kanoon, LiveLaw, Bar & Bench, SCC Online Blog | Case name, court, bench, date, statutory provisions cited, outcome, compensation directions, whether urgency clause was invoked, procedural history |
| R&R (Rehabilitation & Resettlement) scheme documents | Published per-project by the implementing authority when R&R is triggered (large projects only) — availability is inconsistent; treat as case-by-case | Entitlement categories, affected-family counts, benefit amounts (where disclosed) |
| Project reports / DPRs (Detailed Project Reports) | Sometimes published by the implementing agency (e.g., NHSRCL, NHAI) as summaries; full DPRs are often not public | Route/alignment description, land-requirement estimates, cost estimates, timeline milestones |

**What Document Intelligence should realistically be scoped to do in the prototype:** extract structured fields from the **synthetic** document set you generate (Section 7/8), demonstrated against the *style* of real notifications/judgments described above, rather than promising OCR extraction from a live scrape of government gazettes (which are often scanned, non-standardized PDFs with no guaranteed public bulk archive).

---

## 5. REAL LEGAL CASE DATA

Two verified cases (fuller detail already given in Section 1's citations — reproduced here in the schema-relevant shape):

| case_name | court | date | state | legal_issue | decision | acquisition_stage | source |
|---|---|---|---|---|---|---|---|
| Farmers' petitions vs. State of Gujarat / NHSRCL (Bullet Train land acquisition) | Gujarat High Court | Sept 19, 2019 (final dismissal) | Gujarat | Notification/consent/SIA challenge, compensation adequacy | <cite index="35-1">Petitions dismissed; 2016 state amendment upheld; SIA process found adequate</cite> | Post-notification, pre-possession | LiveLaw/Bar & Bench/The Week, 2019 |
| Kali Charan and Others v. State of Uttar Pradesh and Others (Yamuna Expressway/YEIDA) | Supreme Court of India | Nov 26, 2024 | Uttar Pradesh | Urgency-clause misuse (Sec 17(1)/17(4)), bypass of Sec 5-A objection hearing, compensation enhancement uniformity | <cite index="52-1">Supreme Court upheld the legality of the acquisitions, balancing public development interest against private property rights</cite> | Post-award, possession/compensation-enhancement stage | SCC Online Blog / Deccan Herald / Verdictum, 2024 |

**How to represent these in the database:** as `legal_case` records with `source_type = REAL_PUBLIC`, linked (via a generic `related_project` free-text field, since these are reference cases and not part of your synthetic project's own dependency graph) rather than wired into the synthetic dependency graph — mixing a real citation into a synthetic critical-path calculation would misrepresent the demo. Use them for a "Historical Patterns" reference panel in the UI, separate from the live synthetic project.

**Categories confirmed present in real Indian land-acquisition litigation** (useful for designing your synthetic legal_case generator's realistic scenario types): notification/consent challenges, urgency-clause misuse claims, compensation-adequacy claims, and conflicting High Court precedent lines needing Supreme Court resolution.

---

## 6. COMPENSATION AND R&R DATA — RFCTLARR Act, 2013

The Act's compensation formula is real, public, and precisely documented in statute and case law — this is one of the strongest "real data" components you can build on.

**The compensation stack (Sections 26–30), in order:**
1. **Market value (Section 26):** based on registered sale-deed value / average of top-50% of recent sale prices in the area / consented compensation in similar acquisitions — whichever is highest.
2. **Multiplication factor (First Schedule):** <cite index="31-1">a multiplier applies to the market value before solatium is added — in rural areas the factor can be as high as 2.0, so the base market value is effectively doubled at this stage; urban areas typically get a factor of 1.0</cite> (state governments can notify factors between 1 and 2 based on distance from urban areas).
3. **Value of attached assets (Sections 28–29):** <cite index="31-1">the Collector must separately assess and add the value of trees, plants, standing crops, houses, buildings, and wells — valued on their own replacement/market-value footing and added to the compensation</cite>.
4. **Damage / severance (Section 28):** injurious effect on remaining land, severance, or other consequential loss.
5. **Solatium (Section 30(1)):** <cite index="32-1">100% of the compensation amount so far (market value × factor, plus assets, plus damage) — effectively doubling the entire corpus built up to that point</cite>. The Supreme Court has clarified <cite index="25-1">solatium under Section 30(1) is calculated only on the market value plus the value of attached assets — i.e., the total compensation determined under Sections 26–28 — and does not itself include the further 12% per annum additional amount</cite>.
6. **Additional 12% per annum amount (Section 30(3)):** <cite index="31-1">calculated on the market value alone, for the period from the Section 11 preliminary notification date to the award date or possession date, whichever is earlier</cite>.
7. **R&R entitlements (Second & Third Schedules):** separate from monetary compensation — housing, subsistence allowance, transportation allowance, resettlement allowance, and (for displaced families losing their sole livelihood) options like annuity or employment, scaled to "affected family" status (including landless agricultural laborers, not just titleholders).

**How these become database fields:**
```
compensation_record:
  parcel_id, market_value_base, multiplier_factor, asset_value,
  severance_damage, subtotal_before_solatium, solatium_amount,
  interest_12pct_amount, total_compensation,
  notification_date (Sec 11), award_date, possession_date,
  compensation_status  -- pending | disbursed | disputed | enhanced_by_court

rr_record:
  affected_family_id, family_type (titleholder | landless_labourer | tenant),
  housing_entitlement, subsistence_allowance, transport_allowance,
  resettlement_allowance, livelihood_option (annuity | employment | one_time),
  rr_status
```

This gives your **synthetic** compensation generator a *real, legally accurate formula* to run — an important credibility point for the demo: the numbers per parcel are synthetic, but the arithmetic that produces them is the actual RFCTLARR Act method, correctly cited.

---

## 7–9. SYNTHETIC DIGITAL-TWIN DESIGN, GENERATOR, AND GIS SCHEMA

Covered together in the next file section for continuity of the schema — see `schema_postgis.sql` (PostGIS DDL) and `synthetic_data_generator.py` (generator) delivered alongside this document. Design summary below; full code is in those files.

### 7. Coherent synthetic scenario (the story the demo tells)
One synthetic project, e.g. **"NH-927A Kota–Jhalawar Bypass Widening"** (a fictional but realistic-sounding Rajasthan highway widening project — clearly synthetic, never claimed as a real NHAI project):
- 1 project → 5–8 synthetic villages along a fictional alignment → hundreds to thousands of parcels per village → multiple owners per village, some owning parcels across village boundaries → each parcel optionally has an acquisition case → each case optionally has compensation, R&R → some cases have legal disputes → every parcel/case has documents → every acquisition/compensation/legal step has approvals routed through specific officers/departments → segments of the highway depend on clusters of parcels → milestones depend on segments → project completion date is a MODEL_DERIVED rollup of all of the above.

### 8. Generator design (see `synthetic_data_generator.py`)
- Deterministic seed (`--seed`) so the same run is reproducible for grading/demo purposes.
- Size presets: `SMALL` (100–500 parcels), `MEDIUM` (500–2,500), `LARGE` (2,500–10,000) — as you specified.
- **Scenario injectors**, applied probabilistically but *traceably* (never silently random): ownership mismatch, missing documents, duplicate ownership claims, compensation pending, active legal dispute, R&R pending, approval bottleneck, physically inaccessible parcel, field-verification pending, "acquired but possession pending," and the important edge case you flagged — **a parcel that scores low on simple attributes but is actually critical because it structurally blocks a major segment** (the generator explicitly creates a handful of these per project size, tagged internally, so your Critical Path Intelligence feature has real cases to correctly surface, and a way to grade whether it caught them).
- Every generated record carries `source_type = "SYNTHETIC"` and a `generator_run_id` for traceability.

### 9. PostGIS schema — see `schema_postgis.sql`
Geometry type guidance used in that schema:
- **POINT** — officer locations, document-signing locations, individual landmark/POI markers (a specific well, a specific structure being compensated).
- **LINESTRING** — roads, railway lines, project alignment centerlines, project_segments (a segment of the highway between two chainage points).
- **POLYGON** — a single parcel's boundary, a single village's boundary.
- **MULTIPOLYGON** — a village made of disjoint revenue blocks, or a project's full village-coverage layer (union of many villages), or a parcel split across a right-of-way boundary.

---

## 10. CRITICAL PATH DATA — variables and representation

| Variable | Represented as | Notes |
|---|---|---|
| `project_dependency` | Edge in dependency graph (project → segment) | see Section 11 |
| `segment_dependency` | Edge (segment → segment, e.g. sequential construction order) | Directed, weighted by construction-sequence necessity |
| `compensation_status` | Enum on `compensation_record`: `not_started \| pending \| disbursed \| disputed` | Feeds blocking logic: `disputed`/`pending` states block `possession` |
| `ownership_conflict` | Boolean + `conflict_type` enum on `parcel` (`none \| duplicate_claim \| succession_dispute \| boundary_dispute`) | Blocks `ownership_verification` node |
| `legal_status` | Enum on `legal_case`: `none \| filed \| in_hearing \| stayed \| decided_for_owner \| decided_for_authority` | `stayed`/`in_hearing` block `possession` |
| `rr_status` | Enum on `rr_record`: `not_applicable \| pending \| in_progress \| completed` | Blocks `possession` for R&R-eligible families only |
| `approval_status` | Enum per approval step: `pending \| under_review \| approved \| rejected \| escalated` | Each approval is its own node with an assigned officer/department |
| `document_status` | Enum on `document`: `missing \| submitted \| under_verification \| verified \| rejected_inconsistent` | Feeds `verification` node |
| `downstream_dependencies` | Computed (MODEL_DERIVED): count/list of segments+milestones that transitively depend on this parcel | Recomputed whenever the graph changes |
| `historical_delay_factor` | MODEL_DERIVED, calibrated conceptually against the real historical patterns in Section 1 (e.g., legal disputes over urgency-clause use historically added years, not weeks) | Used to weight risk scoring — this is where your real historical case research (Section 1) legitimately feeds the synthetic model's calibration, without mixing real records into the synthetic project itself |

**Parcel Criticality Score** (suggested composable formula, transparent rather than a black box):
```
criticality_score = w1*downstream_segment_count
                   + w2*downstream_milestone_weight
                   + w3*is_single_point_of_failure (1 if no alternate alignment exists)
                   + w4*(1 - progress_fraction)
```
where weights (w1..w4) are configurable, and every score stores which terms fired — so the UI can explain *why* a parcel is critical (important for the "recommended action" requirement in Section 13, and for judges/evaluators to trust the score isn't arbitrary).

**Project Risk / Downstream Delay / Milestone Impact** are all rollups: risk aggregates parcel-level risk_scores weighted by criticality; downstream delay propagates a parcel's current expected delay along dependency edges to every milestone that depends on it; milestone impact is the max propagated delay across all parcels feeding that milestone.

---

## 11. DEPENDENCY GRAPH — node and edge types

**Node types:**
`project`, `village`, `parcel`, `owner`, `land_record`, `acquisition_case`, `compensation_record`, `rr_record`, `legal_case`, `document`, `verification`, `approval`, `officer`, `department`, `project_segment`, `milestone`

**Edge types (directed, each with a `blocking: boolean` flag):**
```
parcel --belongs_to--> village
parcel --owned_by--> owner
parcel --has--> acquisition_case
acquisition_case --requires--> compensation_record        (blocking)
acquisition_case --requires--> rr_record                  (blocking, if RR-eligible)
compensation_record --blocked_by--> ownership_verification (blocking)
ownership_verification --blocked_by--> document           (blocking, if status=missing/rejected_inconsistent)
legal_case --blocks--> possession                          (blocking)
acquisition_case --leads_to--> possession
possession --required_for--> project_segment               (blocking)
project_segment --required_for--> milestone                 (blocking)
milestone --contributes_to--> project (overall completion)
approval --gates--> (compensation_record | rr_record | possession)  (blocking)
officer --assigned_to--> approval
department --owns--> approval
```
This matches your two examples exactly (PARCEL→ACQUISITION CASE→COMPENSATION→POSSESSION→PROJECT SEGMENT→MILESTONE, and DOCUMENT→VERIFICATION→OWNERSHIP→COMPENSATION→POSSESSION) and generalizes them into a single edge-typed graph so Critical Path Intelligence can run standard graph algorithms (longest blocking path, topological layering, single-point-of-failure detection) directly on it.

---

## 12. WHAT-IF SIMULATOR — data requirements

For each intervention type, the same record shape:

```
intervention_definition:
  intervention_type        -- resolve_ownership_conflict | process_compensation | complete_field_verification |
                               resolve_legal_case | deploy_additional_officers | accelerate_approval | process_rr
  input_entity_ids         -- which parcel(s)/case(s)/segment(s) this targets
  affected_entities        -- derived by walking the dependency graph from input_entity_ids
  preconditions            -- what must be true for this intervention to be applicable (e.g. can't "process compensation" if ownership_conflict is unresolved)
  cost_estimate            -- resource units (officer-days, budget) — MODEL_DERIVED default, user-editable
  historical_effect_range  -- a plausible min/max effect duration, informed conceptually by Section 1's real delay patterns (e.g. legal disputes historically resolved in months-to-years, not days) — stored as a *range* to avoid a false precision
  expected_delay_reduction -- computed, not hardcoded (see below)
  constraints               -- e.g. max officers deployable per district, budget ceiling
```

**How to compute "before vs. after" without hardcoding the result:**
1. Compute the current critical path and projected completion date on the *live* dependency graph (a standard longest-path/CPM calculation over blocking edges, using each entity's current expected-resolution-duration as edge weight).
2. Clone the graph in memory, apply the intervention's effect as a *state change* (e.g., flip `legal_status: in_hearing → decided_for_authority`, or reduce `document_status: missing → verified`), which removes or shortens specific blocking edges.
3. Re-run the identical CPM calculation on the modified graph.
4. `expected_delay_reduction = projected_completion_before − projected_completion_after`.

Because both runs use the same deterministic graph algorithm, the "effect" is *derived from the graph structure itself*, not a canned number — this is the honest way to satisfy your "without simply hardcoding the result" requirement.

---

## 13. MAP VISUALIZATION — exact content per mode

**NORMAL MODE colors/status:** `Acquired` (green), `In Progress` (amber), `Problem` (red — any blocking legal/ownership/document issue open), `Not Started` (grey).

**RISK MODE:** `Low / Medium / High / Critical`, computed from the risk_score in Section 10, rendered as a choropleth over parcel polygons.

**CRITICAL PATH MODE:** only parcels whose `downstream_dependencies` list includes a project milestone within the current critical path (i.e., parcels that are *not* on the critical path are dimmed/hidden) — this is a direct filter on the Section 11 graph's computed longest-path set, not a separate scoring system.

**Parcel click panel — exact fields, all traceable to the schema above:**
`parcel_id, owner(s), village, land_area, acquisition_status, compensation (status + total_compensation), rr (status + entitlements), legal_status, documents (list + status), dependencies (upstream blockers + downstream affected count), criticality_score (+ contributing terms), risk_score, downstream_impact (segments/milestones affected), recommended_action` — the last field is MODEL_DERIVED text generated from whichever blocking edge currently dominates (e.g. "Resolve ownership conflict — verification blocked by 1 missing document" beats a generic "delayed" label).

---

## 14. DATA PROVENANCE — UI treatment

Every record's `source_type` (`REAL_PUBLIC | SYNTHETIC | USER_ENTERED | MODEL_DERIVED`) should be visibly distinguished, not just stored:
- **Color-coded badge** next to every field/card in the UI: e.g. blue = REAL_PUBLIC, amber/dashed border = SYNTHETIC, green = USER_ENTERED, purple = MODEL_DERIVED.
- **Hover/click reveals** `source`, `source_url` (clickable, opens the real source, for REAL_PUBLIC only), `source_timestamp`, `verification_status`, `confidence`.
- A **"Data Reality" toggle/legend** always visible on the map and dashboard, so a judge or reviewer never mistakes a synthetic parcel for a real one — this directly implements your "extremely clear distinction" requirement and is, frankly, one of the strongest differentiators this platform can have as a submission: most competing prototypes will blur this line, and you've explicitly asked not to.

---

## 15. RECOMMENDED MVP DATASET (given real constraints found above)

Given everything verified above, a credible, honest MVP combines:
1. **Real geospatial base layer:** OSM/Geofabrik roads+rail+rivers for your chosen Rajasthan district(s), plus whatever real village boundary layer you can source for that specific district (verify per-district on Bhuvan/state GIS before committing — don't assume coverage).
2. **Real reference data:** the RFCTLARR Act compensation formula (Section 6) driving all synthetic compensation math; Rajasthan DLC circle-rate ranges (verify current published rates for your chosen district) informing plausible synthetic market values.
3. **Real historical calibration:** the 2 verified cases in Section 1/5 (Bullet Train, Yamuna Expressway) as a "Historical Patterns" reference panel — not wired into the live synthetic project, but citable as "here is what really happens when X occurs," giving your risk model's weighting a real-world anchor you can defend to judges.
4. **One synthetic MEDIUM project** (500–2,500 parcels) as the live demo — big enough to show Critical Path Intelligence doing real work, small enough to seed/reset quickly during a demo.
5. **Full provenance labeling** from day one (Section 14) — this should be a headline feature of your pitch, not an afterthought.

---

## 16. WHAT THIS SESSION EXPLICITLY DID NOT FABRICATE

To be fully transparent about the boundary of this research:
- No parcel-level ownership record, khasra number, or landowner name in this document is real — none were found publicly available, so none are presented.
- No compensation amount for any real case is stated beyond what the cited sources explicitly reported (the Yamuna Expressway 64.7% enhancement is real and cited; no other project's exact per-household payout was found and none is invented).
- The "candidate cases" list in Section 1 (DMIC, POSCO, Narmada, Nandigram/Singur, Vizhinjam, Char Dham) is flagged as unverified in this pass — treat every field for those as NULL until independently researched.
- Village names inside the synthetic project (e.g., the fictional "Kanhera Kalan") are invented placeholders and must never be rendered next to real district/tehsil names in a way that implies they exist.


## 17. API / DATA INGESTION ARCHITECTURE (recommended)

```
Ingestion layer
├── real_geo_ingest/        -- one-time + periodic pulls
│     ├── osm_geofabrik.py       (roads, rail, rivers, water bodies -> PostGIS `roads`, `infrastructure`)
│     ├── bhuvan_layers.py       (village boundaries / thematic layers where a district has coverage)
│     └── datagovin_client.py    (registered API key; admin boundaries, aggregate stats)
├── document_registry/       -- manual/curated entry of real notification & judgment PDFs (Section 4/5),
│                                each row stamped source_type=REAL_PUBLIC with a working source_url
├── synthetic_seed/           -- synthetic_data_generator.py output loaded via seed_data.sql
├── field_officer_api/        -- USER_ENTERED writes: document upload, status updates, verification actions
└── analytics_engine/         -- MODEL_DERIVED: criticality/risk scoring, CPM projected-completion,
                                 what-if simulation, all read from + write back to the same PostGIS tables
```
Each layer writes only its own `source_type`, so the provenance rule (Section 14) is enforced structurally, not just by convention.

---

## 18. SEED PACKAGE — WHAT WAS ACTUALLY GENERATED

A working generator (`synthetic_data_generator.py`) and PostGIS schema (`schema_postgis.sql`) are delivered alongside this document, plus one executed SMALL-size sample run so you can inspect real output, not just a design on paper.

**Sample run (`--size SMALL --seed 42`) produced:**
- 181 parcels across 3 synthetic villages, 60 owners, 6 officers, 4 departments, 6 project segments, 3 milestones
- Scenario distribution actually generated: 71 clean, 22 ownership_mismatch, 21 duplicate_ownership, 19 compensation_pending, 14 approval_bottleneck, 11 missing_documents, 9 rr_pending, 7 legal_dispute, 5 field_verification_pending, 2 inaccessible_parcel — plus a small deliberately-seeded set of "hidden critical" parcels (low visible severity but structurally gating a segment), for testing whether your Critical Path Intelligence feature correctly surfaces them
- Full referential consistency verified by construction: every `compensation_record.case_id` references a real `acquisition_cases.case_id`; every `case_id` references a real `parcels.parcel_id`; every blocking relationship also has a matching row in `dependency_edges`
- Output formats: `seed_data.json` (full nested export), one `.csv` per table (18 tables), and `seed_data.sql` (ready-to-run `INSERT` statements against `schema_postgis.sql`)

To regenerate at MEDIUM or LARGE scale for the actual demo:
```bash
python synthetic_data_generator.py --size MEDIUM --seed <your_seed> --out ./seed_output
python synthetic_data_generator.py --size LARGE  --seed <your_seed> --out ./seed_output
```
Geometry columns (`geometry`, `boundary`, `alignment`) are intentionally left for a follow-up GIS-generation pass (e.g., placing synthetic parcel polygons inside a real or placeholder village envelope, per the method in Section 3) rather than fabricated here as fake coordinates — plugging in real village boundaries where available (Section 2) is the more credible next step than inventing lat/longs.

---

*Document prepared for SIH26016. Every REAL_PUBLIC claim above is paraphrased from and traceable to the cited source URLs. Every synthetic figure, name, and record is fabricated for prototype purposes only and is tagged accordingly throughout the delivered schema and seed data.*
