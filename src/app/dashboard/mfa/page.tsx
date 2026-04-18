"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Shield, ShieldOff, Copy, Check } from "lucide-react";

interface MFASetupData {
  mfaEnabled: boolean;
  qrCode?: string;
  secret?: string;
}

export default function MFAPage() {
  const [data, setData] = useState<MFASetupData | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchMFAStatus();
  }, []);

  async function fetchMFAStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa-setup");
      const data = await res.json();
      setData(data);
    } catch (e) {
      setError("Failed to load MFA status");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnable() {
    if (!code) {
      setError("Please enter the code from your authenticator app");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/auth/mfa-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, enable: true }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("MFA enabled successfully!");
        setData({ mfaEnabled: true });
        setCode("");
      } else {
        setError(data.error || "Failed to enable MFA");
      }
    } catch (e) {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/auth/mfa-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: false }),
      });

      if (res.ok) {
        setSuccess("MFA disabled");
        setData({ mfaEnabled: false });
      } else {
        setError("Failed to disable MFA");
      }
    } catch (e) {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function copySecret() {
    if (data?.secret) {
      await navigator.clipboard.writeText(data.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.mfaEnabled ? (
              <div className="text-center">
                <div className="p-4 bg-green-50 rounded-lg mb-4">
                  <Shield className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">MFA is enabled</p>
                </div>
                <Button
                  onClick={handleDisable}
                  disabled={saving}
                  variant="destructive"
                  className="w-full"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disable MFA"}
                </Button>
              </div>
            ) : data?.qrCode ? (
              <div className="space-y-4">
                <div className="text-center">
                  <img src={data.qrCode} alt="QR Code" className="mx-auto w-48 h-48" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Scan this with your authenticator app
                  </p>
                </div>

                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <code className="flex-1 text-sm font-mono">{data.secret}</code>
                  <Button variant="ghost" size="sm" onClick={copySecret}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                <div>
                  <Input
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-500 text-sm">{success}</p>}

                <Button
                  onClick={handleEnable}
                  disabled={saving || code.length !== 6}
                  className="w-full"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enable MFA"}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}