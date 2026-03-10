"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ItemType = "assignment" | "tutorial" | "quiz" | "exam" | "event";
export type Priority = "low" | "medium" | "high";
export type ItemStatus = "pending" | "done";

export interface ItemFormData {
  type: ItemType;
  title: string;
  course: string;
  description: string;
  dueDate: string;     // ISO string or ""
  eventDate: string;   // ISO string or ""
  location: string;
  priority: Priority;
  color: string;
}

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    throw new Error("Not authenticated");
  }
  return (session.user as any).id as string;
}

export async function getItems(type?: ItemType) {
  const userId = await requireUser();

  return prisma.item.findMany({
    where: { userId, ...(type ? { type } : {}) },
    orderBy: [{ dueDate: "asc" }, { eventDate: "asc" }, { createdAt: "desc" }],
  });
}

export async function addItem(data: ItemFormData) {
  const userId = await requireUser();

  const item = await prisma.item.create({
    data: {
      userId,
      type: data.type,
      title: data.title.trim(),
      course: data.course?.trim() || null,
      description: data.description?.trim() || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      eventDate: data.eventDate ? new Date(data.eventDate) : null,
      location: data.location?.trim() || null,
      priority: data.priority || "medium",
      status: "pending",
      color: data.color || "#5046e5",
    },
  });

  revalidatePath("/dashboard");
  return item;
}

export async function updateItem(id: string, data: Partial<ItemFormData>) {
  const userId = await requireUser();

  const existing = await prisma.item.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Item not found");

  const updated = await prisma.item.update({
    where: { id },
    data: {
      type: data.type ?? existing.type,
      title: data.title?.trim() ?? existing.title,
      course: data.course !== undefined ? (data.course?.trim() || null) : existing.course,
      description: data.description !== undefined ? (data.description?.trim() || null) : existing.description,
      dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : existing.dueDate,
      eventDate: data.eventDate !== undefined ? (data.eventDate ? new Date(data.eventDate) : null) : existing.eventDate,
      location: data.location !== undefined ? (data.location?.trim() || null) : existing.location,
      priority: data.priority ?? existing.priority,
      color: data.color ?? existing.color,
    },
  });

  revalidatePath("/dashboard");
  return updated;
}

export async function toggleItemStatus(id: string) {
  const userId = await requireUser();

  const existing = await prisma.item.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Item not found");

  const updated = await prisma.item.update({
    where: { id },
    data: { status: existing.status === "pending" ? "done" : "pending" },
  });

  revalidatePath("/dashboard");
  return updated;
}

export async function deleteItem(id: string) {
  const userId = await requireUser();

  const existing = await prisma.item.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Item not found");

  await prisma.item.delete({ where: { id } });

  revalidatePath("/dashboard");
  return { success: true };
}
