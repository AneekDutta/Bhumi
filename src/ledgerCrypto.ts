// PS-18 SHG Digital Ledger: Cryptographic Integrity & Tamper Detection Engine

export interface CanonicalTxInput {
  sequenceNumber: number | string;
  groupId: string;
  meetingId?: string | null;
  memberId?: string | null;
  transactionType: string;
  amountPaise: number | string;
  principalPaise?: number | string;
  interestPaise?: number | string;
  paymentMode?: string;
  prevHash: string;
  createdAt: string;
}

export interface VerificationError {
  sequenceNumber: number;
  txId: string;
  type: "HASH_MISMATCH" | "PREV_HASH_MISMATCH" | "SEQUENCE_GAP" | "SEQUENCE_DUPLICATE" | "INVALID_PAYLOAD";
  message: string;
  expectedHash?: string;
  actualHash?: string;
  prevHashExpected?: string;
  prevHashActual?: string;
}

export interface LedgerVerificationResult {
  valid: boolean;
  transactionsChecked: number;
  validCount: number;
  violationsCount: number;
  status: "VERIFIED" | "COMPROMISED";
  errors: VerificationError[];
  affectedTxIds: string[];
}

/**
 * Deterministically computes SHA-256 hex digest using Web Crypto API
 */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Computes deterministic genesis previous hash for a given SHG group
 */
export async function computeGenesisHash(groupId: string): Promise<string> {
  return sha256(`PS18:GENESIS:${groupId || "MDSHG-2024"}`);
}

/**
 * Serializes transaction fields into a strict deterministic canonical payload format:
 * sequence_number:group_id:meeting_id:member_id:transaction_type:amount_paise:principal_paise:interest_paise:payment_mode:prev_hash:created_at
 */
export function serializeCanonicalPayload(tx: CanonicalTxInput): string {
  const seq = String(tx.sequenceNumber);
  const grp = tx.groupId || "MDSHG-2024";
  const meet = tx.meetingId || "NONE";
  const mem = tx.memberId || "NONE";
  const type = tx.transactionType || "Contribution";
  const amt = String(Math.round(Number(tx.amountPaise) || 0));
  const prin = String(Math.round(Number(tx.principalPaise) || 0));
  const int = String(Math.round(Number(tx.interestPaise) || 0));
  const mode = tx.paymentMode || "Cash";
  const prev = tx.prevHash || "";
  const created = tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString();

  return `${seq}:${grp}:${meet}:${mem}:${type}:${amt}:${prin}:${int}:${mode}:${prev}:${created}`;
}

/**
 * Computes the cryptographic current_hash for a given canonical transaction payload
 */
export async function computeTransactionHash(tx: CanonicalTxInput): Promise<string> {
  const payload = serializeCanonicalPayload(tx);
  return sha256(payload);
}

/**
 * Comprehensive ledger chain verification algorithm:
 * 1. Validates genesis link
 * 2. Recalculates each node's SHA-256 hash over its canonical payload
 * 3. Verifies linear chain pointers (T[i].prev_hash === T[i-1].current_hash)
 * 4. Checks sequence monotonicity and detects gaps or duplicates
 */
