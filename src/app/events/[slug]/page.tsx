import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WishlistButton } from "@/components/wishlist-button";
import { FollowButton } from "@/components/follow-button";
import { ResponsiveHeader } from "@/components/responsive-header";
import { Footer } from "@/components/footer";
import { AlertCircle, Calendar, MapPin, User, Globe, Users, Tag, HelpCircle, Image as ImageIcon } from "lucide-react";
import { FaqAccordion } from "@/components/faq-accordion";
import { SpeakerGrid } from "@/components/speaker-modal";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
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
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      banner: true,
      location: true,
      dateTime: true,
      isPublished: true,
      isOnline: true,
      streamingLink: true,
      category: true,
      targetAudience: true,
      hideAddress: true,
      hideStreamingLink: true,
      speakerLabel: true,
      contactEmail: true,
      contactPhone: true,
      websiteUrl: true,
      twitterUrl: true,
      facebookUrl: true,
      instagramUrl: true,
      youtubeUrl: true,
      linkedinUrl: true,
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
      faqs: { orderBy: { createdAt: "asc" } },
      tags: true,
      gallery: { orderBy: { createdAt: "asc" } },
      speakers: { orderBy: { createdAt: "asc" } },
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

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);

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

  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen">
      <ResponsiveHeader isLoggedIn={!!session} />

      <main>
        {event.banner && (
          <div className="w-full h-[200px] md:h-[300px] lg:h-[400px] relative mb-6 md:mb-8 bg-muted">
            <img
              src={event.banner}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <WishlistButton eventId={event.id} />
              <FollowButton type="event" slug={event.slug} />
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {event.isOnline && (
                    <span className="px-3 py-1 bg-rose-100 text-rose-700 text-sm rounded-full flex items-center gap-1">
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
                
                <h1 className="text-2xl md:text-3xl font-bold mb-4">{event.title}</h1>
                
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
                    <span>
                      {event.isOnline 
                        ? "Online Event" 
                        : event.hideAddress 
                          ? "Location shown to registered attendees"
                          : event.location || "TBA"}
                    </span>
                  </div>
                </div>
              </div>

              {event.targetAudience && (
                <div className="flex items-start gap-2 p-4 bg-rose-50 border border-rose-100 rounded-lg">
                  <Users className="w-5 h-5 text-rose-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-rose-800">Who is this event for?</p>
                    <p className="text-sm text-rose-700">{event.targetAudience}</p>
                  </div>
                </div>
              )}

              {event.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">About this event</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {event.isOnline && event.streamingLink && !event.hideStreamingLink && (
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

              {event.isOnline && event.hideStreamingLink && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Online Event</h3>
                  <p className="text-sm text-muted-foreground">
                    Streaming link will be shared with registered attendees before the event.
                  </p>
                </div>
              )}

              {event.gallery && event.gallery.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.gallery.map((image) => (
                      <div key={image.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={image.image}
                          alt={image.caption || "Event image"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {event.speakers && event.speakers.length > 0 && (
                <SpeakerGrid 
                  speakers={event.speakers} 
                  label={event.speakerLabel || "Speakers"} 
                />
              )}

              {event.faqs && event.faqs.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Frequently Asked Questions
                  </h2>
                  <FaqAccordion faqs={event.faqs} />
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
                <CardContent className="space-y-4">
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
                  <FollowButton type="organizer" organizerId={event.organizer.id} />
                </CardContent>
              </Card>

              {(event.contactEmail || event.contactPhone || event.websiteUrl || event.twitterUrl || event.facebookUrl || event.instagramUrl || event.youtubeUrl) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contact & Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {event.contactEmail && (
                      <a href={`mailto:${event.contactEmail}`} className="block text-sm hover:underline">
                        {event.contactEmail}
                      </a>
                    )}
                    {event.contactPhone && (
                      <a href={`tel:${event.contactPhone}`} className="block text-sm hover:underline">
                        {event.contactPhone}
                      </a>
                    )}
                    {event.websiteUrl && (
                      <a href={event.websiteUrl} target="_blank" rel="noopener noreferrer" className="block text-sm hover:underline">
                        Website
                      </a>
                    )}
                    <div className="flex gap-3 pt-2">
                      {event.twitterUrl && (
                        <a href={event.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                          X
                        </a>
                      )}
                      {event.facebookUrl && (
                        <a href={event.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                        Facebook
                      </a>
                      )}
                      {event.instagramUrl && (
                        <a href={event.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                        Instagram
                      </a>
                      )}
                      {event.youtubeUrl && (
                        <a href={event.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                          YouTube
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}