import { signIn } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 text-center">
      <span className="text-5xl">🎲</span>
      <h1 className="mt-4 font-display text-3xl font-semibold text-foreground">
        Board Game Night
      </h1>
      <p className="mt-2 text-muted">
        Your library, and what to play tonight.
      </p>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: callbackUrl ?? "/" });
        }}
        className="mt-8"
      >
        <button
          type="submit"
          className="rounded-full bg-accent px-6 py-3 font-display font-medium text-accent-foreground shadow-sm transition-transform hover:scale-[1.02]"
        >
          Sign in with Google
        </button>
      </form>
    </div>
  );
}
