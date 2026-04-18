import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WishlistButton } from "@/components/wishlist-button";
import { AlertCircle, Calendar, MapPin, User, Ticket, Globe, Users, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    select: { title: true, description: true, banner: true },
  });

  if (!event) {
    return { title: "Event Not Found" };
  }

  return {
    title: event.title,
    description: event.description || `Join us for ${event.title}`,
    openGraph: {
      title: event.title,
      description: event.description || `Join us for ${event.title}`,
      images: event.banner ? [event.banner] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.description || `Join us for ${event.title}`,
      images: event.banner ? [event.banner] : [],
    },
  };
}

async function getEvent(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      organizer: { 
        select: { 
          id: true, 
          name: true, 
          email: true,
          image: true,
          payoutBankCode: true,
          payoutAccountNumber: true,
          payoutAccountName: true,
        } 
      },
      ticketTypes: { orderBy: { price: "asc" } },
      faqs: true,
    },
  });
  return event;
}

function hasPayoutSettings(organizer: {
  payoutBankCode?: string | null;
  payoutAccountNumber?: string | null;
  payoutAccountName?: string | null;
}): boolean {
  return !!(
    organizer.payoutBankCode &&
    organizer.payoutAccountNumber &&
    organizer.payoutAccountName
  );
}

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const event = await getEvent(params.slug);

  if (!event || !event.isPublished) {
    notFound();
  }

  const organizerHasPayout = hasPayoutSettings(event.organizer);

  const availableTickets = event.ticketTypes.filter(
    (tt) => tt.soldCount < tt.quantity && (tt.price === 0 || organizerHasPayout)
  );

  const allTicketsHidden = event.ticketTypes.every(
    (tt) => tt.price > 0 && !organizerHasPayout
  );

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Gater.ng
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/events" className="text-sm font-medium hover:text-primary">
              Browse Events
            </Link>
            <Link href="/login" className="text-sm font-medium hover:text-primary">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {event.banner && (
          <div className="aspect-video max-h-[400px] rounded-lg overflow-hidden mb-8 bg-muted relative">
            <img
              src={event.banner}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              <WishlistButton eventId={event.id} />
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {event.isOnline && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Online Event
                  </span>
                )}
                {event.category && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {event.category}
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
              
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{formatDate(event.dateTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {event.isOnline ? (
                    <Globe className="w-5 h-5" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}
                  <span>{event.isOnline ? "Online Event" : event.location}</span>
                </div>
              </div>
            </div>

            {event.targetAudience && (
              <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Who is this event for?</p>
                  <p className="text-sm text-blue-700">{event.targetAudience}</p>
                </div>
              </div>
            )}

            {event.description && (
              <div>
                <h2 className="text-xl font-semibold mb-2">About this event</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {event.isOnline && event.streamingLink && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Join the Event</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  This is an online event. Access the streaming link after purchasing your ticket.
                </p>
                <Button asChild>
                  <a href={event.streamingLink} target="_blank" rel="noopener noreferrer">
                    Open Streaming Link
                  </a>
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Tickets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {allTicketsHidden ? (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Tickets not available</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Paid tickets will be available once the organizer completes their payout settings.
                      </p>
                    </div>
                  </div>
                ) : availableTickets.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Tickets are sold out</p>
                ) : (
                  availableTickets.map((ticketType) => (
                    <div
                      key={ticketType.id}
                      className="flex justify-between items-center p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{ticketType.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {ticketType.quantity - ticketType.soldCount} remaining
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {ticketType.price === 0 ? "Free" : formatCurrency(ticketType.price)}
                        </p>
                        <Button asChild size="sm" className="mt-2">
                          <Link href={`/checkout/${event.slug}?ticketType=${ticketType.id}`}>
                            Buy
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organized by</CardTitle>
              </CardHeader>
              <CardContent>
                <Link 
                  href={`/organizer/${event.organizer.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {event.organizer.image ? (
                      <img 
                        src={event.organizer.image} 
                        alt={event.organizer.name || "Organizer"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{event.organizer.name || "Organizer"}</p>
                    <p className="text-sm text-muted-foreground">
                      View profile
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}