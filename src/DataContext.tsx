import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { api, ApiError } from "./api";
import { useAuth } from "./AuthContext";
import { verifyTransactionChain, type LedgerVerificationResult } from "./ledgerCrypto";
import { syncEngine } from "./syncEngine";

interface Stats {
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
}

interface DataContextValue {
  transactions: any[];
  members: any[];
  loans: any[];
  meetings: any[];
  currentMeeting: any | null;
  disputes: any[];
  auditEvents: any[];
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  seedDatabase: () => Promise<void>;
  verifyLedger: (customTxns?: any[]) => Promise<LedgerVerificationResult>;
  createMember: (body: object) => Promise<void>;
  createTransaction: (body: object) => Promise<any>;
  batchImportTransactions: (records: any[]) => Promise<any>;
  approveTransaction: (id: string, approver?: string, role?: string) => Promise<void>;
  rejectTransaction: (id: string) => Promise<void>;
  createLoan: (body: object) => Promise<any>;
  addRepayment: (loanId: string, amount: number) => Promise<any>;
  saveAttendance: (meetingId: string, attendance: any[]) => Promise<any>;
  reconcileCash: (meetingId: string, payload: any) => Promise<any>;
  signoffMeeting: (meetingId: string, role: string) => Promise<any>;
  closeMeeting: (meetingId: string) => Promise<any>;
  createDispute: (body: object) => Promise<void>;
  resolveDispute: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, profile, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setMembers([]);
      setLoans([]);
      setMeetings([]);
      setDisputes([]);
      setAuditEvents([]);
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [txns, mems, ls, meets, disps, evts, st] = await Promise.all([
        api.transactions.list(),
        api.members.list(),
        api.loans.list(),
        api.meetings.list().catch(() => []),
        api.disputes.list(),
        api.auditEvents.list(),
        api.stats(),
      ]);
      setTransactions(txns);
      setMembers(mems);
      setLoans(ls);
      setMeetings(meets);
      setDisputes(disps);
      setAuditEvents(evts);
      setStats(st);
      setError(null);
    } catch (e: any) {
      const errMsg = e instanceof ApiError ? e.message : e.message || "Failed to load ledger data from backend";
      setError(errMsg);
      setTransactions([]);
      setMembers([]);
      setLoans([]);
      setMeetings([]);
      setDisputes([]);
      setAuditEvents([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadAll();
    }
  }, [authLoading, loadAll]);

  const seedDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.seed();
      await loadAll();
    } catch (e: any) {
      setError(e.message || "Failed to initialize seed data");
    } finally {
      setLoading(false);
    }
  };

  const verifyLedger = async (customTxns?: any[]): Promise<LedgerVerificationResult> => {
    const listToVerify = customTxns ?? transactions;
    return verifyTransactionChain(listToVerify, profile?.groupCode || "MDSHG-2024");
  };

  const createMember = async (body: object) => {
    await api.members.create(body);
    await loadAll();
  };

  const createTransaction = async (body: any) => {
    if (syncEngine.getNetworkState() !== "ONLINE") {
      const offlineTx = await syncEngine.recordOfflineTransaction({
        group_id: profile?.groupCode || "MDSHG-2024",
        member_id: body.memberId || body.member_id || "M-01",
        member_name: body.member || body.memberName || "Sunita Devi",
        meeting_id: body.meetingId || body.meeting_id || "MEET-48",
        transaction_type: body.type || body.transactionType || "Contribution",
        description: body.description,
        amount_paise: Math.round(Number(body.amount || 0) * 100),
        principal_paise: Math.round(Number(body.principal || body.amount || 0) * 100),
        interest_paise: 0,
        payment_mode: body.paymentMode || "Cash",
        created_by: user?.email || profile?.name || "user",
      });

      const mappedOffline = {
        id: offlineTx.local_id,
        sequenceNumber: "Pending Sync",
        sequence_number: "Pending Sync",
        member: offlineTx.member_name,
        member_name: offlineTx.member_name,
        type: offlineTx.transaction_type,
        amount: offlineTx.amount_paise / 100,
        amountPaise: offlineTx.amount_paise,
        date: "Today (Offline)",
        description: offlineTx.description,
        status: "WAITING TO SYNC",
        verification: "Pending",
        currentHash: null,
        current_hash: null,
        isOffline: true,
      };

      setTransactions((prev) => [mappedOffline, ...prev]);
      return mappedOffline;
    }

    try {
      const res = await api.transactions.create(body);
      await loadAll();
      return res;
    } catch {
      syncEngine.setNetworkState("CONNECTION_UNREACHABLE");
      const offlineTx = await syncEngine.recordOfflineTransaction({
        group_id: profile?.groupCode || "MDSHG-2024",
        member_id: body.memberId || body.member_id || "M-01",
        member_name: body.member || body.memberName || "Sunita Devi",
        meeting_id: body.meetingId || body.meeting_id || "MEET-48",
        transaction_type: body.type || body.transactionType || "Contribution",
        description: body.description,
        amount_paise: Math.round(Number(body.amount || 0) * 100),
        principal_paise: Math.round(Number(body.principal || body.amount || 0) * 100),
        interest_paise: 0,
        payment_mode: body.paymentMode || "Cash",
        created_by: user?.email || profile?.name || "user",
      });

      const mappedOffline = {
        id: offlineTx.local_id,
        sequenceNumber: "Pending Sync",
        sequence_number: "Pending Sync",
        member: offlineTx.member_name,
        member_name: offlineTx.member_name,
        type: offlineTx.transaction_type,
        amount: offlineTx.amount_paise / 100,
        amountPaise: offlineTx.amount_paise,
        date: "Today (Offline)",
        description: offlineTx.description,
        status: "WAITING TO SYNC",
        verification: "Pending",
        currentHash: null,
        current_hash: null,
        isOffline: true,
      };

      setTransactions((prev) => [mappedOffline, ...prev]);
      return mappedOffline;
    }
  };

  const batchImportTransactions = async (records: any[]) => {
    const res = await api.transactions.batchImport(records, profile?.groupCode || "MDSHG-2024");
    await loadAll();
    return res;
  };

  const approveTransaction = async (id: string, approver?: string, role?: string) => {
    const actorName = approver || profile?.name || "Officer";
    const actorRole = role || profile?.role || "Auditor";
    await api.transactions.approve(id, actorName, actorRole);
    await loadAll();
  };

  const rejectTransaction = async (id: string) => {
    await api.transactions.reject(id);
    await loadAll();
  };

  const createLoan = async (body: object) => {
    const res = await api.loans.create(body);
    await loadAll();
    return res;
  };

  const addRepayment = async (loanId: string, amount: number) => {
    const res = await api.loans.repayment(loanId, amount);
    await loadAll();
    return res;
  };

  const saveAttendance = async (meetingId: string, attendance: any[]) => {
    const res = await api.meetings.saveAttendance(meetingId, attendance);
    await loadAll();
    return res;
  };

  const reconcileCash = async (meetingId: string, payload: any) => {
    const res = await api.meetings.reconcileCash(meetingId, payload);
    await loadAll();
    return res;
  };

  const signoffMeeting = async (meetingId: string, role: string) => {
    const res = await api.meetings.signoff(meetingId, role);
    await loadAll();
    return res;
  };

  const closeMeeting = async (meetingId: string) => {
    const res = await api.meetings.close(meetingId);
    await loadAll();
    return res;
  };

  const createDispute = async (body: object) => {
    await api.disputes.create(body);
    await loadAll();
  };

  const resolveDispute = async (id: string) => {
    await api.disputes.resolve(id);
    await loadAll();
  };

  const currentMeeting = meetings[0] || null;

  return (
    <DataContext.Provider
      value={{
        transactions,
        members,
        loans,
        meetings,
        currentMeeting,
        disputes,
        auditEvents,
        stats,
        loading,
        error,
        refresh: loadAll,
        seedDatabase,
        verifyLedger,
        createMember,
        createTransaction,
        batchImportTransactions,
        approveTransaction,
        rejectTransaction,
        createLoan,
        addRepayment,
        saveAttendance,
        reconcileCash,
        signoffMeeting,
        closeMeeting,
        createDispute,
        resolveDispute,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
