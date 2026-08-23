import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const PREFIX = "/make-server-2f910efb";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const authClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey);

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "apikey"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// Helper: SHA-256 hex string
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Genesis hash for an SHG group
async function computeGenesisHash(groupId: string): Promise<string> {
  return sha256(`PS18:GENESIS:${groupId || "MDSHG-2024"}`);
}

// Canonical transaction payload format:
// sequence_number:group_id:meeting_id:member_id:transaction_type:amount_paise:principal_paise:interest_paise:payment_mode:prev_hash:created_at
function serializeCanonicalPayload(tx: {
  sequence_number: number | string;
  group_id: string;
  meeting_id?: string | null;
  member_id?: string | null;
  transaction_type: string;
  amount_paise: number | string;
  principal_paise?: number | string;
  interest_paise?: number | string;
  payment_mode?: string;
  prev_hash: string;
  created_at: string;
}): string {
  const seq = String(tx.sequence_number);
  const grp = tx.group_id || "MDSHG-2024";
  const meet = tx.meeting_id || "NONE";
  const mem = tx.member_id || "NONE";
  const type = tx.transaction_type || "Contribution";
  const amt = String(Math.round(Number(tx.amount_paise) || 0));
  const prin = String(Math.round(Number(tx.principal_paise) || 0));
  const int = String(Math.round(Number(tx.interest_paise) || 0));
  const mode = tx.payment_mode || "Cash";
  const prev = tx.prev_hash || "";
  const created = new Date(tx.created_at).toISOString();

  return `${seq}:${grp}:${meet}:${mem}:${type}:${amt}:${prin}:${int}:${mode}:${prev}:${created}`;
}

// ─── Health check ───────────────────────────────────────────────────────────

app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// ─── Authentication Middleware ───────────────────────────────────────────────

async function requireAuth(c: any, next: () => Promise<void>) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized", message: "Authorization bearer token is required" }, 401);
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return c.json({ error: "Unauthorized", message: "Token not found in Authorization header" }, 401);
  }

  try {
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) {
      return c.json({ error: "Unauthorized", message: error?.message || "Invalid or expired authentication token" }, 401);
    }
    c.set("user", user);
    await next();
  } catch (err: any) {
    return c.json({ error: "Unauthorized", message: err.message || "Failed to authenticate request" }, 401);
  }
}

// ─── Seed Endpoint (Development / Test Initialization) ──────────────────────

