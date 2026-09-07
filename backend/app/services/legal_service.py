"""
Legal & Rights Knowledge Center Service
SIH26016 Land Acquisition Digital Twin Engine

Provides structured, authoritative legal information from the RFCTLARR Act 2013,
Central Notifications, and State Rules (e.g., Rajasthan RFCTLARR Rules 2016).
Connects legal obligations to parcel workflows, officer duties, citizen rights,
complaints, and CPM milestones.
"""
from typing import Any, Optional
from sqlalchemy import select, or_, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.legal import SIHLegalProvision
from app.data.legal_provisions_data import LEGAL_PROVISIONS_SEED
from app.services.sih26016_service import sih_service

LEGAL_DISCLAIMER_TEXT = (
    "KOSH provides statutory information and workflow guidance based on configured "
    "legal sources. It does not provide legal advice or determine legal rights. "
    "Applicable State rules, notifications, special enactments, court orders and "
    "project-specific circumstances may affect the procedure. Verify the current "
    "applicable law with the competent authority or qualified legal professional."
)

OFFICER_STAGES_DEFINITION = [
    {
        "stage_number": 1,
        "stage_key": "proposal",
        "stage_name": "Project Proposal & Requisition",
        "applicable_laws": ["RFCTLARR Act 2013 Section 2", "Project Requisition Guidelines"],
        "officer_responsibility": "Verify project alignment, requiring body requisition, extent of public purpose, and preliminary corridor boundaries.",
        "required_evidence": ["Administrative Approval Order", "Corridor Alignment Feasibility DPR", "Land Requisition Form 1"],
        "notified_parties": ["Revenue Department", "Requiring Body (NHAI/MoRTH)"],
        "statutory_clock": "Pre-statutory preparation phase",
        "risk_if_overdue": "Delay in initiating SIA and statutory preliminary notification.",
        "related_bhumi_entity": "Project",
        "related_milestone": "MS-01: Feasibility & Alignment Sign-off",
        "provision_ids": []
    },
    {
        "stage_number": 2,
        "stage_key": "sia",
        "stage_name": "Social Impact Assessment (SIA)",
        "applicable_laws": ["RFCTLARR Act 2013 Sections 4–9", "Social Impact Assessment Rules"],
        "officer_responsibility": "Commission independent SIA study, conduct public hearings in affected Gram Panchayats, evaluate food security impact, and submit report to Expert Group.",
        "required_evidence": ["SIA Draft Report", "Gram Sabha Public Hearing Minutes & Video Recording", "Independent Expert Group Evaluation Recommendation"],
        "notified_parties": ["Affected Village Gram Panchayats", "Local Residents & Occupiers"],
        "statutory_clock": "6 months from SIA commencement to completion under Section 4(2)",
        "risk_if_overdue": "If SIA report is not approved within statutory timelines, preliminary notification cannot proceed.",
        "related_bhumi_entity": "Village",
        "related_milestone": "MS-02: SIA & Public Hearing Clearance",
        "provision_ids": []
    },
    {
        "stage_number": 3,
        "stage_key": "preliminary_notification",
        "stage_name": "Section 11 Preliminary Notification",
        "applicable_laws": ["RFCTLARR Act 2013 Section 11", "Rajasthan RFCTLARR Rules 2016"],
        "officer_responsibility": "Publish preliminary notification in Gazette, two local newspapers, Panchayat offices, and upload to website. Update land revenue registers to block unauthorized post-notification transactions.",
        "required_evidence": ["Gazette Notification (Form 4)", "Newspaper Clippings (Hindi & English)", "Gram Panchayat Notice Service Certificate"],
        "notified_parties": ["All Land Titleholders in Cadastral Boundary", "General Public"],
        "statutory_clock": "Baseline trigger (Day 0) for Section 15 (60-day objection clock) and Section 19 (12-month declaration clock)",
        "risk_if_overdue": "Postpones entire corridor timeline and increases statutory additional component liabilities under Section 30(3).",
        "related_bhumi_entity": "Parcel",
        "related_milestone": "MS-03: Section 11 Gazette Publication",
        "provision_ids": ["RFCTLARR-2013-SEC-11"]
    },
    {
        "stage_number": 4,
        "stage_key": "survey",
        "stage_name": "Preliminary Survey & Level Taking",
        "applicable_laws": ["RFCTLARR Act 2013 Sections 12 & 13"],
        "officer_responsibility": "Give 7 days prior written notice before entering buildings/compounds. Undertake DGPS cadastral boundary surveys, mark alignment pillars, and tender spot compensation for any crop/tree damage.",
        "required_evidence": ["7-Day Advance Notice Proof", "DGPS Boundary Survey Log", "Spot Damage Assessment Slip & Tender Receipt"],
        "notified_parties": ["Occupiers of Surveyed Parcels", "Village Patwari"],
        "statutory_clock": "Within 60 days following Section 11 notification",
        "risk_if_overdue": "Boundary mismatch disputes and inability to freeze cadastral area for Section 19 declaration.",
        "related_bhumi_entity": "Parcel",
        "related_milestone": "MS-04: Cadastral Boundary Demarcation",
        "provision_ids": ["RFCTLARR-2013-SEC-12", "RFCTLARR-2013-SEC-13"]
    },
    {
        "stage_number": 5,
        "stage_key": "objections",
        "stage_name": "Hearing of Objections (Section 15)",
        "applicable_laws": ["RFCTLARR Act 2013 Section 15"],
        "officer_responsibility": "Receive written objections within 60 days of Section 11 publication. Issue personal hearing notice, conduct formal enquiry, prepare reasoned report, and submit to Government for decision.",
        "required_evidence": ["Objection Registry", "Notice of Hearing (Form 5)", "Hearing Record of Proceedings", "Collector Recommendation Report"],
        "notified_parties": ["Objecting Landowners / Interested Persons"],
        "statutory_clock": "Strict 60 calendar days from Section 11 publication for filing objections",
        "risk_if_overdue": "Delayed submission of Collector's report risks exceeding the 12-month limit for Section 19 declaration.",
        "related_bhumi_entity": "Document",
        "related_milestone": "MS-05: Section 15 Objection Hearing Sign-off",
        "provision_ids": ["RFCTLARR-2013-SEC-15"]
    },
    {
        "stage_number": 6,
        "stage_key": "rr_planning",
        "stage_name": "Rehabilitation & Resettlement Planning",
        "applicable_laws": ["RFCTLARR Act 2013 Sections 16–18, 41", "Second Schedule"],
        "officer_responsibility": "Conduct socio-economic census of all affected families (titleholders and landless/tenants). Prepare Draft R&R Scheme. For Scheduled Areas, prepare Tribal Development Plan with Gram Sabha consent.",
        "required_evidence": ["Socio-Economic Census Register", "Draft R&R Scheme", "Gram Sabha Resolution (for Scheduled Areas)", "Tribal Development Plan"],
        "notified_parties": ["Affected Titleholder Families", "Livelihood-dependent Landless Families", "Gram Sabha"],
        "statutory_clock": "Must be finalized prior to Section 19 declaration",
        "risk_if_overdue": "Declaration under Section 19 cannot be published without R&R summary.",
        "related_bhumi_entity": "Village",
        "related_milestone": "MS-06: R&R Scheme Finalization",
        "provision_ids": ["RFCTLARR-2013-SEC-31", "RFCTLARR-2013-SEC-41"]
    },
    {
        "stage_number": 7,
        "stage_key": "declaration",
        "stage_name": "Section 19 Declaration",
        "applicable_laws": ["RFCTLARR Act 2013 Section 19"],
        "officer_responsibility": "Verify requiring body has deposited estimated acquisition and R&R cost. Publish formal declaration and summary of R&R scheme in Gazette, newspapers, and local offices.",
        "required_evidence": ["Cost Deposit Bank Challan", "Declaration Gazette Publication (Form 7)", "Published R&R Summary"],
        "notified_parties": ["All Verified Titleholders", "General Public"],
        "statutory_clock": "Within 12 months from Section 11 preliminary notification (Section 19(7))",
        "risk_if_overdue": "CRITICAL MANDATORY LAPSE: If declaration is not made within 12 months, Section 11 lapses entirely.",
        "related_bhumi_entity": "AcquisitionCase",
        "related_milestone": "MS-07: Section 19 Declaration Publication",
        "provision_ids": ["RFCTLARR-2013-SEC-19"]
    },
    {
        "stage_number": 8,
        "stage_key": "measurement",
        "stage_name": "Land Measurement & Plan Preparation",
        "applicable_laws": ["RFCTLARR Act 2013 Section 20"],
        "officer_responsibility": "Mark out, measure, and prepare accurate revenue cadastral map of all declared parcels for award enquiry.",
        "required_evidence": ["Final Cadastral Map with Sub-divisions", "Field Measurement Trace (FMB)", "Area Verification Memo"],
        "notified_parties": ["Village Patwari", "Tehsildar", "Landowners"],
        "statutory_clock": "Following Section 19 declaration prior to Section 21 notice",
        "risk_if_overdue": "Discrepancies in area result in delayed compensation calculations and litigation.",
        "related_bhumi_entity": "Parcel",
        "related_milestone": "MS-08: Final Cadastral Field Verification",
        "provision_ids": ["RFCTLARR-2013-SEC-12"]
    },
    {
        "stage_number": 9,
        "stage_key": "notice_to_interested",
        "stage_name": "Notice to Persons Interested (Section 21)",
        "applicable_laws": ["RFCTLARR Act 2013 Section 21"],
        "officer_responsibility": "Issue public notices and individual notices to all interested persons calling for claims to compensation, measurements, and R&R entitlements.",
        "required_evidence": ["Section 21 Public Notice (Form 8)", "Individual Notice Service Acknowledgements", "Submitted Claim Statements"],
        "notified_parties": ["Every Registered Owner and Occupier", "Known Claimants"],
        "statutory_clock": "Notice period of not less than 30 days and not more than 6 months before enquiry",
        "risk_if_overdue": "Failure of individual service renders subsequent enquiry and award vulnerable to legal challenge.",
        "related_bhumi_entity": "Document",
        "related_milestone": "MS-09: Section 21 Notice Service",
        "provision_ids": ["RFCTLARR-2013-SEC-21"]
    },
    {
        "stage_number": 10,
        "stage_key": "enquiry",
        "stage_name": "Collector Award Enquiry (Section 23)",
        "applicable_laws": ["RFCTLARR Act 2013 Section 23"],
        "officer_responsibility": "Conduct formal enquiry into objections, claims, apportionment, and parcel measurements. Record statements of all appearing titleholders.",
        "required_evidence": ["Enquiry Order Sheet", "Claims Register", "Recorded Statements of Landowners"],
        "notified_parties": ["Claimants and Interested Persons"],
        "statutory_clock": "Scheduled following expiry of Section 21 notice period",
        "risk_if_overdue": "Delays final award determination.",
        "related_bhumi_entity": "AcquisitionCase",
        "related_milestone": "MS-10: Section 23 Collector Enquiry",
        "provision_ids": ["RFCTLARR-2013-SEC-23"]
    },
    {
        "stage_number": 11,
        "stage_key": "valuation",
        "stage_name": "Statutory Valuation Determination",
        "applicable_laws": ["RFCTLARR Act 2013 Sections 26–30", "First Schedule", "State Rules"],
        "officer_responsibility": "Determine market value (higher of circle rate vs 3-yr sale deeds), apply rural multiplier slab, assess PWD structures, forest/horticulture trees, crops, and compute 100% solatium and 12% additional amount.",
        "required_evidence": ["DLC / Circle Rate Sheet", "3-Year Sub-Registrar Average Sale Analysis", "PWD Structural Valuation", "Horticulture Tree Valuation", "KOSH Valuation Calculation Sheet"],
        "notified_parties": ["Requiring Body", "Collector Valuation Committee"],
        "statutory_clock": "Completed during enquiry prior to award finalization",
        "risk_if_overdue": "Inaccurate valuation leads to widespread Section 64 references and delay interest under Section 80.",
        "related_bhumi_entity": "CompensationRecord",
        "related_milestone": "MS-11: Statutory Valuation Finalization",
        "provision_ids": ["RFCTLARR-2013-SEC-26", "RFCTLARR-2013-SEC-26-2-SCH-1", "RFCTLARR-2013-SEC-27-29", "RFCTLARR-2013-SEC-30-1", "RFCTLARR-2013-SEC-30-3", "RAJ-RFCTLARR-2016-RULE-14"]
    },
    {
        "stage_number": 12,
        "stage_key": "award",
        "stage_name": "Land Acquisition Award (Sections 23 & 25)",
        "applicable_laws": ["RFCTLARR Act 2013 Sections 23, 25, 30"],
        "officer_responsibility": "Obtain State Government prior approval where award quantum exceeds prescribed limits. Pronounce formal award under Section 23 and file award in Collector's office.",
        "required_evidence": ["State Government Approval (if required)", "Final Award Order (Form 11)", "Apportionment Award Schedule"],
        "notified_parties": ["All Interested Persons (Form 12 Notice)", "Requiring Body"],
        "statutory_clock": "EXACTLY 12 MONTHS from Section 19 declaration date (Section 25)",
        "risk_if_overdue": "ABSOLUTE STATUTORY LAPSE: Entire acquisition proceeding terminates by law under Section 25.",
        "related_bhumi_entity": "AcquisitionCase",
        "related_milestone": "MS-12: Section 23 Final Award Pronouncement",
        "provision_ids": ["RFCTLARR-2013-SEC-23", "RFCTLARR-2013-SEC-25", "RFCTLARR-2013-SEC-30-1", "RFCTLARR-2013-SEC-30-3"]
    },
    {
        "stage_number": 13,
        "stage_key": "compensation_payment",
        "stage_name": "Compensation Payment & Disbursement",
        "applicable_laws": ["RFCTLARR Act 2013 Sections 38, 77, 80"],
        "officer_responsibility": "Disburse 100% of awarded compensation directly into titleholder bank accounts via PFMS / treasury transfer. If ownership is disputed or owner refuses tender, deposit amount with the LARR Authority.",
        "required_evidence": ["PFMS Bank Payment Confirmation Slips", "Authority Deposit Challan (Form 13)", "Proof of Tender"],
        "notified_parties": ["Awardees / Titleholders", "LARR Authority"],
        "statutory_clock": "Prior to taking physical possession under Section 38",
        "risk_if_overdue": "Taking possession before payment triggers 9% to 15% statutory penal interest under Section 80.",
        "related_bhumi_entity": "CompensationRecord",
        "related_milestone": "MS-13: 100% Compensation Disbursement",
        "provision_ids": ["RFCTLARR-2013-SEC-38", "RFCTLARR-2013-SEC-77-80"]
    },
    {
        "stage_number": 14,
        "stage_key": "rr_award",
        "stage_name": "Rehabilitation & Resettlement Award",
        "applicable_laws": ["RFCTLARR Act 2013 Section 31", "Second Schedule"],
        "officer_responsibility": "Pronounce separate R&R award specifying housing allotment, subsistence grant, transport grant, and livelihood options for all qualified affected families.",
        "required_evidence": ["R&R Award Order (Form 9)", "Disbursement Register for Monetary Entitlements", "House Allotment Orders"],
        "notified_parties": ["All Affected Families (Titleholders and Non-titleholders)"],
        "statutory_clock": "Concurrently with or prior to taking possession",
        "risk_if_overdue": "Possession cannot legally be taken under Section 38 until monetary R&R entitlements are fully paid.",
        "related_bhumi_entity": "AcquisitionCase",
        "related_milestone": "MS-14: R&R Award Pronouncement & Grant",
        "provision_ids": ["RFCTLARR-2013-SEC-31"]
    },
    {
        "stage_number": 15,
        "stage_key": "possession",
        "stage_name": "Possession & Land Vesting (Section 38)",
        "applicable_laws": ["RFCTLARR Act 2013 Section 38"],
        "officer_responsibility": "Verify full payment of compensation and R&R grants. Take physical possession of land. Execute Panchnama with independent witnesses and handover possession to Requiring Body.",
        "required_evidence": ["Full Payment Verification Certificate", "Panchnama with 2 Independent Witnesses", "Spot Possession Memo (Form 10)", "Handover Memo to NHAI/Contractor"],
        "notified_parties": ["Landowners / Occupiers", "Civil Contractors", "Police Escort if required"],
        "statutory_clock": "Only after 100% payment verification",
        "risk_if_overdue": "Premature possession without full payment is illegal and invites High Court stay orders.",
        "related_bhumi_entity": "Parcel",
        "related_milestone": "MS-15: Physical Possession & Corridor Vesting",
        "provision_ids": ["RFCTLARR-2013-SEC-38"]
    },
    {
        "stage_number": 16,
        "stage_key": "dispute_reference",
        "stage_name": "Dispute Reference to Authority (Section 64)",
        "applicable_laws": ["RFCTLARR Act 2013 Section 64", "Sections 76 & 77"],
        "officer_responsibility": "Receive reference applications from dissatisfied landowners. Transmit statement and case records to the LARR Authority within 30 days. Record protest status.",
        "required_evidence": ["Section 64 Application", "Collector Reference Statement to Authority (Form 14)", "Transmittal Receipt from Authority"],
        "notified_parties": ["Applicant Landowner", "LARR Authority", "Requiring Body"],
        "statutory_clock": "Application within 6 weeks (if present) or 6 months (from notice). Collector must refer within 30 days.",
        "risk_if_overdue": "If Collector fails to refer within 30 days, landowner may apply directly to Authority under Section 64(2) proviso.",
        "related_bhumi_entity": "LegalCase",
        "related_milestone": "MS-16: Judicial Reference Transmission",
        "provision_ids": ["RFCTLARR-2013-SEC-64"]
    },
    {
        "stage_number": 17,
        "stage_key": "closure",
        "stage_name": "Project Closure & Revenue Mutation",
        "applicable_laws": ["RFCTLARR Act 2013 Section 99", "State Land Revenue Act"],
        "officer_responsibility": "Execute mutation of acquired parcels in favor of Central/State Government in revenue Jamabandi. Issue updated revenue records and close acquisition case file.",
        "required_evidence": ["Revenue Mutation Order (Dakhil Kharij)", "Updated Jamabandi / Khasra Khatauni", "Final Audit Log"],
        "notified_parties": ["Revenue Sub-Divisional Officer", "Tehsildar", "Requiring Body"],
        "statutory_clock": "Within 30 days following possession",
        "risk_if_overdue": "Failure to mutate causes double-taxation and duplicate revenue record conflicts.",
        "related_bhumi_entity": "Parcel",
        "related_milestone": "MS-17: Revenue Record Mutation & Closure",
        "provision_ids": []
    }
]

