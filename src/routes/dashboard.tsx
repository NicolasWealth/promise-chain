import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CommitmentCard, EmptyState, SectionEyebrow, Shell, StatCard } from "@/components/commitchain";
import { commitments } from "@/services/mockData";
import type { CommitmentStatus } from "@/services/mockData";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — CommitChain" },
    { name: "description", content: "Review active, completed, and failed commitments." },
    { property: "og:title", content: "Dashboard — CommitChain" },
    { property: "og:description", content: "Review active, completed, and failed commitments." },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const [filter, setFilter] = useState<'all' | CommitmentStatus>('all');
  const filtered = filter === 'all' ? commitments : commitments.filter((item) => item.status === filter);
  return <Shell>
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><SectionEyebrow>Workspace / overview</SectionEyebrow><h1 className="mt-3 text-4xl font-bold tracking-tight">Your commitments</h1><p className="mt-2 text-sm text-muted-foreground">A single view of every promise, deadline, and outcome.</p></div><Button asChild variant="accent"><Link to="/create"><Plus className="size-4" /> Create commitment</Link></Button></div>
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5"><StatCard label="Total commitments" value="04" detail="all time" /><StatCard label="Active" value="02" detail="in progress" tone="accent" /><StatCard label="Completed" value="01" detail="delivered" /><StatCard label="Failed" value="01" detail="deadline missed" tone="danger" /><StatCard label="Funds committed" value="$19.5k" detail="USDC + ETH" /></div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-3"><div className="flex flex-wrap gap-1">{(['all', 'active', 'completed', 'failed'] as const).map((item) => <Button key={item} variant={filter === item ? 'primary' : 'ghost'} size="sm" onClick={() => setFilter(item)}>{item.charAt(0).toUpperCase() + item.slice(1)}</Button>)}</div><span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-faint"><SlidersHorizontal className="size-3.5" /> {filtered.length} records</span></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">{filtered.length ? filtered.map((commitment) => <CommitmentCard key={commitment.id} commitment={commitment} />) : <div className="lg:col-span-2"><EmptyState title="No commitments here" description="Try a different filter to see more of the paper trail." /></div>}</div>
    </main>
  </Shell>;
}