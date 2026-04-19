import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { DashboardClient } from "./dashboard-client";
import { AlertCircle, Ticket, ArrowLeft, ArrowRight, Calendar, Plus, Sparkles } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

async function getOrganizerData(userId: string) {
  const events = await prisma.event.findMany({
    where: { organizerId: userId },
    include: {
      ticketTypes: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = await prisma.order.aggregate({
    where: {
      event: { organizerId: userId },
      status: "PAID",
    },
    _sum: { amount: true },
  });

  const totalTicketsSold = await prisma.ticket.count({
    where: {
      order: {
        event: { organizerId: userId },
        status: "PAID",
      },
    },
  });

  return { events, totalRevenue: totalRevenue._sum.amount || 0, totalTicketsSold };
}

async function getAttendeeData(userId: string, userEmail: string) {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { buyerId: userId, status: "PAID" },
        { buyerEmail: userEmail, status: "PAID" },
      ],
    },
    include: {
      event: true,
      tickets: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return { orders };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    redirect("/login");
  }

  const { mode } = await searchParams;
  const preferredMode = mode || "attendee";
  const isOrganizer = user.role === "ORGANIZER" || user.role === "ADMIN" || user.role === "SUPERADMIN";
  
  let currentMode: "attendee" | "organizer" = "attendee";
  if (preferredMode === "organizer" && isOrganizer) {
    currentMode = "organizer";
  } else if (preferredMode === "organizer" && !isOrganizer) {
    currentMode = "attendee";
  } else if (preferredMode === "attendee") {
    currentMode = "attendee";
  }

  const canSwitchToOrganizer = isOrganizer && user.role !== "ATTENDEE";
  const canSwitchToAttendee = true;

  if (user.role === "ATTENDEE" && currentMode === "organizer") {
    currentMode = "attendee";
  }

  if (currentMode === "attendee") {
    const { orders } = await getAttendeeData(user.id, user.email);
    
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary">
              Hitix
            </Link>
            <div className="flex items-center gap-4">
              {canSwitchToOrganizer && (
                <Link href="/dashboard?mode=organizer" className="text-sm hover:text-primary flex items-center gap-1">
                  <ArrowRight className="w-4 h-4" />
                  Switch to Organizer
                </Link>
              )}
              <Link href="/dashboard/wishlist" className="text-sm hover:text-primary">
                Wishlist
              </Link>
              <Link href="/dashboard/profile" className="text-sm hover:text-primary">
                Profile
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">My Tickets</h1>
              <p className="text-muted-foreground">Your purchased event tickets</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                Attendee Mode
              </span>
            </div>
          </div>

          {user.role === "ATTENDEE" && (
            <div className="mb-6 p-3 bg-muted/30 rounded-lg flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Have an event? <Link href="/dashboard/events/new" className="text-primary hover:underline">Create your own</Link> - it&apos;s free!</span>
              </div>
            </div>
          )}

          {user.role === "ORGANIZER" && currentMode === "attendee" && (
            <div className="mb-6 p-4 bg-gradient-to-r from-rose-50 to-purple-50 border border-rose-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-full">
                  <Sparkles className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="font-medium text-rose-800">Create Your Own Event</p>
                  <p className="text-sm text-muted-foreground">Share your passion with the world - it&apos;s free!</p>
                </div>
              </div>
              <Link href="/dashboard/events/new">
                <Button>Get Started</Button>
              </Link>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No tickets yet</h2>
              <p className="text-muted-foreground mb-6">Browse events and get your first ticket!</p>
              <Link href="/events">
                <Button>Browse Events</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{order.event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.event.dateTime)}
                      </span>
                      <span>{order.tickets.length} ticket(s)</span>
                      <span>{formatCurrency(order.amount)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/tickets/${order.id}`}>
                      <Button variant="outline" size="sm">View Tickets</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  const { events, totalRevenue, totalTicketsSold } = await getOrganizerData(user.id);

  const hasPayoutSettings = !!user.paystackSubaccountCode || !!user.payoutAccountNumber;
  const hasPaidTickets = events.some(e => e.ticketTypes.some(tt => tt.price > 0));
  const showPayoutWarning = hasPaidTickets && !hasPayoutSettings;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Hitix
          </Link>
          <div className="flex items-center gap-4">
            {canSwitchToAttendee && (
              <Link href="/dashboard?mode=attendee" className="text-sm hover:text-primary flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Switch to Attendee
              </Link>
            )}
            <span className="text-sm text-muted-foreground">{user.email}</span>
            {user.role === "SUPERADMIN" && (
              <Link href="/admin_dash" className="text-sm hover:text-primary">
                Admin Panel
              </Link>
            )}
            <Link href="/dashboard/payout" className="text-sm hover:text-primary">
              Payout Settings
            </Link>
            <Link href="/dashboard/wishlist" className="text-sm hover:text-primary">
              Wishlist
            </Link>
            <Link href="/dashboard/profile" className="text-sm hover:text-primary">
              Profile
            </Link>
            <LogoutButton />
            <Link
              href="/dashboard/events/new"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage your events</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm bg-rose-100 text-rose-700 px-3 py-1 rounded-full">
              Organizer Mode
            </span>
          </div>
        </div>

        {showPayoutWarning && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Action Required: Complete Your Payout Settings</p>
              <p className="text-sm text-muted-foreground mt-1">
                You have paid ticket types but haven't completed your payout settings. 
                Paid tickets will not be visible to attendees until you add your bank details.
              </p>
              <Link 
                href="/dashboard/payout" 
                className="inline-block mt-2 text-sm text-amber-700 hover:text-amber-900 underline"
              >
                Complete payout settings now
              </Link>
            </div>
          </div>
        )}

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <div className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0">💳</div>
          <div>
            <p className="font-medium text-blue-800">
              Platform Fee: {user.transactionFeePercent || 5}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {user.paystackSubaccountCode 
                ? "Your Paystack subaccount is active. You'll receive payouts directly."
                : "Complete payout settings to receive payments."}
            </p>
          </div>
        </div>

        <DashboardClient 
          events={events} 
          totalRevenue={totalRevenue} 
          totalTicketsSold={totalTicketsSold}
          userId={user.id}
        />
      </main>
    </div>
  );
}