LANDOWNER_GUIDE_SECTIONS = [
    {
        "section_key": "before_acquisition",
        "title": "Before Acquisition",
        "subtitle": "Understanding Notifications, Surveys, and Your Initial Rights",
        "questions": [
            {
                "question": "What does a Preliminary Notification under Section 11 mean?",
                "answer": "It is the official announcement that the Government intends to acquire land in your village for a specified public purpose (such as a highway bypass or rail corridor). It identifies the affected village and estimated area. Importantly, any sale, purchase, or mortgage of the notified land made after this date without the Collector's permission is legally void.",
                "action_needed": "Check the gazette notice to see if your survey number (Khasra) is listed. Retain your original title deeds (Jamabandi/RoR/Khatoni).",
                "linked_section": "Section 11(1) & 11(4)"
            },
            {
                "question": "Can officers enter my land for survey? What are my rights?",
                "answer": "Yes, under Section 12, authorized survey teams may enter land to measure and take levels. However, they CANNOT enter any building or enclosed compound attached to a dwelling house without giving you at least seven (7) days advance written notice. You or your representative have the right to be present.",
                "action_needed": "Accompany the survey team. Note down where boundary pillars are placed. Take photos of existing structures and trees on the boundary line.",
                "linked_section": "Section 12"
            },
            {
                "question": "What if crops or trees are damaged during the survey?",
                "answer": "Under Section 13, the surveying staff must assess and tender spot cash compensation immediately for any damage caused to standing crops, trees, or fences during surveying or soil boring.",
                "action_needed": "Request an on-the-spot written damage slip and payment. If you disagree with the amount, record your objection in writing to the Collector.",
                "linked_section": "Section 13"
            },
            {
                "question": "How and when can I raise objections to the acquisition?",
                "answer": "You have exactly sixty (60) days from the publication date of the Section 11 notification to submit written objections to the Collector under Section 15. You can object to: (1) whether the purpose is genuinely public, (2) the suitability of your land, (3) excessive area being acquired, or (4) findings of the Social Impact Assessment (SIA).",
                "action_needed": "Submit your written objection to the Collector within 60 days. You are legally entitled to a personal hearing.",
                "linked_section": "Section 15"
            }
        ],
        "provision_ids": ["RFCTLARR-2013-SEC-11", "RFCTLARR-2013-SEC-12", "RFCTLARR-2013-SEC-13", "RFCTLARR-2013-SEC-15"]
    },
    {
        "section_key": "compensation",
        "title": "Compensation & Valuation",
        "subtitle": "How Your Compensation is Calculated under Sections 26 to 30",
        "questions": [
            {
                "question": "How is the base market value of my land determined?",
                "answer": "Under Section 26, the Collector must evaluate two figures: (1) the minimum circle rate (DLC rate) prescribed under the Stamp Act, and (2) the average sale price of the top 50% recorded registered sale deeds for similar land in your village over the past 3 years. The statute guarantees that you receive the HIGHER of these two rates.",
                "action_needed": "Inspect the KOSH valuation card for your parcel to verify the circle rate and comparison sale rate applied.",
                "linked_section": "Section 26(1)"
            },
            {
                "question": "What is the rural distance multiplier factor?",
                "answer": "For rural lands, Section 26(2) and the First Schedule mandate that the base market value is multiplied by a statutory factor between 1.00x and 2.00x based on radial distance from the nearest municipal boundary. For example, in Rajasthan, land 10–20 km away receives a 1.50x multiplier.",
                "action_needed": "Confirm your parcel's distance from the nearest urban boundary in the KOSH dossier.",
                "linked_section": "Section 26(2) & First Schedule"
            },
            {
                "question": "How are houses, wells, and trees valued?",
                "answer": "Under Section 29, the Collector cannot rely solely on land rates. Independent expert departments must value attached assets: PWD for residential/commercial structures, Forest/Horticulture for timber and fruit trees, and Agriculture for standing crops. Severance damages must also be paid under Section 28 if dividing your land leaves remainder fragments unusable.",
                "action_needed": "Submit bills, photographs, and estimates of borewells, farm houses, or fruit orchards to the Land Acquisition Officer.",
                "linked_section": "Sections 27, 28 & 29"
            },
            {
                "question": "What is Solatium and how much do I receive?",
                "answer": "Under Section 30(1), the Collector must award a mandatory Solatium of one hundred per cent (100%) on the total compensation amount (market value + attached assets + severance). This statutory solatium effectively doubles the subtotal.",
                "action_needed": "Ensure the 100% Solatium line item is included in your draft award calculation.",
                "linked_section": "Section 30(1)"
            },
            {
                "question": "What is the additional 12% statutory component?",
                "answer": "Under Section 30(3), you receive an additional statutory amount calculated at 12% per annum on the base market value for the period between the Section 11 notice and the date of the Collector award. (This is an additional statutory component, distinct from Section 80 penal interest for delayed payment).",
                "action_needed": "Verify the exact date of Section 11 notice and award date to check the days of accrued 12% allowance.",
                "linked_section": "Section 30(3)"
            }
        ],
        "provision_ids": ["RFCTLARR-2013-SEC-26", "RFCTLARR-2013-SEC-26-2-SCH-1", "RFCTLARR-2013-SEC-27-29", "RFCTLARR-2013-SEC-30-1", "RFCTLARR-2013-SEC-30-3", "RAJ-RFCTLARR-2016-RULE-14"]
    },
    {
        "section_key": "objections_disputes",
        "title": "Objections & Grievances",
        "subtitle": "Raising Procedural Objections vs Lodging Digital Twin Grievances",
        "questions": [
            {
                "question": "What is the difference between an administrative grievance in KOSH and a statutory objection?",
                "answer": "A statutory objection under Section 15 must be filed in writing with the Collector within 60 days of Section 11 notification and specifically addresses the legal validity of the acquisition. An administrative grievance submitted in the KOSH portal helps you flag ground-level issues (like boundary pillar misalignment, delayed officer visit, or unrecorded borewells) directly to the verification team and automatically feeds into the corridor delay tracking.",
                "action_needed": "Use KOSH Grievance submission for quick field officer intervention, but ensure you also file a formal Section 15 petition if challenging the acquisition.",
                "linked_section": "Section 15"
            },
            {
                "question": "What happens if there is an ownership dispute or contest between legal heirs?",
                "answer": "If multiple family members or claimants contest title or apportionment, the Collector does not decide complex title questions. The Collector deposits the disputed compensation into the LARR Authority under Section 77(2), and the Authority adjudicates the entitlement. In KOSH, this dispute flags an active CPM blocker on the parcel.",
                "action_needed": "Submit registered mutation records, succession certificates, or family partition deeds to clarify entitlement.",
                "linked_section": "Sections 64 & 77(2)"
            }
        ],
        "provision_ids": ["RFCTLARR-2013-SEC-15", "RFCTLARR-2013-SEC-64", "RFCTLARR-2013-SEC-77-80"]
    },
    {
        "section_key": "rehabilitation_resettlement",
        "title": "Rehabilitation & Resettlement (R&R)",
        "subtitle": "Entitlements for Displaced and Affected Families under the Second Schedule",
        "questions": [
            {
                "question": "Who qualifies as an 'affected family' under the Act?",
                "answer": "The definition is broad: it covers not only title-holding landowners whose land is acquired, but also agricultural labourers, tenants, sharecroppers, and village artisans whose primary source of livelihood has been affected by the acquisition for at least three years prior.",
                "action_needed": "Ensure all dependent family members and tenants are enumerated during the Section 16 socio-economic census.",
                "linked_section": "Section 3(c) & Section 31"
            },
            {
                "question": "What entitlements are guaranteed under the Second Schedule?",
                "answer": "Key entitlements include: (1) Constructed house in resettlement area or one-time financial grant for house construction, (2) Monthly subsistence allowance of ₹3,000/month for 12 months, (3) Transportation allowance of ₹50,000 for displaced families, (4) One-time Resettlement Allowance of ₹50,000, and (5) Annuity or mandatory employment option where applicable.",
                "action_needed": "Review the published R&R scheme summary accompanying the Section 19 declaration.",
                "linked_section": "Section 31 & Second Schedule"
            },
            {
                "question": "What special protections apply to Scheduled Caste and Scheduled Tribe families?",
                "answer": "Under Section 41, acquisition in Scheduled Areas requires prior informed consent of the Gram Sabha. SC/ST families are entitled to land-for-land restoration (minimum 2.5 acres or equal extent acquired), a one-time grant of ₹50,000, and an additional 25% monetary allocation under the Second Schedule.",
                "action_needed": "Submit your caste certificate to the Administrator R&R to ensure inclusion in the Tribal Development Plan.",
                "linked_section": "Section 41"
            }
        ],
        "provision_ids": ["RFCTLARR-2013-SEC-31", "RFCTLARR-2013-SEC-41"]
    },
    {
        "section_key": "possession_completion",
        "title": "Possession & Land Handover",
        "subtitle": "Prerequisites for Government Possession and Document Safeguards",
        "questions": [
            {
                "question": "Can the Government take physical possession of my land before paying compensation?",
                "answer": "ABSOLUTELY NOT. Under Section 38(1), full payment of compensation as well as monetary R&R entitlements must be paid or deposited in your bank account BEFORE the Collector can take possession. Any attempt to dispossess you prior to full payment is illegal.",
                "action_needed": "Do not surrender physical possession until your bank account reflects the full compensation award credit. Keep bank statements and UTR numbers.",
                "linked_section": "Section 38(1)"
            },
            {
                "question": "What happens if Government takes possession but compensation is delayed?",
                "answer": "Under Section 80, if compensation is not paid or deposited before taking possession, the Collector MUST pay statutory interest at nine per cent (9%) per annum from the date of taking possession up to one year, and fifteen per cent (15%) per annum for any subsequent period until paid.",
                "action_needed": "If possession was taken without payment, record the exact date and immediately demand interest under Section 80.",
                "linked_section": "Section 80"
            }
        ],
        "provision_ids": ["RFCTLARR-2013-SEC-38", "RFCTLARR-2013-SEC-77-80"]
    },
    {
        "section_key": "if_you_disagree",
        "title": "If You Disagree (Remedies & Escalation)",
        "subtitle": "Statutory References, Appeals, and Judicial Recourse Pathways",
        "questions": [
            {
                "question": "What should I do if I am unhappy with the compensation amount awarded?",
                "answer": "You can accept the compensation 'UNDER PROTEST' in writing. Accepting under protest allows you to receive the money immediately while preserving your legal right to seek higher compensation. Never sign an unconditional receipt if you intend to seek enhancement.",
                "action_needed": "Write 'Accepted Under Protest regarding quantum of compensation' on the voucher and receipt.",
                "linked_section": "Section 64"
            },
            {
                "question": "How do I refer my case to the Land Acquisition Authority?",
                "answer": "Under Section 64, submit a written application to the Collector requesting reference to the Land Acquisition, Rehabilitation and Resettlement Authority. LIMITATION PERIOD: You must apply within six (6) weeks if you were present when the award was announced, or within six (6) months from the date of receiving the Section 21 notice or award.",
                "action_needed": "Submit your Section 64 reference application to the Collector within the statutory limitation window.",
                "linked_section": "Section 64(1) & 64(2)"
            },
            {
                "question": "What if the Collector refuses or delays forwarding my reference?",
                "answer": "Under Section 64(2) proviso, if the Collector fails to refer your application to the Authority within thirty (30) days, you have the right to apply directly to the Authority.",
                "action_needed": "Obtain an acknowledged copy of your reference application with the office stamp and date.",
                "linked_section": "Section 64(2)"
            }
        ],
        "provision_ids": ["RFCTLARR-2013-SEC-64", "RFCTLARR-2013-SEC-77-80"]
    }
]


