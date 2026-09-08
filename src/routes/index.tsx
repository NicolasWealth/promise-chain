import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommitmentCard,
  Footer,
  Navbar,
  PageFrame,
  SectionEyebrow,
  StatusBadge,
  StepFlow,
} from "@/components/commitchain";
import { currentCommitment, profileHistory } from "@/services/mockData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PromiseChain - Make promises worth keeping" },
      {
        name: "description",
        content: "Fund measurable commitments and build a public record of delivering.",
      },
      { property: "og:title", content: "PromiseChain - Make promises worth keeping" },
      {
        property: "og:description",
        content: "Fund measurable commitments and build a public record of delivering.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PageFrame>
      <Navbar />
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16 lg:pb-28">
          <div className="animate-[cc-rise_.6s_ease-out_both]">
            <SectionEyebrow>Accountability infrastructure for Web3</SectionEyebrow>
            <h1 className="mt-5 max-w-2xl text-5xl font-bold leading-[.98] tracking-[-0.045em] sm:text-7xl">
              Make promises
              <br />
              <span className="text-lime-soft">worth keeping.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Commit funds. Set measurable outcomes. Build a public track record of delivering.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="accent" size="lg">
                <Link to="/create">
                  Create a commitment <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/dashboard">Explore commitments</Link>
              </Button>
            </div>
            <StepFlow />
          </div>
          <div className="relative animate-[cc-rise_.7s_.1s_ease-out_both]">
            <div className="absolute -left-3 -top-3 hidden h-20 w-20 border-l border-t border-lime-soft/50 sm:block" />
            <CommitmentCard commitment={currentCommitment} />
            <div className="mt-3 flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-[.14em] text-faint">
              <ShieldCheck className="size-3.5 text-lime-soft" /> Escrow-backed - publicly
              verifiable
            </div>
          </div>
        </section>

        <section className="border-y border-rule bg-panel">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:py-20">
            <div>
              <SectionEyebrow>Why PromiseChain</SectionEyebrow>
              <h2 className="mt-4 max-w-md text-3xl font-bold tracking-tight sm:text-4xl">
                Make delivery visible.
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                [
                  "01",
                  "Commit with skin in the game",
                  "Lock value against a promise, not a vague roadmap.",
                ],
                [
                  "02",
                  "Verify the work",
                  "Use clear, measurable evidence before the clock runs out.",
                ],
                ["03", "Build reputation", "Every outcome becomes part of a public track record."],
              ].map(([number, title, copy]) => (
                <div key={number} className="border-t-2 border-ink pt-4">
                  <span className="font-mono text-[11px] text-lime-soft">{number}</span>
                  <h3 className="mt-5 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <SectionEyebrow>Public reputation</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                A track record you can inspect.
              </h2>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 text-sm font-bold text-lime-soft hover:text-foreground"
            >
              View Project Alpha <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {profileHistory.map((commitment) => (
              <div key={commitment.reference} className="border border-rule p-5">
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge status={commitment.status} />
                  <span className="font-mono text-[10px] text-faint">{commitment.reference}</span>
                </div>
                <h3 className="mt-6 font-bold">{commitment.title}</h3>
                <p className="mt-2 font-mono text-sm">
                  {commitment.amount} {commitment.token}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-ink text-background">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-5 py-14 sm:px-8">
            <div>
              <SectionEyebrow>Start with a promise</SectionEyebrow>
              <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
                The next milestone deserves a deadline.
              </h2>
            </div>
            <Button asChild variant="accent" size="lg">
              <Link to="/create">
                Create a commitment <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </PageFrame>
  );
}
