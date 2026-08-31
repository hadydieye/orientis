import { NextResponse } from "next/server";
import { listUsers, requireAdminSession } from "@/lib/api/users";

// GET /admin/users — comptes et rôles (admin uniquement).
export async function GET() {
  const guard = await requireAdminSession();
  if (guard.error) return guard.error;

  try {
    return NextResponse.json(await listUsers());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lecture des comptes impossible." },
      { status: 500 }
    );
  }
}
