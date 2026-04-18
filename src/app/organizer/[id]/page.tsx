"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  MapPin, 
  Globe, 
  Twitter, 
  Instagram, 
  Facebook, 
  Share2, 
  Users,
  ArrowLeft
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  slug: string;
  banner: string | null;
  location: string;
  dateTime: string;
  minPrice: number;
  totalTickets: number;
  soldTickets: number;
  ticketsLeft: number;
}

interface Organizer {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  instagram: string | null;
  facebook: string | null;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  upcomingEvents: Event[];
  pastEvents: Event[];
}

export default function OrganizerProfilePage({ params }: { params: { id: string } }) {
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/organizers/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrganizer(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/organizers/${params.id}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      setOrganizer((prev) => 
        prev 
          ? { 
              ...prev, 
              isFollowing: data.isFollowing,
              followerCount: data.isFollowing 
                ? prev.followerCount + 1 
                : prev.followerCount - 1
            }
          : null
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${organizer?.name}'s Profile`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Organizer not found</p>
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const events = activeTab === "upcoming" ? organizer.upcomingEvents : organizer.pastEvents;

  return (
    <div className="min-h-screen bg-rose-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-rose-600">
            Gater.ng
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/events" className="text-sm font-medium hover:text-rose-600">
              Browse Events
            </Link>
            <Link href="/login" className="text-sm font-medium hover:text-rose-600">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-rose-600">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </Button>
        </div>

        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {organizer.image ? (
                <img 
                  src={organizer.image} 
                  alt={organizer.name || "Organizer"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-rose-600">
                  {organizer.name?.[0]?.toUpperCase() || "O"}
                </span>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-2xl font-bold">{organizer.name || "Organizer"}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{organizer.followerCount} followers</span>
                </div>
              </div>

              {organizer.bio && (
                <p className="text-muted-foreground">{organizer.bio}</p>
              )}

              <div className="flex flex-wrap gap-3">
                {(organizer.website || organizer.twitter || organizer.instagram || organizer.facebook) && (
                  <div className="flex gap-2">
                    {organizer.website && (
                      <a 
                        href={organizer.website.startsWith("http") ? organizer.website : `https://${organizer.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {organizer.twitter && (
                      <a 
                        href={`https://twitter.com/${organizer.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {organizer.instagram && (
                      <a 
                        href={`https://instagram.com/${organizer.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {organizer.facebook && (
                      <a 
                        href={organizer.facebook.startsWith("http") ? organizer.facebook : `https://facebook.com/${organizer.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Facebook className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleFollow} 
                disabled={followLoading}
                className={organizer.isFollowing ? "bg-gray-100 text-gray-800 hover:bg-gray-200" : "bg-rose-600 hover:bg-rose-700"}
              >
                {organizer.isFollowing ? "Following" : "Follow"}
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 border-b mb-6">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === "upcoming" 
                ? "text-rose-600 border-b-2 border-rose-600" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Upcoming Events ({organizer.upcomingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === "past" 
                ? "text-rose-600 border-b-2 border-rose-600" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Past Events ({organizer.pastEvents.length})
          </button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No {activeTab} events</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link 
                key={event.id} 
                href={`/events/${event.slug}`}
                className="group bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
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
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold line-clamp-2 group-hover:text-rose-600 transition-colors">
                    {event.title}
                  </h3>
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
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}