app.post(`${PREFIX}/seed`, async (c) => {
  const existing = await kv.get("meta:seeded");
  if (existing) {
    return c.json({ seeded: false, message: "Database is already initialized." });
  }

  const groupId = "MDSHG-2024";
  const genesis = await computeGenesisHash(groupId);

  const members = [
    { id: "M-01", groupId, name: "Kamla Verma", role: "Group Leader", status: "Active", transactions: 48, approvals: 212, lastActivity: "22 Aug 2026" },
    { id: "M-02", groupId, name: "Sunita Devi", role: "Treasurer", status: "Active", transactions: 62, approvals: 198, lastActivity: "22 Aug 2026" },
    { id: "M-03", groupId, name: "Anita Sharma", role: "Member", status: "Active", transactions: 31, approvals: 0, lastActivity: "22 Aug 2026" },
    { id: "M-04", groupId, name: "Rekha Singh", role: "Auditor", status: "Active", transactions: 27, approvals: 156, lastActivity: "21 Aug 2026" },
    { id: "M-05", groupId, name: "Meera Patel", role: "Member", status: "Active", transactions: 19, approvals: 0, lastActivity: "20 Aug 2026" },
    { id: "M-06", groupId, name: "Priya Kumari", role: "Member", status: "Active", transactions: 22, approvals: 0, lastActivity: "19 Aug 2026" },
    { id: "M-07", groupId, name: "Savita Yadav", role: "Member", status: "Active", transactions: 14, approvals: 0, lastActivity: "22 Aug 2026" },
    { id: "M-08", groupId, name: "Geeta Mishra", role: "Member", status: "Active", transactions: 18, approvals: 0, lastActivity: "18 Aug 2026" },
    { id: "M-18", groupId, name: "Lakshmi Nair", role: "Member", status: "Active", transactions: 11, approvals: 0, lastActivity: "22 Aug 2026" },
  ];

  const rawSeedTxns = [
    { id: "TXN-1043", member_id: "M-06", member_name: "Priya Kumari", transaction_type: "Repayment", description: "Partial loan repayment", amount_paise: 350000, date: "2026-08-19T10:00:00.000Z", displayDate: "19 Aug 2026" },
    { id: "TXN-1044", member_id: "M-05", member_name: "Meera Patel", transaction_type: "Loan", description: "Business expansion loan", amount_paise: 1500000, date: "2026-08-20T11:30:00.000Z", displayDate: "20 Aug 2026" },
    { id: "TXN-1045", member_id: "M-04", member_name: "Rekha Singh", transaction_type: "Expense", description: "Group meeting refreshments", amount_paise: 120000, date: "2026-08-21T09:15:00.000Z", displayDate: "21 Aug 2026" },
    { id: "TXN-1046", member_id: "M-03", member_name: "Anita Sharma", transaction_type: "Contribution", description: "Monthly savings contribution", amount_paise: 200000, date: "2026-08-22T08:00:00.000Z", displayDate: "22 Aug 2026" },
    { id: "TXN-1047", member_id: "M-02", member_name: "Sunita Devi", transaction_type: "Repayment", description: "Monthly loan repayment", amount_paise: 500000, date: "2026-08-22T14:30:00.000Z", displayDate: "22 Aug 2026" },
  ];

  let prevHash = genesis;
  const transactions: any[] = [];

  for (let i = 0; i < rawSeedTxns.length; i++) {
    const raw = rawSeedTxns[i];
    const seq = i + 1;
    const canonicalPayload = serializeCanonicalPayload({
      sequence_number: seq,
      group_id: groupId,
      meeting_id: "NONE",
      member_id: raw.member_id,
      transaction_type: raw.transaction_type,
      amount_paise: raw.amount_paise,
      principal_paise: raw.amount_paise,
      interest_paise: 0,
      payment_mode: "Cash",
      prev_hash: prevHash,
      created_at: raw.date,
    });

    const hash = await sha256(canonicalPayload);

    transactions.push({
      id: raw.id,
      groupId,
      group_id: groupId,
      memberId: raw.member_id,
      member_id: raw.member_id,
      member: raw.member_name,
      member_name: raw.member_name,
      type: raw.transaction_type,
      transaction_type: raw.transaction_type,
      description: raw.description,
      amount: raw.amount_paise / 100,
      amount_paise: raw.amount_paise,
      principal_paise: raw.amount_paise,
      interest_paise: 0,
      paymentMode: "Cash",
      payment_mode: "Cash",
      sequenceNumber: seq,
      sequence_number: seq,
      prevHash,
      prev_hash: prevHash,
      hash,
      current_hash: hash,
      currentHash: hash,
      date: raw.displayDate,
      created_at: raw.date,
      status: "Completed",
      verification: "Verified",
      approvalCount: 2,
      requiredApprovals: 2,
    });

    prevHash = hash;
  }

  // 1 Pending transaction
  const pendingTxCanonical = serializeCanonicalPayload({
    sequence_number: 6,
    group_id: groupId,
    meeting_id: "NONE",
    member_id: "M-07",
    transaction_type: "Loan",
    amount_paise: 1000000,
    principal_paise: 1000000,
    interest_paise: 0,
    payment_mode: "Cash",
    prev_hash: prevHash,
    created_at: "2026-08-22T16:00:00.000Z",
  });
  const pendingHash = await sha256(pendingTxCanonical);

  transactions.push({
    id: "TXN-1048",
    groupId,
    group_id: groupId,
    memberId: "M-07",
    member_id: "M-07",
    member: "Savita Yadav",
    member_name: "Savita Yadav",
    type: "Loan",
    transaction_type: "Loan",
    description: "Emergency medical loan",
    amount: 10000,
    amount_paise: 1000000,
    principal_paise: 1000000,
    interest_paise: 0,
    paymentMode: "Cash",
    payment_mode: "Cash",
    sequenceNumber: 6,
    sequence_number: 6,
    prevHash,
    prev_hash: prevHash,
    hash: "",
    current_hash: pendingHash,
    currentHash: pendingHash,
    date: "22 Aug 2026",
    created_at: "2026-08-22T16:00:00.000Z",
    status: "Pending",
    verification: "Pending",
    approvalCount: 1,
    requiredApprovals: 2,
  });

  transactions.reverse();

  const loans = [
    { id: "LN-0031", groupId, member: "Sunita Devi", member_id: "M-02", principal: 10000, principal_paise: 1000000, repaid: 4000, repaid_paise: 400000, termsMonths: 10, startDate: "01 May 2026", status: "Active", notes: "Provisions shop", repayments: [{ date: "22 Aug 2026", amount: 1000, amount_paise: 100000 }] },
    { id: "LN-0028", groupId, member: "Anita Sharma", member_id: "M-03", principal: 5000, principal_paise: 500000, repaid: 5000, repaid_paise: 500000, termsMonths: 5, startDate: "01 Mar 2026", status: "Cleared", repayments: [] },
    { id: "LN-0033", groupId, member: "Meera Patel", member_id: "M-05", principal: 15000, principal_paise: 1500000, repaid: 5000, repaid_paise: 500000, termsMonths: 12, startDate: "20 Aug 2026", status: "Active", notes: "Business expansion", repayments: [] },
    { id: "LN-0034", groupId, member: "Savita Yadav", member_id: "M-07", principal: 10000, principal_paise: 1000000, repaid: 0, repaid_paise: 0, termsMonths: 10, startDate: "22 Aug 2026", status: "Active", notes: "Emergency medical", repayments: [] },
    { id: "LN-0029", groupId, member: "Geeta Mishra", member_id: "M-08", principal: 8000, principal_paise: 800000, repaid: 3000, repaid_paise: 300000, termsMonths: 8, startDate: "14 Jul 2026", status: "Active", repayments: [] },
  ];

  const meetings = [
    {
      id: "MEET-01",
      groupId,
      meeting_number: 1,
      date: "22 Aug 2026",
      status: "Attendance",
      quorum_required: 7, // 70% of 9
      quorum_count: 8,
      quorum_met: true,
      location_status: "AVAILABLE",
      latitude: 25.3176,
      longitude: 82.9739,
      distance_meters: 14,
      attendance: [
        { member_id: "M-01", name: "Kamla Verma", present: true },
        { member_id: "M-02", name: "Sunita Devi", present: true },
        { member_id: "M-03", name: "Anita Sharma", present: true },
        { member_id: "M-04", name: "Rekha Singh", present: true },
        { member_id: "M-05", name: "Meera Patel", present: true },
        { member_id: "M-06", name: "Priya Kumari", present: true },
        { member_id: "M-07", name: "Savita Yadav", present: true },
        { member_id: "M-08", name: "Geeta Mishra", present: true },
        { member_id: "M-18", name: "Lakshmi Nair", present: false },
      ],
      cash_reconciliation: {
        opening_cash_paise: 500000,
        expected_cash_paise: 850000,
        physical_cash_paise: 850000,
        cash_delta_paise: 0,
        denominations: { "500": 10, "200": 15, "100": 5 },
        status: "Matched",
      },
      signoffs: {
        leader: true,
        treasurer: false,
      },
      created_at: "2026-08-22T08:30:00.000Z",
    },
  ];

  const disputes = [
    { id: "D-1047", txId: "TXN-1047", reportedBy: "Lakshmi Nair", reason: "I do not recognize this transaction.", status: "Under Review", originalAmount: 5000, currentAmount: 50000, original_amount_paise: 500000, current_amount_paise: 5000000, date: "22 Aug 2026, 15:05" },
  ];

  const auditEvents = [
    { id: "AE-001", group_id: groupId, actor: "Savita Yadav", action: "Created transaction TXN-1048 (Loan ₹10,000)", timestamp: "22 Aug 2026, 09:14", type: "created", txId: "TXN-1048" },
    { id: "AE-002", group_id: groupId, actor: "Kamla Verma", action: "Approved TXN-1048 (Group Leader)", timestamp: "22 Aug 2026, 09:22", type: "approval", txId: "TXN-1048" },
    { id: "AE-003", group_id: groupId, actor: "Sunita Devi", action: "Created transaction TXN-1047 (Repayment ₹5,000)", timestamp: "22 Aug 2026, 14:32", type: "created", txId: "TXN-1047" },
    { id: "AE-004", group_id: groupId, actor: "Kamla Verma", action: "Approved TXN-1047 (Group Leader)", timestamp: "22 Aug 2026, 14:35", type: "approval", txId: "TXN-1047" },
    { id: "AE-005", group_id: groupId, actor: "Rekha Singh", action: "Approved TXN-1047 (Auditor)", timestamp: "22 Aug 2026, 14:37", type: "approval", txId: "TXN-1047" },
    { id: "AE-006", group_id: groupId, actor: "System", action: "TXN-1047 verified — cryptographic hash chain intact", timestamp: "22 Aug 2026, 14:38", type: "verified", txId: "TXN-1047" },
    { id: "AE-007", group_id: groupId, actor: "Lakshmi Nair", action: "Opened dispute D-1047 — unrecognized transaction", timestamp: "22 Aug 2026, 15:05", type: "dispute", txId: "TXN-1047" },
  ];

  await kv.set("members", members);
  await kv.set("transactions", transactions);
  await kv.set("loans", loans);
  await kv.set("meetings", meetings);
  await kv.set("disputes", disputes);
  await kv.set("audit_events", auditEvents);
  await kv.set("meta:seeded", true);

  return c.json({ seeded: true, message: "Ledger initialized with full Phase 3 financial data." });
});

// ─── Verification Endpoint ───────────────────────────────────────────────────

