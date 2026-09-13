"use client";

import { useState, useRef, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Search, CheckCircle, XCircle, AlertCircle, Users, Mail, Loader2, ChevronLeft, ChevronRight, ScanLine } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function CheckinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [ticketId, setTicketId] = useState("");
  const [checkInCount, setCheckInCount] = useState(1);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ totalTickets: 0, totalAdmissions: 0, checkedIn: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("scan");
  const [attendees, setAttendees] = useState<any[]>([]);
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [attendeePage, setAttendeePage] = useState(1);
  const [attendeeTotalPages, setAttendeeTotalPages] = useState(1);
  const [attendeeTotal, setAttendeeTotal] = useState(0);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [rowAction, setRowAction] = useState<{ id: string; action: "checkin" | "resend" } | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [bulkResending, setBulkResending] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "attendees") {
      fetchAttendees();
    }
  }, [activeTab, attendeePage]);

  useEffect(() => {
    if (activeTab !== "attendees") return;

    const timeout = setTimeout(() => {
      fetchAttendees(1, attendeeSearch);
    }, 300);

    return () => clearTimeout(timeout);
  }, [attendeeSearch, activeTab]);

  const fetchAttendees = async (page = attendeePage, search = attendeeSearch) => {
    setLoadingAttendees(true);
    try {
      const query = new URLSearchParams();
      query.set("eventId", eventId);
      query.set("page", page.toString());
      query.set("limit", "20");
      if (search.trim()) query.set("search", search.trim());
      const res = await fetch(`/api/attendees?${query}`);
      if (res.ok) {
        const data = await res.json();
        setAttendees(data.tickets || data);
        setAttendeeTotal(data.total ?? (data.tickets || data).length);
        setAttendeeTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch attendees:", error);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleRowCheckIn = async (ticket: any) => {
    setRowAction({ id: ticket.id, action: "checkin" });
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.ticketId, eventId, count: 1 }),
      });
      const data = await res.json();
      if (res.ok) {
        setAttendees((prev) =>
          prev.map((t) =>
            t.id === ticket.id
              ? { ...t, checkedInCount: data.checkedInCount, isUsed: data.checkedInCount >= data.groupSize }
              : t
          )
        );
        toast({ title: "Checked in", description: `${ticket.ticketId} (${data.checkedInCount}/${data.groupSize})` });
        fetchStats();
      } else {
        toast({ title: "Check-in failed", description: data.error || "Failed to check in", variant: "destructive" });
        fetchAttendees();
      }
    } catch {
      toast({ title: "Error", description: "Check-in failed", variant: "destructive" });
    } finally {
      setRowAction(null);
    }
  };

  const handleRowResend = async (ticket: any) => {
    setRowAction({ id: ticket.id, action: "resend" });
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/resend`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Email sent", description: `Ticket email resent to ${data.email}` });
      } else {
        toast({ title: "Error", description: data.error || "Failed to resend email", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to resend email", variant: "destructive" });
    } finally {
      setRowAction(null);
    }
  };

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTickets.size === attendees.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(attendees.map((t: any) => t.id)));
    }
  };

  const handleBulkResend = async () => {
    if (selectedTickets.size === 0) return;
    setBulkResending(true);
    try {
      const res = await fetch("/api/tickets/bulk-resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketIds: Array.from(selectedTickets) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Bulk resend complete",
          description: `Sent ${data.success} of ${selectedTickets.size} emails.${data.failed > 0 ? ` ${data.failed} failed.` : ""}`,
        });
        setSelectedTickets(new Set());
      } else {
        toast({ title: "Error", description: data.error || "Failed to bulk resend", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to bulk resend", variant: "destructive" });
    } finally {
      setBulkResending(false);
    }
  };

  const startScanner = () => {
    setScannerError(null);
    setIsScanning(true);
  };

  const stopScanner = useCallback(() => {
    if (scannerRef.current && isScanningRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear();
      }).catch(() => {});
      scannerRef.current = null;
      isScanningRef.current = false;
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    if (!isScanning || isScanningRef.current) return;

    let html5QrCode: Html5Qrcode | null = null;
    try {
      html5QrCode = new Html5Qrcode("qr-reader-dashboard");
      scannerRef.current = html5QrCode;
      isScanningRef.current = true;

      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          try {
            const parsed = JSON.parse(decodedText);
            setTicketId(parsed.ticketId || decodedText);
          } catch {
            setTicketId(decodedText);
          }
          stopScanner();
          setTimeout(() => handleCheckIn(), 100);
        },
        () => {}
      ).catch(() => {
        setScannerError("Camera not available. Use manual entry instead.");
        isScanningRef.current = false;
        setIsScanning(false);
      });
    } catch {
      setScannerError("Camera not available. Use manual entry instead.");
      isScanningRef.current = false;
      setIsScanning(false);
    }

    return () => {
      if (html5QrCode && isScanningRef.current) {
        html5QrCode.stop().then(() => {
          html5QrCode?.clear();
        }).catch(() => {});
        scannerRef.current = null;
        isScanningRef.current = false;
      }
    };
  }, [isScanning]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/checkin?eventId=${eventId}`);
      const data = await res.json();
      if (res.ok) {
        setStats({ 
          totalTickets: data.totalTickets, 
          totalAdmissions: data.totalAdmissions || 0,
          checkedIn: data.checkedIn 
        });
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
        body: JSON.stringify({ ticketId: ticketId.trim(), eventId, count: checkInCount }),
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Event Check-in</h1>
          <p className="text-muted-foreground">Scan tickets, enter ticket IDs manually, or work from the attendee list</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Total Tickets</p>
              <p className="text-3xl font-bold">{stats.totalTickets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Total Admissions</p>
              <p className="text-3xl font-bold">{stats.totalAdmissions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Checked In</p>
              <p className="text-3xl font-bold text-green-600">{stats.checkedIn}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Scan
            </TabsTrigger>
            <TabsTrigger value="attendees" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Attendees{attendeeTotal > 0 ? ` (${attendeeTotal})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan">
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
              <Input
                type="number"
                min="1"
                value={checkInCount}
                onChange={(e) => setCheckInCount(Number(e.target.value))}
                className="w-24"
                placeholder="Count"
              />
              <Button onClick={handleCheckIn} disabled={isLoading}>
                <Search className="w-4 h-4 mr-2" />
                Check In
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter number of people to check in (for group tickets)
            </p>

            <div className="pt-4 border-t">
              {!isScanning ? (
                <Button
                  onClick={startScanner}
                  variant="outline"
                  className="w-full"
                >
                  <ScanLine className="w-4 h-4 mr-2" />
                  Scan QR Code
                </Button>
              ) : (
                <div className="space-y-3">
                  <div id="qr-reader-dashboard" className="w-full max-w-sm mx-auto"></div>
                  <Button
                    onClick={stopScanner}
                    variant="outline"
                    className="w-full"
                  >
                    Stop Scanner
                  </Button>
                </div>
              )}
              {scannerError && (
                <p className="text-sm text-amber-600 mt-2">{scannerError}</p>
              )}
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
                          {result.discountCode && (
                            <p className="font-medium mt-1 text-blue-700">
                              Promo Code: {result.discountCode}
                            </p>
                          )}
                          {result.groupSize > 1 && (
                            <p className="font-medium mt-1">
                              {result.checkedInCount} of {result.groupSize} checked in
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
                {result.type === "warning" && (
                  <>
                    <AlertCircle className="w-12 h-12 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-800">
                        {result.status === "ALREADY_USED" ? "Fully Used" : "Partial Check-in"}
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">{result.message}</p>
                      {result.groupSize > 1 && (
                        <p className="text-sm text-yellow-700 mt-1">
                          {result.checkedInCount || 0} of {result.groupSize} checked in
                        </p>
                      )}
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
          </TabsContent>

          <TabsContent value="attendees">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Attendee List
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={attendeeSearch}
                    onChange={(e) => setAttendeeSearch(e.target.value)}
                    placeholder="Search name, email, or ticket ID..."
                    className="pl-10"
                  />
                  {loadingAttendees && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {loadingAttendees && attendees.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : attendees.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No attendees found.</p>
                ) : (
                  <>
                    {selectedTickets.size > 0 && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">{selectedTickets.size} ticket(s) selected</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTickets(new Set())}
                            disabled={bulkResending}
                          >
                            Clear selection
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleBulkResend}
                            disabled={bulkResending}
                          >
                            {bulkResending ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Mail className="w-4 h-4 mr-2" />
                            )}
                            Resend to selected ({selectedTickets.size})
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-muted">
                          <tr>
                            <th className="p-3 w-10">
                              <input
                                type="checkbox"
                                checked={selectedTickets.size === attendees.length && attendees.length > 0}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 rounded border-gray-300"
                              />
                            </th>
                            <th className="p-3 text-left font-medium">Ticket</th>
                            <th className="p-3 text-left font-medium">Buyer</th>
                            <th className="p-3 text-left font-medium">Type</th>
                            <th className="p-3 text-left font-medium">Status</th>
                            <th className="p-3 text-right font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendees.map((ticket: any) => {
                            const groupSize = ticket.ticketType?.groupSize ?? 1;
                            const checkedIn = ticket.checkedInCount ?? 0;
                            const fullyUsed = ticket.isUsed || checkedIn >= groupSize;
                            const busy = rowAction?.id === ticket.id;
                            const isSelected = selectedTickets.has(ticket.id);
                            return (
                              <tr key={ticket.id} className={`border-b last:border-0 hover:bg-muted/50 ${isSelected ? "bg-blue-50" : ""}`}>
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleTicketSelection(ticket.id)}
                                    className="w-4 h-4 rounded border-gray-300"
                                  />
                                </td>
                                <td className="p-3 font-mono text-xs">{ticket.ticketId}</td>
                                <td className="p-3">{ticket.order?.buyerName || ticket.order?.buyerEmail || ticket.owner?.name || ticket.owner?.email || "N/A"}</td>
                                <td className="p-3">{ticket.ticketType?.name || "—"}</td>
                                <td className="p-3">
                                  {fullyUsed ? (
                                    <span className="text-green-600 font-medium">Used</span>
                                  ) : checkedIn > 0 ? (
                                    <span className="text-yellow-600 font-medium">{checkedIn}/{groupSize}</span>
                                  ) : (
                                    <span className="text-muted-foreground">Not used</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      size="sm"
                                      onClick={() => handleRowCheckIn(ticket)}
                                      disabled={busy || fullyUsed}
                                      title={fullyUsed ? "Fully checked in" : "Check in 1 admission"}
                                    >
                                      {busy && rowAction?.action === "checkin" ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                      )}
                                      Check in
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRowResend(ticket)}
                                      disabled={busy}
                                      title="Resend ticket email"
                                    >
                                      {busy && rowAction?.action === "resend" ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Mail className="w-4 h-4 mr-1" />
                                      )}
                                      Resend email
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {attendeeTotalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Page {attendeePage} of {attendeeTotalPages} ({attendeeTotal} total)
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={attendeePage <= 1 || loadingAttendees}
                            onClick={() => setAttendeePage((p) => Math.max(1, p - 1))}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={attendeePage >= attendeeTotalPages || loadingAttendees}
                            onClick={() => setAttendeePage((p) => Math.min(attendeeTotalPages, p + 1))}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
