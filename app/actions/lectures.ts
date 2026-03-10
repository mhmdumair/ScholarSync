"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface LectureFormData {
  title: string;
  subject: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string;
  instructor?: string;
  color?: string;
  deadline?: string;
  notes?: string;
}

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    throw new Error("Not authenticated");
  }
  return (session.user as any).id as string;
}

export async function getLectures() {
  const userId = await requireUser();

  return prisma.lecture.findMany({
    where: { userId, isActive: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function addLecture(data: LectureFormData) {
  const userId = await requireUser();

  if (data.startTime >= data.endTime) {
    throw new Error("Start time must be before end time");
  }

  const lecture = await prisma.lecture.create({
    data: {
      userId,
      title: data.title.trim(),
      subject: data.subject.trim(),
      dayOfWeek: Number(data.dayOfWeek),
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location?.trim() || null,
      instructor: data.instructor?.trim() || null,
      color: data.color || "#6366f1",
      deadline: data.deadline ? new Date(data.deadline) : null,
      notes: data.notes?.trim() || null,
    },
  });

  revalidatePath("/dashboard");
  return lecture;
}

export async function updateLecture(id: string, data: Partial<LectureFormData>) {
  const userId = await requireUser();

  const existing = await prisma.lecture.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Lecture not found");

  const startTime = data.startTime ?? existing.startTime;
  const endTime = data.endTime ?? existing.endTime;
  if (startTime >= endTime) {
    throw new Error("Start time must be before end time");
  }

  const updated = await prisma.lecture.update({
    where: { id },
    data: {
      title: data.title?.trim() ?? existing.title,
      subject: data.subject?.trim() ?? existing.subject,
      dayOfWeek: data.dayOfWeek !== undefined ? Number(data.dayOfWeek) : existing.dayOfWeek,
      startTime,
      endTime,
      location: data.location !== undefined ? (data.location?.trim() || null) : existing.location,
      instructor: data.instructor !== undefined ? (data.instructor?.trim() || null) : existing.instructor,
      color: data.color ?? existing.color,
      deadline: data.deadline !== undefined
        ? (data.deadline ? new Date(data.deadline) : null)
        : existing.deadline,
      notes: data.notes !== undefined ? (data.notes?.trim() || null) : existing.notes,
    },
  });

  revalidatePath("/dashboard");
  return updated;
}

export async function deleteLecture(id: string) {
  const userId = await requireUser();

  const existing = await prisma.lecture.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Lecture not found");

  await prisma.lecture.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/dashboard");
  return { success: true };
}
