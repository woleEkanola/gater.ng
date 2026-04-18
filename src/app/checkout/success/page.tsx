"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, LogIn, UserPlus, Link as LinkIcon } from "lucide-react";

interface OrderDetails {
  orderId: string;
  eventTitle: string;
  amount: number;
  tickets: number;
  buyerEmail?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref") || "";
  const orderId = searchParams.get("orderId") || reference;
  const emailFromUrl = searchParams.get("email") || "";
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [buyerEmail, setBuyerEmail] = useState<string>(emailFromUrl);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMagicForm, setShowMagicForm] = useState(false);

  useEffect(() => {
    async function verifyPayment() {
      if (!reference) {
        setStatus("failed");
        return;
      }

      if (reference === "free") {
        setStatus("success");
        const email = emailFromUrl || "";
        setBuyerEmail(email);
        setOrder({
          orderId: orderId || "",
          eventTitle: "Event",
          amount: 0,
          tickets: 1,
          buyerEmail: email,
        });

        if (email) {
          checkEmailExists(email);
        }
        return;
      }

      try {
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const data = await res.json();

        if (res.ok && data.verified) {
          setStatus("success");
          const email = data.buyerEmail || data.email || "";
          setBuyerEmail(email);
          setOrder({
            orderId: data.orderId || orderId || "",
            eventTitle: data.eventTitle || "",
            amount: data.amount || 0,
            tickets: data.tickets || 0,
            buyerEmail: email,
          });

          if (email) {
            checkEmailExists(email);
          }
        } else {
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

  async function checkEmailExists(email: string) {
    console.log("[CHECKOUT SUCCESS] Checking email exists:", email);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      console.log("[CHECKOUT SUCCESS] Email check response:", data);
      setEmailExists(data.exists);
    } catch (error) {
      console.error("[CHECKOUT SUCCESS] Error checking email:", error);
    }
  }

  async function handleCreateAccount() {
    if (!buyerEmail || !password) {
      setError("Please enter a password");
      return;
    }

    setActionLoading("create");
    setError("");

    try {
      const res = await fetch("/api/auth/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: buyerEmail, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("Account created! Redirecting to login...");
        window.location.href = `/auth-route/login?created=true&email=${encodeURIComponent(buyerEmail)}`;
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch (error) {
      setError("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendMagicLink() {
    if (!buyerEmail) return;

    setActionLoading("magic");
    setError("");

    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: buyerEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("Magic link sent! Check your email to set password.");
        setShowMagicForm(false);
      } else {
        setError(data.error || "Failed to send magic link");
      }
    } catch (error) {
      setError("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

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
            <p className="text-muted-foreground mb-6">
              There was an issue with your payment. Please try again.
            </p>
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
          <p className="text-muted-foreground mb-4">
            Your tickets have been sent to your email.
          </p>

          {order && (
            <div className="bg-muted rounded-lg p-4 text-left mb-4">
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
                <span className="font-medium">Amount:</span> ₦{((order.amount || 0) / 100).toLocaleString()}
              </p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {emailExists === false && !showCreateForm && !showMagicForm && (
            <div className="mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-3">
                <p className="text-blue-700 font-medium text-sm mb-2">Create an account to track your tickets</p>
                <p className="text-blue-600 text-xs">Save your purchase and access tickets anytime</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </Button>
                <Button 
                  onClick={() => setShowMagicForm(true)}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <LinkIcon className="w-4 h-4" />
                  Send Magic Link
                </Button>
              </div>
            </div>
          )}

          {showCreateForm && (
            <div className="mb-4 text-left">
              <div className="mb-3">
                <Label htmlFor="password" className="text-sm">Set Password (min 6 characters)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="mt-1"
                />
              </div>
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateAccount}
                  disabled={actionLoading === "create"}
                  className="flex-1"
                >
                  {actionLoading === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                </Button>
                <Button 
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showMagicForm && (
            <div className="mb-4 text-left">
              <p className="text-sm text-muted-foreground mb-2">
                We'll send a magic link to <strong>{buyerEmail}</strong> to set your password.
              </p>
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              <div className="flex gap-2">
                <Button 
                  onClick={handleSendMagicLink}
                  disabled={actionLoading === "magic"}
                  className="flex-1"
                >
                  {actionLoading === "magic" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Magic Link"}
                </Button>
                <Button 
                  onClick={() => setShowMagicForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {emailExists === true && !showCreateForm && !showMagicForm && (
            <div className="mb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left mb-3">
                <p className="text-amber-700 text-sm">An account with this email already exists.</p>
              </div>
              <Link href={`/auth-route/login?email=${encodeURIComponent(buyerEmail)}`} className="w-full">
                <Button className="w-full flex items-center justify-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Login to View Tickets
                </Button>
              </Link>
            </div>
          )}

          {!buyerEmail && (
            <div className="mb-4">
              <Link href="/events" className="w-full">
                <Button className="w-full">Browse More Events</Button>
              </Link>
            </div>
          )}

          {buyerEmail && (
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Or continue without an account
              </p>
              <p className="text-sm text-muted-foreground">
                Your tickets have been sent to <strong>{buyerEmail}</strong>
              </p>
            </div>
          )}
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