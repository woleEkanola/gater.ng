"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
  type: "event" | "organizer";
  slug?: string;
  organizerId?: string;
}

export function FollowButton({ type, slug, organizerId }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkFollow() {
      const endpoint = type === "event" 
        ? `/api/events/${slug}/follow`
        : `/api/organizers/${organizerId}/follow`;
      
      try {
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setIsFollowing(data.isFollowing);
          setFollowerCount(data.followerCount || 0);
        }
      } catch {}
      setLoading(false);
    }
    checkFollow();
  }, [type, slug, organizerId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const endpoint = type === "event" 
      ? `/api/events/${slug}/follow`
      : `/api/organizers/${organizerId}/follow`;
    
    try {
      const res = await fetch(endpoint, { method: "POST" });
      
      if (res.status === 401) {
        router.push(`/auth-route/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        setFollowerCount(prev => data.isFollowing ? prev + 1 : prev - 1);
      }
    } catch {}
  };

  if (loading) {
    return (
      <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-400" disabled>
        <UserPlus className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isFollowing
          ? "bg-primary/10 text-primary border border-primary"
          : "bg-primary text-white hover:bg-primary/90"
      }`}
    >
      {isFollowing ? (
        <UserCheck className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">
        {isFollowing ? "Following" : "Follow"}
      </span>
      {followerCount > 0 && (
        <span className="text-xs opacity-70">({followerCount})</span>
      )}
    </button>
  );
}