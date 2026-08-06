import { redirect } from "next/navigation";

export default function CreateHybridEventPage() {
  redirect("/dashboard/events/new?accessMode=BOTH");
}
