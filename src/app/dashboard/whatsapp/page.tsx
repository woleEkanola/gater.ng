"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, QrCode, CheckCircle, XCircle, Loader2, Phone, AlertTriangle, RefreshCw } from "lucide-react";

type ConnectionState = "loading" | "disconnected" | "connecting" | "connected" | "error";

export default function WhatsAppSetupPage() {
  const { toast } = useToast();
  const [state, setState] = useState<ConnectionState>("loading");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const isPolling = useRef(false);

  useEffect(() => {
    checkStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();

      if (!data.instanceExists) {
        setState("disconnected");
        setPhone(null);
        setQrCode(null);
        setError(null);
        setQrError(null);
        return;
      }

      if (data.connected) {
        setState("connected");
        setPhone(data.phone);
        setQrCode(null);
        setError(null);
        setQrError(null);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = setInterval(pollConnectionHealth, 30000);
        } else {
          pollRef.current = setInterval(pollConnectionHealth, 30000);
        }
      } else {
        setState("connecting");
        setPhone(null);
        setError(null);
        setQrError(null);
        fetchQR();
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(pollConnection, 5000);
      }
    } catch {
      setState("error");
      setError("Failed to check WhatsApp status");
    }
  }, []);

  const pollConnection = useCallback(async () => {
    if (isPolling.current) return;
    isPolling.current = true;
    try {
      const res = await fetch("/api/whatsapp/check-connection");
      const data = await res.json();

      if (data.connected) {
        setState("connected");
        setPhone(data.phone);
        setQrCode(null);
        setQrError(null);
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(pollConnectionHealth, 30000);
        toast({ title: "WhatsApp Connected", description: `Connected as ${data.phone}` });
      }
    } catch {
      // polling error is silent
    } finally {
      isPolling.current = false;
    }
  }, [toast]);

  const pollConnectionHealth = useCallback(async () => {
    if (isPolling.current) return;
    isPolling.current = true;
    try {
      const res = await fetch("/api/whatsapp/check-connection");
      const data = await res.json();

      if (!data.connected && data.instanceExists) {
        setState("disconnected");
        setPhone(null);
        setQrCode(null);
        setQrError(null);
        if (pollRef.current) clearInterval(pollRef.current);
        toast({
          title: "WhatsApp Disconnected",
          description: "Ticket messages will no longer be delivered via WhatsApp.",
          variant: "destructive",
        });
      }
    } catch {
      // silent
    } finally {
      isPolling.current = false;
    }
  }, [toast]);

  const fetchQR = async () => {
    setQrLoading(true);
    setQrError(null);
    let gotQR = false;
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch("/api/whatsapp/qr");
        const data = await res.json();

        if (data.state === "connected") {
          setState("connected");
          setQrCode(null);
          setQrLoading(false);
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = setInterval(pollConnectionHealth, 30000);
          return;
        }

        if (data.qrcode) {
          setQrCode(data.qrcode);
          setQrError(null);
          setQrLoading(false);
          gotQR = true;
          return;
        }

        if (data.error) {
          setQrError(data.error);
        }
      } catch {
        setQrError("Failed to load QR code");
      }

      if (i < 2) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    if (!gotQR) {
      setQrError("Could not load QR code. Please try again.");
    }
    setQrLoading(false);
  };

  const handleConnect = async () => {
    setState("loading");
    setError(null);
    setQrError(null);
    try {
      const res = await fetch("/api/whatsapp/create-instance", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create instance");
        setState("error");
        return;
      }

      setState("connecting");
      fetchQR();
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(pollConnection, 5000);
    } catch {
      setError("Failed to connect. Ensure Evolution API is running.");
      setState("error");
    }
  };

  const handleDisconnect = async () => {
    setState("loading");
    setQrError(null);
    try {
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      const data = await res.json();

      if (data.warning) {
        toast({ title: "Disconnected", description: data.warning, variant: "default" });
      }

      setState("disconnected");
      setQrCode(null);
      setPhone(null);
      setError(null);
      if (pollRef.current) clearInterval(pollRef.current);
    } catch {
      setError("Failed to disconnect");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary">
              Hitix
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 text-sm hover:text-primary">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">WhatsApp Integration</h1>
        <p className="text-muted-foreground mb-8">
          Send ticket confirmations and event updates to buyers via WhatsApp.
        </p>

        {state === "loading" && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Checking WhatsApp status...</p>
            </CardContent>
          </Card>
        )}

        {state === "disconnected" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                WhatsApp Not Connected
              </CardTitle>
              <CardDescription>
                Connect your WhatsApp account to automatically send ticket confirmations to buyers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li>Buyers receive ticket info instantly on WhatsApp</li>
                <li>Messages sent from your own WhatsApp number</li>
                <li>Works alongside email confirmations</li>
              </ul>
              <Button onClick={handleConnect} className="w-full">
                <QrCode className="w-4 h-4 mr-2" />
                Connect WhatsApp
              </Button>
              {error && (
                <p className="text-sm text-red-500 mt-4">{error}</p>
              )}
            </CardContent>
          </Card>
        )}

        {state === "connecting" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary animate-pulse" />
                Scan to Connect
              </CardTitle>
              <CardDescription>
                Open WhatsApp on your phone, go to <strong>Settings &gt; Linked Devices</strong>, and scan the QR code below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {qrCode ? (
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <img
                    src={qrCode}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64"
                  />
                </div>
              ) : qrLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : qrError ? (
                <div className="text-center py-8">
                  <XCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                  <p className="text-sm text-red-500">{qrError}</p>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center">
                Waiting for you to scan... This page will update automatically once connected.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={fetchQR}
                  disabled={qrLoading}
                  className="flex-1"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${qrLoading ? "animate-spin" : ""}`} />
                  Refresh QR
                </Button>
                <Button variant="outline" onClick={handleDisconnect} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {state === "connected" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                WhatsApp Connected
              </CardTitle>
              <CardDescription>
                Ticket confirmations are being sent to buyers via WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Connected as</p>
                  <p className="text-green-700">{phone || "Unknown"}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  If you log out of WhatsApp on your phone or change devices, you will need to reconnect here.
                </p>
              </div>

              <Button variant="destructive" onClick={handleDisconnect} className="w-full">
                Disconnect WhatsApp
              </Button>
            </CardContent>
          </Card>
        )}

        {state === "error" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Connection Error
              </CardTitle>
              <CardDescription>
                Something went wrong. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="text-sm text-red-500 mb-4">{error}</p>
              )}
              <Button onClick={handleConnect} className="w-full">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
