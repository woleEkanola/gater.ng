import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Ticket, BarChart, Smartphone, CreditCard, Users, ArrowRight, Check, MapPin, Star } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatCurrency, formatShortDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getFeaturedEvents() {
  const events = await prisma.event.findMany({
    where: { isFeatured: true, isPublished: true, dateTime: { gte: new Date() } },
    include: { ticketTypes: { where: { deletedAt: null } } },
    orderBy: { dateTime: "asc" },
    take: 6,
  });

  return events.map((event) => ({
    ...event,
    minPrice: Math.min(...event.ticketTypes.map((t) => t.price)),
  }));
}

export default async function OrganizerPage() {
  const featuredEvents = await getFeaturedEvents();
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Hitix
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/events" className="text-sm font-medium hover:text-primary">
              Discover Events
            </Link>
            <Link href="/auth-route/login" className="text-sm font-medium hover:text-primary">
              Login
            </Link>
            <Link
              href="/auth-route/register"
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:opacity-90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Create unforgettable
            <span className="text-primary"> events</span>
          </h1>
          <p className="text-xl text-gray-500 mb-8">
            The easiest way to plan, promote, and sell tickets for your events. 
            Join thousands of organizers across Nigeria.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth-route/register"
              className="px-8 py-3 bg-primary text-white rounded-md font-medium hover:opacity-90 inline-flex items-center justify-center gap-2"
            >
              Start Selling Tickets Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 inline-flex items-center justify-center"
            >
              See How It Works
            </Link>
          </div>
        </div>

        {featuredEvents.length > 0 && (
          <section className="pb-16">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                <h2 className="text-2xl font-bold">Featured Events</h2>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {featuredEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-sm"
                >
                  <div className="aspect-[5/2] bg-gray-100 overflow-hidden">
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
                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {formatShortDate(event.dateTime)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{event.location || "Online"}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="font-semibold">
                        {event.minPrice === 0 ? "Free" : formatCurrency(event.minPrice)}
                      </span>
                      <span className="text-xs text-primary font-medium">
                        View Event →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/browse" className="text-primary hover:opacity-80 inline-flex items-center gap-1 text-sm">
                View all events <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        <div id="features" className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to sell tickets
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Ticket className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Ticket Creation</h3>
              <p className="text-gray-500">
                Create multiple ticket types in seconds. Set prices, quantities, and early bird discounts.
              </p>
            </div>

            <div className="p-6 border rounded-lg">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mobile Ticketing</h3>
              <p className="text-gray-500">
                QR code tickets that work on any phone. No app needed - just scan and check in instantly.
              </p>
            </div>

            <div className="p-6 border rounded-lg">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Payments</h3>
              <p className="text-gray-500">
                Get paid directly to your bank account. Money transfers automatically after each sale.
              </p>
            </div>

            <div className="p-6 border rounded-lg">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <BarChart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-gray-500">
                Track sales, monitor attendance, and see how your events are performing in real-time.
              </p>
            </div>

            <div className="p-6 border rounded-lg">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Attendee Management</h3>
              <p className="text-gray-500">
                Build your audience with attendee lists. Export data and send follow-up communications.
              </p>
            </div>

            <div className="p-6 border rounded-lg">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Event Pages</h3>
              <p className="text-gray-500">
                Beautiful, mobile-optimized event pages that look great on any device.
              </p>
            </div>
          </div>
        </div>

        <div className="py-16 bg-gray-50 rounded-2xl px-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            Simple, transparent pricing
          </h2>
          
          <div className="max-w-md mx-auto">
            <div className="p-8 bg-white border rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-2">For Organizers</h3>
              <p className="text-4xl font-bold mb-4">5% <span className="text-lg font-normal text-gray-500">per ticket</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Unlimited events
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Unlimited ticket types
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Real-time analytics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  QR check-in
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Instant payouts
                </li>
              </ul>
              <Link
                href="/auth-route/register"
                className="block w-full py-3 bg-primary text-white text-center rounded-md font-medium hover:opacity-90"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>

        <div className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to grow your audience?
          </h2>
          <p className="text-xl text-gray-500 mb-8">
            Join thousands of organizers already using Hitix
          </p>
          <Link
            href="/auth-route/register"
            className="px-8 py-3 bg-primary text-white rounded-md font-medium hover:opacity-90 inline-block"
          >
            Get Started Free
          </Link>
        </div>
      </main>

      <footer className="border-t py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-2xl font-bold text-primary">Hitix</div>
            <nav className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/events" className="hover:text-primary">Discover Events</Link>
              <Link href="/organizer/demo" className="hover:text-primary">Demo</Link>
              <span>&copy; {new Date().getFullYear()} Hitix</span>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}