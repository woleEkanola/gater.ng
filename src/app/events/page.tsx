"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Search, Globe, Tag, Heart, X, SlidersHorizontal } from "lucide-react";
import { formatCurrency, formatShortDate } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  description: string | null;
  banner: string | null;
  location: string;
  dateTime: string;
  organizer: { name: string | null };
  ticketTypes: { price: number }[];
  slug: string;
  isOnline: boolean;
  category: string | null;
}

const CATEGORIES = [
  "Music",
  "Business",
  "Technology",
  "Sports",
  "Food & Drink",
  "Arts",
  "Education",
  "Health & Wellness",
  "Fashion",
  "Entertainment",
  "Networking",
  "Other",
];

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [wishlistLoading, setWishlistLoading] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filter, setFilter] = useState(searchParams.get("filter") || "upcoming");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter) params.set("filter", filter);
      if (category) params.set("category", category);
      if (priceRange.min) params.set("minPrice", priceRange.min);
      if (priceRange.max) params.set("maxPrice", priceRange.max);
      if (dateRange.from) params.set("dateFrom", dateRange.from);
      if (dateRange.to) params.set("dateTo", dateRange.to);

      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();
      setEvents(data);
      setLoading(false);
    }

    fetchEvents();
  }, [search, filter, category, priceRange.min, priceRange.max, dateRange.from, dateRange.to]);

  useEffect(() => {
    async function fetchWishlist() {
      try {
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          setWishlistedIds(new Set(data.map((e: any) => e.id)));
        }
      } catch {}
    }
    fetchWishlist();
  }, []);

  const handleWishlist = async (eventId: string) => {
    setWishlistLoading(eventId);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      setWishlistedIds((prev) => {
        const next = new Set(prev);
        if (data.isWishlisted) {
          next.add(eventId);
        } else {
          next.delete(eventId);
        }
        return next;
      });
    } finally {
      setWishlistLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter) params.set("filter", filter);
      if (category) params.set("category", category);
      router.push(`/events?${params}`);
    });
  };

  const clearFilters = () => {
    setPriceRange({ min: "", max: "" });
    setDateRange({ from: "", to: "" });
  };

  const hasActiveFilters = priceRange.min || priceRange.max || dateRange.from || dateRange.to;

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Hitix
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/auth-route/login" className="text-sm font-medium hover:text-primary">
              Login
            </Link>
            <Link
              href="/auth-route/register"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search events by title or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isPending}>
              Search
            </Button>
          </form>

          <div className="flex gap-2">
            <Button
              variant={filter === "upcoming" ? "default" : "outline"}
              onClick={() => setFilter("upcoming")}
            >
              Upcoming
            </Button>
            <Button
              variant={filter === "past" ? "default" : "outline"}
              onClick={() => setFilter("past")}
            >
              Past
            </Button>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-rose-600 text-white text-xs rounded-full">
                  {[priceRange.min, priceRange.max, dateRange.from, dateRange.to].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Price Range (₦)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Date Range</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="w-full"
                  />
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Button
            variant={category === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory("")}
          >
            All Categories
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <h1 className="text-3xl font-bold mb-8">
          {filter === "upcoming" ? "Upcoming Events" : filter === "past" ? "Past Events" : "All Events"}
          {category && <span className="text-muted-foreground"> in {category}</span>}
        </h1>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No events found.</p>
            <p className="text-muted-foreground">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden group">
                {event.banner && (
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={event.banner}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleWishlist(event.id);
                      }}
                      disabled={wishlistLoading === event.id}
                      className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-sm"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          wishlistedIds.has(event.id)
                            ? "fill-rose-600 text-rose-600"
                            : "text-gray-600"
                        }`}
                      />
                    </button>
                    {event.isOnline && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Online
                      </span>
                    )}
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start gap-2">
                    {event.category && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {event.category}
                      </span>
                    )}
                  </div>
                  <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">by {event.organizer.name || "Unknown"}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatShortDate(event.dateTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {event.isOnline ? (
                      <Globe className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="line-clamp-1">
                      {event.isOnline ? "Online Event" : event.location}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {event.ticketTypes[0]?.price === 0 
                      ? "Free" 
                      : event.ticketTypes[0] 
                        ? `From ₦${(event.ticketTypes[0].price / 100).toLocaleString()}` 
                        : "Free"}
                  </span>
                  <Button asChild size="sm">
                    <Link href={`/events/${event.slug}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading events...</p>
      </div>
    }>
      <EventsContent />
    </Suspense>
  );
}