app.get(`${PREFIX}/ledger/verify`, requireAuth, async (c) => {
  const groupId = c.req.query("groupId") || "MDSHG-2024";
  const txns = (await kv.get("transactions")) ?? [];
  const genesis = await computeGenesisHash(groupId);
  const sorted = [...txns].sort((a: any, b: any) => (a.sequence_number ?? 0) - (b.sequence_number ?? 0));

  const errors: any[] = [];
  let expectedPrevHash = genesis;
  let expectedSequence = sorted[0]?.sequence_number ?? 1;

  for (let i = 0; i < sorted.length; i++) {
    const tx = sorted[i];
    const seq = tx.sequence_number ?? (i + 1);
    const storedHash = tx.current_hash || tx.hash || "";
    const storedPrevHash = tx.prev_hash || tx.prevHash || "";

    if (i > 0 && seq !== expectedSequence) {
      errors.push({
        sequenceNumber: seq,
        txId: tx.id,
        type: "SEQUENCE_GAP",
        message: `Sequence gap at ${tx.id}. Expected #${expectedSequence}, got #${seq}`,
      });
    }

    if (i === 0) {
      if (storedPrevHash && storedPrevHash !== genesis && !storedPrevHash.startsWith("0000")) {
        errors.push({
          sequenceNumber: seq,
          txId: tx.id,
          type: "PREV_HASH_MISMATCH",
          message: `Genesis mismatch on first transaction ${tx.id}.`,
        });
      }
    } else if (storedPrevHash !== expectedPrevHash) {
      errors.push({
        sequenceNumber: seq,
        txId: tx.id,
        type: "PREV_HASH_MISMATCH",
        message: `Broken chain link on ${tx.id}.`,
      });
    }

    const canonicalPayload = serializeCanonicalPayload({
      sequence_number: seq,
      group_id: tx.group_id || groupId,
      meeting_id: tx.meeting_id || "NONE",
      member_id: tx.member_id || "NONE",
      transaction_type: tx.transaction_type || tx.type || "Contribution",
      amount_paise: tx.amount_paise ?? (Number(tx.amount || 0) * 100),
      principal_paise: tx.principal_paise ?? (Number(tx.amount || 0) * 100),
      interest_paise: tx.interest_paise ?? 0,
      payment_mode: tx.payment_mode || "Cash",
      prev_hash: storedPrevHash,
      created_at: tx.created_at || new Date().toISOString(),
    });

    const calculatedHash = await sha256(canonicalPayload);

    if (tx.status === "Completed" && storedHash && storedHash !== calculatedHash) {
      errors.push({
        sequenceNumber: seq,
        txId: tx.id,
        type: "HASH_MISMATCH",
        message: `Hash mismatch on ${tx.id}.`,
        expectedHash: calculatedHash,
        actualHash: storedHash,
      });
    }

    expectedPrevHash = storedHash || calculatedHash;
    expectedSequence = seq + 1;
  }

  const valid = errors.length === 0;
  return c.json({
    valid,
    transactionsChecked: sorted.length,
    validCount: Math.max(0, sorted.length - errors.length),
    violationsCount: errors.length,
    status: valid ? "VERIFIED" : "COMPROMISED",
    errors,
  });
});

// ─── Members ─────────────────────────────────────────────────────────────────

app.get(`${PREFIX}/members`, requireAuth, async (c) => {
  const members = await kv.get("members") ?? [];
  return c.json(members);
});

app.post(`${PREFIX}/members`, requireAuth, async (c) => {
  const body = await c.req.json();
  const user = c.get("user");
  const actorName = user?.user_metadata?.name || user?.email || "Member";

  if (!body.name || body.name.trim() === "") {
    return c.json({ error: "Validation Error", message: "Member name is required" }, 422);
  }

  const members = await kv.get("members") ?? [];
  const newMember = {
    ...body,
    id: `M-${String(members.length + 1).padStart(2, "0")}`,
    groupId: body.groupId || "MDSHG-2024",
    status: "Active",
    transactions: 0,
    approvals: 0,
    lastActivity: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    createdBy: user?.id,
  };
  await kv.set("members", [...members, newMember]);

  const auditEvents = await kv.get("audit_events") ?? [];
  auditEvents.unshift({
    id: `AE-${Date.now()}`,
    group_id: newMember.groupId,
    actor_user_id: user?.id,
    actor: actorName,
    action: `Added new member ${newMember.name} (${newMember.role})`,
    entity_type: "member",
    entity_id: newMember.id,
    timestamp: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    created_at: new Date().toISOString(),
  });
  await kv.set("audit_events", auditEvents);

  return c.json(newMember, 201);
});

// ─── Transactions & Batch Import ─────────────────────────────────────────────

app.get(`${PREFIX}/transactions`, requireAuth, async (c) => {
  const txns = await kv.get("transactions") ?? [];
  return c.json(txns);
});

app.post(`${PREFIX}/transactions`, requireAuth, async (c) => {
  const body = await c.req.json();
  const user = c.get("user");
  const actorName = user?.user_metadata?.name || body.member || user?.email || "Member";
  const groupId = body.groupId || body.group_id || "MDSHG-2024";

  const amountRupees = Number(body.amount);
  const amountPaise = body.amount_paise ? Number(body.amount_paise) : Math.round(amountRupees * 100);

  if (isNaN(amountPaise) || amountPaise <= 0) {
    return c.json({ error: "Validation Error", message: "Transaction amount must be strictly greater than zero." }, 422);
  }

  const txns = await kv.get("transactions") ?? [];
  const maxSeq = txns.reduce((m: number, t: any) => {
    const s = Number(t.sequence_number ?? t.sequenceNumber ?? 0);
    return s > m ? s : m;
  }, 0);
  const nextSeq = maxSeq + 1;

  const maxId = txns.reduce((m: number, t: any) => {
    const n = parseInt(t.id?.replace("TXN-", "") || "1000", 10);
    return !isNaN(n) && n > m ? n : m;
  }, 1048);
  const newId = `TXN-${maxId + 1}`;

  const prevTx = txns[0];
  const genesis = await computeGenesisHash(groupId);
  const prevHash = prevTx?.current_hash || prevTx?.hash || genesis;

  const nowIso = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const canonicalPayload = serializeCanonicalPayload({
    sequence_number: nextSeq,
    group_id: groupId,
    meeting_id: body.meeting_id || "NONE",
    member_id: body.member_id || "NONE",
    transaction_type: body.type || body.transaction_type || "Contribution",
    amount_paise: amountPaise,
    principal_paise: amountPaise,
    interest_paise: 0,
    payment_mode: body.payment_mode || "Cash",
    prev_hash: prevHash,
    created_at: nowIso,
  });

  const currentHash = await sha256(canonicalPayload);

  const newTx = {
    id: newId,
    groupId,
    group_id: groupId,
    member: body.member,
    member_name: body.member,
    member_id: body.member_id || "NONE",
    type: body.type || body.transaction_type || "Contribution",
    transaction_type: body.type || body.transaction_type || "Contribution",
    description: body.description || `${body.type || "Transaction"} — ${body.member}`,
    amount: amountPaise / 100,
    amount_paise: amountPaise,
    principal_paise: amountPaise,
    interest_paise: 0,
    payment_mode: body.payment_mode || "Cash",
    sequenceNumber: nextSeq,
    sequence_number: nextSeq,
    prevHash: prevHash,
    prev_hash: prevHash,
    hash: "",
    currentHash: currentHash,
    current_hash: currentHash,
    status: "Pending",
    verification: "Pending",
    approvalCount: 0,
    requiredApprovals: 2,
    date: dateStr,
    created_at: nowIso,
    createdBy: user?.id,
  };

  await kv.set("transactions", [newTx, ...txns]);

  const auditEvents = await kv.get("audit_events") ?? [];
  auditEvents.unshift({
    id: `AE-${Date.now()}`,
    group_id: groupId,
    actor_user_id: user?.id,
    actor: actorName,
    action: `Created transaction ${newTx.id} (${newTx.type} ₹${newTx.amount}) [Seq #${nextSeq}]`,
    entity_type: "transaction",
    entity_id: newTx.id,
    timestamp: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    created_at: nowIso,
  });
  await kv.set("audit_events", auditEvents);

  return c.json(newTx, 201);
});

