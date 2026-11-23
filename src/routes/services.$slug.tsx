import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { TIERS } from "@/lib/care-rules";
import { SERVICES, serviceBySlug, type Service } from "@/lib/services";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }): Service => {
    const found = serviceBySlug(params.slug);
    if (!found) throw notFound();
    return found;
  },
  head: ({ params }) => {
    const s = serviceBySlug(params.slug);
    if (!s) return { meta: [{ title: "Service — Rama Cares" }] };
    return {
      meta: [
        { title: `${s.name} — Rama Cares` },
        { name: "description", content: s.short },
        { property: "og:title", content: `${s.name} — Rama Cares` },
        { property: "og:description", content: s.tagline },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ServicePage,
});

function ServicePage() {
  const s = Route.useLoaderData();
  const others = SERVICES.filter((x) => x.slug !== s.slug);

  return (
    <div className="bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link to="/" className="font-display text-2xl text-primary">
            Rama Cares
          </Link>
          <a
            href="/#enquire"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Book an assessment
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-14">
        <p className="text-xs uppercase tracking-[0.25em] text-accent">{s.n} · Service</p>
        <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[1.05] md:text-7xl">{s.name}</h1>
        <p className="mt-6 max-w-2xl font-display text-2xl text-primary">{s.tagline}</p>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{s.intro}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="/#enquire"
            className="rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Request a nurse assessment
          </a>
          <Link
            to="/"
            className="rounded-full border border-foreground/20 px-7 py-3.5 font-medium hover:border-primary hover:text-primary"
          >
            Back to home
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">What's included</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {s.included.map((i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {i}
                </li>
              ))}
            </ul>

            <h2 className="mt-16 font-display text-3xl md:text-4xl">Who this is for</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {s.forWhom.map((i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {i}
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-secondary p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Who we send</p>
              <p className="mt-3 font-display text-xl">{s.staff}</p>
              {s.tiers.length > 0 && (
                <ul className="mt-5 space-y-3">
                  {s.tiers.map((t) => (
                    <li key={t} className="border-t border-border pt-3 text-sm">
                      <span className="font-medium text-primary">
                        {t} · {TIERS[t].name}
                      </span>
                      <span className="block text-muted-foreground">{TIERS[t].supervision}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl border border-border p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">How it's priced</p>
              <p className="mt-3 text-sm text-muted-foreground">{s.pricing}</p>
            </div>
            <div className="rounded-2xl border border-border p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Not sure this is the one?</p>
              <p className="mt-3 text-sm text-muted-foreground">
                A nurse decides the level of care after seeing your parent — not from a phone call. Start with an
                assessment and we will tell you honestly what they need.
              </p>
              <a
                href="/#enquire"
                className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Request an assessment
              </a>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="text-xs uppercase tracking-[0.25em] opacity-70">Supervision, not a placement</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl md:text-5xl">A nurse stays responsible for the care.</h2>
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {s.supervision.map((x) => (
              <li key={x} className="border-t border-primary-foreground/20 pt-6 text-sm opacity-90">
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="font-display text-4xl md:text-5xl">How it starts</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-5">
            {s.starts.map((x, i) => (
              <li key={x}>
                <span className="font-display text-5xl text-accent">{i + 1}</span>
                <p className="mt-3 font-medium">{x}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="font-display text-4xl md:text-5xl">Questions families ask</h2>
        <dl className="mt-12 grid gap-x-14 gap-y-10 md:grid-cols-2">
          {s.faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-display text-xl">{f.q}</dt>
              <dd className="mt-2 text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="font-display text-3xl md:text-4xl">Other ways we care</h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                to="/services/$slug"
                params={{ slug: o.slug }}
                className="group bg-card p-8 transition-colors hover:bg-secondary"
              >
                <span className="font-display text-accent">{o.n}</span>
                <h3 className="mt-3 font-display text-xl">{o.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{o.short}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Read the full detail
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground">
          <span>
            <span className="font-display text-lg text-primary">Rama Cares</span> · Hyderabad
          </span>
          <Link to="/console" className="hover:text-primary">
            Staff console
          </Link>
        </div>
      </footer>
    </div>
  );
}
