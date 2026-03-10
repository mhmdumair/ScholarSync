// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLectures } from "@/app/actions/lectures";
import { getItems } from "@/app/actions/items";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const [lectures, items] = await Promise.all([getLectures(), getItems()]);

  const serializedLectures = lectures.map(l => ({
    id: l.id,
    title: l.title,
    subject: l.subject,
    dayOfWeek: l.dayOfWeek,
    startTime: l.startTime,
    endTime: l.endTime,
    location: l.location,
    instructor: l.instructor,
    color: l.color,
    deadline: l.deadline?.toISOString() ?? null,
    notes: l.notes,
  }));

  const serializedItems = items.map(i => ({
    id: i.id,
    type: i.type,
    title: i.title,
    course: i.course,
    description: i.description,
    dueDate: i.dueDate?.toISOString() ?? null,
    eventDate: i.eventDate?.toISOString() ?? null,
    location: i.location,
    priority: i.priority,
    status: i.status,
    color: i.color,
  }));

  return (
    <DashboardClient
      user={{
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }}
      initialLectures={serializedLectures}
      initialItems={serializedItems}
    />
  );
}
