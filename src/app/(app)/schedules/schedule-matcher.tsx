'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { BookOpenCheck, Loader2, Users } from "lucide-react";
import { summarizeSharedSchedules, SummarizeSharedSchedulesInput, SummarizeSharedSchedulesOutput } from '@/ai/flows/summarize-shared-schedules';
import type { UserSchedule } from './page';

export function ScheduleMatcher({ schedules }: { schedules: UserSchedule[] }) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummarizeSharedSchedulesOutput | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckboxChange = (userId: string, checked: boolean | 'indeterminate') => {
    setSelectedUsers(prev =>
      checked ? [...prev, userId] : prev.filter(id => id !== userId)
    );
  };

  const handleFindSharedTimes = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    if (selectedUsers.length < 2) {
      setError("Please select at least two friends to compare schedules.");
      setLoading(false);
      setIsDialogOpen(true);
      return;
    }

    try {
      const userSchedules = schedules
        .filter(s => selectedUsers.includes(s.userId))
        .map(({ userId, schedule }) => ({ userId, schedule }));

      const input: SummarizeSharedSchedulesInput = { userSchedules };
      const summary = await summarizeSharedSchedules(input);
      setResult(summary);
    } catch (e) {
      console.error(e);
      setError("An AI error occurred. Could not find shared times.");
    } finally {
      setLoading(false);
      setIsDialogOpen(true);
    }
  };

  const renderResult = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-2 min-h-[10rem]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Our AI is analyzing schedules...</p>
        </div>
      );
    }
    if (error) {
      return <p className="text-destructive">{error}</p>;
    }
    if (result) {
      if (result.sharedTimes.length === 0) {
        return <p>No common free times found for the selected friends.</p>;
      }
      return (
        <div className="space-y-4 max-h-96 overflow-y-auto p-1">
          {result.sharedTimes.map((time, index) => (
            <div key={index} className="p-4 border rounded-lg bg-secondary/50">
              <p className="font-semibold">{time.day}, {time.startTime} - {time.endTime}</p>
              <p className="text-sm text-muted-foreground">Shared by: {time.users.join(', ')}</p>
              <p className="text-sm mt-2"><strong>Summary:</strong> {time.activitySummary}</p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-primary" />
            Find Shared Free Time
          </CardTitle>
          <CardDescription>
            Select friends to compare schedules and find the perfect time to meet up. Our AI will help you find intersection points.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
              <h3 className="font-semibold">Select Friends:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {schedules.map(user => (
                  <div key={user.userId} className="flex items-center space-x-2">
                    <Checkbox
                      id={user.userId}
                      onCheckedChange={(checked) => handleCheckboxChange(user.userId, checked)}
                      checked={selectedUsers.includes(user.userId)}
                    />
                    <label
                      htmlFor={user.userId}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {user.userId}
                    </label>
                  </div>
                ))}
              </div>
          </div>
        </CardContent>
        <CardFooter>
            <Button className="bg-accent hover:bg-accent/90" onClick={handleFindSharedTimes} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
            Find Shared Times with AI
            </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {error ? "Error" : "Shared Time Analysis"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>{renderResult()}</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsDialogOpen(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
