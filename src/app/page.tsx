import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">
        Hello, {session?.user?.name ?? "friend"}
      </h1>
      <p className="text-sm text-gray-500">{session?.user?.email}</p>

      <Link href="/recommend" className="text-sm underline">
        What should we play tonight?
      </Link>

      <Link href="/library" className="text-sm underline">
        Browse the library
      </Link>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-4 py-2"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
