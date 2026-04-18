"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Download, Calendar, MapPin, Ticket as TicketIcon } from "lucide-react";

interface Ticket {
  id: string;
  ticketId: string;
  qrCode: string;
  ticketType: { name: string };
}

interface Order {
  id: string;
  event: { title: string; location: string; dateTime: string };
  tickets: Ticket[];
}

export default function TicketDownloadPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      const res = await fetch(`/api/tickets?orderId=${orderId}`);
      const data = await res.json();
      setOrder(data);
      setLoading(false);
    }
    fetchOrder();
  }, [orderId]);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    if (!order) return;
    const ticket = order.tickets[0];
    if (!ticket) return;

    const link = document.createElement("a");
    link.href = ticket.qrCode;
    link.download = `ticket-${ticket.ticketId}.png`;
    link.click();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!order || order.tickets.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">No tickets found</div>;
  }

  const ticket = order.tickets[0];

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
      <div className="max-w-md mx-auto">
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
              <h1 className="text-2xl font-bold text-primary">Gater.ng</h1>
              <p className="text-sm text-muted-foreground">Event Ticket</p>
            </div>

            <div className="border-t border-b py-4 mb-4">
              <h2 className="text-xl font-bold mb-2">{order.event.title}</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(order.event.dateTime).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{order.event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TicketIcon className="w-4 h-4" />
                  <span>{ticket.ticketType.name}</span>
                </div>
              </div>
            </div>

            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground mb-2">Ticket ID</p>
              <p className="text-xl font-mono font-bold">{ticket.ticketId}</p>
            </div>

            <div className="text-center">
              <img src={ticket.qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">Scan at event entrance</p>
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>Order ID: {order.id}</p>
              <p className="mt-1">© {new Date().getFullYear()} Gater.ng</p>
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