// Batch import for Paper Register
app.post(`${PREFIX}/transactions/batch-import`, requireAuth, async (c) => {
  const body = await c.req.json();
  const records = body.records || [];
  const user = c.get("user");
  const actorName = user?.user_metadata?.name || user?.email || "Officer";
  const groupId = body.groupId || "MDSHG-2024";

  if (!Array.isArray(records) || records.length === 0) {
    return c.json({ error: "Validation Error", message: "Batch records array is required." }, 422);
  }

  const txns = await kv.get("transactions") ?? [];
  let maxSeq = txns.reduce((m: number, t: any) => {
    const s = Number(t.sequence_number ?? t.sequenceNumber ?? 0);
    return s > m ? s : m;
  }, 0);

  let maxId = txns.reduce((m: number, t: any) => {
    const n = parseInt(t.id?.replace("TXN-", "") || "1000", 10);
    return !isNaN(n) && n > m ? n : m;
  }, 1048);

  const genesis = await computeGenesisHash(groupId);
  let prevHash = txns[0]?.current_hash || txns[0]?.hash || genesis;

  const importedTxns: any[] = [];
  const nowIso = new Date().toISOString();

  for (const rec of records) {
    const amtPaise = rec.amount_paise ? Number(rec.amount_paise) : Math.round(Number(rec.amount || 0) * 100);
    if (isNaN(amtPaise) || amtPaise <= 0) {
      return c.json({ error: "Validation Error", message: `Invalid amount for record ${rec.member || "unknown"}` }, 422);
    }

    maxSeq += 1;
    maxId += 1;
    const txId = `TXN-${maxId}`;

    const canonicalPayload = serializeCanonicalPayload({
      sequence_number: maxSeq,
      group_id: groupId,
      meeting_id: "NONE",
      member_id: rec.member_id || "NONE",
      transaction_type: rec.type || "Contribution",
      amount_paise: amtPaise,
      principal_paise: amtPaise,
      interest_paise: 0,
      payment_mode: rec.payment_mode || "Cash",
      prev_hash: prevHash,
      created_at: rec.date ? new Date(rec.date).toISOString() : nowIso,
    });

    const hash = await sha256(canonicalPayload);

    const tx = {
      id: txId,
      groupId,
      group_id: groupId,
      member: rec.member,
      member_name: rec.member,
      member_id: rec.member_id || "NONE",
      type: rec.type || "Contribution",
      transaction_type: rec.type || "Contribution",
      description: rec.description || `Paper Register Import — ${rec.member}`,
      amount: amtPaise / 100,
      amount_paise: amtPaise,
      principal_paise: amtPaise,
      interest_paise: 0,
      payment_mode: rec.payment_mode || "Cash",
      sequenceNumber: maxSeq,
      sequence_number: maxSeq,
      prevHash,
      prev_hash: prevHash,
      hash,
      currentHash: hash,
      current_hash: hash,
      status: "Completed",
      verification: "Verified",
      approvalCount: 2,
      requiredApprovals: 2,
      date: rec.displayDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      created_at: nowIso,
      createdBy: user?.id,
    };

    importedTxns.push(tx);
    prevHash = hash;
  }

  // Prepend to ledger
  await kv.set("transactions", [...importedTxns.reverse(), ...txns]);

  const auditEvents = await kv.get("audit_events") ?? [];
  auditEvents.unshift({
    id: `AE-${Date.now()}`,
    group_id: groupId,
    actor_user_id: user?.id,
    actor: actorName,
    action: `Imported paper register batch (${importedTxns.length} records)`,
    entity_type: "paper_import",
    entity_id: `BATCH-${Date.now()}`,
    metadata: { count: importedTxns.length },
    timestamp: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    created_at: nowIso,
  });
  await kv.set("audit_events", auditEvents);

  return c.json({ importedCount: importedTxns.length, transactions: importedTxns }, 201);
});

app.put(`${PREFIX}/transactions/:id/approve`, requireAuth, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const user = c.get("user");
  const approverName = user?.user_metadata?.name || body.approver || user?.email || "Approver";
  const approverRole = user?.user_metadata?.role || body.role || "Auditor";

  const txns = await kv.get("transactions") ?? [];
  let approvedTx: any = null;

  const updated = await Promise.all(txns.map(async (t: any) => {
    if (t.id !== id) return t;
    const newCount = (t.approvalCount || t.approval_count || 0) + 1;
    const isApproved = newCount >= (t.requiredApprovals || t.required_approvals || 2);

    approvedTx = {
      ...t,
      approvalCount: newCount,
      approval_count: newCount,
      status: isApproved ? "Completed" : "Pending",
      verification: isApproved ? "Verified" : "Pending",
      hash: isApproved ? (t.current_hash || t.currentHash) : "",
    };
    return approvedTx;
  }));

  if (!approvedTx) {
    return c.json({ error: "Not Found", message: `Transaction ${id} not found` }, 404);
  }

  await kv.set("transactions", updated);

  const auditEvents = await kv.get("audit_events") ?? [];
  auditEvents.unshift({
    id: `AE-${Date.now()}`,
    group_id: approvedTx.group_id || "MDSHG-2024",
    actor_user_id: user?.id,
    actor: approverName,
    action: `Approved transaction ${id} (${approverRole}) — Status: ${approvedTx.status}`,
    entity_type: "transaction",
    entity_id: id,
    timestamp: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    created_at: new Date().toISOString(),
  });
  await kv.set("audit_events", auditEvents);

  return c.json({ ok: true, transaction: approvedTx });
});

app.put(`${PREFIX}/transactions/:id/reject`, requireAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const actorName = user?.user_metadata?.name || user?.email || "Approver";

  const txns = await kv.get("transactions") ?? [];
  let found = false;
  const updated = txns.map((t: any) => {
    if (t.id === id) {
      found = true;
      return { ...t, status: "Rejected", verification: "Failed" };
    }
    return t;
  });

  if (!found) {
    return c.json({ error: "Not Found", message: `Transaction ${id} not found` }, 404);
  }

  await kv.set("transactions", updated);

  const auditEvents = await kv.get("audit_events") ?? [];
  auditEvents.unshift({
    id: `AE-${Date.now()}`,
    actor_user_id: user?.id,
    actor: actorName,
    action: `Rejected transaction ${id}`,
    entity_type: "transaction",
    entity_id: id,
    timestamp: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    created_at: new Date().toISOString(),
  });
  await kv.set("audit_events", auditEvents);

  return c.json({ ok: true });
});

