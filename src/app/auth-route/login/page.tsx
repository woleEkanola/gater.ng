"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mfaRequired) {
        const res = await fetch("/api/auth/mfa-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, code: mfaCode }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast({ title: "Error", description: data.error, variant: "destructive" });
          setIsLoading(false);
          return;
        }

        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error === "MFA_REQUIRED") {
          setMfaRequired(true);
        } else if (result?.error) {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/10 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            {mfaRequired ? "Enter your 2FA code" : "Enter your email and password to access your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!mfaRequired ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">Two-Factor Authentication</span>
                </div>
                <Input
                  id="mfaCode"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  autoFocus
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading || (mfaRequired && mfaCode.length !== 6)}>
              {isLoading ? "Signing in..." : mfaRequired ? "Verify" : "Sign in"}
            </Button>
          </form>
          {!mfaRequired && (
            <>
              <div className="mt-4 text-center text-sm">
                <Link href="/auth-route/forgot-password" className="text-rose-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth-route/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </>
          )}
          {mfaRequired && (
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => { setMfaRequired(false); setMfaCode(""); }}>
                Back to login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}