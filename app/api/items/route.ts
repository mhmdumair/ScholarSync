// app/api/items/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: [{ dueDate: "asc" }, { eventDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}
