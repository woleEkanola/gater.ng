"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface OrderDetails {
  orderId: string;
  eventTitle: string;
  amount: number;
  tickets: number;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref") || "";
  const orderId = searchParams.get("orderId") || reference;
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [debug, setDebug] = useState<string>("");

  useEffect(() => {
    setDebug(`ref: ${reference}, orderId: ${orderId}`);
  }, [reference, orderId]);

  useEffect(() => {
    async function verifyPayment() {
      if (!reference) {
        console.log("No reference found");
        setStatus("failed");
        return;
      }

      try {
        console.log("Verifying payment with reference:", reference);
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const data = await res.json();
        console.log("Verification response:", JSON.stringify(data));

        if (res.ok && data.verified) {
          setStatus("success");
          setOrder({
            orderId: data.orderId || orderId || "",
            eventTitle: data.eventTitle || "",
            amount: data.amount || 0,
            tickets: data.tickets || 0,
          });
        } else {
          console.log("Verification failed:", data);
          setStatus("failed");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("failed");
      }
    }

    if (reference) {
      verifyPayment();
    }
  }, [reference, orderId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
            <p className="text-muted-foreground mb-2">
              There was an issue with your payment. Please try again.
            </p>
            <pre className="text-xs text-left bg-muted p-2 rounded mb-4 overflow-auto max-h-32">
              {debug}
            </pre>
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Your tickets have been sent to your email.
          </p>

          {order && (
            <div className="bg-muted rounded-lg p-4 text-left mb-6">
              <h3 className="font-semibold mb-2">Order Details</h3>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Order ID:</span> {order.orderId}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Event:</span> {order.eventTitle}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Tickets:</span> {order.tickets}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Amount:</span> ₦{order.amount.toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {order && (
              <Link href={`/tickets/${order.orderId}`} className="w-full">
                <Button variant="outline" className="w-full">
                  Download Tickets
                </Button>
              </Link>
            )}
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full">
                View My Orders
              </Button>
            </Link>
            <Link href="/events" className="w-full">
              <Button className="w-full">Browse More Events</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}