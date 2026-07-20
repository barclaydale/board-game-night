import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "friend";

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
      <span className="text-4xl">👋</span>
      <h1 className="mt-4 font-display text-3xl font-semibold text-foreground">
        Hey, {firstName}
      </h1>
      <p className="mt-2 text-muted">Let&apos;s figure out what to play.</p>

      <Link
        href="/recommend"
        className="mt-8 rounded-full bg-accent px-8 py-3 font-display text-lg font-medium text-accent-foreground shadow-sm transition-transform hover:scale-[1.02]"
      >
        What should we play tonight? 🎲
      </Link>

      <div className="mt-10 flex gap-4">
        <Link
          href="/library"
          className="rounded-2xl border border-border bg-surface px-6 py-4 text-sm text-foreground transition-colors hover:border-accent"
        >
          📚 Browse the library
        </Link>
        <Link
          href="/plays"
          className="rounded-2xl border border-border bg-surface px-6 py-4 text-sm text-foreground transition-colors hover:border-accent"
        >
          📝 Play history
        </Link>
      </div>
    </div>
  );
}