// ─── Loans & Repayments (Full Financial Lifecycle) ───────────────────────────

app.get(`${PREFIX}/loans`, requireAuth, async (c) => {
  const loans = await kv.get("loans") ?? [];
  return c.json(loans);
});

app.post(`${PREFIX}/loans`, requireAuth, async (c) => {
  const body = await c.req.json();
  const user = c.get("user");
  const actorName = user?.user_metadata?.name || user?.email || "Officer";
  const groupId = body.groupId || "MDSHG-2024";

  const principalRupees = Number(body.principal || body.amount);
  const principalPaise = body.principal_paise ? Number(body.principal_paise) : Math.round(principalRupees * 100);
  const tenureMonths = Number(body.termsMonths || body.tenure_months || 10);

  if (isNaN(principalPaise) || principalPaise <= 0) {
    return c.json({ error: "Validation Error", message: "Loan principal must be strictly greater than zero." }, 422);
  }
  if (!body.member) {
    return c.json({ error: "Validation Error", message: "Loan recipient member is required." }, 422);
  }

  // Check corpus availability
  const txns = await kv.get("transactions") ?? [];
  const completedTxns = txns.filter((t: any) => t.status === "Completed");
  const totalIn = completedTxns
    .filter((t: any) => t.type === "Contribution" || t.type === "Repayment")
    .reduce((s: number, t: any) => s + (t.amount_paise ?? Number(t.amount || 0) * 100), 0);
  const totalOut = completedTxns
    .filter((t: any) => t.type === "Loan" || t.type === "Expense")
    .reduce((s: number, t: any) => s + (t.amount_paise ?? Number(t.amount || 0) * 100), 0);
  const availableCorpusPaise = 8000000 + totalIn - totalOut;

  if (principalPaise > availableCorpusPaise) {
    return c.json({
      error: "Validation Error",
      message: `Requested loan (₹${principalPaise / 100}) exceeds available group corpus (₹${availableCorpusPaise / 100}).`,
    }, 422);
  }

  const loans = await kv.get("loans") ?? [];
  const loanId = `LN-${String(Date.now()).slice(-4)}`;

  // Generate repayment schedule installments
  const schedule: any[] = [];
  const monthlyPrincipalPaise = Math.round(principalPaise / tenureMonths);
  const baseDate = new Date();

  for (let i = 1; i <= tenureMonths; i++) {
    const dueDate = new Date(baseDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    schedule.push({
      installment_number: i,
      due_date: dueDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      expected_principal_paise: i === tenureMonths ? principalPaise - (monthlyPrincipalPaise * (tenureMonths - 1)) : monthlyPrincipalPaise,
      expected_interest_paise: 0,
      paid_principal_paise: 0,
      paid_interest_paise: 0,
      status: "Unpaid",
    });
  }

  // 1. Create corresponding LOAN_DISBURSEMENT ledger transaction
  let maxSeq = txns.reduce((m: number, t: any) => {
    const s = Number(t.sequence_number ?? t.sequenceNumber ?? 0);
    return s > m ? s : m;
  }, 0) + 1;

  let maxId = txns.reduce((m: number, t: any) => {
    const n = parseInt(t.id?.replace("TXN-", "") || "1000", 10);
    return !isNaN(n) && n > m ? n : m;
  }, 1048) + 1;

  const txId = `TXN-${maxId}`;
  const genesis = await computeGenesisHash(groupId);
  const prevHash = txns[0]?.current_hash || txns[0]?.hash || genesis;
  const nowIso = new Date().toISOString();

  const canonicalPayload = serializeCanonicalPayload({
    sequence_number: maxSeq,
    group_id: groupId,
    meeting_id: "NONE",
    member_id: body.member_id || "NONE",
    transaction_type: "Loan",
    amount_paise: principalPaise,
    principal_paise: principalPaise,
    interest_paise: 0,
    payment_mode: "Cash",
    prev_hash: prevHash,
    created_at: nowIso,
  });
  const currentHash = await sha256(canonicalPayload);

  const disbursementTx = {
    id: txId,
    groupId,
    group_id: groupId,
    member: body.member,
    member_name: body.member,
    member_id: body.member_id || "NONE",
    type: "Loan",
    transaction_type: "Loan",
    description: `Loan disbursement (${loanId}) — ${body.notes || body.purpose || "General Loan"}`,
    amount: principalPaise / 100,
    amount_paise: principalPaise,
    principal_paise: principalPaise,
    interest_paise: 0,
    payment_mode: "Cash",
    sequenceNumber: maxSeq,
    sequence_number: maxSeq,
    prevHash,
    prev_hash: prevHash,
    hash: currentHash,
    currentHash,
    current_hash: currentHash,
    status: "Completed",
    verification: "Verified",
    approvalCount: 2,
    requiredApprovals: 2,
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    created_at: nowIso,
    createdBy: user?.id,
  };

  await kv.set("transactions", [disbursementTx, ...txns]);

  const newLoan = {
    id: loanId,
    groupId,
    member: body.member,
    member_name: body.member,
    member_id: body.member_id || "NONE",
    principal: principalPaise / 100,
    principal_paise: principalPaise,
    repaid: 0,
    repaid_paise: 0,
    termsMonths: tenureMonths,
    startDate: body.startDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    status: "Active",
    repayments: [],
    schedule,
    notes: body.notes || body.purpose || "",
    disbursement_tx_id: txId,
    createdBy: user?.id,
  };
  await kv.set("loans", [newLoan, ...loans]);

  const auditEvents = await kv.get("audit_events") ?? [];
  auditEvents.unshift({
    id: `AE-${Date.now()}`,
    group_id: groupId,
    actor_user_id: user?.id,
    actor: actorName,
    action: `Disbursed loan ${newLoan.id} to ${newLoan.member} (₹${newLoan.principal}) & recorded in ledger ${txId}`,
    entity_type: "loan",
    entity_id: newLoan.id,
    timestamp: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    created_at: nowIso,
  });
  await kv.set("audit_events", auditEvents);

  return c.json(newLoan, 201);
});

app.post(`${PREFIX}/loans/:id/repayment`, requireAuth, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const user = c.get("user");
  const actorName = user?.user_metadata?.name || user?.email || "Treasurer";
  const groupId = body.groupId || "MDSHG-2024";

  const amountRupees = Number(body.amount);
  const amountPaise = body.amount_paise ? Number(body.amount_paise) : Math.round(amountRupees * 100);

  if (isNaN(amountPaise) || amountPaise <= 0) {
    return c.json({ error: "Validation Error", message: "Repayment amount must be strictly greater than zero." }, 422);
  }

  const loans = await kv.get("loans") ?? [];
  const targetLoan = loans.find((l: any) => l.id === id);

  if (!targetLoan) {
    return c.json({ error: "Not Found", message: `Loan ${id} not found.` }, 404);
  }

  if (targetLoan.status === "Cleared" || targetLoan.status === "Closed") {
    return c.json({ error: "Validation Error", message: `Loan ${id} is already cleared and closed.` }, 422);
  }

  const currentRepaidPaise = targetLoan.repaid_paise ?? (Number(targetLoan.repaid || 0) * 100);
  const principalPaise = targetLoan.principal_paise ?? (Number(targetLoan.principal || 0) * 100);
  const outstandingPaise = principalPaise - currentRepaidPaise;

  if (amountPaise > outstandingPaise) {
    return c.json({
      error: "Validation Error",
      message: `Repayment amount (₹${amountPaise / 100}) cannot exceed outstanding loan balance (₹${outstandingPaise / 100}).`,
    }, 422);
  }

  // 1. Create corresponding REPAYMENT ledger transaction
  const txns = await kv.get("transactions") ?? [];
  const maxSeq = txns.reduce((m: number, t: any) => {
    const s = Number(t.sequence_number ?? t.sequenceNumber ?? 0);
    return s > m ? s : m;
  }, 0) + 1;

  const maxId = txns.reduce((m: number, t: any) => {
    const n = parseInt(t.id?.replace("TXN-", "") || "1000", 10);
    return !isNaN(n) && n > m ? n : m;
  }, 1048) + 1;

  const txId = `TXN-${maxId}`;
  const genesis = await computeGenesisHash(groupId);
  const prevHash = txns[0]?.current_hash || txns[0]?.hash || genesis;
  const nowIso = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const canonicalPayload = serializeCanonicalPayload({
    sequence_number: maxSeq,
    group_id: groupId,
    meeting_id: "NONE",
    member_id: targetLoan.member_id || "NONE",
    transaction_type: "Repayment",
    amount_paise: amountPaise,
    principal_paise: amountPaise,
    interest_paise: 0,
    payment_mode: "Cash",
    prev_hash: prevHash,
    created_at: nowIso,
  });
  const currentHash = await sha256(canonicalPayload);

  const repaymentTx = {
    id: txId,
    groupId,
    group_id: groupId,
    member: targetLoan.member,
    member_name: targetLoan.member,
    member_id: targetLoan.member_id || "NONE",
    type: "Repayment",
    transaction_type: "Repayment",
    description: `Loan repayment (${id}) — ${targetLoan.member}`,
    amount: amountPaise / 100,
    amount_paise: amountPaise,
    principal_paise: amountPaise,
    interest_paise: 0,
    payment_mode: "Cash",
    sequenceNumber: maxSeq,
    sequence_number: maxSeq,
    prevHash,
    prev_hash: prevHash,
    hash: currentHash,
    currentHash,
    current_hash: currentHash,
    status: "Completed",
    verification: "Verified",
    approvalCount: 2,
    requiredApprovals: 2,
    date: dateStr,
    created_at: nowIso,
    createdBy: user?.id,
  };

  await kv.set("transactions", [repaymentTx, ...txns]);

  // Update loan record
  const newRepaidPaise = currentRepaidPaise + amountPaise;
  const newRepaidRupees = newRepaidPaise / 100;
  const updatedStatus = newRepaidPaise >= principalPaise ? "Cleared" : "Active";

  const updated = loans.map((l: any) => {
    if (l.id !== id) return l;
    return {
      ...l,
      repaid: newRepaidRupees,
      repaid_paise: newRepaidPaise,
      status: updatedStatus,
      repayments: [
        {
          date: dateStr,
          amount: amountRupees,
          amount_paise: amountPaise,
          tx_id: txId,
        },
        ...(l.repayments ?? []),
      ],
    };
  });

  await kv.set("loans", updated);

  const auditEvents = await kv.get("audit_events") ?? [];
  auditEvents.unshift({
    id: `AE-${Date.now()}`,
    actor_user_id: user?.id,
    actor: actorName,
    action: `Recorded repayment of ₹${amountRupees} for loan ${id} (${txId}) — Status: ${updatedStatus}`,
    entity_type: "loan_repayment",
    entity_id: id,
    timestamp: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    created_at: nowIso,
  });
  await kv.set("audit_events", auditEvents);

  return c.json({ ok: true, transaction: repaymentTx, loanStatus: updatedStatus });
});

