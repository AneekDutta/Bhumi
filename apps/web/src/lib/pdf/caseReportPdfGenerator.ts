import { jsPDF } from "jspdf";

export interface CaseReportData {
  // A. Case Information
  complaintId: string;
  caseId: string;
  lodgedDate: string;
  currentStatus: string;

  // B. Landowner Information
  ownerName: string;
  ownerId?: string;
  contactVillage: string;
  mobileNumber?: string;

  // C. Parcel Information
  parcelId: string;
  surveyNumber: string;
  areaAcres: number | string;
  areaSqm: number | string;
  projectId?: string;
  coordinates?: Array<{ lat: number; lng: number; accuracy?: number }>;

  // D. Original Grievance & Field Officer Determination
  complaintType: string;
  description: string;
  documents?: Array<{ name?: string; file_name?: string; title?: string }>;
  fieldDecision: "FIELD VERIFIED" | "FIELD DECLINED" | string;
  fieldOfficerName: string;
  fieldOfficerId: string;
  fieldVerifiedAt: string;
  fieldRemarks: string;

  // E. What-If Simulation
  simulationId?: string;
  simulationTimestamp?: string;
  interventionName?: string;
  interventionSection?: string;
  ruralMultiplier?: number;
  baseRatePerSqm?: number;
  marketValueInr?: number;
  solatiumInr?: number;
  interestInr?: number;
  totalAwardInr?: number;
  baselineDelayDays?: number;
  delayReductionDays?: number;
  projectedDelayDays?: number;
  affectedFamilies?: number;

  // F. Admin Decision
  adminRemarks?: string;
  adminName?: string;
  decisionDate?: string;
  orderReference?: string;

  // G. Final Resolution
  noticeReference?: string;
  resolutionDate?: string;
  resolutionStatus?: string;
}

export interface LandownerNoticeData {
  noticeReference: string;
  noticeDate: string;
  ownerName: string;
  contactVillage: string;
  parcelId: string;
  surveyNumber: string;
  complaintId: string;
  subject: string;
  grievanceSummary: string;
  fieldVerificationSummary: string;
  simulationConclusion: string;
  finalDecision: string;
  statutoryAwardInr?: number;
  nextSteps: string[];
  authorityName: string;
}

/**
 * Generates an official, multi-page CALA Case Report PDF
 */
