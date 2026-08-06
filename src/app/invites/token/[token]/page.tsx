import { InviteRsvpForm } from "@/components/invite-rsvp-form";

export default async function TokenInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <main className="min-h-screen bg-muted/30 px-4 py-12"><div className="mx-auto max-w-xl"><InviteRsvpForm mode="token" identifier={token} /></div></main>;
}
