"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export function WishlistButton({ eventId }: { eventId: string }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkWishlist() {
      try {
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          setIsWishlisted(data.some((e: any) => e.id === eventId));
        }
      } catch {}
      setLoading(false);
    }
    checkWishlist();
  }, [eventId]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      setIsWishlisted(data.isWishlisted);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <button className="p-2 bg-white/90 rounded-full shadow-sm" disabled>
        <Heart className="w-5 h-5 text-gray-300" />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-sm"
    >
      <Heart
        className={`w-5 h-5 ${
          isWishlisted ? "fill-rose-600 text-rose-600" : "text-gray-600"
        }`}
      />
    </button>
  );
}