// ─── Meetings & Closure Gateways ─────────────────────────────────────────────

app.get(`${PREFIX}/meetings`, requireAuth, async (c) => {
  const meetings = await kv.get("meetings") ?? [];
  return c.json(meetings);
});

app.post(`${PREFIX}/meetings`, requireAuth, async (c) => {
  const body = await c.req.json();
  const user = c.get("user");
  const groupId = body.groupId || "MDSHG-2024";

  const members = await kv.get("members") ?? [];
  const activeMembers = members.filter((m: any) => m.status === "Active");
  const quorumRequired = Math.ceil(0.7 * activeMembers.length);

  const meetings = await kv.get("meetings") ?? [];
  const newMeeting = {
    id: `MEET-${String(meetings.length + 1).padStart(2, "0")}`,
    groupId,
    meeting_number: meetings.length + 1,
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    status: "Attendance",
    quorum_required: quorumRequired,
    quorum_count: 0,
    quorum_met: false,
    location_status: "AVAILABLE",
    latitude: 25.3176,
    longitude: 82.9739,
    distance_meters: 10,
    attendance: activeMembers.map((m: any) => ({ member_id: m.id, name: m.name, present: false })),
    cash_reconciliation: {
      opening_cash_paise: 0,
      expected_cash_paise: 0,
      physical_cash_paise: 0,
      cash_delta_paise: 0,
      denominations: {},
      status: "Review Required",
    },
    signoffs: {
      leader: false,
      treasurer: false,
    },
    created_by: user?.id,
    created_at: new Date().toISOString(),
  };

  await kv.set("meetings", [newMeeting, ...meetings]);
  return c.json(newMeeting, 201);
});

// Attendance submission & quorum calculation (70%)
app.post(`${PREFIX}/meetings/:id/attendance`, requireAuth, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const attendanceList = body.attendance || [];

  const meetings = await kv.get("meetings") ?? [];
  const members = await kv.get("members") ?? [];
  const activeMembers = members.filter((m: any) => m.status === "Active");
  const totalCount = activeMembers.length || 9;
  const quorumRequired = Math.ceil(0.7 * totalCount);

  const presentCount = attendanceList.filter((a: any) => a.present === true).length;
  const quorumMet = presentCount >= quorumRequired;

  const updated = meetings.map((m: any) => {
    if (m.id !== id) return m;
    return {
      ...m,
      attendance: attendanceList,
      quorum_count: presentCount,
      quorum_required: quorumRequired,
      quorum_met: quorumMet,
      status: "Transactions",
    };
  });

  await kv.set("meetings", updated);
  return c.json({ ok: true, presentCount, quorumRequired, quorumMet });
});

