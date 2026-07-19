import { signIn } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Board Game Night</h1>
      <p className="text-sm text-gray-500">Sign in to continue</p>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: callbackUrl ?? "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Sign in with Google
        </button>
      </form>
    </div>
  );
}
