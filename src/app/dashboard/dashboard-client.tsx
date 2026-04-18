"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Ticket, Calendar, DollarSign, Users, Play, Pause } from "lucide-react";

interface Event {
  id: string;
  title: string;
  isPublished: boolean;
  _count: { orders: number };
}

interface DashboardClientProps {
  events: Event[];
  totalRevenue: number;
  totalTicketsSold: number;
  userId: string;
}

export function DashboardClient({ events, totalRevenue, totalTicketsSold, userId }: DashboardClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [eventsList, setEventsList] = useState(events);
  const [loading, setLoading] = useState<string | null>(null);

  const toggleEvent = async (eventId: string, currentStatus: boolean) => {
    setLoading(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      setEventsList(eventsList.map(e => 
        e.id === eventId ? { ...e, isPublished: !currentStatus } : e
      ));
      toast({ 
        title: "Success", 
        description: !currentStatus ? "Event is now live" : "Event has been paused" 
      });
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ₦{(totalRevenue / 100).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Ticket className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tickets Sold</p>
                <p className="text-2xl font-bold">{totalTicketsSold}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{eventsList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Events</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You haven&apos;t created any events yet.</p>
              <Button asChild>
                <Link href="/dashboard/events/new">Create your first event</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {eventsList.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.isPublished ? (
                        <span className="text-green-600">Live</span>
                      ) : (
                        <span>Draft</span>
                      )} • {event._count.orders} orders
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {event.isPublished ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleEvent(event.id, true)}
                        disabled={loading === event.id}
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleEvent(event.id, false)}
                        disabled={loading === event.id}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/events/${event.id}`}>Manage</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/checkin/${event.id}`}>Check-in</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}