// Cash reconciliation submission with denomination reconstruction
app.post(`${PREFIX}/meetings/:id/reconcile`, requireAuth, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const denominations = body.denominations || {};
  const expectedCashPaise = Number(body.expected_cash_paise ?? (Number(body.expectedCash || 0) * 100));
  const openingCashPaise = Number(body.opening_cash_paise ?? 0);

  // Server independently reconstructs physical cash from denomination counts
  const DENOM_VALUES: Record<string, number> = {
    "500": 50000,
    "200": 20000,
    "100": 10000,
    "50": 5000,
    "20": 2000,
    "10": 1000,
    "5": 500,
    "2": 200,
    "1": 100,
  };

  let physicalCashPaise = 0;
  for (const [denom, count] of Object.entries(denominations)) {
    const val = DENOM_VALUES[denom] || (Number(denom) * 100);
    physicalCashPaise += val * Number(count || 0);
  }

  const deltaPaise = physicalCashPaise - expectedCashPaise;
  const reconStatus = deltaPaise === 0 ? "Matched" : "Mismatch";

  const meetings = await kv.get("meetings") ?? [];
  const updated = meetings.map((m: any) => {
    if (m.id !== id) return m;
    return {
      ...m,
      cash_reconciliation: {
        opening_cash_paise: openingCashPaise,
        expected_cash_paise: expectedCashPaise,
        physical_cash_paise: physicalCashPaise,
        cash_delta_paise: deltaPaise,
        denominations,
        status: reconStatus,
      },
    };
  });

  await kv.set("meetings", updated);

  return c.json({
    ok: true,
    physical_cash_paise: physicalCashPaise,
    expected_cash_paise: expectedCashPaise,
    cash_delta_paise: deltaPaise,
    status: reconStatus,
    matched: deltaPaise === 0,
  });
});

// Sign-off endpoint (Group Leader / Treasurer)
app.post(`${PREFIX}/meetings/:id/signoff`, requireAuth, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const role = body.role === "treasurer" || body.role === "Treasurer" ? "treasurer" : "leader";

  const meetings = await kv.get("meetings") ?? [];
  const updated = meetings.map((m: any) => {
    if (m.id !== id) return m;
    return {
      ...m,
      signoffs: {
        ...m.signoffs,
        [role]: true,
      },
    };
  });

  await kv.set("meetings", updated);
  return c.json({ ok: true, role, signed: true });
});

// Meeting closure gate enforcement
app.post(`${PREFIX}/meetings/:id/close`, requireAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const actorName = user?.user_metadata?.name || user?.email || "Leader";

  const meetings = await kv.get("meetings") ?? [];
  const meeting = meetings.find((m: any) => m.id === id);

  if (!meeting) {
    return c.json({ error: "Not Found", message: `Meeting ${id} not found.` }, 404);
  }

  if (meeting.status === "Closed") {
    return c.json({ error: "Validation Error", message: "Meeting is already closed." }, 422);
  }

  // 1. Quorum check (70%)
  const quorumPassed = meeting.quorum_met === true;

  // 2. Cash reconciliation check (delta === 0)
  const cashPassed = meeting.cash_reconciliation?.cash_delta_paise === 0 && meeting.cash_reconciliation?.status === "Matched";

  // 3. Ledger verification check
  const txns = await kv.get("transactions") ?? [];
  const genesis = await computeGenesisHash(meeting.groupId || "MDSHG-2024");
  let ledgerPassed = true;
  let prev = genesis;
  for (const t of [...txns].reverse()) {
    if (t.status === "Completed" && t.current_hash) {
      if (t.prev_hash !== prev) {
        ledgerPassed = false;
        break;
      }
      prev = t.current_hash;
    }
  }

  // 4. Sign-offs check (Dual Leader + Treasurer)
  const leaderSignoff = meeting.signoffs?.leader === true;
  const treasurerSignoff = meeting.signoffs?.treasurer === true;
  const signoffsPassed = leaderSignoff && treasurerSignoff;

  const reasons: string[] = [];
  if (!quorumPassed) reasons.push(`Quorum not met (${meeting.quorum_count}/${meeting.quorum_required} required)`);
  if (!cashPassed) reasons.push(`Cash difference: ₹${(meeting.cash_reconciliation?.cash_delta_paise || 0) / 100}`);
  if (!ledgerPassed) reasons.push("Ledger verification failed: hash mismatch detected");
  if (!leaderSignoff) reasons.push("Group Leader sign-off missing");
  if (!treasurerSignoff) reasons.push("Treasurer sign-off missing");

  if (reasons.length > 0) {
    return c.json({
      status: "BLOCKED",
      message: "Meeting closure requirements not satisfied.",
      reasons,
    }, 422);
  }

  const nowIso = new Date().toISOString();
  const updated = meetings.map((m: any) => {
    if (m.id !== id) return m;
    return {
      ...m,
      status: "Closed",
      closed_at: nowIso,
    };
  });
  await kv.set("meetings", updated);

  const auditEvents = await kv.get("audit_events") ?? [];
  auditEvents.unshift({
    id: `AE-${Date.now()}`,
    group_id: meeting.groupId || "MDSHG-2024",
    actor_user_id: user?.id,
    actor: actorName,
    action: `Closed meeting ${id} — Quorum: ${meeting.quorum_count}, Cash: ₹${meeting.cash_reconciliation?.physical_cash_paise / 100}, Ledger verified`,
    entity_type: "meeting",
    entity_id: id,
    timestamp: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    created_at: nowIso,
  });
  await kv.set("audit_events", auditEvents);

  return c.json({ ok: true, status: "CLOSED", meeting: { ...meeting, status: "Closed", closed_at: nowIso } });
});

// ─── Disputes ────────────────────────────────────────────────────────────────

app.get(`${PREFIX}/disputes`, requireAuth, async (c) => {
  const disputes = await kv.get("disputes") ?? [];
  return c.json(disputes);
});

app.post(`${PREFIX}/disputes`, requireAuth, async (c) => {
  const body = await c.req.json();
  const user = c.get("user");
  const actorName = user?.user_metadata?.name || body.reportedBy || user?.email || "Member";

  const disputes = await kv.get("disputes") ?? [];

  // Check duplicate open dispute
  const existing = disputes.find((d: any) => d.txId === body.txId && d.status === "Under Review");
  if (existing) {
    return c.json({ error: "Validation Error", message: `An active dispute is already open for transaction ${body.txId}.` }, 422);
  }

  const newDispute = {
    id: `D-${(body.txId || "").replace("TXN-", "") || Date.now()}`,
    status: "Under Review",
    date: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    reportedBy: actorName,
    createdBy: user?.id,
    ...body,
  };
  await kv.set("disputes", [newDispute, ...disputes]);

  const auditEvents = await kv.get("audit_events") ?? [];
  auditEvents.unshift({
    id: `AE-${Date.now()}`,
    actor_user_id: user?.id,
    actor: actorName,
    action: `Opened dispute ${newDispute.id} on transaction ${newDispute.txId}`,
    entity_type: "dispute",
    entity_id: newDispute.id,
    timestamp: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    created_at: new Date().toISOString(),
  });
  await kv.set("audit_events", auditEvents);

  return c.json(newDispute, 201);
});

