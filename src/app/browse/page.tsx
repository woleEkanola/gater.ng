"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Search, Globe, Tag, Heart, X, SlidersHorizontal, Menu, X as XIcon, Music, Briefcase, Palette, Utensils, Code, Activity, Shirt, Theater, ArrowRight } from "lucide-react";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { Footer } from "@/components/footer";

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
  { name: "Music", icon: Music },
  { name: "Business", icon: Briefcase },
  { name: "Arts", icon: Palette },
  { name: "Food & Drink", icon: Utensils },
  { name: "Technology", icon: Code },
  { name: "Sports", icon: Activity },
  { name: "Fashion", icon: Shirt },
  { name: "Entertainment", icon: Theater },
];

const CITIES = [
  { name: "Lagos", image: "https://images.unsplash.com/photo-1530305408686-3009d04dc10a?w=400&h=300&fit=crop" },
  { name: "Abuja", image: "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=400&h=300&fit=crop" },
  { name: "Port Harcourt", image: "https://images.unsplash.com/photo-1579621970563-6ec7560ff3e?w=400&h=300&fit=crop" },
  { name: "Ibadan", image: "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=400&h=300&fit=crop" },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents(data.events || []);
      setLoading(false);
    }

    fetchEvents();
  }, [search, filter, category, priceRange.min, priceRange.max, dateRange.from, dateRange.to]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(`/browse?search=${search}&filter=${filter}&category=${category}`);
    });
  };

  const handleWishlist = async (eventId: string) => {
    setWishlistLoading(eventId);
    try {
      if (wishlistedIds.has(eventId)) {
        await fetch(`/api/wishlist?eventId=${eventId}`, { method: "DELETE" });
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
      } else {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });
        setWishlistedIds((prev) => new Set(prev).add(eventId));
      }
    } finally {
      setWishlistLoading(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilter("upcoming");
    setCategory("");
    setPriceRange({ min: "", max: "" });
    setDateRange({ from: "", to: "" });
  };

  const hasActiveFilters = priceRange.min || priceRange.max || dateRange.from || dateRange.to;

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary">
              Hitix
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/browse" className="text-sm font-medium hover:text-primary">
                Discover Events
              </Link>
              <Link href="/auth-route/login" className="text-sm font-medium hover:text-primary">
                Login
              </Link>
              <Link
                href="/organizer"
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:opacity-90"
              >
                Create Event
              </Link>
            </nav>
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t pt-4 flex flex-col gap-4">
              <Link
                href="/browse"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Discover Events
              </Link>
              <Link
                href="/organizer"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Event
              </Link>
              <Link
                href="/auth-route/login"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </nav>
          )}
        </div>
      </header>

      <section className="relative bg-gradient-to-b from-primary/10 to-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Discover events that
              <span className="text-primary"> inspire you</span>
            </h1>
            <p className="text-lg text-gray-500 mb-8">
              Find concerts, conferences, workshops, and more happening near you
            </p>
            <form className="flex gap-2 max-w-lg mx-auto" onSubmit={handleSearch}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events, locations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button type="submit" className="bg-primary hover:opacity-90 px-6">
                Search
              </Button>
            </form>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 justify-center flex-wrap">
            <Button
              variant={category === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("")}
            >
              All
            </Button>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/browse?category=${cat.name}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  category === cat.name
                    ? "bg-primary text-white"
                    : "bg-white border hover:border-primary hover:text-primary"
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
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
                <span className="ml-1 px-1.5 py-0.5 bg-white text-primary text-xs rounded-full">
                  {[priceRange.min, priceRange.max, dateRange.from, dateRange.to].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Filters</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Price Range</label>
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

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {filter === "upcoming" ? "Upcoming Events" : filter === "past" ? "Past Events" : "All Events"}
            {category && <span className="text-muted-foreground font-normal"> in {category}</span>}
          </h2>
          <span className="text-sm text-muted-foreground">
            {events.length} event{events.length !== 1 ? "s" : ""} found
          </span>
        </div>

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
                      className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          wishlistedIds.has(event.id) ? "fill-primary text-primary" : ""
                        }`}
                      />
                    </button>
                    {event.isOnline && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-primary text-white text-xs rounded-full flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Online
                      </span>
                    )}
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
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

        {events.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Popular Cities</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CITIES.map((city) => (
                <Link
                  key={city.name}
                  href={`/browse?search=${city.name}`}
                  className="group relative aspect-[4/3] rounded-lg overflow-hidden"
                >
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">{city.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    }>
      <EventsContent />
    </Suspense>
  );
}