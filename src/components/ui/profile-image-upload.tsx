"use client";

import { generateReactHelpers } from "@uploadthing/react";
import { X, Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

import type { AppFileRouter } from "@/lib/uploadthing";

const { useUploadThing } = generateReactHelpers<AppFileRouter>();

interface ProfileImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  loading?: boolean;
}

export function ProfileImageUpload({ value, onChange, loading }: ProfileImageUploadProps) {
  const { startUpload, isUploading } = useUploadThing("profileImage", {
    onClientUploadComplete(files) {
      onChange(files[0].url);
    },
  });

  const isLoading = loading || isUploading;

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          "w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center",
          isLoading && "opacity-50"
        )}
      >
        {value ? (
          <img src={value} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-8 h-8 text-muted-foreground" />
        )}
      </div>

      <label
        className={cn(
          "absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-md hover:bg-primary/90 transition-colors",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
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

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
          title="Remove image"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
