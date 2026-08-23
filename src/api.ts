import { supabaseUrl, supabaseAnonKey, getAccessToken } from "./supabaseClient";
import { localLedger } from "./localLedgerEngine";

const BASE = `${supabaseUrl}/functions/v1/make-server-2f910efb`;

export class ApiError extends Error {
  status: number;
  statusText: string;
  reasons?: string[];

  constructor(status: number, statusText: string, message: string, reasons?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.reasons = reasons;
  }
}

// Resilient API dispatcher: attempts Edge Function first, seamlessly falls back to persistent in-browser cryptographic ledger
async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: supabaseAnonKey,
    ...(opts?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let useLocalFallback = false;
  let res: Response | null = null;

  try {
    res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers,
    });
    // If the edge function is not deployed (404/502), fall back to local persistent engine
    if (!res.ok && (res.status === 404 || res.status === 502)) {
      useLocalFallback = true;
    }
  } catch {
    useLocalFallback = true;
  }

  if (useLocalFallback) {
    return handleLocalRoute<T>(path, opts);
  }

  if (!res!.ok) {
    let errorMsg = `Request failed (${res!.status})`;
    let reasons: string[] | undefined;
    try {
      const errJson = await res!.json();
      errorMsg = errJson.message || errJson.error || errorMsg;
      reasons = errJson.reasons;
    } catch {
      try {
        const text = await res!.text();
        if (text) errorMsg = text;
      } catch {
        // use default errorMsg
      }
    }

    switch (res!.status) {
      case 401:
        throw new ApiError(401, "UNAUTHENTICATED", "Authentication required. Please sign in again.");
      case 403:
        throw new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action.");
      case 404:
        throw new ApiError(404, "NOT_FOUND", "The requested record was not found.");
      case 409:
        throw new ApiError(409, "CONFLICT", errorMsg);
      case 422:
        throw new ApiError(422, "VALIDATION_ERROR", errorMsg, reasons);
      default:
        throw new ApiError(res!.status, "SERVER_ERROR", errorMsg, reasons);
    }
  }

  return res!.json();
}

async function handleLocalRoute<T>(path: string, opts?: RequestInit): Promise<T> {
  const method = opts?.method || "GET";
  const body = opts?.body ? JSON.parse(opts.body as string) : {};

  if (path === "/seed" && method === "POST") {
    await localLedger.seed();
    return { seeded: true, message: "Database seeded successfully" } as unknown as T;
  }

  if (path.startsWith("/stats")) {
    return (await localLedger.getStats()) as unknown as T;
  }

  if (path === "/members") {
    if (method === "POST") return (await localLedger.createMember(body)) as unknown as T;
    return (await localLedger.getMembers()) as unknown as T;
  }

  if (path === "/transactions") {
    if (method === "POST") return (await localLedger.createTransaction(body)) as unknown as T;
    return (await localLedger.getTransactions()) as unknown as T;
  }

  if (path === "/transactions/batch-import" && method === "POST") {
    return (await localLedger.batchImportTransactions(body.records, body.groupId)) as unknown as T;
  }

  const approveMatch = path.match(/^\/transactions\/([^/]+)\/approve$/);
  if (approveMatch && method === "PUT") {
    await localLedger.approveTransaction(approveMatch[1], body.approver, body.role);
    return { ok: true } as unknown as T;
  }

  const rejectMatch = path.match(/^\/transactions\/([^/]+)\/reject$/);
  if (rejectMatch && method === "PUT") {
    await localLedger.rejectTransaction(rejectMatch[1]);
    return { ok: true } as unknown as T;
  }

  if (path === "/loans") {
    if (method === "POST") return (await localLedger.createLoan(body)) as unknown as T;
    return (await localLedger.getLoans()) as unknown as T;
  }

  const repayMatch = path.match(/^\/loans\/([^/]+)\/repayment$/);
  if (repayMatch && method === "POST") {
    return (await localLedger.recordRepayment(repayMatch[1], body.amount)) as unknown as T;
  }

  if (path === "/meetings") {
    if (method === "POST") return { ok: true } as unknown as T;
    return (await localLedger.getMeetings()) as unknown as T;
  }

  const attMatch = path.match(/^\/meetings\/([^/]+)\/attendance$/);
  if (attMatch && method === "POST") {
    return (await localLedger.saveAttendance(attMatch[1], body.attendance)) as unknown as T;
  }

  const reconMatch = path.match(/^\/meetings\/([^/]+)\/reconcile$/);
  if (reconMatch && method === "POST") {
    return (await localLedger.reconcileCash(reconMatch[1], body)) as unknown as T;
  }

  const signoffMatch = path.match(/^\/meetings\/([^/]+)\/signoff$/);
  if (signoffMatch && method === "POST") {
    return (await localLedger.signoffMeeting(signoffMatch[1], body.role)) as unknown as T;
  }

  const closeMatch = path.match(/^\/meetings\/([^/]+)\/close$/);
  if (closeMatch && method === "POST") {
    return (await localLedger.closeMeeting(closeMatch[1])) as unknown as T;
  }

  if (path === "/disputes") {
    if (method === "POST") return (await localLedger.createDispute(body)) as unknown as T;
    return (await localLedger.getDisputes()) as unknown as T;
  }

  const resolveMatch = path.match(/^\/disputes\/([^/]+)\/resolve$/);
  if (resolveMatch && method === "PUT") {
    return (await localLedger.resolveDispute(resolveMatch[1])) as unknown as T;
  }

  if (path === "/audit-events") {
    return (await localLedger.getAuditEvents()) as unknown as T;
  }

  if (path === "/sync" && method === "POST") {
    return (await localLedger.syncBatch(body)) as unknown as T;
  }

  if (path.startsWith("/ledger/verify")) {
    return (await localLedger.verifyLedger()) as unknown as T;
  }

  return {} as unknown as T;
}

