import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Star, ExternalLink, Search } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { propertiesApi } from "@/api/properties";
import { PROPERTY_TYPE_LABELS } from "@/types";
import { formatPrice } from "@/utils/format";

export default function PropertiesAdmin() {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "properties-all"],
    queryFn: () => propertiesApi.list({ limit: 100 }),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => propertiesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Объект удалён");
    },
    onError: () => toast.error("Ошибка удаления"),
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, featured }: { id: number; featured: number }) =>
      propertiesApi.update(id, { is_featured: featured }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });

  const filtered = data?.items.filter((p) =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.district.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="font-bold" style={{ fontSize: "22px", color: "#111", letterSpacing: "-0.015em" }}>
              Объекты
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "#999" }}>
              {data?.total ?? 0} объектов в базе
            </p>
          </div>
          <Link to="/admin/properties/new" className="btn-primary">
            <Plus size={16} strokeWidth={2.2} />
            Добавить
          </Link>
        </div>

        {/* Card */}
        <div
          className="rounded-[20px] overflow-hidden"
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          {/* Search bar */}
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#aaa" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию или району..."
                className="field pl-9"
                style={{ fontSize: "14px" }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#FAFAFA" }}>
                  {["Объект", "Тип", "Цена", "Район", "Циан", ""].map((h) => (
                    <th
                      key={h}
                      className={`py-3 text-[11px] font-bold uppercase tracking-[0.07em] ${h === "" ? "text-right pr-5" : "text-left px-5"}`}
                      style={{ color: "#999" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-3 rounded-full animate-pulse" style={{ background: "#F0F0F2", width: j === 0 ? "70%" : "50%" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filtered?.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="text-center py-14" style={{ color: "#999", fontSize: "14px" }}>
                        Объекты не найдены
                      </td>
                    </tr>
                  )
                  : filtered?.map((p) => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                      className="transition-colors hover:bg-[#FAFAFA]"
                    >
                      {/* Title + meta */}
                      <td className="px-5 py-4">
                        <p
                          className="font-medium truncate max-w-[200px]"
                          style={{ fontSize: "14px", color: "#111", letterSpacing: "-0.01em" }}
                        >
                          {p.title}
                        </p>
                        <p className="text-[12px] mt-0.5" style={{ color: "#999" }}>
                          {p.area} м²{p.rooms ? ` · ${p.rooms} комн.` : ""}
                          {p.floor ? ` · ${p.floor}/${p.total_floors} эт.` : ""}
                        </p>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        <span
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(0,0,0,0.05)", color: "#555" }}
                        >
                          {PROPERTY_TYPE_LABELS[p.property_type]}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4">
                        <span className="font-semibold whitespace-nowrap" style={{ fontSize: "14px", color: "#111" }}>
                          {formatPrice(p.price)}
                        </span>
                      </td>

                      {/* District */}
                      <td className="px-5 py-4">
                        <span style={{ fontSize: "13px", color: "#666" }}>{p.district}</span>
                      </td>

                      {/* Cian URL */}
                      <td className="px-5 py-4">
                        {p.cian_url ? (
                          <a
                            href={p.cian_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors"
                            style={{ color: "#E31E24" }}
                            title={p.cian_url}
                          >
                            <ExternalLink size={12} strokeWidth={2} />
                            ЦИАН
                          </a>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#ccc" }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="pr-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleFeatured.mutate({ id: p.id, featured: p.is_featured ? 0 : 1 })}
                            title={p.is_featured ? "Убрать с главной" : "На главную"}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                            style={{
                              background: p.is_featured ? "rgba(234,179,8,0.12)" : "transparent",
                              color: p.is_featured ? "#CA8A04" : "#ccc",
                            }}
                          >
                            <Star size={14} fill={p.is_featured ? "currentColor" : "none"} />
                          </button>
                          <Link
                            to={`/admin/properties/${p.id}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-black/5"
                            style={{ color: "#888" }}
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => { if (confirm(`Удалить «${p.title}»?`)) deleteMut.mutate(p.id); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-50"
                            style={{ color: "#ccc" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#E31E24")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#ccc")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
