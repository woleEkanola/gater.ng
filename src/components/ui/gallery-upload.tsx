"use client";

import { generateReactHelpers } from "@uploadthing/react";
import { Plus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

import type { AppFileRouter } from "@/lib/uploadthing";

const { useUploadThing } = generateReactHelpers<AppFileRouter>();

interface GalleryUploadProps {
  onUpload: (url: string) => void;
  isUploading?: boolean;
}

export function GalleryUpload({ onUpload, isUploading }: GalleryUploadProps) {
  const { startUpload } = useUploadThing("galleryImage", {
    onClientUploadComplete(files) {
      onUpload(files[0].url);
    },
  });

  return (
    <label className={cn(
      "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors",
      isUploading && "opacity-50 cursor-not-allowed"
    )}>
      {isUploading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Uploading...</span>
        </div>
      ) : (
        <>
          <Plus className="w-6 h-6 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Add Images</span>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={isUploading}
        onChange={async (e) => {
          const files = e.target.files;
          if (!files || files.length === 0) return;
          await startUpload(Array.from(files));
        }}
      />
    </label>
  );
}