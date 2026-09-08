import { useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Check, ChevronDown, LoaderCircle } from "lucide-react";
import { useAccount, useChainId, useConnect, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { isAddress } from "viem";

import { Button } from "@/components/ui/button";
import { SectionEyebrow, Shell, StatusBadge } from "@/components/commitchain";
import { isPromiseChainConfigured } from "@/lib/web3/contract";
import { blockchainService } from "@/services/blockchain";

const evidenceLabels: Record<string, string> = {
  github_pr: "GitHub Pull Request",
  github_issue: "GitHub Issue",
  manual_note: "Manual Note",
};

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create a commitment - PromiseChain" },
      {
        name: "description",
        content: "Fund a measurable promise with clear evidence and a deadline.",
      },
      { property: "og:title", content: "Create a commitment - PromiseChain" },
      {
        property: "og:description",
        content: "Fund a measurable promise with clear evidence and a deadline.",
      },
    ],
  }),
  component: CreateCommitment,
});

function CreateCommitment() {
  const navigate = useNavigate({ from: "/create" });
  const { isConnected } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const [title, setTitle] = useState("Ship the first public beta");
  const [description, setDescription] = useState(
    "Deliver a stable release that is ready for a small group of real users.",
  );
  const [beneficiary, setBeneficiary] = useState("0x91b7c93a1c6d8d5a67eafb1e2b4b65bd4e20a111");
  const [amount, setAmount] = useState("0.1");
  const [deadline, setDeadline] = useState("2026-10-20");
  const [evidenceType, setEvidenceType] = useState("github_pr");
  const [evidenceReference, setEvidenceReference] = useState(
    "https://github.com/example/repo/pull/123",
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [mode, setMode] = useState<"chain" | "demo" | "">("");
  const [error, setError] = useState("");

  async function ensureWalletReady() {
    if (!isPromiseChainConfigured()) {
      return;
    }

    if (!isConnected) {
      const connector = connectors[0];
      if (!connector) {
        throw new Error("No wallet connector is available");
      }
      await connectAsync({ connector });
    }

    if (chainId !== baseSepolia.id) {
      await switchChainAsync({ chainId: baseSepolia.id });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Add a commitment title.");
      return;
    }
    if (!description.trim()) {
      setError("Add a description.");
      return;
    }
    if (!isAddress(beneficiary)) {
      setError("Enter a valid beneficiary address.");
      return;
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError("Escrow amount must be greater than zero.");
      return;
    }
    if (!deadline) {
      setError("Choose a deadline.");
      return;
    }
    if (!evidenceReference.trim()) {
      setError("Add an evidence reference.");
      return;
    }

    setSubmitting(true);
    try {
      await ensureWalletReady();
      const result = await blockchainService.createCommitment({
        title,
        description,
        beneficiary,
        amount,
        deadline,
        evidenceType,
        evidenceReference,
      });
      setTxHash(result.transactionHash);
      setMode(result.mode);
      setConfirmed(true);
      window.setTimeout(
        () => navigate({ to: "/commitments/$id", params: { id: result.commitmentId } }),
        1200,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create commitment.");
    } finally {
      setSubmitting(false);
    }
  }

  const evidenceLabel = evidenceLabels[evidenceType] ?? evidenceType;
  const statusLabel =
    confirmed && mode === "chain"
      ? "Transaction confirmed"
      : confirmed && mode === "demo"
        ? "Demo transaction confirmed"
        : "Ready to create";

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to dashboard
        </Link>
        <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <SectionEyebrow>New commitment / step 01</SectionEyebrow>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Make it measurable.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Define the promise, lock the value, and give everyone a clear way to verify the
              outcome.
            </p>
            <form onSubmit={submit} className="mt-9 space-y-8">
              <fieldset className="space-y-4">
                <legend className="text-sm font-bold">The promise</legend>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Commitment title
                  </span>
                  <input
                    required
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full border border-input bg-panel px-3 py-3 text-sm outline-none transition-colors focus:border-lime-soft"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Description
                  </span>
                  <textarea
                    required
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    className="w-full resize-y border border-input bg-panel px-3 py-3 text-sm leading-6 outline-none transition-colors focus:border-lime-soft"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Beneficiary wallet
                  </span>
                  <input
                    required
                    value={beneficiary}
                    onChange={(event) => setBeneficiary(event.target.value)}
                    className="w-full border border-input bg-panel px-3 py-3 font-mono text-sm outline-none transition-colors focus:border-lime-soft"
                  />
                </label>
              </fieldset>

              <fieldset className="space-y-4 border-t border-rule pt-7">
                <legend className="text-sm font-bold">The stake</legend>
                <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Escrow amount
                    </span>
                    <input
                      required
                      inputMode="decimal"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      className="w-full border border-input bg-panel px-3 py-3 font-mono text-sm outline-none focus:border-lime-soft"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Token
                    </span>
                    <div className="flex h-[46px] items-center border border-input bg-panel px-3 text-sm font-semibold">
                      ETH
                    </div>
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Deadline
                  </span>
                  <input
                    required
                    type="date"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    className="w-full border border-input bg-panel px-3 py-3 font-mono text-sm outline-none focus:border-lime-soft"
                  />
                </label>
              </fieldset>

              <fieldset className="space-y-4 border-t border-rule pt-7">
                <legend className="text-sm font-bold">Verification</legend>
                <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Evidence type
                    </span>
                    <span className="relative block">
                      <select
                        value={evidenceType}
                        onChange={(event) => setEvidenceType(event.target.value)}
                        className="w-full appearance-none border border-input bg-panel px-3 py-3 text-sm outline-none focus:border-lime-soft"
                      >
                        <option value="github_pr">GitHub Pull Request</option>
                        <option value="github_issue">GitHub Issue</option>
                        <option value="manual_note">Manual Note</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4 text-muted-foreground" />
                    </span>
                  </label>
                  <div className="flex items-end">
                    <div className="w-full border border-lime-soft/40 bg-lime/10 px-3 py-3 text-sm font-semibold">
                      {evidenceLabel}
                    </div>
                  </div>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Evidence reference
                  </span>
                  <input
                    required
                    value={evidenceReference}
                    onChange={(event) => setEvidenceReference(event.target.value)}
                    placeholder="https://github.com/example/repo/pull/123"
                    className="w-full border border-input bg-panel px-3 py-3 font-mono text-sm outline-none focus:border-lime-soft"
                  />
                </label>
              </fieldset>

              <Button type="submit" variant="accent" size="lg" disabled={submitting || confirmed}>
                {submitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" /> Preparing transaction
                  </>
                ) : confirmed ? (
                  <>
                    <Check className="size-4" /> {statusLabel}
                  </>
                ) : (
                  "Create commitment"
                )}
              </Button>

              {error && (
                <p className="flex items-start gap-2 text-sm text-danger">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </p>
              )}

              {txHash && (
                <p className="font-mono text-xs text-muted-foreground">
                  Transaction hash: {txHash}
                </p>
              )}
            </form>
          </div>

          <aside className="border border-rule bg-panel lg:sticky lg:top-24">
            <div className="border-b border-rule bg-ink px-5 py-4 text-background">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[.16em] text-lime">
                  Preview
                </span>
                <StatusBadge status="active" />
              </div>
              <p className="mt-5 text-xl font-bold">{title || "Your commitment title"}</p>
            </div>
            <div className="space-y-5 p-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.12em] text-faint">
                  Description
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {description || "Your measurable promise will appear here."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-y border-rule py-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.12em] text-faint">
                    Escrow
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold">
                    {amount || "0"} <span className="text-xs text-muted-foreground">ETH</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[.12em] text-faint">
                    Deadline
                  </p>
                  <p className="mt-1 text-sm font-bold">{deadline || "—"}</p>
                </div>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.12em] text-faint">
                  Success condition
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {evidenceLabel} · {evidenceReference || "your evidence reference"}
                </p>
              </div>
              <p className="border-t border-rule pt-4 font-mono text-[10px] leading-5 text-faint">
                Wallet + Base Sepolia are required for a live escrow. Demo fallback stays explicit
                when deployment is not configured.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </Shell>
  );
}
