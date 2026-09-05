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
    <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Geo-Tagged Field Photographs</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {photos.length} Attached
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Live Camera (environment capture) */}
        <label className="py-3 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-all">
          <Camera className="w-5 h-5 text-emerald-400" />
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
        <label className="py-3 px-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-all">
          <Upload className="w-5 h-5 text-slate-400" />
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
            <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.dataUrl} alt={photo.caption || "Photo"} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-1.5">
                <button
                  type="button"
                  onClick={() => onRemovePhoto(photo.id)}
                  className="self-end p-1 rounded-md bg-red-600/80 text-white hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <span className="text-[9px] font-mono text-slate-300 truncate uppercase">
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
