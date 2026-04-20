import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { HomeRecommendations } from "@/components/home-recommendations";
import { ResponsiveHeader } from "@/components/responsive-header";
import { Footer } from "@/components/footer";
import { Calendar, MapPin, Search, Heart, ArrowRight, Music, Briefcase, Palette, Utensils, Code, Activity, Shirt, Theater } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hitix - Discover & Book Events in Nigeria",
  description: "Discover the best events in Nigeria. Buy tickets for concerts, conferences, workshops and more on Hitix.",
  openGraph: {
    title: "Hitix - Discover & Book Events",
    description: "Discover the best events in Nigeria. Buy tickets for concerts, conferences, workshops and more.",
    url: "https://gater.ng",
    siteName: "Hitix",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hitix - Discover & Book Events",
    description: "Discover the best events in Nigeria.",
  },
};

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
  { name: "Port Harcourt", image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop" },
  { name: "Ibadan", image: "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=400&h=300&fit=crop" },
];

async function getFeaturedEvents() {
  const events = await prisma.event.findMany({
    where: { isPublished: true, dateTime: { gte: new Date() } },
    include: {
      organizer: { select: { name: true } },
      ticketTypes: true,
    },
    orderBy: { dateTime: "asc" },
    take: 6,
  });

  return events.map((event) => ({
    ...event,
    minPrice: Math.min(...event.ticketTypes.map((t) => t.price)),
  }));
}

async function getTrendingEvents() {
  const events = await prisma.event.findMany({
    where: { isPublished: true, dateTime: { gte: new Date() } },
    include: {
      organizer: { select: { name: true } },
      ticketTypes: true,
      _count: { select: { orders: true } },
    },
    orderBy: { dateTime: "asc" },
    take: 8,
  });

  return events.map((event) => ({
    ...event,
    minPrice: Math.min(...event.ticketTypes.map((t) => t.price)),
  }));
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const featuredEvents = await getFeaturedEvents();
  const trendingEvents = await getTrendingEvents();

  return (
    <main className="min-h-screen flex flex-col">
      <ResponsiveHeader isLoggedIn={!!session} />

      <section className="relative bg-gradient-to-b from-rose-50 to-white py-12 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover events that
              <span className="text-rose-600"> inspire you</span>
            </h1>
            <p className="text-lg text-gray-500 mb-8">
              Find concerts, conferences, workshops, and more happening near you
            </p>
            <form className="flex gap-2 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events, locations..."
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                />
              </div>
              <Button className="bg-rose-600 hover:bg-rose-700 px-6">
                Search
              </Button>
            </form>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 justify-center flex-wrap">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/events?category=${cat.name}`}
                className="flex items-center gap-2 px-4 py-2 bg-white border rounded-full hover:border-rose-600 hover:text-rose-600 transition-colors whitespace-nowrap"
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HomeRecommendations />

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Popular Cities</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CITIES.map((city) => (
              <Link
                key={city.name}
                href={`/events?search=${city.name}`}
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
        </div>
      </section>

      {featuredEvents.length > 0 && (
        <section className="py-12 bg-rose-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Upcoming Events</h2>
              <Link href="/events" className="text-rose-600 hover:text-rose-700 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.slice(0, 6).map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
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
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {formatShortDate(event.dateTime)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-rose-600">
                        {event.minPrice === 0 ? "Free" : formatCurrency(event.minPrice)}
                      </span>
                      <span className="text-xs text-gray-400">
                        by {event.organizer.name || "Organizer"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {trendingEvents.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Trending This Week</h2>
              <Link href="/events?filter=upcoming" className="text-rose-600 hover:text-rose-700 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
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
                  <div className="p-3 space-y-1">
                    <h3 className="font-medium line-clamp-1 text-sm group-hover:text-rose-600">
                      {event.title}
                    </h3>
                    <p className="text-xs text-gray-500">{formatShortDate(event.dateTime)}</p>
                    <p className="font-semibold text-rose-600 text-sm">
                      {event.minPrice === 0 ? "Free" : formatCurrency(event.minPrice)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-rose-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to create your event?</h2>
          <p className="text-rose-100 mb-8 max-w-xl mx-auto">
            Join thousands of organizers who trust Hitix to sell tickets to their events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={session ? "/dashboard/events/new" : "/register"}
              className="px-8 py-3 bg-white text-rose-600 rounded-md font-medium hover:bg-rose-50 inline-block"
            >
              Create Event
            </Link>
            <Link
              href="/events"
              className="px-8 py-3 border border-white text-white rounded-md font-medium hover:bg-rose-700 inline-block"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}