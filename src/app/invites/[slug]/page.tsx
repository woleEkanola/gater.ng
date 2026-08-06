import { InviteRsvpForm } from "@/components/invite-rsvp-form";

export default async function OpenInvitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <main className="min-h-screen bg-muted/30 px-4 py-12"><div className="mx-auto max-w-xl"><InviteRsvpForm mode="open" identifier={slug} /></div></main>;
}
