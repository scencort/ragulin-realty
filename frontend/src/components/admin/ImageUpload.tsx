import { useRef, useState } from "react";
import { GripVertical, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { propertiesApi } from "@/api/properties";
import type { PropertyImage } from "@/types";
import { getImageUrl } from "@/utils/format";

interface ImageUploadProps {
  propertyId: number;
  images: PropertyImage[];
  onUpdate: () => void;
}

export default function ImageUpload({ propertyId, images, onUpdate }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const [localOrder, setLocalOrder] = useState<PropertyImage[]>([...images].sort((a, b) => a.sort_order - b.sort_order));
  const fileRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const prevImages = useRef(images);

  if (prevImages.current !== images) {
    prevImages.current = images;
    setLocalOrder([...images].sort((a, b) => a.sort_order - b.sort_order));
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i += 1) {
        await propertiesApi.uploadImage(propertyId, files[i], localOrder.length + i);
      }
      onUpdate();
      toast.success("Фото загружены");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
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

  const onDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const onDragEnter = (index: number) => {
    if (dragIndex.current === null || dragIndex.current === index) return;

    const newOrder = [...localOrder];
    const [moved] = newOrder.splice(dragIndex.current, 1);
    newOrder.splice(index, 0, moved);
    dragIndex.current = index;
    setLocalOrder(newOrder);
  };

  const onDragEnd = async () => {
    dragIndex.current = null;
    setSaving(true);

    try {
      await propertiesApi.reorderImages(propertyId, localOrder.map((img) => img.id));
      onUpdate();
    } catch {
      toast.error("Не удалось сохранить порядок");
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div
        className="rounded-[14px] border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
        style={{
          borderColor: dropActive ? "rgba(162,13,15,0.35)" : "var(--border-xl)",
          background: dropActive ? "rgba(162,13,15,0.05)" : "var(--surface-2)",
        }}
        onClick={() => fileRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDropActive(true);
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDropActive(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <Upload size={22} className="mx-auto mb-3" style={{ color: "var(--ink-4)" }} />
        <p className="text-[14px] font-semibold" style={{ color: "var(--ink-2)" }}>
          {uploading ? "Загрузка..." : dropActive ? "Отпустите фото для загрузки" : "Перетащите фото или нажмите"}
        </p>
        <p className="text-[12px] mt-1" style={{ color: "var(--ink-4)" }}>
          JPG, PNG, WebP · до 15 МБ каждый
        </p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {localOrder.length > 0 && (
        <>
          <div className="flex items-center justify-between mt-5 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--ink-4)" }}>
              {localOrder.length} фото · перетащите для изменения порядка
            </p>
            {saving && (
              <p className="text-[12px]" style={{ color: "var(--ink-4)" }}>
                Сохраняю порядок...
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {localOrder.map((img, index) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => onDragStart(index)}
                onDragEnter={() => onDragEnter(index)}
                onDragEnd={onDragEnd}
                onDragOver={(event) => event.preventDefault()}
                className="relative group rounded-[10px] overflow-hidden cursor-grab active:cursor-grabbing select-none"
                style={{
                  aspectRatio: "16/9",
                  background: "var(--surface-3)",
                  border: "1px solid var(--border-lg)",
                  outline: dragIndex.current === index ? "2px solid #a20d0f" : "none",
                }}
              >
                <img
                  src={getImageUrl(img.image_path)}
                  alt=""
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />

                <div
                  className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-0.5"
                  style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
                >
                  <GripVertical size={13} />
                </div>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteImage(img.id);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                >
                  <X size={12} />
                </button>

                <div
                  className="absolute bottom-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
                >
                  {index === 0 ? "Обложка" : `#${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
