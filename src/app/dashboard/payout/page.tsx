"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Building2, ChevronLeft } from "lucide-react";

const payoutSchema = z.object({
  payoutBankCode: z.string().min(3, "Bank code required"),
  payoutAccountNumber: z.string().min(10, "Account number required (10 digits)"),
  payoutAccountName: z.string().min(1, "Account name required"),
});

type PayoutFormData = z.infer<typeof payoutSchema>;

export default function PayoutSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PayoutFormData>({
    resolver: zodResolver(payoutSchema),
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/payout");
        if (res.ok) {
          const data = await res.json();
          if (data.payoutBankCode) setValue("payoutBankCode", data.payoutBankCode);
          if (data.payoutAccountNumber) setValue("payoutAccountNumber", data.payoutAccountNumber);
          if (data.payoutAccountName) setValue("payoutAccountName", data.payoutAccountName);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [setValue]);

  const onSubmit = async (data: PayoutFormData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "Success", description: "Payout settings saved" });
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        
        <h1 className="text-2xl font-bold mb-2">Payout Settings</h1>
        <p className="text-muted-foreground mb-8">
          Set up your bank account to receive payouts from ticket sales.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Bank Account Details
              </CardTitle>
              <CardDescription>
                Enter your Nigerian bank account details for payouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payoutBankCode">Bank Code</Label>
                <Input
                  id="payoutBankCode"
                  {...register("payoutBankCode")}
                  placeholder="e.g., 011"
                />
                {errors.payoutBankCode && (
                  <p className="text-sm text-destructive">{errors.payoutBankCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payoutAccountNumber">Account Number</Label>
                <Input
                  id="payoutAccountNumber"
                  {...register("payoutAccountNumber")}
                  placeholder="10-digit account number"
                  maxLength={10}
                />
                {errors.payoutAccountNumber && (
                  <p className="text-sm text-destructive">{errors.payoutAccountNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payoutAccountName">Account Name</Label>
                <Input
                  id="payoutAccountName"
                  {...register("payoutAccountName")}
                  placeholder="Account holder name"
                />
                {errors.payoutAccountName && (
                  <p className="text-sm text-destructive">{errors.payoutAccountName.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save Payout Settings"}
          </Button>
        </form>
      </div>
    </div>
  );
}