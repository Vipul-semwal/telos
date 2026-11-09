import Link from "next/link";
import { ArrowLeft, Compass } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-4 sm:p-6">
      <div className="surface-panel w-full max-w-lg rounded-3xl p-8 text-center sm:p-10">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
          <Compass size={22} />
        </span>
        <p className="mt-6 font-mono text-micro uppercase tracking-[0.16em] text-foreground-muted">
          Route not found
        </p>
        <h1 className="mt-2 text-title font-semibold tracking-tight text-foreground-primary">
          This path is not part of the workspace
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-small leading-relaxed text-foreground-secondary">
          The page may have moved, or the address may be incomplete. Return to the cockpit to
          continue.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded bg-accent px-4 text-small font-medium text-white shadow-control transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary"
        >
          <ArrowLeft size={15} />
          Back to cockpit
        </Link>
      </div>
    </main>
  );
}
