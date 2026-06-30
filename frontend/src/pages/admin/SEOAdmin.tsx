import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { seoApi } from "@/api/seo";
import type { SEOPage } from "@/types";

const PAGE_LABELS: Record<string, string> = {
  home: "Главная страница",
  catalog: "Каталог",
  about: "О специалисте",
  reviews: "Отзывы",
  contacts: "Контакты",
};

export default function SEOAdmin() {
  const [activePage, setActivePage] = useState("home");
  const qc = useQueryClient();

  const { data: seoList } = useQuery({
    queryKey: ["admin", "seo"],
    queryFn: () => seoApi.list(),
  });

  const active = seoList?.find((s) => s.page === activePage);

  const updateMut = useMutation({
    mutationFn: (data: Partial<SEOPage>) => seoApi.update(activePage, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "seo"] });
      toast.success("SEO настройки сохранены");
    },
    onError: () => toast.error("Ошибка сохранения"),
  });

  const { register, handleSubmit, reset } = useForm<Partial<SEOPage>>();

  useEffect(() => {
    if (active) reset(active);
  }, [active, reset]);

  return (
    <AdminLayout>
      <div className="p-8" style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div className="mb-7">
          <h1
            className="font-bold"
            style={{ fontSize: "26px", color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            SEO
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "var(--ink-4)" }}>
            Метаданные для поисковых систем
          </p>
        </div>

        {/* Page tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {Object.entries(PAGE_LABELS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setActivePage(k)}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150"
              style={
                activePage === k
                  ? { background: "#a20d0f", color: "#fff" }
                  : { background: "var(--surface)", color: "var(--ink-3)", border: "1px solid var(--border-lg)" }
              }
            >
              {v}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div
          className="rounded-[20px] p-7"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-lg)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <h2
            className="font-bold mb-6 pb-4"
            style={{
              fontSize: "16px",
              color: "var(--ink)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {PAGE_LABELS[activePage]}
          </h2>

          <form onSubmit={handleSubmit((d) => updateMut.mutate(d))} className="space-y-5">
            <SeoField label="Meta Title (до 60 символов)">
              <input {...register("meta_title")} className="field" style={{ fontSize: "14px" }} />
            </SeoField>
            <SeoField label="Meta Description (до 160 символов)">
              <textarea
                {...register("meta_description")}
                rows={3}
                className="field"
                style={{ fontSize: "14px", resize: "vertical" }}
              />
            </SeoField>
            <SeoField label="OG Title">
              <input {...register("og_title")} className="field" style={{ fontSize: "14px" }} />
            </SeoField>
            <SeoField label="OG Description">
              <textarea
                {...register("og_description")}
                rows={3}
                className="field"
                style={{ fontSize: "14px", resize: "vertical" }}
              />
            </SeoField>
            <SeoField label="OG Image URL">
              <input
                {...register("og_image")}
                className="field"
                style={{ fontSize: "14px" }}
                placeholder="https://..."
              />
            </SeoField>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updateMut.isPending}
                className="btn-red"
                style={{ fontSize: "14px", padding: "0.65rem 1.5rem" }}
              >
                {updateMut.isPending ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

function SeoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block text-[11px] font-bold uppercase tracking-[0.08em] mb-2"
        style={{ color: "var(--ink-4)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