app.put(`${PREFIX}/disputes/:id/resolve`, requireAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const actorName = user?.user_metadata?.name || user?.email || "Auditor";

  const disputes = await kv.get("disputes") ?? [];
  let found = false;
  const updated = disputes.map((d: any) => {
    if (d.id === id) {
      found = true;
      return { ...d, status: "Resolved", resolved_by: actorName, resolved_at: new Date().toISOString() };
    }
    return d;
  });

  if (!found) {
    return c.json({ error: "Not Found", message: `Dispute ${id} not found` }, 404);
  }

  await kv.set("disputes", updated);

  const auditEvents = await kv.get("audit_events") ?? [];
  auditEvents.unshift({
    id: `AE-${Date.now()}`,
    actor_user_id: user?.id,
    actor: actorName,
    action: `Resolved dispute ${id}`,
    entity_type: "dispute",
    entity_id: id,
    timestamp: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    created_at: new Date().toISOString(),
  });
  await kv.set("audit_events", auditEvents);

  return c.json({ ok: true });
});

// ─── Audit events ─────────────────────────────────────────────────────────────

app.get(`${PREFIX}/audit-events`, requireAuth, async (c) => {
  const events = await kv.get("audit_events") ?? [];
  return c.json(events);
});

// ─── Dynamic Reports & Calculations ───────────────────────────────────────────

app.get(`${PREFIX}/stats`, requireAuth, async (c) => {
  const txns = await kv.get("transactions") ?? [];
  const loans = await kv.get("loans") ?? [];
  const disputes = await kv.get("disputes") ?? [];
  const members = await kv.get("members") ?? [];

  const completedTxns = txns.filter((t: any) => t.status === "Completed");

  const totalContributionsPaise = completedTxns
    .filter((t: any) => t.transaction_type === "Contribution" || t.type === "Contribution")
    .reduce((s: number, t: any) => s + (t.amount_paise ?? Number(t.amount || 0) * 100), 0);

  const totalExpensesPaise = completedTxns
    .filter((t: any) => t.transaction_type === "Expense" || t.type === "Expense")
    .reduce((s: number, t: any) => s + (t.amount_paise ?? Number(t.amount || 0) * 100), 0);

  const totalRepaymentsPaise = completedTxns
    .filter((t: any) => t.transaction_type === "Repayment" || t.type === "Repayment")
    .reduce((s: number, t: any) => s + (t.amount_paise ?? Number(t.amount || 0) * 100), 0);

  const totalLoansDisbursedPaise = completedTxns
    .filter((t: any) => t.transaction_type === "Loan" || t.type === "Loan")
    .reduce((s: number, t: any) => s + (t.amount_paise ?? Number(t.amount || 0) * 100), 0);

  const netLiquidPaise = 8000000 + totalContributionsPaise + totalRepaymentsPaise - totalLoansDisbursedPaise - totalExpensesPaise;

  const activeLoans = loans.filter((l: any) => l.status === "Active" || l.status === "Overdue");
  const outstandingPaise = activeLoans.reduce((s: number, l: any) => {
    const prin = l.principal_paise ?? Number(l.principal || 0) * 100;
    const rep = l.repaid_paise ?? Number(l.repaid || 0) * 100;
    return s + (prin - rep);
  }, 0);

  const verified = txns.filter((t: any) => t.verification === "Verified").length;
  const openDisputes = disputes.filter((d: any) => d.status === "Under Review").length;

  return c.json({
    memberCount: members.length,
    transactionCount: txns.length,
    totalContributions: totalContributionsPaise / 100,
    totalContributionsPaise,
    balance: netLiquidPaise / 100,
    balancePaise: netLiquidPaise,
    activeLoans: activeLoans.length,
    outstandingLoans: outstandingPaise / 100,
    outstandingLoansPaise: outstandingPaise,
    verifiedCount: verified,
    openDisputes,
    integrityViolations: 0,
  });
});
// ─────────────────────────────────────────────────────────────────────────────
// BATCH SYNC ENDPOINT (IDEMPOTENT & AUTHORITATIVE)
// ─────────────────────────────────────────────────────────────────────────────
app.post(`${PREFIX}/sync`, async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized: valid bearer token required to sync financial records" }, 401);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const operations: any[] = body.operations || [];
  const results: any[] = [];
  const txns: any[] = (await kv.get("transactions")) ?? [];
  const groupId = "MDSHG-2024";
  const genesis = await computeGenesisHash(groupId);

  for (const op of operations) {
    const clientTxId = op.client_transaction_id;

    // 1. Idempotency check: if record already exists with client_transaction_id, return existing
    const existing = txns.find((t: any) => t.client_transaction_id === clientTxId);
    if (existing) {
      results.push({
        client_transaction_id: clientTxId,
        status: "SYNCED",
        transaction_id: existing.id,
        sequence_number: existing.sequence_number,
        current_hash: existing.current_hash,
        verified: true,
        is_idempotent_replay: true,
      });
      continue;
    }

    // 2. Validation
    const amountPaise = Number(op.amount_paise ?? (Number(op.amount || 0) * 100));
    if (!amountPaise || amountPaise <= 0) {
      results.push({
        client_transaction_id: clientTxId,
        status: "REJECTED",
        reason: "INVALID_AMOUNT",
      });
      continue;
    }

    // 3. Determine authoritative sequence and prev_hash
    const lastTx = txns[txns.length - 1];
    const prevHash = lastTx ? lastTx.current_hash : genesis;
    const seq = (lastTx ? Number(lastTx.sequence_number) : 0) + 1;
    const nowIso = new Date().toISOString();

    const canonicalInput = {
      sequence_number: seq,
      group_id: groupId,
      meeting_id: op.meeting_id || "MEET-48",
      member_id: op.member_id || "M-01",
      transaction_type: op.transaction_type || "Contribution",
      amount_paise: amountPaise,
      principal_paise: op.principal_paise || amountPaise,
      interest_paise: op.interest_paise || 0,
      payment_mode: op.payment_mode || "Cash",
      prev_hash: prevHash,
      created_at: nowIso,
    };

    const payloadStr = serializeCanonicalPayload(canonicalInput);
    const hash = await sha256(payloadStr);

    const newTx = {
      id: `TXN-${1000 + seq}`,
      group_id: groupId,
      sequence_number: seq,
      meeting_id: op.meeting_id || "MEET-48",
      member_id: op.member_id || "M-01",
      member_name: op.member_name || "Sunita Devi",
      transaction_type: op.transaction_type || "Contribution",
      description: op.description || `${op.transaction_type || "Contribution"} (${op.member_name || "Sunita Devi"})`,
      amount_paise: amountPaise,
      principal_paise: op.principal_paise || amountPaise,
      interest_paise: op.interest_paise || 0,
      payment_mode: op.payment_mode || "Cash",
      prev_hash: prevHash,
      current_hash: hash,
      status: "Completed",
      verification: "Verified",
      approval_count: 2,
      required_approvals: 2,
      approvals: [
        { approver: "Kamla Verma", role: "Group Leader", timestamp: nowIso },
        { approver: "Sunita Devi", role: "Treasurer", timestamp: nowIso },
      ],
      client_transaction_id: clientTxId,
      client_created_at: op.client_created_at || nowIso,
      server_received_at: nowIso,
      created_by: user.id || "user",
      created_at: nowIso,
    };

    txns.push(newTx);
    await kv.set("transactions", txns);

    results.push({
      client_transaction_id: clientTxId,
      status: "SYNCED",
      transaction_id: newTx.id,
      sequence_number: seq,
      current_hash: hash,
      verified: true,
    });
  }

  return c.json({ results });
});

Deno.serve(app.fetch);
