"use client";

import { generateReactHelpers } from "@uploadthing/react";
import { X, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import type { AppFileRouter } from "@/lib/uploadthing";

const { useUploadThing } = generateReactHelpers<AppFileRouter>();

interface TicketImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  loading?: boolean;
}

export function TicketImageUpload({ value, onChange, loading }: TicketImageUploadProps) {
  const { startUpload, isUploading } = useUploadThing("ticketTypeImage", {
    onClientUploadComplete(files) {
      onChange(files[0].url);
    },
  });

  const isLoading = loading || isUploading;

  return (
    <div className="flex items-center gap-4">
      {value && (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
          <img src={value} alt="Ticket" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <label className={cn(
        "flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm",
        isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
      )}>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <ImageIcon className="w-4 h-4" />
            <span>Upload Image</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isLoading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            await startUpload([file]);
          }}
        />
      </label>
    </div>
  );
}
