"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  Minus,
  Plus,
  ScanLine,
  Keyboard,
  Users,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Html5Qrcode } from "html5-qrcode";

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
  const [myCheckInCount, setMyCheckInCount] = useState(0);
  const [eventTitle, setEventTitle] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [admissionsOpen, setAdmissionsOpen] = useState(false);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loadingAdmissions, setLoadingAdmissions] = useState(false);

  const [activeTab, setActiveTab] = useState("manual");
  const [scannedTicketId, setScannedTicketId] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<string>("qr-reader");
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/checkin/accept?eventId=${eventId}`);
      return;
    }
    if (status === "authenticated") {
      checkAuthorization();
    }
  }, [status, eventId]);

  useEffect(() => {
    if (activeTab === "scanner") {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [activeTab]);

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
      fetchMyCount();
    } catch {
      toast({ title: "Error", description: "Failed to verify access", variant: "destructive" });
      router.push(`/checkin/accept?eventId=${eventId}`);
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchMyCount = async () => {
    try {
      const res = await fetch(`/api/checkin?eventId=${eventId}&mine=true`);
      if (res.ok) {
        const data = await res.json();
        setMyCheckInCount(data.myCheckInCount ?? data.checkedIn ?? 0);
      }
    } catch {}
  };

  const doCheckIn = async (tid: string, count: number) => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: tid.trim().toUpperCase(), eventId, count }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ type: "success", message: "Check-in successful", details: data });
        toast({ title: "Success", description: "Attendee checked in" });
        fetchMyCount();
      } else {
        if (data.status === "ALREADY_USED") {
          setResult({ type: "warning", message: "Ticket already fully used", details: data });
        } else if (data.status === "PARTIAL") {
          setResult({ type: "warning", message: data.error, details: data });
        } else {
          setResult({ type: "error", message: data.error || "Check-in failed", details: data });
        }
      }
    } catch {
      setResult({ type: "error", message: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCheckIn = async () => {
    if (!ticketId.trim()) {
      toast({ title: "Error", description: "Please enter a ticket ID", variant: "destructive" });
      return;
    }
    await doCheckIn(ticketId, checkInCount);
    setTicketId("");
    setCheckInCount(1);
    setTimeout(() => {
      const input = document.getElementById("ticketId") as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  };

  const handleScannerAdmit = async () => {
    if (!scannedTicketId) return;
    await doCheckIn(scannedTicketId, checkInCount);
    setScannedTicketId(null);
    setCheckInCount(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleManualCheckIn();
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const startScanner = useCallback(async () => {
    if (isScanningRef.current) return;
    try {
      const html5QrCode = new Html5Qrcode(scannerContainerRef.current);
      scannerRef.current = html5QrCode;
      isScanningRef.current = true;
      setScannerError(null);

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          try {
            const parsed = JSON.parse(decodedText);
            setScannedTicketId(parsed.ticketId || decodedText);
          } catch {
            setScannedTicketId(decodedText);
          }
          stopScanner();
        },
        () => {}
      );
    } catch {
      setScannerError("Camera not available. Use manual entry instead.");
      isScanningRef.current = false;
    }
  }, []);

  const stopScanner = useCallback(() => {
    if (scannerRef.current && isScanningRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear();
      }).catch(() => {});
      scannerRef.current = null;
      isScanningRef.current = false;
    }
  }, []);

  const openAdmissions = async () => {
    setAdmissionsOpen(true);
    setLoadingAdmissions(true);
    try {
      const res = await fetch(`/api/checkin?eventId=${eventId}&mine=true`);
      if (res.ok) {
        const data = await res.json();
        setAdmissions(data.checkIns || []);
      }
    } catch {
      setAdmissions([]);
    } finally {
      setLoadingAdmissions(false);
    }
  };

  if (status === "loading" || checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-white px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold leading-tight">Check-in</h1>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{eventTitle}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="gap-2">
              <Keyboard className="w-4 h-4" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="scanner" className="gap-2">
              <ScanLine className="w-4 h-4" />
              QR Scanner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <Card className="border-0 shadow-none">
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Input
                    id="ticketId"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter ticket code"
                    className="text-2xl font-mono tracking-wider uppercase h-14 text-center"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Guests
                  </span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCheckInCount((c) => Math.max(1, c - 1))}
                      disabled={checkInCount <= 1}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <span className="w-6 text-center font-mono text-lg">{checkInCount}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCheckInCount((c) => c + 1)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleManualCheckIn}
                  disabled={isLoading || !ticketId.trim()}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Admitting...
                    </>
                  ) : (
                    "Admit Attendee"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scanner">
            <Card className="border-0 shadow-none">
              <CardContent className="pt-4 space-y-4">
                {scannerError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{scannerError}</p>
                    <Button
                      variant="outline"
                      className="mt-3"
                      onClick={() => setActiveTab("manual")}
                    >
                      Use Manual Entry
                    </Button>
                  </div>
                ) : scannedTicketId ? (
                  <div className="text-center py-4 space-y-4">
                    <CheckCircle className="w-10 h-10 mx-auto text-green-500" />
                    <div>
                      <p className="font-mono text-lg font-bold">{scannedTicketId}</p>
                      <p className="text-sm text-muted-foreground mt-1">Ticket scanned successfully</p>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Guests
                      </span>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setCheckInCount((c) => Math.max(1, c - 1))}
                          disabled={checkInCount <= 1}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="w-6 text-center font-mono text-lg">{checkInCount}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setCheckInCount((c) => c + 1)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setScannedTicketId(null);
                          setCheckInCount(1);
                          setTimeout(() => startScanner(), 200);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleScannerAdmit}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Admitting...
                          </>
                        ) : (
                          "Admit Attendee"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      id={scannerContainerRef.current}
                      className="w-full aspect-square bg-black rounded-lg overflow-hidden"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Point camera at the QR code on the ticket
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {result && (
          <Card
            className={`mt-4 border-0 ${
              result.type === "success"
                ? "bg-green-50"
                : result.type === "warning"
                ? "bg-yellow-50"
                : "bg-red-50"
            }`}
          >
            <CardContent className="pt-4">
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
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold text-sm ${
                      result.type === "success"
                        ? "text-green-900"
                        : result.type === "warning"
                        ? "text-yellow-900"
                        : "text-red-900"
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.details?.ticket && (
                    <div className="mt-1.5 text-xs space-y-0.5 text-muted-foreground">
                      <p>
                        <strong>{result.details.ticket.ticketId}</strong> — {result.details.ticket.ticketType}
                      </p>
                      <p>{result.details.ticket.owner}</p>
                      {result.details.checkedInCount !== undefined && (
                        <p>
                          {result.details.checkedInCount} of {result.details.groupSize} checked in
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-auto pt-6 text-center">
          <button
            onClick={openAdmissions}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            View my admissions ({myCheckInCount})
          </button>
        </div>
      </main>

      <Dialog open={admissionsOpen} onOpenChange={setAdmissionsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>My Admissions</DialogTitle>
            <DialogDescription>
              Attendees checked in by you for this event
            </DialogDescription>
          </DialogHeader>
          {loadingAdmissions ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : admissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No admissions yet
            </p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {admissions.map((ci: any) => (
                <div
                  key={ci.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-medium truncate">
                      {ci.ticket?.ticketId}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ci.ticket?.ticketType?.name} — {ci.ticket?.order?.buyerName || ci.ticket?.order?.buyerEmail || "Unknown"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-3 flex-shrink-0">
                    {new Date(ci.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
