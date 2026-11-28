import { JournalShell } from "@/components/journal-shell";
import { CalendarClient } from "@/components/calendar-client";
import { getCorporateCalendar } from "@/lib/calendar-service";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const calendarData = await getCorporateCalendar({ upcomingOnly: true, limit: 600 });

  return (
    <JournalShell mode="live" activePage="calendar" showMode={false}>
      <CalendarClient initialData={calendarData} />
    </JournalShell>
  );
}
