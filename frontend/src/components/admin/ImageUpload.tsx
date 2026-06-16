import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { propertiesApi } from "@/api/properties";
import { getImageUrl } from "@/utils/format";
import type { PropertyImage } from "@/types";
import toast from "react-hot-toast";

interface ImageUploadProps {
  propertyId: number;
  images: PropertyImage[];
  onUpdate: () => void;
}

export default function ImageUpload({ propertyId, images, onUpdate }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await propertiesApi.uploadImage(propertyId, files[i], images.length + i);
      }
      onUpdate();
      toast.success("Фото загружены");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId: number) => {
    if (!confirm("Удалить фото?")) return;
    try {
      await propertiesApi.deleteImage(propertyId, imageId);
      onUpdate();
      toast.success("Фото удалено");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  return (
    <div>
      <div
        className="border-2 border-dashed border-border-gray p-8 text-center cursor-pointer hover:border-graphite transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <Upload size={24} className="mx-auto text-text-muted mb-3" />
        <p className="text-sm font-medium text-graphite mb-1">
          {uploading ? "Загрузка..." : "Перетащите фото или нажмите"}
        </p>
        <p className="text-xs text-text-muted">JPG, PNG, WebP · до 15 МБ каждый</p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-square overflow-hidden bg-light-gray">
              <img
                src={getImageUrl(img.image_path)}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => deleteImage(img.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-graphite/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-1.5 left-1.5 text-xs bg-graphite/70 text-white px-1.5 py-0.5">
                #{img.sort_order + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
