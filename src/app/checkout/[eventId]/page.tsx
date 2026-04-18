"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Minus, Plus } from "lucide-react";

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  soldCount: number;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  location: string;
  dateTime: string;
  ticketTypes: TicketType[];
}

export default function CheckoutPage({ params, searchParams }: { params: { slug: string }; searchParams: { ticketType?: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [buyerInfo, setBuyerInfo] = useState({ name: "", email: "", phone: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${params.slug}`);
        const data = await res.json();

        if (data.error) {
          toast({ title: "Error", description: data.error, variant: "destructive" });
          router.push("/events");
          return;
        }

        setEvent(data);

        if (searchParams.ticketType) {
          setCart({ [searchParams.ticketType]: 1 });
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load event", variant: "destructive" });
      } finally {
        setIsLoadingEvent(false);
      }
    }

    fetchEvent();
  }, [params.slug, searchParams.ticketType]);

  const updateQuantity = (ticketTypeId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[ticketTypeId] || 0;
      const ticketType = event?.ticketTypes.find((tt) => tt.id === ticketTypeId);
      const available = ticketType ? ticketType.quantity - ticketType.soldCount : 0;
      const newQuantity = Math.max(0, Math.min(current + delta, available));

      if (newQuantity === 0) {
        const { [ticketTypeId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [ticketTypeId]: newQuantity };
    });
  };

  const totalAmount = event?.ticketTypes.reduce((sum, tt) => {
    return sum + (cart[tt.id] || 0) * tt.price;
  }, 0) || 0;

  const totalTickets = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const handleCheckout = async () => {
    if (!buyerInfo.email) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }

    if (totalTickets === 0) {
      toast({ title: "Error", description: "Please select at least one ticket", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const items = Object.entries(cart).map(([ticketTypeId, quantity]) => ({
        ticketTypeId,
        quantity,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: params.slug,
          items,
          email: buyerInfo.email,
          name: buyerInfo.name,
          phone: buyerInfo.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      const ticketData = items.map((item) => ({
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity,
      }));

      const paymentRes = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data.orderId,
          email: buyerInfo.email,
          name: buyerInfo.name,
          amount: totalAmount,
          ticketData,
          eventId: params.slug,
        }),
      });

      const paymentData = await paymentRes.json();

      if (!paymentRes.ok) {
        toast({ title: "Error", description: paymentData.error, variant: "destructive" });
        return;
      }

      window.location.href = paymentData.authorizationUrl;
    } catch {
      toast({ title: "Error", description: "Checkout failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Event not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href={event ? `/events/${event.slug || event.id}` : "/events"} className="flex items-center gap-2 text-sm hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-8">{event.title}</p>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={buyerInfo.name}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={buyerInfo.email}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={buyerInfo.phone}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, phone: e.target.value })}
                  placeholder="08012345678"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Tickets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.ticketTypes.map((ticketType) => {
                const available = ticketType.quantity - ticketType.soldCount;
                const quantity = cart[ticketType.id] || 0;

                return (
                  <div key={ticketType.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{ticketType.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(ticketType.price)} • {available} available
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(ticketType.id, -1)}
                        disabled={quantity === 0}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center">{quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(ticketType.id, 1)}
                        disabled={quantity >= available}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Total ({totalTickets} tickets)</span>
                <span className="text-2xl font-bold">{formatCurrency(totalAmount)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isLoading || totalTickets === 0}
              >
                {isLoading ? "Processing..." : "Proceed to Payment"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
