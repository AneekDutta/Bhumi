"use client";

import React from "react";
import { Camera, Upload, Trash2 } from "lucide-react";
import { CapturedPhoto } from "@/lib/native/camera";

interface CapturePhotoProps {
  photos: CapturedPhoto[];
  onAddPhoto: (photo: CapturedPhoto) => void;
  onRemovePhoto: (id: string) => void;
  currentCoords?: { lat: number; lng: number };
}

export function CapturePhoto({
  photos,
  onAddPhoto,
  onRemovePhoto,
  currentCoords
}: CapturePhotoProps) {
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, category: CapturedPhoto["category"]) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const newPhoto: CapturedPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        dataUrl: event.target?.result as string,
        category,
        caption: `${category.toUpperCase()} photo at survey site`,
        timestamp: new Date().toLocaleTimeString(),
        lat: currentCoords?.lat,
        lng: currentCoords?.lng
      };
      onAddPhoto(newPhoto);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0B2E59] dark:text-white">
          <Camera className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
          <span>Geo-Tagged Field Photographs</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#0B2E59] dark:text-sky-300 bg-[#E6F0FA] dark:bg-sky-950/40 px-2 py-0.5 rounded-[2px] border border-[#B8D5ED] dark:border-sky-800/40">
          {photos.length} Attached
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Live Camera (environment capture) */}
        <label className="py-3 px-3 rounded-[4px] bg-[#E8F5E9] dark:bg-emerald-950/30 hover:bg-[#C8E6C9] dark:hover:bg-emerald-900/40 border border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300 text-xs font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-colors shadow-xs">
          <Camera className="w-5 h-5 text-[#1E7E34] dark:text-emerald-400" />
          <span>Take Live Photo</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileInput(e, "boundary")}
            className="hidden"
          />
        </label>

        {/* Gallery / File Picker */}
        <label className="py-3 px-3 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] hover:bg-[#F4F6F8] dark:hover:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#0B2E59] dark:text-slate-200 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-colors shadow-xs">
          <Upload className="w-5 h-5 text-[#0B2E59] dark:text-sky-400" />
          <span>Gallery / Storage</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileInput(e, "structure")}
            className="hidden"
          />
        </label>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group rounded-[3px] overflow-hidden border border-[#DCE2E8] dark:border-white/10 bg-slate-900 aspect-square shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.dataUrl} alt={photo.caption || "Photo"} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-1.5">
                <button
                  type="button"
                  onClick={() => onRemovePhoto(photo.id)}
                  className="self-end p-1 rounded-[2px] bg-[#B32424] text-white hover:bg-[#8F1D1D] transition-colors cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <span className="text-[9px] font-mono text-slate-200 truncate uppercase font-bold">
                  {photo.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