export async function verifyTransactionChain(
  transactions: any[],
  groupId: string = "MDSHG-2024"
): Promise<LedgerVerificationResult> {
  if (!transactions || transactions.length === 0) {
    return {
      valid: true,
      transactionsChecked: 0,
      validCount: 0,
      violationsCount: 0,
      status: "VERIFIED",
      errors: [],
      affectedTxIds: [],
    };
  }

  // Sort chronologically by sequence number ascending
  const sorted = [...transactions].sort((a, b) => {
    const seqA = Number(a.sequenceNumber ?? a.sequence_number ?? 0);
    const seqB = Number(b.sequenceNumber ?? b.sequence_number ?? 0);
    return seqA - seqB;
  });

  const errors: VerificationError[] = [];
  const affectedTxIds: string[] = [];
  const genesisHash = await computeGenesisHash(groupId);
  let expectedPrevHash = genesisHash;
  let expectedSequence = Number(sorted[0].sequenceNumber ?? sorted[0].sequence_number ?? 1);

  for (let i = 0; i < sorted.length; i++) {
    const tx = sorted[i];
    const txId = tx.id || `TXN-${i + 1}`;
    const seq = Number(tx.sequenceNumber ?? tx.sequence_number ?? (i + 1));
    const storedHash = tx.currentHash ?? tx.current_hash ?? tx.hash ?? "";
    const storedPrevHash = tx.prevHash ?? tx.prev_hash ?? "";

    // 1. Sequence checks
    if (i > 0 && seq !== expectedSequence) {
      errors.push({
        sequenceNumber: seq,
        txId,
        type: "SEQUENCE_GAP",
        message: `Sequence discontinuity detected at ${txId}. Expected sequence #${expectedSequence}, got #${seq}`,
      });
      affectedTxIds.push(txId);
    }

    // 2. Previous hash pointer check
    if (i === 0) {
      if (storedPrevHash && storedPrevHash !== genesisHash && !storedPrevHash.startsWith("0000")) {
        // First transaction should match genesis
        errors.push({
          sequenceNumber: seq,
          txId,
          type: "PREV_HASH_MISMATCH",
          message: `Genesis previous hash mismatch for first transaction ${txId}.`,
          prevHashExpected: genesisHash,
          prevHashActual: storedPrevHash,
        });
        affectedTxIds.push(txId);
      }
    } else {
      if (storedPrevHash !== expectedPrevHash) {
        errors.push({
          sequenceNumber: seq,
          txId,
          type: "PREV_HASH_MISMATCH",
          message: `Broken chain link at ${txId}: previous hash pointer does not match previous transaction's hash.`,
          prevHashExpected: expectedPrevHash,
          prevHashActual: storedPrevHash,
        });
        affectedTxIds.push(txId);
      }
    }

    // 3. Recompute canonical hash
    const canonicalInput: CanonicalTxInput = {
      sequenceNumber: seq,
      groupId: tx.groupId || tx.group_id || groupId,
      meetingId: tx.meetingId || tx.meeting_id || null,
      memberId: tx.memberId || tx.member_id || null,
      transactionType: tx.transactionType || tx.transaction_type || tx.type || "Contribution",
      amountPaise: tx.amountPaise ?? tx.amount_paise ?? (Number(tx.amount || 0) * 100),
      principalPaise: tx.principalPaise ?? tx.principal_paise ?? 0,
      interestPaise: tx.interestPaise ?? tx.interest_paise ?? 0,
      paymentMode: tx.paymentMode || tx.payment_mode || "Cash",
      prevHash: storedPrevHash,
      createdAt: tx.createdAt || tx.created_at || tx.date || new Date().toISOString(),
    };

    const calculatedHash = await computeTransactionHash(canonicalInput);

    if (storedHash && storedHash !== calculatedHash) {
      errors.push({
        sequenceNumber: seq,
        txId,
        type: "HASH_MISMATCH",
        message: `Cryptographic hash mismatch on ${txId}. Record content has been modified.`,
        expectedHash: calculatedHash,
        actualHash: storedHash,
      });
      affectedTxIds.push(txId);
    }

    // Advance expected pointers
    expectedPrevHash = storedHash || calculatedHash;
    expectedSequence = seq + 1;
  }

  const valid = errors.length === 0;
  const violationsCount = errors.length;
  const validCount = Math.max(0, sorted.length - violationsCount);

  return {
    valid,
    transactionsChecked: sorted.length,
    validCount,
    violationsCount,
    status: valid ? "VERIFIED" : "COMPROMISED",
    errors,
    affectedTxIds: Array.from(new Set(affectedTxIds)),
  };
}
