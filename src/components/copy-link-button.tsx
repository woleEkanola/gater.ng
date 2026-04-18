"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CopyLinkButtonProps {
  url: string;
  title: string;
  image?: string | null;
}

export function CopyLinkButton({ url, title, image }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share && image) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this event: ${title}`,
          url: url,
        });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleShare}
      title={copied ? "Copied!" : "Copy link"}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </Button>
  );
}