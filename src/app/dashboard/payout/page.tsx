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
import { BankSelect } from "@/components/ui/bank-select";
import { Building2, ChevronLeft, MessageCircle, Clock, CheckCircle, DollarSign, RefreshCw } from "lucide-react";

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
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [selectedBankName, setSelectedBankName] = useState("");
  const [payoutHistory, setPayoutHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/payout/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Sync complete", description: `${data.newRecords} new payout record(s) found` });
        const historyRes = await fetch("/api/payout/history");
        if (historyRes.ok) setPayoutHistory(await historyRes.json());
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Sync failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
          if (data.banks) setBanks(data.banks);
          if (data.payoutBankName) setSelectedBankName(data.payoutBankName);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [setValue]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/payout/history");
        if (res.ok) {
          setPayoutHistory(await res.json());
        }
      } catch {}
      setLoadingHistory(false);
    }
    fetchHistory();
  }, []);

  const onSubmit = async (data: PayoutFormData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, payoutBankName: selectedBankName }),
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
                <Label>Bank</Label>
                <BankSelect
                  banks={banks}
                  value={watch("payoutBankCode")}
                  onChange={(code, name) => {
                    setValue("payoutBankCode", code);
                    setSelectedBankName(name);
                  }}
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

        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payout History
            </h2>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync from Paystack"}
            </Button>
          </div>

          {loadingHistory ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : payoutHistory ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">₦{payoutHistory.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{payoutHistory.totalOrders} paid orders</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Your Share ({payoutHistory.feePercent}% fee)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">₦{payoutHistory.netRevenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">After {payoutHistory.feePercent}% platform fee</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      Settled
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">₦{payoutHistory.totalSettled.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Paid by Paystack</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-amber-600">₦{payoutHistory.totalPending.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Awaiting settlement</p>
                  </CardContent>
                </Card>
              </div>

              {payoutHistory.payoutRecords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Settlements</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr className="text-left">
                          <th className="p-3 font-medium">Date</th>
                          <th className="p-3 font-medium">Amount</th>
                          <th className="p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payoutHistory.payoutRecords.map((r: any) => (
                          <tr key={r.id} className="border-b">
                            <td className="p-3 text-muted-foreground">
                              {new Date(r.paidAt).toLocaleDateString()}
                            </td>
                            <td className="p-3 font-medium">
                              ₦{(r.amount / 100).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full">
                                Paid
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Unable to load payout data</p>
          )}
        </div>

        <div className="mt-8 pt-8 border-t">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                WhatsApp Integration
              </CardTitle>
              <CardDescription>
                Send ticket confirmations to buyers via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/whatsapp">
                <Button variant="outline" className="w-full">
                  Manage WhatsApp Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}