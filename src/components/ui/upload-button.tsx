"use client";

import { generateReactHelpers } from "@uploadthing/react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import type { AppFileRouter } from "@/lib/uploadthing";

const { useUploadThing } = generateReactHelpers<AppFileRouter>();

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  loading?: boolean;
}

export function ImageUpload({ value, onChange, className, loading }: ImageUploadProps) {
  const { startUpload, isUploading } = useUploadThing("eventBanner", {
    onClientUploadComplete(files) {
      onChange(files[0].url);
    },
  });

  const isLoading = loading || isUploading;

  return (
    <div className={cn("space-y-4", className)}>
      {value && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden border group">
          <img src={value} alt="Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isLoading ? (
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </div>
            ) : (
              <label className="cursor-pointer px-4 py-2 bg-white rounded-lg text-sm font-medium hover:bg-gray-100">
                Change Image
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
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {!value && (
        <label className={cn(
          "flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
          isLoading ? "opacity-50 cursor-not-allowed" : "border-gray-300 hover:border-blue-500"
        )}>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Click to upload banner</span>
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
      )}
    </div>
  );
}