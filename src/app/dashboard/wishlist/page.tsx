"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Heart, Trash2 } from "lucide-react";

interface Event {
  id: string;
  title: string;
  slug: string;
  banner: string | null;
  location: string;
  dateTime: string;
  minPrice: number;
  ticketsLeft: number;
  organizer: { id: string; name: string | null };
}

export default function WishlistPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/wishlist")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return [];
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setEvents(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleRemove = async (eventId: string) => {
    setRemoving(eventId);
    try {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Gater.ng
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Heart className="w-6 h-6 text-rose-600" />
          <h1 className="text-2xl font-bold">My Wishlist</h1>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No saved events</p>
            <p className="text-muted-foreground text-sm mt-2">
              Events you save will appear here
            </p>
            <Button asChild className="mt-4">
              <Link href="/events">Browse Events</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg border overflow-hidden group"
              >
                <Link href={`/events/${event.slug}`}>
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {event.banner ? (
                      <img
                        src={event.banner}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4 space-y-2">
                  <Link href={`/events/${event.slug}`}>
                    <h3 className="font-semibold line-clamp-2 group-hover:text-rose-600 transition-colors">
                      {event.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {formatDate(event.dateTime)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-bold text-rose-600">
                      {event.minPrice === 0 ? "Free" : formatCurrency(event.minPrice)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {event.ticketsLeft} left
                    </span>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleRemove(event.id)}
                    disabled={removing === event.id}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {removing === event.id ? "Removing..." : "Remove"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}