export type CommitmentStatus = "active" | "completed" | "failed";

export type Commitment = {
  id: string;
  reference: string;
  title: string;
  description: string;
  status: CommitmentStatus;
  amount: string;
  token: "USDC" | "ETH";
  deadline: string;
  deadlineShort: string;
  daysRemaining?: number;
  progress: number;
  creator: string;
  beneficiary: string;
  beneficiaryLabel: string;
  condition: string;
  repository: string;
  pullRequest: number;
  pullRequestTitle: string;
  author: string;
  createdDate: string;
  mergeStatus: "merged" | "open" | "not-submitted";
  mergeDate?: string;
  createdAt: string;
  lockedAt: string;
  submittedAt?: string;
  verifiedAt?: string;
  resolvedAt?: string;
  transactionHash: string;
  releaseHash?: string;
};

export const currentCommitment: Commitment = {
  id: "auth-142",
  reference: "COM-2291",
  title: "Build authentication system",
  description:
    "Ship production-ready authentication with walletless email sign-in, session recovery, and protected project routes.",
  status: "active",
  amount: "5,000",
  token: "USDC",
  deadline: "September 20, 2026",
  deadlineShort: "Sep 20, 2026",
  daysRemaining: 12,
  progress: 68,
  creator: "0x3f8c…9a2b",
  beneficiary: "0x7de1…4c0f",
  beneficiaryLabel: "Core Contributors",
  condition: "GitHub PR #142 must be merged before September 20.",
  repository: "project-alpha/app",
  pullRequest: 142,
  pullRequestTitle: "feat: add passwordless authentication flow",
  author: "@maya-chen",
  createdDate: "Aug 26, 2026",
  mergeStatus: "merged",
  mergeDate: "Sep 08, 2026 at 14:32 UTC",
  createdAt: "Aug 26, 2026 at 09:14 UTC",
  lockedAt: "Aug 26, 2026 at 09:15 UTC",
  submittedAt: "Sep 08, 2026 at 14:30 UTC",
  verifiedAt: "Sep 08, 2026 at 14:33 UTC",
  transactionHash: "0x8a2f1c9e7d4b6a2f…c41d",
};

export const commitments: Commitment[] = [
  currentCommitment,
  {
    id: "mobile-beta",
    reference: "COM-2284",
    title: "Launch mobile beta",
    description: "Release the first invite-only mobile beta to 250 testers.",
    status: "active",
    amount: "0.85",
    token: "ETH",
    deadline: "October 02, 2026",
    deadlineShort: "Oct 02, 2026",
    daysRemaining: 24,
    progress: 31,
    creator: "0x3f8c…9a2b",
    beneficiary: "0x91b7…e20a",
    beneficiaryLabel: "Alpha Mobile Team",
    condition: "Public beta build available to 250 invited testers.",
    repository: "project-alpha/mobile",
    pullRequest: 88,
    pullRequestTitle: "release: mobile beta 0.1",
    author: "@leo-park",
    createdDate: "Aug 18, 2026",
    mergeStatus: "open",
    createdAt: "Aug 18, 2026 at 16:07 UTC",
    lockedAt: "Aug 18, 2026 at 16:08 UTC",
    transactionHash: "0x14d81e5c2aa74b31…7c82",
  },
  {
    id: "payments-ledger",
    reference: "COM-2242",
    title: "Ship payments ledger",
    description: "Deliver the reconciliation ledger and publish its implementation notes.",
    status: "completed",
    amount: "12,000",
    token: "USDC",
    deadline: "July 30, 2026",
    deadlineShort: "Jul 30, 2026",
    progress: 100,
    creator: "0x3f8c…9a2b",
    beneficiary: "0x7de1…4c0f",
    beneficiaryLabel: "Core Contributors",
    condition: "Payments ledger merged and reconciliation notes published.",
    repository: "project-alpha/ledger",
    pullRequest: 121,
    pullRequestTitle: "feat: ship payment reconciliation ledger",
    author: "@maya-chen",
    createdDate: "Jul 02, 2026",
    mergeStatus: "merged",
    mergeDate: "Jul 28, 2026 at 11:02 UTC",
    createdAt: "Jul 02, 2026 at 10:12 UTC",
    lockedAt: "Jul 02, 2026 at 10:13 UTC",
    submittedAt: "Jul 28, 2026 at 11:01 UTC",
    verifiedAt: "Jul 28, 2026 at 11:03 UTC",
    resolvedAt: "Jul 28, 2026 at 11:04 UTC",
    transactionHash: "0x6e3bd4f8e70c1a5e…b720",
    releaseHash: "0x1f4aa2d890ef4e92…1b06",
  },
  {
    id: "security-audit",
    reference: "COM-2198",
    title: "Publish security audit",
    description: "Publish an independent review covering the core protocol contracts.",
    status: "failed",
    amount: "2,500",
    token: "USDC",
    deadline: "August 14, 2026",
    deadlineShort: "Aug 14, 2026",
    progress: 0,
    creator: "0x3f8c…9a2b",
    beneficiary: "0x2ca9…d44e",
    beneficiaryLabel: "Alpha Security",
    condition: "Independent audit report published before the deadline.",
    repository: "project-alpha/protocol",
    pullRequest: 67,
    pullRequestTitle: "docs: add audit report",
    author: "@niko-r",
    createdDate: "Jul 20, 2026",
    mergeStatus: "not-submitted",
    createdAt: "Jul 20, 2026 at 12:48 UTC",
    lockedAt: "Jul 20, 2026 at 12:49 UTC",
    resolvedAt: "Aug 14, 2026 at 00:01 UTC",
    transactionHash: "0x3c1e85ab42d76f0d…02ae",
  },
];

export const profileHistory: Commitment[] = [
  ...commitments.filter((commitment) => commitment.id === "payments-ledger"),
  {
    ...currentCommitment,
    status: "completed" as const,
    progress: 100,
    deadline: "June 18, 2026",
    deadlineShort: "Jun 18, 2026",
  },
  ...commitments.filter((commitment) => commitment.id === "security-audit"),
];
export const getCommitment = (id: string) =>
  commitments.find((commitment) => commitment.id === id) ?? currentCommitment;
