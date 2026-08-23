# Lekha — SHG Digital Ledger (PS-18)

A tamper-evident, offline-first digital financial ledger application for Self-Help Groups (SHGs), compliant with National Rural Livelihoods Mission (NRLM) standards.

---

## 🚀 Quick Start on Any Computer

### Prerequisites
- **Node.js**: v18 or higher ([Download Node.js](https://nodejs.org))
- **npm**: (bundled with Node.js)

### 1. Install Dependencies
Open your terminal inside the `version 7` folder and run:
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open **[http://localhost:8443](http://localhost:8443)** (or the URL printed in the terminal) in your browser.

### 3. Run Automated Tests (61/61 Tests)
```bash
npm test
```

### 4. Production Build
```bash
npm run build
```

---

## 🛠️ Key Features

1. **Voice / Low-Literacy Entry**: Web Speech API speech recognition, NLP amount parser, and audio confirmation in 13 Indian languages.
2. **Cryptographic SHA-256 Ledger**: Continuous tamper-evident hash chain with mathematical integrity audits.
3. **Internal Microloan Tracker**: Complete loan lifecycle, EMI repayments, corpus availability protection, and overdue alerts.
4. **Federation Audit View**: Multi-tier administrative aggregation (`District` → `Block` → `CLF` → `VO` → `SHG`) and formal dispute resolution.
5. **Deterministic Risk & Anomaly Engine**: 10 automated governance rules evaluating loan concentration, cash mismatch, and outlier transactions.
6. **IndexedDB Offline-First Architecture**: Durably records transactions and meetings offline; safely syncs with server sequence authority when online.
7. **Optical Character Recognition (OCR)**: Scans physical meeting register photos to batch-import verified historical records.
8. **Bank & Cash Reconciliation**: Reconciles physical cash in the group cash box with Union Bank institutional savings.
