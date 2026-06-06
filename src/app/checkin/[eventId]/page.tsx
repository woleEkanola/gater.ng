"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, XCircle, AlertCircle, LogOut, ScanLine } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function StaffCheckinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [ticketId, setTicketId] = useState("");
  const [checkInCount, setCheckInCount] = useState(1);
  const [result, setResult] = useState<{
    type: "success" | "warning" | "error";
    message: string;
    details?: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTickets: 0,
    totalAdmissions: 0,
    checkedIn: 0,
  });
  const [eventTitle, setEventTitle] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/checkin/accept?eventId=${eventId}`);
      return;
    }

    if (status === "authenticated") {
      checkAuthorization();
    }
  }, [status, eventId]);

  const checkAuthorization = async () => {
    try {
      const res = await fetch(`/api/checkin/verify-staff?eventId=${eventId}`);
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Unauthorized", description: data.error, variant: "destructive" });
        router.push(`/checkin/accept?eventId=${eventId}`);
        return;
      }

      setEventTitle(data.eventTitle);
      setIsAuthorized(true);
      fetchStats();
    } catch (err) {
      toast({ title: "Error", description: "Failed to verify access", variant: "destructive" });
      router.push(`/checkin/accept?eventId=${eventId}`);
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/checkin?eventId=${eventId}`);
      const data = await res.json();

      if (res.ok) {
        setStats({
          totalTickets: data.totalTickets,
          totalAdmissions: data.totalAdmissions,
          checkedIn: data.checkedIn,
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleCheckIn = async () => {
    if (!ticketId.trim()) {
      toast({ title: "Error", description: "Please enter a ticket ID", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticketId.trim().toUpperCase(),
          eventId,
          count: checkInCount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          type: "success",
          message: "Check-in successful",
          details: data,
        });
        toast({ title: "Success", description: "Attendee checked in" });
        fetchStats();
      } else {
        if (data.status === "ALREADY_USED") {
          setResult({
            type: "warning",
            message: "Ticket already fully used",
            details: data,
          });
        } else if (data.status === "PARTIAL") {
          setResult({
            type: "warning",
            message: data.error,
            details: data,
          });
        } else {
          setResult({
            type: "error",
            message: data.error || "Check-in failed",
            details: data,
          });
        }
      }
    } catch (err) {
      setResult({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setTicketId("");
      setTimeout(() => {
        const input = document.getElementById("ticketId") as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCheckIn();
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  if (status === "loading" || checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Check-in</h1>
            <p className="text-sm text-muted-foreground">{eventTitle}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalTickets}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Admissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalAdmissions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Checked In</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.checkedIn}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Scan / Enter Ticket
            </CardTitle>
            <CardDescription>
              Enter the ticket ID or scan the QR code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ticketId">Ticket ID</Label>
              <Input
                id="ticketId"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="GAT-XXXXXX"
                className="font-mono text-lg uppercase"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">Number of Admissions</Label>
              <Input
                id="count"
                type="number"
                min="1"
                value={checkInCount}
                onChange={(e) => setCheckInCount(parseInt(e.target.value) || 1)}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">
                For group tickets, enter how many people are checking in
              </p>
            </div>

            <Button
              onClick={handleCheckIn}
              disabled={isLoading || !ticketId.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking in...
                </>
              ) : (
                "Check In"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card
            className={
              result.type === "success"
                ? "border-green-200 bg-green-50"
                : result.type === "warning"
                ? "border-yellow-200 bg-yellow-50"
                : "border-red-200 bg-red-50"
            }
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {result.type === "success" && (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                )}
                {result.type === "warning" && (
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                )}
                {result.type === "error" && (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p
                    className={
                      result.type === "success"
                        ? "font-semibold text-green-900"
                        : result.type === "warning"
                        ? "font-semibold text-yellow-900"
                        : "font-semibold text-red-900"
                    }
                  >
                    {result.message}
                  </p>
                  {result.details && (
                    <div className="mt-2 text-sm space-y-1">
                      {result.details.ticket && (
                        <>
                          <p>
                            <strong>Ticket:</strong> {result.details.ticket.ticketId}
                          </p>
                          <p>
                            <strong>Type:</strong> {result.details.ticket.ticketType}
                          </p>
                          <p>
                            <strong>Attendee:</strong> {result.details.ticket.owner}
                          </p>
                        </>
                      )}
                      {result.details.checkedInCount !== undefined && (
                        <p>
                          <strong>Progress:</strong> {result.details.checkedInCount} of{" "}
                          {result.details.groupSize} checked in
                        </p>
                      )}
                      {result.details.remaining !== undefined && (
                        <p>
                          <strong>Remaining:</strong> {result.details.remaining} admission
                          {result.details.remaining === 1 ? "" : "s"}
                        </p>
                      )}
                      {result.details.discountCode && (
                        <p>
                          <strong>Promo Code:</strong> {result.details.discountCode}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
