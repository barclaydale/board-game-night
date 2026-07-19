import { auth } from "@/lib/auth";
import { startImportJob } from "@/lib/bgg/importJob";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const bggUsername = body?.bggUsername?.trim();
  if (!bggUsername) {
    return Response.json({ error: "bggUsername is required" }, { status: 400 });
  }

  const { jobId } = await startImportJob(bggUsername);
  return Response.json({ jobId });
}
