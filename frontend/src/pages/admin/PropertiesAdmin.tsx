import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, ExternalLink, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { propertiesApi } from "@/api/properties";
import { PROPERTY_BADGE_LABELS, PROPERTY_TYPE_LABELS } from "@/types";
import { formatPrice } from "@/utils/format";

export default function PropertiesAdmin() {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "properties-all", search],
    queryFn: () => propertiesApi.adminList({ limit: 200, search: search || undefined }),
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

  const togglePublished = useMutation({
    mutationFn: ({ id, published }: { id: number; published: number }) =>
      propertiesApi.update(id, { is_published: published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });

  return (
    <AdminLayout>
      <div className="p-8 max-w-[1240px]">
        <div className="flex items-center justify-between mb-7 gap-4">
          <div>
            <h1 className="font-bold" style={{ fontSize: "26px", color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Объекты
            </h1>
            <p className="text-[14px] mt-1" style={{ color: "var(--ink-4)" }}>
              {data?.total ?? 0} объектов в базе
            </p>
          </div>
          <Link to="/admin/properties/new" className="btn-red" style={{ fontSize: "14px", padding: "0.6rem 1.25rem" }}>
            <Plus size={15} strokeWidth={2.5} />
            Добавить
          </Link>
        </div>

        <div
          className="rounded-[20px] overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-lg)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="relative max-w-md">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--ink-5)" }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию, адресу или району..."
                className="field pl-9"
                style={{ fontSize: "14px" }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                  {["Объект", "Тип", "Цена", "Статус", "Бейджи", "ЦИАН", ""].map((h) => (
                    <th
                      key={h}
                      className={`py-3 text-[11px] font-bold uppercase tracking-[0.07em] ${h === "" ? "text-right pr-5" : "text-left px-5"}`}
                      style={{ color: "var(--ink-4)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div
                            className="h-3 rounded-full animate-pulse"
                            style={{ background: "var(--skeleton)", width: j === 0 ? "70%" : "50%" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !data?.items.length ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16" style={{ color: "var(--ink-4)", fontSize: "14px" }}>
                      Объекты не найдены
                    </td>
                  </tr>
                ) : (
                  data.items.map((p) => (
                    <tr key={p.id} className="group" style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-5 py-4">
                        <p className="font-semibold truncate max-w-[260px]" style={{ fontSize: "14px", color: "var(--ink)", letterSpacing: "-0.01em" }}>
                          {p.title}
                        </p>
                        <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-4)" }}>
                          {p.address}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "var(--surface-3)", color: "var(--ink-3)" }}
                        >
                          {PROPERTY_TYPE_LABELS[p.property_type]}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-bold whitespace-nowrap" style={{ fontSize: "14px", color: "var(--ink)", letterSpacing: "-0.01em" }}>
                          {formatPrice(p.price)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit"
                            style={{
                              background: p.is_published ? "rgba(22,163,74,0.1)" : "rgba(161,161,170,0.12)",
                              color: p.is_published ? "#15803d" : "var(--ink-4)",
                            }}
                          >
                            {p.is_published ? "Опубликован" : "Черновик"}
                          </span>
                          {p.is_featured === 1 && (
                            <span className="text-[11px] font-semibold" style={{ color: "#CA8A04" }}>
                              На главной
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                          {(p.badges ?? []).length ? (
                            (p.badges ?? []).map((badge) => (
                              <span
                                key={badge}
                                className="text-[11px] px-2 py-1 rounded-full"
                                style={{ background: "var(--surface-3)", color: "var(--ink-3)" }}
                              >
                                {PROPERTY_BADGE_LABELS[badge as keyof typeof PROPERTY_BADGE_LABELS] ?? badge}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: "12px", color: "var(--ink-5)" }}>—</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {p.cian_url ? (
                          <a
                            href={p.cian_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition-opacity hover:opacity-70"
                            style={{ color: "#a20d0f" }}
                          >
                            <ExternalLink size={11} strokeWidth={2.2} />
                            ЦИАН
                          </a>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--ink-5)" }}>—</span>
                        )}
                      </td>

                      <td className="pr-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => togglePublished.mutate({ id: p.id, published: p.is_published ? 0 : 1 })}
                            title={p.is_published ? "Снять с публикации" : "Опубликовать"}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: "var(--surface-3)", color: p.is_published ? "#15803d" : "var(--ink-5)" }}
                          >
                            {p.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => toggleFeatured.mutate({ id: p.id, featured: p.is_featured ? 0 : 1 })}
                            title={p.is_featured ? "Убрать с главной" : "Поставить на главную"}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                            style={{
                              background: p.is_featured ? "rgba(234,179,8,0.12)" : "var(--surface-3)",
                              color: p.is_featured ? "#CA8A04" : "var(--ink-5)",
                            }}
                          >
                            <Star size={14} fill={p.is_featured ? "currentColor" : "none"} />
                          </button>
                          <Link
                            to={`/admin/properties/${p.id}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: "var(--surface-3)", color: "var(--ink-3)" }}
                          >
                            <Pencil size={13} strokeWidth={2} />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm(`Удалить «${p.title}»?`)) deleteMut.mutate(p.id);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: "var(--surface-3)", color: "var(--ink-5)" }}
                          >
                            <Trash2 size={13} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
