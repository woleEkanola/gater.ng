"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { Calendar, Sparkles } from "lucide-react";

interface Event {
  id: string;
  title: string;
  slug: string;
  banner: string | null;
  location: string;
  dateTime: string;
  minPrice: number;
  organizer: { name: string | null };
}

export function HomeRecommendations() {
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [recsBasis, setRecsBasis] = useState("");
  const [session, setSession] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setSession(!!data?.user);
        if (data?.user) {
          fetch("/api/events/recommendations")
            .then((res) => res.json())
            .then((data) => {
              if (data.events) {
                setRecommendations(data.events);
                setRecsBasis(data.basedOn || "");
              }
            })
            .finally(() => setLoadingRecs(false));
        } else {
          setLoadingRecs(false);
        }
      })
      .catch(() => setLoadingRecs(false));
  }, []);

  if (loadingRecs) {
    return null;
  }

  if (!session) {
    return (
      <section className="py-12 bg-rose-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Personalized for you</h2>
          <p className="text-gray-500 mb-6">Sign in to get event recommendations based on your interests</p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth-route/login" className="px-6 py-2 bg-rose-600 text-white rounded-md font-medium hover:bg-rose-700">
              Sign In
            </Link>
            <Link href="/auth-route/register" className="px-6 py-2 border border-rose-600 text-rose-600 rounded-md font-medium hover:bg-rose-50">
              Create Account
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="w-6 h-6 text-rose-600" />
          <h2 className="text-2xl font-bold">For You</h2>
          {recsBasis && (
            <span className="text-sm text-muted-foreground">{recsBasis}</span>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.slice(0, 4).map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                {event.banner ? (
                  <img
                    src={event.banner}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1">
                <h3 className="font-medium line-clamp-1 text-sm group-hover:text-rose-600">
                  {event.title}
                </h3>
                <p className="text-xs text-gray-500">{formatShortDate(event.dateTime)}</p>
                <p className="font-semibold text-rose-600 text-sm">
                  {event.minPrice === 0 ? "Free" : formatCurrency(event.minPrice)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}