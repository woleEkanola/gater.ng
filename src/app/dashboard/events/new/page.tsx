"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/ui/upload-button";
import { Globe, MapPin, Users } from "lucide-react";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  banner: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  dateTime: z.string().min(1, "Date and time are required"),
  isPublished: z.boolean().default(false),
  isOnline: z.boolean().default(false),
  streamingLink: z.string().optional(),
  category: z.string().optional(),
  targetAudience: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

const CATEGORIES = [
  "Music",
  "Business",
  "Technology",
  "Sports",
  "Food & Drink",
  "Arts",
  "Education",
  "Health & Wellness",
  "Fashion",
  "Entertainment",
  "Networking",
  "Other",
];

export default function CreateEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");
  const [isOnline, setIsOnline] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      isPublished: false,
      isOnline: false,
    },
  });

  const handleBannerUpload = (url: string) => {
    setBannerUrl(url);
    setValue("banner", url);
  };

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, banner: bannerUrl }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "Success", description: "Event created successfully" });
      router.push(`/dashboard/events/${result.id}`);
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            Gater.ng
          </Link>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Enter event title"
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe your event"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Event Banner</Label>
                <ImageUpload value={bannerUrl} onChange={handleBannerUpload} />
                <p className="text-sm text-muted-foreground">
                  Recommended size: 1200x600px
                </p>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isOnline"
                    checked={isOnline}
                    onChange={(e) => {
                      setIsOnline(e.target.checked);
                      setValue("isOnline", e.target.checked);
                    }}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isOnline" className="flex items-center gap-2 cursor-pointer">
                    <Globe className="w-4 h-4" />
                    Online Event
                  </Label>
                </div>
              </div>

              {isOnline ? (
                <div className="space-y-2">
                  <Label htmlFor="streamingLink">Streaming Link</Label>
                  <Input
                    id="streamingLink"
                    {...register("streamingLink")}
                    placeholder="https://zoom.us/... or https://meet.google.com/..."
                  />
                  <p className="text-sm text-muted-foreground">
                    Link to your virtual event (Zoom, Google Meet, etc.)
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    {...register("location")}
                    placeholder="Event location"
                  />
                  {errors.location && (
                    <p className="text-sm text-red-500">{errors.location.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="dateTime">Date & Time</Label>
                <Input
                  id="dateTime"
                  type="datetime-local"
                  {...register("dateTime")}
                />
                {errors.dateTime && (
                  <p className="text-sm text-red-500">{errors.dateTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  {...register("category")}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Who is this event for?
                </Label>
                <Textarea
                  id="targetAudience"
                  {...register("targetAudience")}
                  placeholder="e.g., Software developers, Students, Business owners..."
                  rows={2}
                />
                <p className="text-sm text-muted-foreground">
                  Describe who should attend this event
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  {...register("isPublished")}
                  className="w-4 h-4"
                />
                <Label htmlFor="isPublished">Publish event immediately</Label>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Event"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}