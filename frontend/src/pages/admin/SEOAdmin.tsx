import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { seoApi } from "@/api/seo";
import { SITE_URL } from "@/utils/site";
import type { SEOPage } from "@/types";

const PAGE_LABELS: Record<string, string> = {
  home: "Главная страница",
  catalog: "Каталог",
  about: "О специалисте",
  reviews: "Отзывы",
  contacts: "Контакты",
};

const PAGE_PATHS: Record<string, string> = {
  home: "/",
  catalog: "/catalog",
  about: "/about",
  reviews: "/reviews",
  contacts: "/contacts",
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

  const { register, handleSubmit, reset, watch } = useForm<Partial<SEOPage>>();

  useEffect(() => {
    if (active) reset(active);
  }, [active, reset]);

  const metaTitle = watch("meta_title") ?? "";
  const metaDescription = watch("meta_description") ?? "";
  const ogTitle = watch("og_title") ?? "";
  const ogDescription = watch("og_description") ?? "";
  const ogImage = watch("og_image") ?? "";

  const previewUrl = useMemo(() => {
    const path = PAGE_PATHS[activePage] ?? "/";
    return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  }, [activePage]);

  const titlePreview = metaTitle || `${PAGE_LABELS[activePage]} | Рагулин Роман`;
  const descriptionPreview =
    metaDescription || "Описание страницы пока не заполнено. Добавьте краткий и понятный текст для поисковой выдачи.";

  return (
    <AdminLayout>
      <div className="p-10 max-w-[1320px]">
        <div className="mb-7">
          <h1
            className="font-bold"
            style={{ fontSize: "34px", color: "var(--ink)", letterSpacing: "-0.03em" }}
          >
            SEO
          </h1>
          <p className="text-[16px] mt-2" style={{ color: "var(--ink-4)" }}>
            Метаданные для поисковиков и соцсетей
          </p>
        </div>

        <div className="flex gap-3 mb-8 flex-wrap">
          {Object.entries(PAGE_LABELS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setActivePage(k)}
              className="px-5 py-3 rounded-2xl text-[15px] font-semibold transition-all duration-150"
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

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-7 items-start">
          <div
            className="rounded-[24px] p-8"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-lg)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <h2
              className="font-bold mb-6 pb-4"
              style={{
                fontSize: "20px",
                color: "var(--ink)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {PAGE_LABELS[activePage]}
            </h2>

            <form onSubmit={handleSubmit((d) => updateMut.mutate(d))} className="space-y-5">
              <SeoField label={`Meta Title (${metaTitle.length}/60)`}>
                <input {...register("meta_title")} className="field" style={{ fontSize: "16px" }} />
              </SeoField>
              <SeoField label={`Meta Description (${metaDescription.length}/160)`}>
                <textarea
                  {...register("meta_description")}
                  rows={3}
                  className="field"
                  style={{ fontSize: "16px", resize: "vertical" }}
                />
              </SeoField>
              <SeoField label={`OG Title (${ogTitle.length}/60)`}>
                <input {...register("og_title")} className="field" style={{ fontSize: "16px" }} />
              </SeoField>
              <SeoField label={`OG Description (${ogDescription.length}/160)`}>
                <textarea
                  {...register("og_description")}
                  rows={3}
                  className="field"
                  style={{ fontSize: "16px", resize: "vertical" }}
                />
              </SeoField>
              <SeoField label="OG Image URL">
                <input
                  {...register("og_image")}
                  className="field"
                  style={{ fontSize: "16px" }}
                  placeholder="https://..."
                />
              </SeoField>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updateMut.isPending}
                  className="btn-red"
                  style={{ fontSize: "16px", padding: "0.85rem 1.65rem" }}
                >
                  {updateMut.isPending ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div
              className="rounded-[24px] p-7"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-lg)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] mb-5" style={{ color: "var(--ink-4)" }}>
                Превью в поиске
              </p>
              <div className="space-y-1">
                <p className="text-[15px]" style={{ color: "#1a0dab" }}>
                  {titlePreview}
                </p>
                <p className="text-[13px]" style={{ color: "#006621" }}>
                  {previewUrl}
                </p>
                <p className="text-[15px] leading-7" style={{ color: "var(--ink-3)" }}>
                  {descriptionPreview}
                </p>
              </div>
            </div>

            <div
              className="rounded-[24px] p-7"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-lg)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] mb-5" style={{ color: "var(--ink-4)" }}>
                Превью для соцсетей
              </p>
              <div className="overflow-hidden rounded-[18px]" style={{ border: "1px solid var(--border)" }}>
                <div
                  className="aspect-[1.91/1] flex items-center justify-center text-center px-6"
                  style={{ background: ogImage ? `center / cover no-repeat url(${ogImage})` : "var(--surface-2)" }}
                >
                  {!ogImage && (
                    <span style={{ color: "var(--ink-4)", fontSize: "14px" }}>
                      Здесь будет OG-изображение
                    </span>
                  )}
                </div>
                <div className="p-4" style={{ background: "var(--surface)" }}>
                  <p className="font-semibold text-[16px]" style={{ color: "var(--ink)" }}>
                    {ogTitle || titlePreview}
                  </p>
                  <p className="text-[14px] mt-1.5" style={{ color: "var(--ink-3)", lineHeight: 1.6 }}>
                    {ogDescription || descriptionPreview}
                  </p>
                  <p className="text-[13px] mt-2 uppercase" style={{ color: "var(--ink-5)" }}>
                    {previewUrl.replace(/^https?:\/\//, "")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function SeoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block text-[12px] font-bold uppercase tracking-[0.08em] mb-2.5"
        style={{ color: "var(--ink-4)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
