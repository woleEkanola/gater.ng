"use client";

import { generateReactHelpers } from "@uploadthing/react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import type { AppFileRouter } from "@/lib/uploadthing";

const { useUploadThing } = generateReactHelpers<AppFileRouter>();

interface SpeakerImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  loading?: boolean;
}

export function SpeakerImageUpload({ value, onChange, loading }: SpeakerImageUploadProps) {
  const { startUpload, isUploading } = useUploadThing("speakerImage", {
    onClientUploadComplete(files) {
      onChange(files[0].url);
    },
  });

  const isLoading = loading || isUploading;

  return (
    <div className="flex items-center gap-4">
      {value && (
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted">
          <img src={value} alt="Speaker" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
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
          <span>Upload Photo</span>
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