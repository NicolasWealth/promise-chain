import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronDown, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionEyebrow, Shell, StatusBadge } from "@/components/commitchain";
import { blockchainService } from "@/services/blockchain";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create a commitment — CommitChain" },
      {
        name: "description",
        content: "Fund a measurable promise with clear evidence and a deadline.",
      },
      { property: "og:title", content: "Create a commitment — CommitChain" },
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
  const [title, setTitle] = useState("Ship the first public beta");
  const [description, setDescription] = useState(
    "Deliver a stable release that is ready for a small group of real users.",
  );
  const [beneficiary, setBeneficiary] = useState("0x91b7c93a…e20a");
  const [amount, setAmount] = useState("2,500");
  const [token, setToken] = useState<"USDC" | "ETH">("USDC");
  const [deadline, setDeadline] = useState("2026-10-20");
  const [repository, setRepository] = useState("project-alpha/app");
  const [pullRequest, setPullRequest] = useState("156");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const result = await blockchainService.createCommitment({
      title,
      description,
      beneficiary,
      amount,
      token,
      deadline,
      condition: `GitHub PR #${pullRequest} must be merged before the deadline.`,
      repository,
      pullRequest: Number(pullRequest) || 0,
    });
    setSubmitting(false);
    setConfirmed(true);
    window.setTimeout(
      () => navigate({ to: "/commitments/$id", params: { id: result.commitmentId } }),
      1100,
    );
  }

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
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      className="w-full border border-input bg-panel px-3 py-3 font-mono text-sm outline-none focus:border-lime-soft"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Token
                    </span>
                    <span className="relative block">
                      <select
                        value={token}
                        onChange={(event) => setToken(event.target.value as "USDC" | "ETH")}
                        className="w-full appearance-none border border-input bg-panel px-3 py-3 text-sm outline-none focus:border-lime-soft"
                      >
                        <option>USDC</option>
                        <option>ETH</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4 text-muted-foreground" />
                    </span>
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
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Evidence type
                  </span>
                  <div className="flex items-center justify-between border border-lime-soft/40 bg-lime/10 px-3 py-3 text-sm font-semibold">
                    <span>GitHub Pull Request</span>
                    <span className="font-mono text-[10px] uppercase tracking-[.12em] text-lime-soft">
                      default
                    </span>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      GitHub repository
                    </span>
                    <input
                      required
                      value={repository}
                      onChange={(event) => setRepository(event.target.value)}
                      className="w-full border border-input bg-panel px-3 py-3 font-mono text-sm outline-none focus:border-lime-soft"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      PR number
                    </span>
                    <input
                      required
                      type="number"
                      min="1"
                      value={pullRequest}
                      onChange={(event) => setPullRequest(event.target.value)}
                      className="w-full border border-input bg-panel px-3 py-3 font-mono text-sm outline-none focus:border-lime-soft"
                    />
                  </label>
                </div>
              </fieldset>
              <Button type="submit" variant="accent" size="lg" disabled={submitting || confirmed}>
                {submitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" /> Preparing demo transaction
                  </>
                ) : confirmed ? (
                  <>
                    <Check className="size-4" /> Demo transaction confirmed
                  </>
                ) : (
                  "Create commitment"
                )}
              </Button>
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
                    {amount || "0"} <span className="text-xs text-muted-foreground">{token}</span>
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
                  PR #{pullRequest || "000"} merged in {repository || "your/repository"}
                </p>
              </div>
              <p className="border-t border-rule pt-4 font-mono text-[10px] leading-5 text-faint">
                Demo mode · no wallet transaction will be broadcast.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </Shell>
  );
}
