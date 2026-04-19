"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Search, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function CheckinPage({ params }: { params: { eventId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [ticketId, setTicketId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ totalTickets: 0, checkedIn: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/checkin?eventId=${params.eventId}`);
      const data = await res.json();
      if (res.ok) {
        setStats({ totalTickets: data.totalTickets, checkedIn: data.checkedIn });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
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
        body: JSON.stringify({ ticketId: ticketId.trim(), eventId: params.eventId }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ type: "success", ...data });
        toast({ title: "Success", description: "Check-in successful" });
        fetchStats();
      } else {
        setResult({
          type: data.status === "ALREADY_USED" ? "warning" : "error",
          message: data.error,
          status: data.status,
        });
      }
    } catch {
      setResult({ type: "error", message: "Check-in failed" });
      toast({ title: "Error", description: "Check-in failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setTicketId("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCheckIn();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            Hitix
          </Link>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Event Check-in</h1>
          <p className="text-muted-foreground">Scan tickets or enter ticket ID manually</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Total Tickets</p>
              <p className="text-3xl font-bold">{stats.totalTickets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Checked In</p>
              <p className="text-3xl font-bold text-green-600">{stats.checkedIn}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Scan / Enter Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="GAT-XXXXXX"
                className="text-lg font-mono uppercase"
              />
              <Button onClick={handleCheckIn} disabled={isLoading}>
                <Search className="w-4 h-4 mr-2" />
                Check In
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className={`${
            result.type === "success" ? "border-green-500 bg-green-50" :
            result.type === "warning" ? "border-yellow-500 bg-yellow-50" :
            "border-red-500 bg-red-50"
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {result.type === "success" && (
                  <>
                    <CheckCircle className="w-12 h-12 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Check-in Successful</p>
                      {result.ticket && (
                        <div className="text-sm text-green-700 mt-1">
                          <p>Ticket: {result.ticket.ticketId}</p>
                          <p>Type: {result.ticket.ticketType}</p>
                          <p>Attendee: {result.ticket.owner}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {result.type === "warning" && (
                  <>
                    <AlertCircle className="w-12 h-12 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-800">Already Used</p>
                      <p className="text-sm text-yellow-700 mt-1">{result.message}</p>
                    </div>
                  </>
                )}
                {result.type === "error" && (
                  <>
                    <XCircle className="w-12 h-12 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-800">Invalid Ticket</p>
                      <p className="text-sm text-red-700 mt-1">{result.message}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
