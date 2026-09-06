import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DetailHeader, EvidencePanel, SectionEyebrow, Shell, Timeline, TransactionRow } from "@/components/commitchain";
import { getCommitment } from "@/services/mockData";

export const Route = createFileRoute("/commitments/$id")({
  head: ({ params }) => ({ meta: [
    { title: `${getCommitment(params.id).title} — CommitChain` },
    { name: "description", content: "Inspect the evidence, timeline, and escrow state for this commitment." },
    { property: "og:title", content: `${getCommitment(params.id).title} — CommitChain` },
    { property: "og:description", content: "Inspect the evidence, timeline, and escrow state for this commitment." },
  ] }),
  component: CommitmentDetails,
});

function CommitmentDetails() {
  const { id } = Route.useParams();
  const commitment = getCommitment(id);
  return <Shell><DetailHeader commitment={commitment} /><main className="mx-auto grid max-w-6xl gap-12 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1fr_340px] lg:gap-16"><div className="space-y-10"><Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> All commitments</Link><EvidencePanel commitment={commitment} /><Timeline commitment={commitment} /></div><aside className="space-y-8"><section><SectionEyebrow>People</SectionEyebrow><div className="mt-4 divide-y divide-rule border-y border-rule"><div className="py-4"><p className="text-xs text-muted-foreground">Creator</p><p className="mt-1 font-mono text-sm font-semibold">{commitment.creator}</p><p className="mt-1 text-xs text-muted-foreground">Project Alpha</p></div><div className="py-4"><p className="text-xs text-muted-foreground">Beneficiary</p><p className="mt-1 font-mono text-sm font-semibold">{commitment.beneficiary}</p><p className="mt-1 text-xs text-muted-foreground">{commitment.beneficiaryLabel}</p></div></div></section><section><div className="flex items-center justify-between"><SectionEyebrow>Transactions</SectionEyebrow><span className="font-mono text-[10px] text-faint">Base · mock</span></div><div className="mt-3 border-y border-rule"><TransactionRow label="Funds locked" hash={commitment.transactionHash} />{commitment.releaseHash && <TransactionRow label="Funds released" hash={commitment.releaseHash} />}</div></section><section className="border border-rule bg-panel p-5"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-faint">Next action</p><h2 className="mt-3 text-lg font-bold">{commitment.status === 'active' ? 'Ready to resolve?' : 'See the outcome'}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{commitment.status === 'active' ? 'Review the verified evidence and preview how this commitment resolves.' : 'Review the final evidence and escrow outcome.'}</p><Button asChild variant={commitment.status === 'failed' ? 'danger' : 'accent'} className="mt-5 w-full"><Link to="/resolution/$id" params={{ id: commitment.id }}>{commitment.status === 'active' ? 'Open resolution preview' : 'View resolution'} <ArrowUpRight className="size-4" /></Link></Button></section></aside></main></Shell>;
}