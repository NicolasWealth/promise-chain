import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Check, CircleX, ExternalLink, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EvidencePanel, SectionEyebrow, Shell, StatusBadge, TransactionRow } from "@/components/commitchain";
import { getCommitment } from "@/services/mockData";

export const Route = createFileRoute("/resolution/$id")({
  head: ({ params }) => ({ meta: [
    { title: `Resolution — ${getCommitment(params.id).title}` },
    { name: "description", content: "See how this commitment resolved and what happened to the escrow." },
    { property: "og:title", content: `Resolution — ${getCommitment(params.id).title}` },
    { property: "og:description", content: "See how this commitment resolved and what happened to the escrow." },
  ] }),
  component: Resolution,
});

function Resolution() {
  const { id } = Route.useParams();
  const commitment = getCommitment(id);
  const failed = commitment.status === 'failed';
  return <Shell><main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14"><Link to="/commitments/$id" params={{ id: commitment.id }} className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-foreground"><ArrowLeft className="size-3.5" /> Back to commitment</Link><div className="mx-auto max-w-3xl py-14 text-center sm:py-20"><div className={failed ? 'mx-auto grid size-16 place-items-center border border-danger/30 bg-danger-soft text-danger' : 'mx-auto grid size-16 place-items-center bg-lime text-ink'}>{failed ? <CircleX className="size-8" /> : <Check className="size-8" />}</div><div className="mt-7 flex items-center justify-center gap-2"><StatusBadge status={commitment.status} /><span className="font-mono text-[11px] text-faint">{commitment.reference}</span></div><h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{failed ? 'Commitment failed' : 'Commitment completed'}</h1><p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">{failed ? 'The required condition was not satisfied before the deadline.' : 'The required GitHub evidence was submitted before the deadline.'}</p></div><div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start"><div className="space-y-6"><EvidencePanel commitment={commitment} verified={!failed && commitment.mergeStatus === 'merged'} /><section className="border border-rule bg-panel p-5 sm:p-6"><SectionEyebrow>Resolution record</SectionEyebrow><div className="mt-5 grid gap-5 sm:grid-cols-2"><div><p className="text-xs text-muted">{failed ? 'Deadline' : 'Completion timestamp'}</p><p className="mt-1 font-semibold">{failed ? commitment.deadline : commitment.resolvedAt}</p></div><div><p className="text-xs text-muted">{failed ? 'Missing evidence' : 'Verification result'}</p><p className="mt-1 inline-flex items-center gap-1.5 font-semibold">{failed ? 'No qualifying submission' : <><ShieldCheck className="size-4 text-lime-soft" /> Evidence verified</>}</p></div></div></section></div><aside className="border border-rule bg-panel p-5 sm:p-6"><SectionEyebrow>Escrow outcome</SectionEyebrow><p className="mt-5 font-mono text-[10px] uppercase tracking-[.14em] text-faint">{failed ? 'Funds returned to creator' : 'Funds released to beneficiary'}</p><p className="mt-2 text-3xl font-bold">{commitment.amount} <span className="text-sm text-muted">{commitment.token}</span></p><div className="mt-6 border-t border-rule pt-2"><TransactionRow label={failed ? 'Escrow settlement' : 'Release transaction'} hash={commitment.releaseHash ?? commitment.transactionHash} status="Confirmed · mock" /></div><a href="#explorer" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-lime-soft">View on explorer <ExternalLink className="size-3.5" /></a><Button asChild variant="outline" className="mt-6 w-full"><Link to="/profile">View public reputation</Link></Button></aside></div></main></Shell>;
}