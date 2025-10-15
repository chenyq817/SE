import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ScheduleMatcher } from "./schedule-matcher";

type ScheduleEntry = {
  day: string;
  startTime: string;
  endTime: string;
  activity: string;
};

export type UserSchedule = {
  userId: string;
  avatarId: string;
  schedule: ScheduleEntry[];
};

const schedules: UserSchedule[] = [
  {
    userId: "Alice Johnson",
    avatarId: "avatar-1",
    schedule: [
      { day: "Monday", startTime: "9:00 AM", endTime: "11:00 AM", activity: "Calculus II" },
      { day: "Monday", startTime: "2:00 PM", endTime: "4:00 PM", activity: "Study Group" },
      { day: "Wednesday", startTime: "10:00 AM", endTime: "12:00 PM", activity: "Physics Lab" },
    ],
  },
  {
    userId: "Bob Smith",
    avatarId: "avatar-2",
    schedule: [
      { day: "Monday", startTime: "10:00 AM", endTime: "12:00 PM", activity: "History of Art" },
      { day: "Tuesday", startTime: "1:00 PM", endTime: "3:00 PM", activity: "Library Shift" },
      { day: "Wednesday", startTime: "11:00 AM", endTime: "1:00 PM", activity: "Gym Session" },
    ],
  },
   {
    userId: "Charlie Brown",
    avatarId: "avatar-3",
    schedule: [
      { day: "Monday", startTime: "9:00 AM", endTime: "10:30 AM", activity: "Computer Science 101" },
      { day: "Wednesday", startTime: "10:00 AM", endTime: "11:30 AM", activity: "Physics Lab" },
      { day: "Friday", startTime: "3:00 PM", endTime: "5:00 PM", activity: "Band Practice" },
    ],
  }
];

export default function SchedulesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Schedule-Based Social" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        
        <ScheduleMatcher schedules={schedules} />

        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-headline">Friends' Schedules</h2>
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {schedules.map((user) => {
              const userAvatar = PlaceHolderImages.find(img => img.id === user.avatarId);
              return (
              <Card key={user.userId}>
                <CardHeader className="flex flex-row items-center gap-3">
                  {userAvatar && <Avatar>
                    <AvatarImage src={userAvatar.imageUrl} alt={user.userId} data-ai-hint={userAvatar.imageHint} />
                    <AvatarFallback>{user.userId.charAt(0)}</AvatarFallback>
                  </Avatar>}
                  <CardTitle>{user.userId}'s Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Activity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.schedule.map((event, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{event.day}</TableCell>
                          <TableCell>{event.startTime} - {event.endTime}</TableCell>
                          <TableCell>{event.activity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )})}
          </div>
        </div>
      </main>
    </div>
  );
}
