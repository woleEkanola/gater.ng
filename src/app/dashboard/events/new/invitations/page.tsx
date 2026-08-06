import { redirect } from "next/navigation";

export default function CreateInvitationEventPage() {
  redirect("/dashboard/events/new?accessMode=INVITES");
}