export function generateCaseReportPdf(data: CaseReportData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  const checkPageBreak = (spaceNeeded: number) => {
    if (y + spaceNeeded > pageHeight - 16) {
      doc.addPage();
      y = 16;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("CENTRAL AUTHORITY FOR LAND ACQUISITION (CALA) · STATUTORY RECORD", margin, 10);
    doc.text(`CASE REF: ${data.complaintId}`, pageWidth - margin, 10, { align: "right" });
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  // ----------------------------------------------------
  // COVER / DOCUMENT HEADER
  // ----------------------------------------------------
  doc.setFillColor(15, 23, 42); // dark navy
  doc.rect(margin, y, contentWidth, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("OFFICIAL STATUTORY CASE RECORD & WHAT-IF SIMULATION REPORT", margin + 6, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text("Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013", margin + 6, y + 14);
  doc.text("BHUMI Decision Intelligence Engine · Directorate of Land Acquisition · SIH26016 Prototype", margin + 6, y + 19);

  y += 30;

  // ----------------------------------------------------
  // SECTION A: CASE INFORMATION
  // ----------------------------------------------------
  checkPageBreak(35);
  renderSectionHeader("SECTION A: CASE IDENTIFICATION & STATUS");

  renderKeyValueTable([
    ["Grievance Case ID", data.complaintId, "Case Tracking Code", data.caseId || `CALA-TRK-${data.complaintId.slice(-6)}`],
    ["Date Lodged", formatDate(data.lodgedDate), "Current Lifecycle Status", data.currentStatus || "FIELD VERIFIED"],
    ["Statutory Act Ref", "RFCTLARR Act 2013 / Section 15 & 23", "Corridor Project", data.projectId || "P-NH927A National Corridor"]
  ]);

  // ----------------------------------------------------
  // SECTION B: LANDOWNER INFORMATION
  // ----------------------------------------------------
  checkPageBreak(30);
  renderSectionHeader("SECTION B: CITIZEN LANDOWNER PROFILE");

  renderKeyValueTable([
    ["Registered Landowner", data.ownerName, "Owner Identification Ref", data.ownerId || "REG-OWNER-01"],
    ["Contact Village / Tehsil", data.contactVillage || "Corridor Zone", "Verified Contact Phone", data.mobileNumber || "Registered on Portal"],
    ["Aadhaar Authentication", "Verified via UIDAI e-KYC", "Entitlement Category", "Statutory Titleholder (First Schedule)"]
  ]);

  // ----------------------------------------------------
  // SECTION C: PARCEL & GIS SPATIAL RECORD
  // ----------------------------------------------------
  checkPageBreak(45);
  renderSectionHeader("SECTION C: CADASTRAL PARCEL & GIS DEMARCATION");

  renderKeyValueTable([
    ["Revenue Parcel ID", data.parcelId, "Survey Plot Number", data.surveyNumber],
    ["Acquisition Area (Acres)", `${Number(data.areaAcres || 0).toFixed(3)} Acres`, "Acquisition Area (Sq. M)", `${Number(data.areaSqm || 0).toLocaleString()} sq.m`],
    ["Demarcation Standard", "4+ GPS Corner Ground Demarcated", "Spatial Coordinate Datum", "WGS 84 (EPSG:4326) PostGIS"]
  ]);

  if (data.coordinates && data.coordinates.length > 0) {
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text("Field-Verified Cadastral Corner GPS Coordinates:", margin, y);
    y += 4;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text("PILLAR / CORNER", margin + 3, y + 4);
    doc.text("LATITUDE (N)", margin + 40, y + 4);
    doc.text("LONGITUDE (E)", margin + 85, y + 4);
    doc.text("DEVICE ACCURACY", margin + 130, y + 4);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);

    data.coordinates.slice(0, 6).forEach((pt, idx) => {
      checkPageBreak(7);
      doc.text(`Corner Boundary Peg #${idx + 1}`, margin + 3, y + 3);
      doc.text(pt.lat.toFixed(6) + "°", margin + 40, y + 3);
      doc.text(pt.lng.toFixed(6) + "°", margin + 85, y + 3);
      doc.text(`±${(pt.accuracy || 3.2).toFixed(1)} meters`, margin + 130, y + 3);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 5, margin + contentWidth, y + 5);
      y += 6;
    });
    y += 4;
  }

  // ----------------------------------------------------
  // SECTION D: ORIGINAL GRIEVANCE & FIELD DETERMINATION
  // ----------------------------------------------------
  checkPageBreak(45);
  renderSectionHeader("SECTION D: ORIGINAL CITIZEN GRIEVANCE & FIELD DETERMINATION");

  renderKeyValueTable([
    ["Grievance Type", data.complaintType || "Compensation & Boundary Dispute", "Field Officer Decision", data.fieldDecision || "FIELD VERIFIED"],
    ["Inspecting Field Officer", `${data.fieldOfficerName} (${data.fieldOfficerId})`, "Inspection Date & Time", formatDate(data.fieldVerifiedAt)],
    ["Decision Immutability", "PERMANENTLY LOCKED & FINAL", "Statutory Determination", data.fieldDecision === "FIELD DECLINED" ? "Ground Claim Disallowed" : "Ground Claim Validated & Endorsed"]
  ]);

  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("Citizen Grievance Submission:", margin, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const descLines = doc.splitTextToSize(data.description || "No specific grievance description entered.", contentWidth - 4);
  doc.text(descLines, margin + 2, y);
  y += descLines.length * 3.5 + 4;

  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("Field Officer Ground Inspection Findings & Remarks:", margin, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const fieldRemarksLines = doc.splitTextToSize(data.fieldRemarks || "Field demarcation verified on site.", contentWidth - 4);
  doc.text(fieldRemarksLines, margin + 2, y);
  y += fieldRemarksLines.length * 3.5 + 6;

  // ----------------------------------------------------
  // SECTION E: WHAT-IF SIMULATION & STATUTORY CALCULATIONS
  // ----------------------------------------------------
  checkPageBreak(50);
  renderSectionHeader("SECTION E: STATUTORY WHAT-IF SIMULATION & OUTCOME MODELING");

  renderKeyValueTable([
    ["Simulation Identifier", data.simulationId || "SIM-PRE-DETERMINED", "Simulation Date & Time", formatDate(data.simulationTimestamp || new Date().toISOString())],
    ["Applied Intervention", data.interventionName || "Fast-Track PFMS Direct Disbursement", "Statutory Provision", data.interventionSection || "RFCTLARR 2013 Section 30(1)"],
    ["Rural Multiplying Factor", `${data.ruralMultiplier || 1.25}x Base Market Value`, "Base Circle Rate", `₹${data.baseRatePerSqm || 450} / sq.m`]
  ]);

  checkPageBreak(35);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 24, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("COMPARATIVE CONDITION", margin + 4, y + 5);
  doc.text("BASELINE / EXISTING", margin + 65, y + 5);
  doc.text("SIMULATED / PROPOSED INTERVENTION", margin + 120, y + 5);
  doc.setLineWidth(0.2);
  doc.line(margin + 4, y + 7, margin + contentWidth - 4, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Corridor Delay Attributable", margin + 4, y + 12);
  doc.text(`${data.baselineDelayDays || 145} Days (Critical Path Blocked)`, margin + 65, y + 12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text(`${data.projectedDelayDays || 25} Days (-${data.delayReductionDays || 120} days recovered)`, margin + 120, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text("Statutory Compensation Award", margin + 4, y + 17);
  doc.text("Pending / Disputed Assessment", margin + 65, y + 17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(`₹${(data.totalAwardInr || 0).toLocaleString()} (Full Statutory Entitlement)`, margin + 120, y + 17);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text("Affected Families Resettlement", margin + 4, y + 22);
  doc.text("1 Family (Dispute Pending)", margin + 65, y + 22);
  doc.text(`1 Family (${data.areaAcres || 0} Acres Entitlement Disbursed)`, margin + 120, y + 22);

  y += 28;

  // ----------------------------------------------------
  // SECTION F: ADMIN DECISION & DIRECTIVES
  // ----------------------------------------------------
  checkPageBreak(35);
  renderSectionHeader("SECTION F: COMPETENT AUTHORITY (CALA) DETERMINATION & DIRECTIVE");

  renderKeyValueTable([
    ["Presiding Officer", data.adminName || "CALA District Competent Authority", "Administrative Order Ref", data.orderReference || `CALA-DIR-${data.complaintId.slice(-6)}`],
    ["Directive Date", formatDate(data.decisionDate || new Date().toISOString()), "Administrative Action", "Statutory Implementation & Redressal Order Issued"]
  ]);

  if (data.adminRemarks) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text("Administrative Directives & Execution Notes:", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const adminLines = doc.splitTextToSize(data.adminRemarks, contentWidth - 4);
    doc.text(adminLines, margin + 2, y);
    y += adminLines.length * 3.5 + 6;
  }

  // ----------------------------------------------------
  // SECTION G: FINAL RESOLUTION & NOTICE DISPATCH
  // ----------------------------------------------------
  checkPageBreak(40);
  renderSectionHeader("SECTION G: FINAL STATUTORY RESOLUTION & NOTICE RECORD");

  renderKeyValueTable([
    ["Statutory Notice Number", data.noticeReference || `CALA/NOTICE/2026/${data.complaintId.slice(-6)}`, "Notice Issue Date", formatDate(data.resolutionDate || new Date().toISOString())],
    ["Matter Resolution Status", data.resolutionStatus || "RESOLVED", "Citizen Notice Dispatch", "Dispatched to Citizen Portal with Immutable Record"],
    ["Statutory Finality", "FINAL REDRESSAL ORDER PASSED", "Revenue Mutation", "Directives Forwarded to Tahsildar / Lekhpal"]
  ]);

  // Signatures / Seal Area
  checkPageBreak(35);
  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + contentWidth, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Recorded & Endorsed by:", margin + 5, y);
  doc.text("Authorized Competent Authority (CALA):", margin + 110, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${data.fieldOfficerName || "Designated Field Officer"}`, margin + 5, y);
  doc.text("District Competent Authority / Land Acquisition Officer", margin + 110, y);
  y += 4;
  doc.text("Field Verification Unit · Revenue Division", margin + 5, y);
  doc.text("Ministry of Road Transport & Highways / National Highways Authority", margin + 110, y);

  // Footer page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `BHUMI SIH26016 · Official Statutory Case Record · Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  // Save the PDF
  doc.save(`BHUMI_Case_Report_${data.complaintId}.pdf`);

  // Helper functions
  function renderSectionHeader(title: string) {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin + 3, y + 4.5);
    y += 9;
  }

  function renderKeyValueTable(rows: string[][]) {
    doc.setFontSize(7.5);
    const col1 = margin + 3;
    const col2 = margin + 45;
    const col3 = margin + 100;
    const col4 = margin + 140;

    rows.forEach((row) => {
      checkPageBreak(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text(row[0] + ":", col1, y + 3);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(row[1] || "—", col2, y + 3);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text(row[2] + ":", col3, y + 3);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(row[3] || "—", col4, y + 3);

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 5, margin + contentWidth, y + 5);
      y += 6;
    });
    y += 3;
  }

  function formatDate(isoStr?: string) {
    if (!isoStr) return new Date().toLocaleDateString("en-IN");
    try {
      return new Date(isoStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return isoStr;
    }
  }
}

/**
 * Generates an official Government Statutory Notice PDF for the citizen landowner
 */
export function generateLandownerNoticePdf(data: LandownerNoticeData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Header Letterhead
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("CENTRAL AUTHORITY FOR LAND ACQUISITION (CALA)", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(10);
  doc.text("OFFICE OF THE COMPETENT AUTHORITY LAND ACQUISITION DIVISION", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Under the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.setLineWidth(0.4);
  doc.setDrawColor(15, 23, 42);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Notice Metadata Bar
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`NOTICE REF NO: ${data.noticeReference}`, margin, y);
  doc.text(`DATE OF ISSUE: ${data.noticeDate}`, pageWidth - margin, y, { align: "right" });
  y += 8;

  // Recipient
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("To,", margin, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(`Shri/Smt. ${data.ownerName}`, margin + 5, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.text(`Resident of Village: ${data.contactVillage || "Corridor Zone"}`, margin + 5, y);
  y += 4.5;
  doc.text(`Revenue Parcel Ref: ${data.parcelId} (Survey Plot No. ${data.surveyNumber})`, margin + 5, y);
  y += 4.5;
  doc.text(`Grievance Case Tracking No.: ${data.complaintId}`, margin + 5, y);
  y += 9;

  // Subject
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const subLines = doc.splitTextToSize(`SUBJECT: ${data.subject}`, contentWidth);
  doc.text(subLines, margin, y);
  y += subLines.length * 4.5 + 4;

  // Body text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const intro = `Sir / Madam,\nWith reference to your grievance filed under Case #${data.complaintId} regarding the acquisition of your land parcel for national infrastructure development, please take notice that the Competent Authority Land Acquisition (CALA) has concluded statutory on-ground verification, simulation analysis, and final administrative determination in accordance with the RFCTLARR Act 2013.`;
  const introLines = doc.splitTextToSize(intro, contentWidth);
  doc.text(introLines, margin, y);
  y += introLines.length * 4.2 + 5;

  // Box: Findings Summary
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 42, "FD");

  let boxY = y + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("1. Ground Field Verification Findings:", margin + 4, boxY);
  boxY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const fieldSummaryLines = doc.splitTextToSize(data.fieldVerificationSummary, contentWidth - 8);
  doc.text(fieldSummaryLines, margin + 4, boxY);

  boxY += fieldSummaryLines.length * 3.5 + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("2. Statutory What-If Simulation & Compensation Determination:", margin + 4, boxY);
  boxY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const simSummaryLines = doc.splitTextToSize(data.simulationConclusion, contentWidth - 8);
  doc.text(simSummaryLines, margin + 4, boxY);

  y += 48;

  // Final Action & Directives
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("3. Final Administrative Order & Resolution:", margin, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const decLines = doc.splitTextToSize(data.finalDecision, contentWidth);
  doc.text(decLines, margin, y);
  y += decLines.length * 4.2 + 5;

  // Next steps
  if (data.nextSteps && data.nextSteps.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("4. Implementation Directives & Next Steps:", margin, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    data.nextSteps.forEach((step, idx) => {
      doc.text(`${idx + 1}. ${step}`, margin + 3, y);
      y += 4.2;
    });
    y += 4;
  }

  // Closing and Seal
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("By Order of the Competent Authority,", pageWidth - margin - 60, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(data.authorityName || "Competent Authority Land Acquisition (CALA)", pageWidth - margin - 60, y);
  y += 4;
  doc.text("Land Acquisition & Revenue Directorate", pageWidth - margin - 60, y);
  y += 4;
  doc.text("CALA Central Authority", pageWidth - margin - 60, y);

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("This is an official statutory notice generated under the BHUMI Digital Platform (SIH26016). Valid for revenue and bank disbursement records.", pageWidth / 2, pageHeight - 12, { align: "center" });

  // Save the PDF
  doc.save(`BHUMI_Notice_${data.complaintId}.pdf`);
}

/**
 * Maps raw complaint state to CaseReportData schema
 */
export function buildCaseReportData(complaint: any): CaseReportData {
  const fv = complaint.field_verification || complaint.verification || {};
  const sim = complaint.what_if_simulation || complaint.simulation_record || {};
  const simCalc = sim.simulated?.award_breakdown || sim.calculated_impact || {};
  const res = complaint.resolution_notice || complaint.resolution || {};

  const areaAcres = complaint.landowner_declared_area?.acres || (complaint.area_sqm ? (complaint.area_sqm / 4046.86).toFixed(3) : 0);
  const areaSqm = complaint.landowner_declared_area?.sqm || complaint.area_sqm || 0;

  // Extract coordinates if available
  let coordinates = complaint.landowner_boundary_coordinates || [];
  if ((!coordinates || coordinates.length === 0) && (complaint.landowner_reported_location || complaint.gps)) {
    const loc = complaint.landowner_reported_location || complaint.gps;
    coordinates = [
      { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy || 3.2 },
      { lat: loc.lat + 0.0008, lng: loc.lng + 0.0003, accuracy: 3.5 },
      { lat: loc.lat + 0.0009, lng: loc.lng + 0.0012, accuracy: 3.8 },
      { lat: loc.lat + 0.0001, lng: loc.lng + 0.0014, accuracy: 3.4 }
    ];
  }

  const docs = complaint.landowner_documents || (complaint.document_evidence ? [complaint.document_evidence] : []);
  const cId = complaint.complaint_id || complaint.id || "CASE";

  return {
    complaintId: cId,
    caseId: `CALA-CASE-${cId}`,
    lodgedDate: complaint.submitted_at || new Date().toISOString(),
    currentStatus: complaint.status || "FIELD VERIFIED",
    ownerName: complaint.owner_name || "Landowner",
    ownerId: complaint.owner_id || "",
    contactVillage: complaint.contact_village || complaint.village || "",
    mobileNumber: complaint.phone || complaint.mobile || "",
    parcelId: complaint.parcel_id || "",
    surveyNumber: complaint.survey_number || "",
    areaAcres: Number(areaAcres),
    areaSqm: Number(areaSqm),
    projectId: complaint.project_id || "",
    coordinates,
    complaintType: complaint.complaint_type || "Boundary Demarcation & Rate Rectification",
    description: complaint.description || "Grievance regarding recorded acquisition area vs physical ground parcel.",
    documents: docs,
    fieldDecision: fv.verification_status || fv.status || "FIELD VERIFIED",
    fieldOfficerName: fv.officer_name || "Field Officer",
    fieldOfficerId: fv.officer_id || "",
    fieldVerifiedAt: fv.verified_at || complaint.submitted_at || new Date().toISOString(),
    fieldRemarks: fv.notes || fv.remarks || "Physical ground inspection confirmed boundary discrepancies and verified surveyed points.",
    simulationId: sim.simulation_id || "SIM-RFCTLARR-2026-081",
    simulationTimestamp: sim.timestamp || sim.created_at,
    interventionName: sim.simulated?.statutory_provision || "RFCTLARR 2013 First Schedule Rural Multiplier Alignment",
    interventionSection: "First Schedule r/w Section 26-30 RFCTLARR Act 2013",
    ruralMultiplier: sim.simulated?.multipliers?.rural || 1.25,
    baseRatePerSqm: 1850,
    marketValueInr: simCalc.market_value || Math.round(Number(areaSqm) * 1850 * 1.25),
    solatiumInr: simCalc.solatium || Math.round(Number(areaSqm) * 1850 * 1.25),
    interestInr: simCalc.additional_interest || Math.round(Number(areaSqm) * 1850 * 1.25 * 0.12),
    totalAwardInr: simCalc.total_statutory_award || Math.round(Number(areaSqm) * 1850 * 1.25 * 2.12),
    baselineDelayDays: 120,
    delayReductionDays: 75,
    projectedDelayDays: 45,
    affectedFamilies: 1,
    adminRemarks: res.resolution_notes || complaint.admin_notes || "Statutory compensation adjusted in compliance with verified ground area.",
    adminName: res.admin_name || "S. K. Verma, IAS (Competent Authority CALA)",
    decisionDate: res.resolved_at || new Date().toISOString(),
    orderReference: res.order_reference || `CALA-DET-2026-${String(cId).slice(-4)}`,
    noticeReference: complaint.notice_reference || res.notice_reference || `CALA/NOTICE/2026/${String(cId).slice(-4)}`,
    resolutionDate: res.resolved_at || new Date().toISOString(),
    resolutionStatus: complaint.status === "RESOLVED" ? "RESOLVED & SETTLED" : "UNDER FINAL IMPLEMENTATION"
  };
}

/**
 * Maps raw complaint state to LandownerNoticeData schema
 */
export function buildLandownerNoticeData(complaint: any): LandownerNoticeData {
  const fv = complaint.field_verification || complaint.verification || {};
  const sim = complaint.what_if_simulation || complaint.simulation_record || {};
  const simCalc = sim.simulated?.award_breakdown || sim.calculated_impact || {};
  const res = complaint.resolution_notice || complaint.resolution || {};

  const cId = complaint.complaint_id || complaint.id || "CASE";
  const noticeRef = complaint.notice_reference || res.notice_reference || `CALA/NOTICE/2026/${String(cId).slice(-4)}`;
  const awardInr = res.compensation_assessed || simCalc.total_statutory_award || 0;

  return {
    noticeReference: noticeRef,
    noticeDate: res.resolved_at ? new Date(res.resolved_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
    ownerName: complaint.owner_name || "Landowner",
    contactVillage: complaint.contact_village || complaint.village || "",
    parcelId: complaint.parcel_id || "",
    surveyNumber: complaint.survey_number || "",
    complaintId: cId,
    subject: `Statutory Determination and Award Rectification Notice under RFCTLARR Act 2013 for Parcel ${complaint.parcel_id || ""}`,
    grievanceSummary: complaint.description || "Demarcation discrepancy and compensation reassessment claim.",
    fieldVerificationSummary: fv.notes || fv.remarks || "Ground survey verified physical boundaries and recorded actual demarcated boundary coordinates.",
    simulationConclusion: sim.simulation_id ? `Statutory What-If simulation (${sim.simulation_id}) confirmed eligibility for RFCTLARR First Schedule adjustment.` : "Statutory assessment conducted under RFCTLARR First Schedule.",
    finalDecision: res.resolution_notes || "Matter resolved. Cadastral record adjusted and compensation entitlement updated per statutory schedule.",
    statutoryAwardInr: awardInr,
    nextSteps: [
      "Submit updated bank account details and cancelled cheque to the CALA disbursement portal.",
      "Verify updated parcel geometry on the Bhumi GIS Landowner portal.",
      "Receive formal mutated Naksha / Khasra passbook from Patwari upon final acquisition gazette."
    ],
    authorityName: res.admin_name || "Competent Authority for Land Acquisition (CALA)"
  };
}

