import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
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
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-graphite mb-6">SEO</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {Object.entries(PAGE_LABELS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setActivePage(k)}
              className={`px-4 py-2 text-sm font-medium border transition-colors ${
                activePage === k ? "bg-graphite text-white border-graphite" : "border-border-gray text-graphite hover:border-graphite"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="bg-white p-6 card-shadow">
          <h2 className="text-sm font-bold text-graphite mb-5 pb-3 border-b border-border-gray">
            {PAGE_LABELS[activePage]}
          </h2>

          <form onSubmit={handleSubmit((d) => updateMut.mutate(d))} className="space-y-4">
            <Field label="Meta Title (до 60 символов)">
              <input {...register("meta_title")} className="input-field text-sm" />
            </Field>
            <Field label="Meta Description (до 160 символов)">
              <textarea {...register("meta_description")} rows={2} className="input-field text-sm resize-none" />
            </Field>
            <Field label="OG Title">
              <input {...register("og_title")} className="input-field text-sm" />
            </Field>
            <Field label="OG Description">
              <textarea {...register("og_description")} rows={2} className="input-field text-sm resize-none" />
            </Field>
            <Field label="OG Image URL">
              <input {...register("og_image")} className="input-field text-sm" placeholder="https://..." />
            </Field>

            <button type="submit" disabled={updateMut.isPending} className="btn-primary">
              {updateMut.isPending ? "Сохранение..." : "Сохранить"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}
