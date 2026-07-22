import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/library", label: "Library" },
  { href: "/recommend", label: "Recommend" },
  { href: "/plays", label: "Play history" },
  { href: "/library/add", label: "Add games" },
];

export async function AppHeader() {
  const session = await auth();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-foreground"
        >
          🎲 Board Game Night
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {session?.user && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
