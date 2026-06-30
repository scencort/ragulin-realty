import { useForm } from "react-hook-form";
import { SlidersHorizontal, X } from "lucide-react";
import type { PropertyFilters } from "@/types";
import { PROPERTY_TYPE_LABELS } from "@/types";

interface Props {
  filters: PropertyFilters;
  onChange: (filters: PropertyFilters) => void;
}

export default function PropertyFilters({ filters, onChange }: Props) {
  const { register, handleSubmit, reset } = useForm<PropertyFilters>({
    defaultValues: filters,
  });

  const onSubmit = (data: PropertyFilters) => {
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined && v !== null && !Number.isNaN(v))
    ) as PropertyFilters;
    onChange({ ...clean, skip: 0 });
  };

  const handleReset = () => {
    reset({});
    onChange({ skip: 0, limit: 12 });
  };

  const hasFilters = Object.entries(filters).some(
    ([k, v]) => !["skip", "limit"].includes(k) && v !== undefined && v !== ""
  );

  return (
    <div
      className="rounded-[20px] overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-lg)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <SlidersHorizontal size={15} style={{ color: "var(--ink-2)" }} />
        <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>Фильтры</span>
        {hasFilters && (
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-1 text-[12px] text-red hover:text-red-hover font-medium"
          >
            <X size={12} /> Сбросить
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
        {[
          {
            label: "Тип недвижимости",
            el: (
              <select {...register("property_type")} className="field text-[14px]">
                <option value="">Все типы</option>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            ),
          },
          {
            label: "Комнат",
            el: (
              <select {...register("rooms", { valueAsNumber: true })} className="field text-[14px]">
                <option value="">Любое</option>
                <option value={1}>1 комната</option>
                <option value={2}>2 комнаты</option>
                <option value={3}>3 комнаты</option>
                <option value={4}>4+ комнаты</option>
              </select>
            ),
          },
        ].map(({ label, el }) => (
          <div key={label}>
            <label className="block text-label font-bold uppercase tracking-widest mb-2" style={{ color: "var(--ink-4)" }}>
              {label}
            </label>
            {el}
          </div>
        ))}

        <div>
          <label className="block text-label font-bold uppercase tracking-widest mb-2" style={{ color: "var(--ink-4)" }}>Цена, ₽</label>
          <div className="grid grid-cols-2 gap-2">
            <input {...register("price_min", { valueAsNumber: true })} placeholder="От" type="number" className="field text-[14px]" />
            <input {...register("price_max", { valueAsNumber: true })} placeholder="До" type="number" className="field text-[14px]" />
          </div>
        </div>

        <div>
          <label className="block text-label font-bold uppercase tracking-widest mb-2" style={{ color: "var(--ink-4)" }}>Площадь, м²</label>
          <div className="grid grid-cols-2 gap-2">
            <input {...register("area_min", { valueAsNumber: true })} placeholder="От" type="number" className="field text-[14px]" />
            <input {...register("area_max", { valueAsNumber: true })} placeholder="До" type="number" className="field text-[14px]" />
          </div>
        </div>

        <button type="submit" className="btn-red w-full justify-center">
          Применить
        </button>
      </form>
    </div>
  );
}