class LegalService:
    def __init__(self):
        self._provisions_cache: dict[str, dict[str, Any]] = {}
        self._all_provisions_cache: list[dict[str, Any]] | None = None
        self._provisions_cache_time: float = 0.0
        self._load_fallback_data()

    def _load_fallback_data(self):
        """Loads static fallback provisions from the verified seed file if DB is offline."""
        for p in LEGAL_PROVISIONS_SEED:
            self._provisions_cache[p["id"]] = p

    async def get_all_provisions(
        self,
        role: Optional[str] = None,
        stage: Optional[str] = None,
        category: Optional[str] = None,
        jurisdiction: Optional[str] = None,
        search_query: Optional[str] = None,
        db: Optional[AsyncSession] = None
    ) -> list[dict[str, Any]]:
        """
        Retrieves filtered statutory provisions from PostgreSQL with in-memory fallback.
        """
        import time
        now = time.time()
        has_filters = bool(role or stage or category or jurisdiction or search_query)
        if not has_filters and self._all_provisions_cache is not None and (now - self._provisions_cache_time < 5.0):
            return [dict(p) for p in self._all_provisions_cache]

        provisions = []

        if db:
            try:
                query = select(SIHLegalProvision)
                filters = []

                if role:
                    norm_role = role.strip().upper()
                    if norm_role in ["LANDOWNER", "FIELD_OFFICER"]:
                        filters.append(or_(
                            SIHLegalProvision.applies_to == norm_role,
                            SIHLegalProvision.applies_to == "BOTH"
                        ))

                if stage:
                    filters.append(SIHLegalProvision.acquisition_stage == stage.strip().lower())

                if category:
                    filters.append(SIHLegalProvision.category == category.strip().upper())

                if jurisdiction:
                    filters.append(SIHLegalProvision.jurisdiction == jurisdiction.strip().upper())

                if search_query:
                    sq = f"%{search_query.strip()}%"
                    filters.append(or_(
                        SIHLegalProvision.section_number.ilike(sq),
                        SIHLegalProvision.title.ilike(sq),
                        SIHLegalProvision.plain_language_summary.ilike(sq),
                        SIHLegalProvision.landowner_guidance.ilike(sq),
                        SIHLegalProvision.officer_guidance.ilike(sq),
                        SIHLegalProvision.act_short_name.ilike(sq)
                    ))

                if filters:
                    query = query.where(*filters)

                query = query.order_by(SIHLegalProvision.id)
                res = await db.execute(query)
                rows = res.scalars().all()
                provisions = [r.to_dict() for r in rows]
            except Exception as e:
                print(f"[LegalService] Database query notice: {e}. Falling back to memory cache.")

        if not provisions:
            # Filter memory cache
            provisions = list(self._provisions_cache.values())
            if role:
                norm_role = role.strip().upper()
                provisions = [p for p in provisions if p.get("applies_to") in [norm_role, "BOTH"]]
            if stage:
                provisions = [p for p in provisions if p.get("acquisition_stage") == stage.strip().lower()]
            if category:
                provisions = [p for p in provisions if p.get("category") == category.strip().upper()]
            if jurisdiction:
                provisions = [p for p in provisions if p.get("jurisdiction") == jurisdiction.strip().upper()]
            if search_query:
                sq = search_query.strip().lower()
                provisions = [
                    p for p in provisions
                    if sq in p.get("section_number", "").lower()
                    or sq in p.get("title", "").lower()
                    or sq in p.get("plain_language_summary", "").lower()
                    or sq in p.get("landowner_guidance", "").lower()
                    or sq in p.get("officer_guidance", "").lower()
                ]

        if not has_filters and provisions:
            import time
            self._all_provisions_cache = [dict(p) for p in provisions]
            self._provisions_cache_time = time.time()

        return provisions

    async def get_provision_by_id(self, provision_id: str, db: Optional[AsyncSession] = None) -> Optional[dict[str, Any]]:
        norm_id = provision_id.strip()
        if db:
            try:
                res = await db.execute(select(SIHLegalProvision).where(SIHLegalProvision.id == norm_id))
                prov = res.scalars().first()
                if prov:
                    return prov.to_dict()
            except Exception:
                pass
        return self._provisions_cache.get(norm_id)

    async def get_officer_procedural_guide(self, db: Optional[AsyncSession] = None) -> list[dict[str, Any]]:
        """Returns the 17 sequential acquisition stages with operational duties and provisions."""
        all_provs = await self.get_all_provisions(db=db)
        prov_map = {p["id"]: p for p in all_provs}

        guide = []
        for stage in OFFICER_STAGES_DEFINITION:
            st = dict(stage)
            st_provs = [prov_map[pid] for pid in st.get("provision_ids", []) if pid in prov_map]
            # Also auto-match provisions by acquisition_stage if not already present
            stage_key = st["stage_key"]
            for p in all_provs:
                if p.get("acquisition_stage") == stage_key and p["id"] not in [sp["id"] for sp in st_provs]:
                    st_provs.append(p)
            st["provisions"] = st_provs
            guide.append(st)

        return guide

    async def get_landowner_guide(self, db: Optional[AsyncSession] = None) -> list[dict[str, Any]]:
        """Returns the 6 question-oriented landowner rights sections."""
        all_provs = await self.get_all_provisions(db=db)
        prov_map = {p["id"]: p for p in all_provs}

        guide = []
        for sec in LANDOWNER_GUIDE_SECTIONS:
            s = dict(sec)
            s_provs = [prov_map[pid] for pid in s.get("provision_ids", []) if pid in prov_map]
            s["provisions"] = s_provs
            guide.append(s)

        return guide

    async def get_parcel_legal_context(self, parcel_id: str, db: Optional[AsyncSession] = None) -> dict[str, Any]:
        """Maps parcel dossier state to governing statutory provisions."""
        norm_pid = parcel_id.strip().upper()
        p_detail = sih_service.get_parcel_detail(norm_pid) or {}

        status = p_detail.get("acquisition_status", "not_started")
        has_conflict = bool(p_detail.get("ownership_conflict"))
        conflict_type = p_detail.get("conflict_type", "none")

        # Map status to stage
        stage_map = {
            "not_started": "preliminary_notification",
            "notified": "objections",
            "surveyed": "declaration",
            "declared": "enquiry",
            "award_declared": "valuation",
            "compensation_pending": "compensation_payment",
            "disputed": "dispute_reference",
            "possessed": "closure"
        }
        current_stage = stage_map.get(status, "preliminary_notification")

        # Select applicable provisions
        target_ids = ["RFCTLARR-2013-SEC-11", "RFCTLARR-2013-SEC-26", "RFCTLARR-2013-SEC-30-1", "RFCTLARR-2013-SEC-38"]
        if status in ["not_started", "notified"]:
            target_ids.extend(["RFCTLARR-2013-SEC-12", "RFCTLARR-2013-SEC-15"])
        elif status in ["surveyed", "declared"]:
            target_ids.extend(["RFCTLARR-2013-SEC-19", "RFCTLARR-2013-SEC-21", "RFCTLARR-2013-SEC-25"])
        elif status in ["award_declared", "compensation_pending"]:
            target_ids.extend(["RFCTLARR-2013-SEC-26-2-SCH-1", "RFCTLARR-2013-SEC-27-29", "RFCTLARR-2013-SEC-30-3", "RFCTLARR-2013-SEC-31", "RFCTLARR-2013-SEC-77-80", "RAJ-RFCTLARR-2016-RULE-14"])
        elif status == "disputed" or has_conflict:
            target_ids.extend(["RFCTLARR-2013-SEC-64", "RFCTLARR-2013-SEC-77-80"])

        all_provs = await self.get_all_provisions(db=db)
        prov_map = {p["id"]: p for p in all_provs}
        applicable = [prov_map[tid] for tid in target_ids if tid in prov_map]

        return {
            "parcel_id": norm_pid,
            "acquisition_status": status,
            "current_stage": current_stage,
            "ownership_conflict": has_conflict,
            "conflict_type": conflict_type,
            "applicable_provisions": applicable,
            "disclaimer": LEGAL_DISCLAIMER_TEXT
        }

    async def get_complaint_legal_context(
        self,
        complaint_type_or_id: str,
        parcel_id: Optional[str] = None,
        db: Optional[AsyncSession] = None
    ) -> dict[str, Any]:
        """Maps a grievance / dispute to governing statutory rights and required officer action."""
        ctype = complaint_type_or_id.strip().lower()

        from app.services.complaint_cpm_bridge import classify_complaint
        classification = classify_complaint(ctype)

        target_ids = []
        officer_action = "Conduct field verification and document report in the official record."
        statutory_limitation = None
        procedural_stage = "enquiry"

        if "title" in ctype or "ownership" in ctype or classification.get("category_code") == "TITLE_DISPUTE":
            target_ids = ["RFCTLARR-2013-SEC-64", "RFCTLARR-2013-SEC-77-80"]
            officer_action = "Verify Jamabandi mutation and succession records. If dispute persists, deposit compensation in LARR Authority under Section 77(2)."
            statutory_limitation = "Reference within 6 weeks or 6 months under Section 64"
            procedural_stage = "dispute_reference"

        elif "boundary" in ctype or "measurement" in ctype or classification.get("category_code") == "BOUNDARY_MISMATCH":
            target_ids = ["RFCTLARR-2013-SEC-12", "RFCTLARR-2013-SEC-20", "RFCTLARR-2013-SEC-64"]
            officer_action = "Deploy revenue surveyor for DGPS total-station remeasurement. Reconcile Field Measurement Book (FMB) with master corridor alignment."
            statutory_limitation = "Before final award declaration under Section 25"
            procedural_stage = "survey"

        elif "possession" in ctype or classification.get("category_code") == "PHYSICAL_POSSESSION":
            target_ids = ["RFCTLARR-2013-SEC-38", "RFCTLARR-2013-SEC-80"]
            officer_action = "Halt premature physical possession. Verify 100% compensation and R&R grant credit before drawing Panchnama."
            statutory_limitation = "Possession barred until 100% payment under Section 38(1)"
            procedural_stage = "possession"

        elif "compensation" in ctype or "payment" in ctype or classification.get("category_code") == "COMPENSATION_DELAY":
            target_ids = ["RFCTLARR-2013-SEC-38", "RFCTLARR-2013-SEC-77-80"]
            officer_action = "Reconcile PFMS treasury transfer. If unpaid past possession date, calculate and disburse 9% to 15% interest under Section 80."
            statutory_limitation = "Immediate upon award"
            procedural_stage = "compensation_payment"

        elif "valuation" in ctype or "tree" in ctype or "structure" in ctype or classification.get("category_code") == "VALUATION_DISCREPANCY":
            target_ids = ["RFCTLARR-2013-SEC-26", "RFCTLARR-2013-SEC-27-29", "RFCTLARR-2013-SEC-30-1", "RFCTLARR-2013-SEC-64"]
            officer_action = "Re-inspect attached assets with PWD and Horticulture departments. If objector refuses award, advise acceptance under protest with Section 64 reference."
            statutory_limitation = "Reference within 6 weeks of award under Section 64"
            procedural_stage = "valuation"

        elif "r&r" in ctype or "resettlement" in ctype or classification.get("category_code") == "RR_ENTITLEMENT":
            target_ids = ["RFCTLARR-2013-SEC-31", "RFCTLARR-2013-SEC-41"]
            officer_action = "Verify family inclusion in R&R Census register under Second Schedule and check SC/ST status for Section 41 entitlements."
            statutory_limitation = "Prior to physical displacement"
            procedural_stage = "rr_award"

        else:
            target_ids = ["RFCTLARR-2013-SEC-15", "RFCTLARR-2013-SEC-21", "RFCTLARR-2013-SEC-64"]

        all_provs = await self.get_all_provisions(db=db)
        prov_map = {p["id"]: p for p in all_provs}
        relevant = [prov_map[tid] for tid in target_ids if tid in prov_map]

        return {
            "complaint_id": complaint_type_or_id,
            "parcel_id": parcel_id,
            "complaint_type": ctype,
            "conflict_type": classification.get("conflict_type", "general_grievance"),
            "procedural_stage": procedural_stage,
            "relevant_provisions": relevant,
            "required_officer_action": officer_action,
            "statutory_limitation": statutory_limitation,
            "disclaimer": LEGAL_DISCLAIMER_TEXT
        }


legal_service = LegalService()
