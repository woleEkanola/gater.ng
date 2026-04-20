"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Download, Calendar, MapPin, Ticket as TicketIcon, Loader2, Video, ExternalLink, Info } from "lucide-react";

interface Ticket {
  id: string;
  ticketId: string;
  qrCode: string;
  ticketType: { name: string };
}

interface Order {
  id: string;
  event: { 
    title: string; 
    location: string; 
    dateTime: string;
    isOnline: boolean;
    streamingLink: string | null;
    accessInstructions: string | null;
  };
  tickets: Ticket[];
}

function TicketContent() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/tickets?orderId=${orderId}`);
      const data = await res.json();
      setOrder(data);
      setLoading(false);
    }
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!order || order.tickets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Ticket not found</p>
      </div>
    );
  }

  const ticket = order.tickets[0];
  const isOnlineEvent = order.event.isOnline;

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    if (!ticket) return;
    const link = document.createElement("a");
    link.href = ticket.qrCode;
    link.download = `ticket-${ticket.ticketId}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b bg-white print:hidden">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Hitix
          </Link>
        </div>
      </header>
      <div className="max-w-md mx-auto p-4">
        <div className="flex gap-2 mb-4 print:hidden">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download QR
          </Button>
          <Button asChild>
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
        </div>

        <Card className="print:border-2 print:shadow-none">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-primary">Hitix</h1>
              <p className="text-sm text-muted-foreground">Event Ticket</p>
            </div>

            <div className="border-t border-b py-4 mb-4">
              <h2 className="text-xl font-bold mb-2">{order.event.title}</h2>
              {isOnlineEvent && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium mb-3">
                  <Video className="w-3 h-3" />
                  Online Event
                </div>
              )}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(order.event.dateTime).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    {" at "}
                    {new Date(order.event.dateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isOnlineEvent ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  <span>{order.event.isOnline ? "Online Event" : order.event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TicketIcon className="w-4 h-4" />
                  <span>{ticket.ticketType.name}</span>
                </div>
              </div>
            </div>

            {isOnlineEvent && order.event.accessInstructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
                  <Info className="w-4 h-4" />
                  Access Instructions
                </div>
                <p className="text-sm text-blue-600">{order.event.accessInstructions}</p>
              </div>
            )}

            {isOnlineEvent && order.event.streamingLink && (
              <div className="mb-4">
                <Button className="w-full" asChild>
                  <a href={order.event.streamingLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Join Event
                  </a>
                </Button>
              </div>
            )}

            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground mb-2">Ticket ID</p>
              <p className="text-xl font-mono font-bold">{ticket.ticketId}</p>
            </div>

            <div className="text-center">
              <img src={ticket.qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">{isOnlineEvent ? "Use this ticket to access the online event" : "Scan at event entrance"}</p>
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>Order ID: {order.id}</p>
              <p className="mt-1">© {new Date().getFullYear()} Hitix</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:border-2 { border-width: 2px !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function TicketDownloadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <TicketContent />
    </Suspense>
  );
}
