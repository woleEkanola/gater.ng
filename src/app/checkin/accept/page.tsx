"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mail, KeyRound } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";

function CheckinAcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const token = searchParams.get("token");
  const eventId = searchParams.get("eventId");

  const [step, setStep] = useState<"loading" | "email" | "otp" | "success">("loading");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !eventId) {
      setError("Invalid invitation link");
      setStep("email");
      return;
    }

    validateToken();
  }, [token, eventId]);

  const validateToken = async () => {
    try {
      const res = await fetch("/api/checkin/validate-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, eventId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid invitation");
        setStep("email");
        return;
      }

      setEventTitle(data.eventTitle);
      setEmail(data.email);
      setStep("email");
    } catch (err) {
      setError("Failed to validate invitation");
      setStep("email");
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkin/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, eventId, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      setStep("otp");
      toast({ title: "OTP Sent", description: "Check your email and phone for the verification code" });
    } catch (err) {
      setError("Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: "Error", description: "Please enter a valid 6-digit OTP", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, eventId, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        return;
      }

      setStep("success");
      toast({ title: "Verified", description: "Signing you in..." });

      const signInResult = await signIn("credentials", {
        redirect: false,
        email: data.tempCredentials.email,
        password: data.tempCredentials.password,
      });

      if (signInResult?.error) {
        setError("Failed to sign in. Please try again.");
        setStep("otp");
        return;
      }

      setTimeout(() => {
        router.push(data.redirectUrl || `/checkin/${eventId}`);
      }, 1500);
    } catch (err) {
      setError("Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-primary">
            Hitix
          </Link>
        </div>

        {step === "loading" && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Validating invitation...</p>
            </CardContent>
          </Card>
        )}

        {step === "email" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Check-in Invitation
              </CardTitle>
              <CardDescription>
                {eventTitle ? (
                  <>You've been invited to check in attendees for <strong>{eventTitle}</strong></>
                ) : (
                  "Enter your email to get started"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>

              <Button onClick={handleSendOtp} disabled={isLoading || !email} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                We'll send a 6-digit code to your email and phone
              </p>
            </CardContent>
          </Card>
        )}

        {step === "otp" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                Enter Verification Code
              </CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>

              <Button onClick={handleVerifyOtp} disabled={isLoading || otp.length !== 6} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full"
              >
                Resend Code
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Code expires in 10 minutes
              </p>
            </CardContent>
          </Card>
        )}

        {step === "success" && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Verified Successfully</h3>
              <p className="text-muted-foreground">Redirecting to check-in page...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function CheckinAcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CheckinAcceptContent />
    </Suspense>
  );
}
