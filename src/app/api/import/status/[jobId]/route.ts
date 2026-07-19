import { auth } from "@/lib/auth";
import { advanceImportJob } from "@/lib/bgg/importJob";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    const progress = await advanceImportJob(jobId);
    return Response.json(progress);
  } catch (err) {
    return Response.json(
      { status: "error", error: (err as Error).message },
      { status: 500 },
    );
  }
}
