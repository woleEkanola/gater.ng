"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InviteMode = "open" | "token";

interface InviteData {
  name: string;
  description?: string | null;
  customMessage?: string | null;
  maxPlusOnes: number | null;
  formConfig?: {
    requireName?: boolean;
    requireEmail?: boolean;
    requirePhone?: boolean;
    plusOneRequireEmail?: boolean;
    fields?: Array<{ key: string; label: string; type?: string; required?: boolean }>;
  };
  event: {
    title: string;
    dateTime: string;
    location?: string | null;
    banner?: string | null;
  };
}

interface AttendeeForm {
  name: string;
  email: string;
  phone: string;
}

export function InviteRsvpForm({ mode, identifier }: { mode: InviteMode; identifier: string }) {
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [tokenInvitee, setTokenInvitee] = useState<any>(null);
  const [primary, setPrimary] = useState<AttendeeForm>({ name: "", email: "", phone: "" });
  const [plusOnes, setPlusOnes] = useState<AttendeeForm[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = mode === "open" ? `/api/invites/${identifier}` : `/api/invites/token/${identifier}`;
    fetch(url)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invitation unavailable");
        setInvite(data.invite || data);
        if (data.invitee) {
          setTokenInvitee(data.invitee);
          setPrimary({ name: data.invitee.name || "", email: data.invitee.email || "", phone: data.invitee.phone || "" });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [identifier, mode]);

  const formConfig = invite?.formConfig || {};
  const customFields = useMemo(() => formConfig.fields || [], [formConfig.fields]);
  const canAddPlusOne = invite?.maxPlusOnes === null || plusOnes.length < (invite?.maxPlusOnes || 0);

  const submit = async (rsvpStatus: "ACCEPTED" | "DECLINED") => {
    if (!invite) return;
    setSubmitting(true);
    setError("");
    try {
      const url = mode === "open" ? `/api/invites/${identifier}/rsvp` : `/api/invites/token/${identifier}/rsvp`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...primary,
          rsvpStatus,
          plusOnes: rsvpStatus === "ACCEPTED" ? plusOnes : [],
          formResponse: responses,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "RSVP failed");
      setResult(data);
    } catch (err: any) {
      setError(err.message || "RSVP failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Card><CardContent className="py-12 text-center text-muted-foreground">Loading invitation...</CardContent></Card>;
  if (error && !invite) return <Card><CardContent className="py-12 text-center text-destructive">{error}</CardContent></Card>;
  if (!invite) return null;

  if (result) {
    const guests = [result.invitee, ...(result.plusOnes || [])].filter(Boolean);
    const codes = new Map<string, string>();
    if (result.accessCode && result.invitee?.id) codes.set(result.invitee.id, result.accessCode);
    for (const credential of result.plusOneCredentials || []) codes.set(credential.inviteeId, credential.accessCode);

    return (
      <Card>
        <CardHeader><CardTitle>{result.invitee?.rsvpStatus === "DECLINED" ? "RSVP recorded" : "You're on the guest list"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Keep these admission details available for the event.</p>
          {guests.map((guest: any) => {
            const code = codes.get(guest.id);
            return (
              <div key={guest.id} className="rounded-lg border p-4">
                <p className="font-medium">{guest.name}</p>
                {code ? <p className="mt-2 font-mono text-2xl tracking-widest">{code}</p> : <p className="mt-2 text-sm text-muted-foreground">Your code was included in the invitation message.</p>}
                {code && <img className="mt-3 h-40 w-40" src={`/api/qr?data=${encodeURIComponent(code)}`} alt={`Admission QR code for ${guest.name}`} />}
              </div>
            );
          })}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invite.event.banner && <img src={invite.event.banner} alt={invite.event.title} className="aspect-[5/2] w-full rounded-lg object-cover" />}
      <Card>
      <CardHeader>
        <p className="text-sm font-medium text-primary">{invite.event.title}</p>
        <p className="text-sm text-muted-foreground">{new Date(invite.event.dateTime).toLocaleString()} · {invite.event.location || "Online event"}</p>
        <CardTitle>RSVP for {invite.name}</CardTitle>
        {invite.description && <p className="text-sm text-muted-foreground">{invite.description}</p>}
        {invite.customMessage && <p className="text-sm">{invite.customMessage}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Name *</Label><Input value={primary.name} onChange={(e) => setPrimary({ ...primary, name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Email {formConfig.requireEmail !== false ? "*" : ""}</Label><Input type="email" value={primary.email} onChange={(e) => setPrimary({ ...primary, email: e.target.value })} /></div>
        </div>
        {formConfig.requirePhone && <div className="space-y-2"><Label>Phone *</Label><Input type="tel" value={primary.phone} onChange={(e) => setPrimary({ ...primary, phone: e.target.value })} /></div>}
        {customFields.map((field) => <div key={field.key} className="space-y-2"><Label>{field.label}{field.required ? " *" : ""}</Label><Input value={responses[field.key] || ""} required={field.required} onChange={(e) => setResponses({ ...responses, [field.key]: e.target.value })} /></div>)}

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between"><div><p className="font-medium">Plus-one guests</p><p className="text-xs text-muted-foreground">{invite.maxPlusOnes === null ? "Unlimited" : `${invite.maxPlusOnes} allowed`} per RSVP</p></div><Button type="button" variant="outline" onClick={() => setPlusOnes([...plusOnes, { name: "", email: "", phone: "" }])} disabled={!canAddPlusOne}>Add plus-one</Button></div>
          {plusOnes.map((guest, index) => <div key={index} className="grid gap-3 rounded-lg bg-muted p-3 sm:grid-cols-2"><Input placeholder={`Plus-one ${index + 1} name`} value={guest.name} onChange={(e) => { const next = [...plusOnes]; next[index] = { ...guest, name: e.target.value }; setPlusOnes(next); }} /><Input placeholder="Email (optional)" type="email" required={Boolean(formConfig.plusOneRequireEmail)} value={guest.email} onChange={(e) => { const next = [...plusOnes]; next[index] = { ...guest, email: e.target.value }; setPlusOnes(next); }} /></div>)}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-3"><Button type="button" onClick={() => submit("ACCEPTED")} disabled={submitting}>{submitting ? "Saving..." : "I'm going"}</Button><Button type="button" variant="outline" onClick={() => submit("DECLINED")} disabled={submitting}>Can't attend</Button></div>
      </CardContent>
      </Card>
    </div>
  );
}
