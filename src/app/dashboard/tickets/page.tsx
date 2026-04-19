import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Download, Ticket } from "lucide-react";

export default async function MyTicketsPage() {
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

  const orders = await prisma.order.findMany({
    where: { buyerId: user.id, status: "PAID" },
    include: {
      event: true,
      tickets: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Hitix
          </Link>
          <Button asChild variant="ghost">
            <Link href="/events">Browse Events</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">My Tickets</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No tickets yet</p>
            <p className="text-muted-foreground mb-4">Purchase tickets to see them here</p>
            <Button asChild>
              <Link href="/events">Browse Events</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <CardTitle>{order.event.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(order.event.dateTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{order.event.location}</span>
                      </div>
                      <p>Tickets: {order.tickets.length}</p>
                    </div>
                    <Button asChild>
                      <Link href={`/tickets/${order.id}`}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Tickets
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}