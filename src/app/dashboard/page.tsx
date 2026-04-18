import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { DashboardClient } from "./dashboard-client";
import { AlertCircle } from "lucide-react";

async function getDashboardData(userId: string) {
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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  }) as any;

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ATTENDEE") {
    redirect("/dashboard/tickets");
  }

  // ADMIN and SUPERADMIN go to admin dashboard
  if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
    redirect("/admin_dash");
  }

  const { events, totalRevenue, totalTicketsSold } = await getDashboardData(user.id);

  const hasPayoutSettings = !!(user as any).paystackSubaccountCode || 
    !!(user as any).payoutAccountNumber;
  
  const hasPaidTickets = events.some(e => e.ticketTypes.some(tt => tt.price > 0));
  const showPayoutWarning = hasPaidTickets && !hasPayoutSettings;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Gater.ng
          </Link>
          <div className="flex items-center gap-4">
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
              Create Event
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

        {showPayoutWarning && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Action Required: Complete Your Payout Settings</p>
              <p className="text-sm text-muted-foreground mt-1">
                You have paid ticket types but haven&apos;t completed your payout settings. 
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
              Platform Fee: {(user as any).transactionFeePercent || 5}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {(user as any).paystackSubaccountCode 
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