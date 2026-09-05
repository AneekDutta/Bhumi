// apps/web/scripts/test_landowner_workflow_e2e.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ykxcoihvfzgykrkabbdy.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGNvaWh2ZnpneWtya2FiYmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NTEyNzEsImV4cCI6MjEwNDAyNzI3MX0.8-0CWlQjD-2IO3T0d5c5u6AJOWfKeHpCUMDYSzuDUCE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function toUuid(str) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  hex = hex.padEnd(32, '0').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runE2E() {
  console.log('================================================================');
  console.log('🚀 RUNNING BHUMI 3-ROLE WORKFLOW END-TO-END VERIFICATION');
  console.log('   Roles: LANDOWNER -> ADMIN -> FIELD OFFICER -> ADMIN -> LANDOWNER');
  console.log('   Backend: Supabase Single Source of Truth');
  console.log('================================================================\n');

  const complaintNum = Math.floor(1000 + Math.random() * 9000);
  const complaintId = `CMP-${complaintNum}`;
  const ownerId = 'O00004';
  const ownerName = 'Geeta Meena';
  const parcelId = 'P00001';
  const complaintUuid = toUuid(`complaint-${complaintId}-${Date.now()}`);
  const parcelUuid = toUuid(parcelId);

  // STEP 1: Landowner lodges grievance
  console.log(`[STEP 1] Citizen Landowner (${ownerName} [${ownerId}]) lodges grievance for Parcel ${parcelId}...`);
  const initialPayload = {
    complaint_id: complaintId,
    owner_id: ownerId,
    owner_name: ownerName,
    contact_village: 'Chandwas (V03)',
    mobile_number: '+91 98290 41234',
    parcel_id: parcelId,
    survey_number: 'V02-KH-0001',
    project_id: 'P-NH927A',
    complaint_type: 'BOUNDARY_DISPUTE',
    description: 'E2E Automated Test: Discrepancy observed between canal boundary and physical fence line.',
    priority: 'HIGH',
    photos: [
      {
        id: 'photo-1',
        url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=60',
        caption: 'Pillar boundary discrepancy'
      }
    ],
    gps: { lat: 28.5355, lng: 77.3910, accuracy: 3.5 },
    submitted_at: new Date().toISOString(),
    assigned_officer: null,
    verification: null,
    resolution: null
  };

  const { data: docData, error: docError } = await supabase
    .from('documents')
    .insert([
      {
        id: complaintUuid,
        title: `Grievance #${complaintId}: BOUNDARY_DISPUTE`,
        description: JSON.stringify(initialPayload),
        document_type: 'landowner_complaint',
        status: 'SUBMITTED',
        parcel_id: null,
        current_version: 1
      }
    ])
    .select('id, title, description, document_type, status, parcel_id')
    .single();

  assert(!docError, `Error inserting complaint: ${docError?.message}`);
  assert(docData && docData.id, 'Document ID must be returned');
  console.log(`   ✅ Complaint lodged in Supabase! Doc ID: ${docData.id}, Status: ${docData.status}`);

  // Step 1 Audit Log
  const now = new Date().toISOString();
  const { error: auditError1 } = await supabase.from('audit_logs').insert([
    {
      id: toUuid(`audit-cmp-${complaintId}-${Date.now()}`),
      actor_id: ownerId,
      actor_role: 'LANDOWNER',
      action: 'COMPLAINT_LODGED',
      entity_type: 'complaint',
      entity_id: complaintUuid,
      source: 'BHUMI_LANDOWNER_PORTAL',
      created_at: now,
      updated_at: now,
      state_after: {
        complaint_id: complaintId,
        owner_name: ownerName,
        parcel_id: parcelId,
        complaint_type: 'BOUNDARY_DISPUTE',
        status: 'SUBMITTED'
      }
    }
  ]);
  assert(!auditError1, `Audit log 1 failed: ${auditError1?.message}`);
  console.log(`   ✅ Audit trail logged with actor_role='LANDOWNER'\n`);

  // STEP 2: Admin reviews grievance on Parcel page & assigns Field Officer
  console.log(`[STEP 2] Admin / CALA Director reviews grievance & assigns Field Officer OFF-001 (Ramesh Patel)...`);
  const { data: fetchDoc, error: fetchError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', complaintUuid)
    .single();

  assert(!fetchError, `Admin fetch error: ${fetchError?.message}`);
  const fetchedPayload = JSON.parse(fetchDoc.description);
  assert(fetchDoc.status === 'SUBMITTED', 'Status must be SUBMITTED');

  fetchedPayload.assigned_officer = {
    officer_id: 'OFF-001',
    officer_name: 'Ramesh Patel',
    assigned_at: new Date().toISOString(),
    admin_notes: 'Perform physical DGPS check on western canal benchmark pillar.'
  };

  const { error: updateAssignError } = await supabase
    .from('documents')
    .update({
      status: 'ASSIGNED_FOR_VERIFICATION',
      description: JSON.stringify(fetchedPayload),
      updated_at: new Date().toISOString()
    })
    .eq('id', complaintUuid);

  assert(!updateAssignError, `Admin assignment update error: ${updateAssignError?.message}`);
  console.log(`   ✅ Complaint updated to ASSIGNED_FOR_VERIFICATION, assigned to OFF-001`);

  const now2 = new Date().toISOString();
  const { error: auditError2 } = await supabase.from('audit_logs').insert([
    {
      id: toUuid(`audit-assign-${complaintId}-${Date.now()}`),
      actor_id: 'ADMIN_CALA',
      actor_role: 'ADMIN',
      action: 'COMPLAINT_ASSIGNED_TO_FIELD_OFFICER',
      entity_type: 'complaint',
      entity_id: complaintUuid,
      source: 'BHUMI_ADMIN_WEB',
      created_at: now2,
      updated_at: now2,
      state_after: {
        complaint_id: complaintId,
        status: 'ASSIGNED_FOR_VERIFICATION',
        assigned_officer: fetchedPayload.assigned_officer
      }
    }
  ]);
  assert(!auditError2, `Audit log 2 failed: ${auditError2?.message}`);
  console.log(`   ✅ Audit trail logged with actor_role='ADMIN'\n`);

  // STEP 3: Field Officer conducts on-site verification
  console.log(`[STEP 3] Field Officer OFF-001 logs in, locates task, and submits ground verification with GPS...`);
  const { data: fieldDoc, error: fieldFetchError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', complaintUuid)
    .single();

  assert(!fieldFetchError, `Field fetch error: ${fieldFetchError?.message}`);
  const fieldPayload = JSON.parse(fieldDoc.description);
  assert(fieldPayload.assigned_officer?.officer_id === 'OFF-001', 'Assigned officer must be OFF-001');

  fieldPayload.verification = {
    verified_by: 'OFF-001',
    verified_officer_name: 'Ramesh Patel',
    verified_at: new Date().toISOString(),
    gps: { lat: 28.5358, lng: 77.3912, accuracy: 1.8 },
    observations: 'Pillar #4 located 2.1m east of revenue map record. Minor canal embankment erosion observed.',
    evidence_photos: [
      {
        id: 'ev-1',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=60',
        caption: 'Benchmark offset photo'
      }
    ],
    remarks: 'Ground coordinates corroborated with physical benchmarks'
  };

  const { error: updateVerifyError } = await supabase
    .from('documents')
    .update({
      status: 'VERIFIED',
      description: JSON.stringify(fieldPayload),
      updated_at: new Date().toISOString()
    })
    .eq('id', complaintUuid);

  assert(!updateVerifyError, `Field verification update error: ${updateVerifyError?.message}`);
  console.log(`   ✅ Ground verification submitted with GPS (lat: 28.5358, lng: 77.3912, accuracy 1.8m)`);

  const now3 = new Date().toISOString();
  const { error: auditError3 } = await supabase.from('audit_logs').insert([
    {
      id: toUuid(`audit-ver-${complaintId}-${Date.now()}`),
      actor_id: 'OFF-001',
      actor_role: 'FIELD_OFFICER',
      action: 'COMPLAINT_GROUND_VERIFIED',
      entity_type: 'complaint',
      entity_id: complaintUuid,
      source: 'BHUMI_FIELD_MOBILE',
      created_at: now3,
      updated_at: now3,
      state_after: {
        complaint_id: complaintId,
        status: 'VERIFIED',
        verification: fieldPayload.verification
      }
    }
  ]);
  assert(!auditError3, `Audit log 3 failed: ${auditError3?.message}`);
  console.log(`   ✅ Audit trail logged with actor_role='FIELD_OFFICER'\n`);

  // STEP 4: Admin issues final statutory resolution
  console.log(`[STEP 4] CALA Director reviews field inspection evidence and issues formal resolution...`);
  const { data: adminReviewDoc, error: adminReviewError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', complaintUuid)
    .single();

  assert(!adminReviewError, `Admin review fetch error: ${adminReviewError?.message}`);
  const reviewPayload = JSON.parse(adminReviewDoc.description);
  assert(adminReviewDoc.status === 'VERIFIED', 'Status must be VERIFIED before resolution');

  reviewPayload.resolution = {
    resolved_by: 'CALA Director - Sh. A. K. Sharma',
    resolved_at: new Date().toISOString(),
    action_taken: 'Boundary corrected under Section 20E; canal easement buffer re-calibrated by 2.1m.',
    compensation_adjustment: 0,
    order_reference: 'CALA/REV/2026/09/8812'
  };

  const { error: updateResolveError } = await supabase
    .from('documents')
    .update({
      status: 'RESOLVED',
      description: JSON.stringify(reviewPayload),
      updated_at: new Date().toISOString()
    })
    .eq('id', complaintUuid);

  assert(!updateResolveError, `Resolution update error: ${updateResolveError?.message}`);
  console.log(`   ✅ Formal resolution recorded: Status = RESOLVED, Order = CALA/REV/2026/09/8812`);

  const now4 = new Date().toISOString();
  const { error: auditError4 } = await supabase.from('audit_logs').insert([
    {
      id: toUuid(`audit-res-cmp-${complaintId}-${Date.now()}`),
      actor_id: 'ADMIN_CALA',
      actor_role: 'ADMIN',
      action: 'COMPLAINT_RESOLVED',
      entity_type: 'complaint',
      entity_id: complaintUuid,
      source: 'BHUMI_ADMIN_WEB',
      created_at: now4,
      updated_at: now4,
      state_after: {
        complaint_id: complaintId,
        status: 'RESOLVED',
        resolution: reviewPayload.resolution
      }
    }
  ]);
  assert(!auditError4, `Audit log 4 failed: ${auditError4?.message}`);
  console.log(`   ✅ Audit trail logged with actor_role='ADMIN'\n`);

  // STEP 5: Landowner sees live updated state
  console.log(`[STEP 5] Landowner ${ownerName} accesses Citizen Portal (/landowner/complaints/${complaintId})...`);
  const { data: landownerFinalDoc, error: finalError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', complaintUuid)
    .single();

  assert(!finalError, `Final landowner fetch error: ${finalError?.message}`);
  assert(landownerFinalDoc.status === 'RESOLVED', 'Final status must be RESOLVED');

  const finalPayload = JSON.parse(landownerFinalDoc.description);
  assert(finalPayload.assigned_officer?.officer_id === 'OFF-001', 'Assigned officer preserved');
  assert(finalPayload.verification?.verified_by === 'OFF-001', 'Verification details preserved');
  assert(finalPayload.resolution?.order_reference === 'CALA/REV/2026/09/8812', 'Order reference preserved');

  console.log(`   ✅ Realtime Verification SUCCESSFUL:`);
  console.log(`      - Complaint ID: #${finalPayload.complaint_id}`);
  console.log(`      - Parcel ID: ${finalPayload.parcel_id} (Survey: ${finalPayload.survey_number})`);
  console.log(`      - Final Status: ${landownerFinalDoc.status}`);
  console.log(`      - Assigned Officer: ${finalPayload.assigned_officer.officer_name} (${finalPayload.assigned_officer.officer_id})`);
  console.log(`      - Ground Observations: "${finalPayload.verification.observations}"`);
  console.log(`      - GPS Verification: Lat ${finalPayload.verification.gps.lat}, Lng ${finalPayload.verification.gps.lng} (Accuracy: ${finalPayload.verification.gps.accuracy}m)`);
  console.log(`      - Statutory Order: ${finalPayload.resolution.order_reference}`);
  console.log(`      - Action Taken: "${finalPayload.resolution.action_taken}"`);

  // Clean up test document
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', complaintUuid);
  assert(!deleteError, `Cleanup failed: ${deleteError?.message}`);
  console.log(`\n🧹 Cleaned up temporary test document: ${complaintUuid}`);

  console.log('\n================================================================');
  console.log('🎉 ALL 3 ROLES PASSED REAL-TIME SYNCHRONIZATION WITH SUPABASE!');
  console.log('================================================================');
}

runE2E().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
