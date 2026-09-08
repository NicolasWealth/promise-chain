import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CircleX, ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import {
  EvidencePanel,
  SectionEyebrow,
  Shell,
  StatusBadge,
  TransactionRow,
} from "@/components/commitchain";
import { blockchainService, toCommitmentView } from "@/services/blockchain";
import { getCommitment as getMockCommitment } from "@/services/mockData";

const evidenceLabels: Record<string, string> = {
  github_pr: "GitHub Pull Request",
  github_issue: "GitHub Issue",
  manual_note: "Manual Note",
};

function isDeadlinePassed(deadline: string) {
  const parsed = Date.parse(`${deadline}T23:59:59Z`);
  return Number.isFinite(parsed) ? parsed <= Date.now() : false;
}

export const Route = createFileRoute("/resolution/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Resolution - ${getMockCommitment(params.id).title}` },
      {
        name: "description",
        content: "See how this commitment resolved and what happened to the escrow.",
      },
      { property: "og:title", content: `Resolution - ${getMockCommitment(params.id).title}` },
      {
        property: "og:description",
        content: "See how this commitment resolved and what happened to the escrow.",
      },
    ],
  }),
  component: Resolution,
});

function Resolution() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const {
    data: commitment,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["commitment", id],
    queryFn: () => blockchainService.getCommitment(id),
  });

  const [evidenceType, setEvidenceType] = useState("github_pr");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [pendingAction, setPendingAction] = useState<"evidence" | "success" | "failure" | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!commitment) {
      return;
    }
    setEvidenceType((current) => current || commitment.repository || "github_pr");
    setEvidenceReference((current) => current || commitment.condition || commitment.description);
  }, [commitment]);

  if (isLoading || !commitment) {
    if (error) {
      return (
        <Shell>
          <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <div className="border border-rule bg-panel p-8 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">
                Unable to load commitment from Base Sepolia
              </p>
              <p className="mt-2">
                {error instanceof Error
                  ? error.message
                  : "Unable to load commitment from Base Sepolia."}
              </p>
            </div>
          </main>
        </Shell>
      );
    }

    return (
      <Shell>
        <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="border border-rule bg-panel p-8 text-sm text-muted-foreground">
            Loading resolution record...
          </div>
        </main>
      </Shell>
    );
  }

  const currentCommitment = commitment;
  const displayCommitment = toCommitmentView(currentCommitment);
  const evidenceLabel = evidenceLabels[evidenceType] ?? evidenceType;
  const authorized =
    currentCommitment.mode === "demo"
      ? isConnected
      : Boolean(
          address &&
          currentCommitment.resolver &&
          address.toLowerCase() === currentCommitment.resolver.toLowerCase(),
        );
  const deadlinePassed = isDeadlinePassed(currentCommitment.deadline);
  const canFail =
    currentCommitment.status === "active" && (deadlinePassed || currentCommitment.mode === "demo");
  const canResolve = currentCommitment.status === "active" && authorized;

  async function runAction(action: "evidence" | "success" | "failure") {
    if (!authorized) {
      setErrorMessage("Connect the authorized resolver wallet to continue.");
      return;
    }

    setErrorMessage("");
    setPendingAction(action);
    try {
      if (action === "evidence") {
        await blockchainService.submitEvidence(
          currentCommitment.id,
          evidenceType,
          evidenceReference,
        );
      } else {
        await blockchainService.resolveCommitment(currentCommitment.id, action === "success");
      }
      await queryClient.invalidateQueries({ queryKey: ["commitment", currentCommitment.id] });
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "Resolution action failed.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          to="/commitments/$id"
          params={{ id: currentCommitment.id }}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to commitment
        </Link>
        <div className="mx-auto max-w-3xl py-14 text-center sm:py-20">
          <div
            className={
              currentCommitment.status === "failed"
                ? "mx-auto grid size-16 place-items-center border border-danger/30 bg-danger-soft text-danger"
                : "mx-auto grid size-16 place-items-center bg-lime text-ink"
            }
          >
            {currentCommitment.status === "failed" ? (
              <CircleX className="size-8" />
            ) : (
              <Check className="size-8" />
            )}
          </div>
          <div className="mt-7 flex items-center justify-center gap-2">
            <StatusBadge status={currentCommitment.status} />
            <span className="font-mono text-[11px] text-faint">{currentCommitment.reference}</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {currentCommitment.status === "failed" ? "Commitment failed" : "Commitment completed"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            {currentCommitment.status === "failed"
              ? "The required condition was not satisfied before the deadline."
              : "The resolver recorded evidence and released the escrow."}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="space-y-6">
            <EvidencePanel
              commitment={displayCommitment}
              verified={currentCommitment.status === "completed"}
            />
            <section className="border border-rule bg-panel p-5 sm:p-6">
              <SectionEyebrow>Resolution record</SectionEyebrow>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {currentCommitment.status === "failed" ? "Deadline" : "Completion timestamp"}
                  </p>
                  <p className="mt-1 font-semibold">
                    {currentCommitment.status === "failed"
                      ? currentCommitment.deadline
                      : currentCommitment.resolvedAt}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {currentCommitment.status === "failed"
                      ? "Missing evidence"
                      : "Verification result"}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 font-semibold">
                    {currentCommitment.status === "failed" ? (
                      "No qualifying submission"
                    ) : (
                      <>
                        <ShieldCheck className="size-4 text-lime-soft" /> Evidence verified
                      </>
                    )}
                  </p>
                </div>
              </div>
            </section>
          </div>
          <aside className="space-y-6">
            <section className="border border-rule bg-panel p-5 sm:p-6">
              <SectionEyebrow>Escrow outcome</SectionEyebrow>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-[.14em] text-faint">
                {currentCommitment.status === "failed"
                  ? "Funds returned to creator"
                  : "Funds released to beneficiary"}
              </p>
              <p className="mt-2 text-3xl font-bold">
                {currentCommitment.amount}{" "}
                <span className="text-sm text-muted-foreground">{currentCommitment.token}</span>
              </p>
              <div className="mt-6 border-t border-rule pt-2">
                <TransactionRow
                  label={
                    currentCommitment.status === "failed"
                      ? "Escrow settlement"
                      : "Release transaction"
                  }
                  hash={
                    currentCommitment.releaseHash ??
                    currentCommitment.transactionHash ??
                    "Unavailable"
                  }
                  status={currentCommitment.mode === "chain" ? "Confirmed" : "Confirmed in demo"}
                />
              </div>
              <a
                href="#explorer"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-lime-soft"
              >
                View on explorer <ExternalLink className="size-3.5" />
              </a>
            </section>

            <section className="border border-rule bg-panel p-5 sm:p-6">
              <SectionEyebrow>Resolver access</SectionEyebrow>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Connected wallet</span>
                  <span className="font-mono">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Resolver</span>
                  <span className="font-mono">
                    {currentCommitment.mode === "demo"
                      ? "Demo resolver"
                      : currentCommitment.resolver
                        ? `${currentCommitment.resolver.slice(0, 6)}...${currentCommitment.resolver.slice(-4)}`
                        : "Unavailable"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Authorization</span>
                  <span
                    className={
                      authorized
                        ? "font-semibold text-lime-soft"
                        : "font-semibold text-muted-foreground"
                    }
                  >
                    {authorized ? "Authorized" : "Read only"}
                  </span>
                </div>
              </div>
              <div className="mt-5 grid gap-4 border-t border-rule pt-5">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Evidence type
                  </span>
                  <select
                    value={evidenceType}
                    onChange={(event) => setEvidenceType(event.target.value)}
                    className="w-full border border-input bg-background px-3 py-3 text-sm outline-none focus:border-lime-soft"
                  >
                    <option value="github_pr">GitHub Pull Request</option>
                    <option value="github_issue">GitHub Issue</option>
                    <option value="manual_note">Manual Note</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Evidence reference
                  </span>
                  <input
                    value={evidenceReference}
                    onChange={(event) => setEvidenceReference(event.target.value)}
                    className="w-full border border-input bg-background px-3 py-3 font-mono text-sm outline-none focus:border-lime-soft"
                  />
                </label>
              </div>
              <div className="mt-5 grid gap-3">
                <Button
                  variant="outline"
                  onClick={() => runAction("evidence")}
                  disabled={!authorized || pendingAction !== null}
                >
                  {pendingAction === "evidence" ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" /> Submitting evidence
                    </>
                  ) : (
                    "Submit evidence"
                  )}
                </Button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="accent"
                    onClick={() => runAction("success")}
                    disabled={!canResolve || pendingAction !== null}
                  >
                    {pendingAction === "success" ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" /> Marking success
                      </>
                    ) : (
                      "Mark success"
                    )}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => runAction("failure")}
                    disabled={!canFail || pendingAction !== null}
                  >
                    {pendingAction === "failure" ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" /> Marking failure
                      </>
                    ) : (
                      "Mark failure"
                    )}
                  </Button>
                </div>
              </div>
              {errorMessage && <p className="mt-4 text-sm text-danger">{errorMessage}</p>}
              {!authorized && (
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  Connect the resolver wallet to enable on-chain evidence submission and settlement.
                </p>
              )}
              {currentCommitment.status !== "active" && (
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  This commitment is already resolved, so the action panel is read only.
                </p>
              )}
              {!deadlinePassed &&
                currentCommitment.mode !== "demo" &&
                currentCommitment.status === "active" && (
                  <p className="mt-4 text-xs leading-5 text-muted-foreground">
                    Failure resolution stays disabled until the deadline passes.
                  </p>
                )}
            </section>

            <section className="border border-rule bg-panel p-5 sm:p-6">
              <SectionEyebrow>Evidence metadata</SectionEyebrow>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-semibold">{evidenceLabel}</span>
                </div>
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="mt-1 font-mono text-xs leading-5 break-words">
                    {evidenceReference}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </Shell>
  );
}