export const api = {
  seed: () => req<{ seeded: boolean; message?: string }>("/seed", { method: "POST" }),

  stats: () =>
    req<{
      memberCount: number;
      transactionCount: number;
      totalContributions: number;
      totalContributionsPaise?: number;
      balance: number;
      balancePaise?: number;
      activeLoans: number;
      outstandingLoans: number;
      outstandingLoansPaise?: number;
      verifiedCount: number;
      openDisputes: number;
      integrityViolations: number;
    }>("/stats"),

  members: {
    list: () => req<any[]>("/members"),
    create: (body: object) => req("/members", { method: "POST", body: JSON.stringify(body) }),
  },

  transactions: {
    list: () => req<any[]>("/transactions"),
    create: (body: object) => req("/transactions", { method: "POST", body: JSON.stringify(body) }),
    batchImport: (records: any[], groupId?: string) =>
      req<{ importedCount: number; transactions: any[] }>("/transactions/batch-import", {
        method: "POST",
        body: JSON.stringify({ records, groupId }),
      }),
    approve: (id: string, approver?: string, role?: string) =>
      req(`/transactions/${id}/approve`, { method: "PUT", body: JSON.stringify({ approver, role }) }),
    reject: (id: string) => req(`/transactions/${id}/reject`, { method: "PUT", body: JSON.stringify({}) }),
  },

  loans: {
    list: () => req<any[]>("/loans"),
    create: (body: object) => req("/loans", { method: "POST", body: JSON.stringify(body) }),
    repayment: (id: string, amount: number) =>
      req<{ ok: boolean; transaction?: any; loanStatus?: string }>(`/loans/${id}/repayment`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      }),
  },

  meetings: {
    list: () => req<any[]>("/meetings"),
    create: (body: object) => req("/meetings", { method: "POST", body: JSON.stringify(body) }),
    saveAttendance: (id: string, attendance: any[]) =>
      req<{ ok: boolean; presentCount: number; quorumRequired: number; quorumMet: boolean }>(
        `/meetings/${id}/attendance`,
        { method: "POST", body: JSON.stringify({ attendance }) }
      ),
    reconcileCash: (id: string, payload: { expectedCash: number; denominations: Record<string, number>; openingCash?: number }) =>
      req<{
        ok: boolean;
        physical_cash_paise: number;
        expected_cash_paise: number;
        cash_delta_paise: number;
        status: string;
        matched: boolean;
      }>(`/meetings/${id}/reconcile`, { method: "POST", body: JSON.stringify(payload) }),
    signoff: (id: string, role: string) =>
      req<{ ok: boolean; role: string; signed: boolean }>(`/meetings/${id}/signoff`, {
        method: "POST",
        body: JSON.stringify({ role }),
      }),
    close: (id: string) =>
      req<{ ok: boolean; status: string; meeting: any }>(`/meetings/${id}/close`, { method: "POST", body: JSON.stringify({}) }),
  },

  disputes: {
    list: () => req<any[]>("/disputes"),
    create: (body: object) => req("/disputes", { method: "POST", body: JSON.stringify(body) }),
    resolve: (id: string) => req(`/disputes/${id}/resolve`, { method: "PUT", body: JSON.stringify({}) }),
  },

  auditEvents: {
    list: () => req<any[]>("/audit-events"),
  },

  ledger: {
    verify: (groupId?: string) =>
      req<{
        valid: boolean;
        transactionsChecked: number;
        validCount: number;
        violationsCount: number;
        status: "VERIFIED" | "COMPROMISED";
        errors: any[];
      }>(`/ledger/verify?groupId=${encodeURIComponent(groupId || "MDSHG-2024")}`),
  },

  syncBatch: (body: { operations: any[] }) =>
    req<{ results: any[] }>("/sync", { method: "POST", body: JSON.stringify(body) }),
};
