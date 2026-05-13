"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { generateReactHelpers } from "@uploadthing/react";
import { X, Loader2, Upload, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { AppFileRouter } from "@/lib/uploadthing";

const { useUploadThing } = generateReactHelpers<AppFileRouter>();

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      }, "image/jpeg", 0.95);
    };
    image.onerror = () => reject(new Error("Failed to load image"));
  });
}

interface BannerCropUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export function BannerCropUpload({ value, onChange, className }: BannerCropUploadProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing("eventBanner", {
    onClientUploadComplete(files) {
      onChange(files[0].url);
      setIsUploading(false);
      setIsModalOpen(false);
      setImageSrc(null);
    },
    onUploadError(error) {
      console.error("Upload error:", error);
      setIsUploading(false);
    },
  });

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setIsModalOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleCropAndUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([blob], "cropped-banner.jpg", { type: "image/jpeg" });
      await startUpload([file]);
    } catch (error) {
      console.error("Crop/upload error:", error);
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Existing banner preview */}
      {value && (
        <div className="relative w-full rounded-lg overflow-hidden border group" style={{ aspectRatio: "2/1" }}>
          <img src={value} alt="Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
            <label className="cursor-pointer px-4 py-2 bg-white rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Change Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!value && (
        <label className={cn(
          "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg transition-colors cursor-pointer hover:border-primary",
          "p-8"
        )} style={{ aspectRatio: "2/1" }}>
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Click to upload banner</span>
          <span className="text-xs text-muted-foreground mt-1">Recommended: 1200x600px (2:1 ratio)</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}

      {/* Crop Modal */}
      {isModalOpen && imageSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg w-full max-w-3xl overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">Crop Banner</h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setImageSrc(null);
                }}
                className="p-1 hover:bg-muted rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cropper */}
            <div className="flex-1 relative" style={{ minHeight: "300px" }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={2}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={true}
                classes={{
                  containerClassName: "w-full h-full",
                  cropAreaClassName: "border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]",
                  mediaClassName: "max-w-full max-h-full",
                }}
              />
            </div>

            {/* Controls */}
            <div className="px-4 py-3 border-t space-y-3">
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-muted-foreground" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
                <ZoomIn className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setImageSrc(null);
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button onClick={handleCropAndUpload} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Crop & Upload"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
