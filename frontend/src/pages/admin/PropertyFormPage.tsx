import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, ExternalLink, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import ImageUpload from "@/components/admin/ImageUpload";
import { propertiesApi } from "@/api/properties";
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS } from "@/types";

const schema = z.object({
  title:        z.string().min(3, "Минимум 3 символа"),
  property_type:z.enum(["apartment","house","commercial","land","garage","townhouse"]),
  status:       z.enum(["sale","rent","sold","rented"]),
  price:        z.number({ invalid_type_error: "Введите цену" }).positive("Цена должна быть > 0"),
  area:         z.number({ invalid_type_error: "Введите площадь" }).positive("Площадь должна быть > 0"),
  rooms:        z.number().nullable().optional(),
  floor:        z.number().nullable().optional(),
  total_floors: z.number().nullable().optional(),
  address:      z.string().min(3, "Минимум 3 символа"),
  district:     z.string().min(2, "Укажите район"),
  latitude:     z.number().nullable().optional(),
  longitude:    z.number().nullable().optional(),
  description:  z.string().optional(),
  advantages:   z.string().optional(),
  cian_url:     z.string().url("Неверный URL").optional().or(z.literal("")),
  is_featured:  z.number().optional(),
  slug:         z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function PropertyFormPage() {
  const { id }  = useParams<{ id: string }>();
  const isNew   = id === "new";
  const navigate = useNavigate();
  const qc      = useQueryClient();

  const { data: property } = useQuery({
    queryKey: ["admin", "property", id],
    queryFn: () => propertiesApi.list({ limit: 200 }).then((r) => r.items.find((p) => p.id === Number(id))),
    enabled: !isNew,
  });

  const [cianUrl, setCianUrl] = useState("");
  const [parsing, setParsing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { property_type: "apartment", status: "sale", is_featured: 0 },
  });

  const handleParseCian = async () => {
    if (!cianUrl.trim()) return toast.error("Введите ссылку на ЦИАН");
    setParsing(true);
    try {
      const result = await propertiesApi.parseCian(cianUrl.trim());
      toast.success(`Загружено: ${result.title} · ${result.photos} фото`);
      navigate(`/admin/properties/${result.id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Ошибка парсинга. Попробуйте ещё раз.");
    } finally {
      setParsing(false);
    }
  };

  useEffect(() => {
    if (property) {
      reset({
        ...property,
        price:     Number(property.price),
        area:      Number(property.area),
        latitude:  property.latitude  ? Number(property.latitude)  : null,
        longitude: property.longitude ? Number(property.longitude) : null,
        advantages: property.advantages?.join("\n") ?? "",
        cian_url:  property.cian_url ?? "",
      });
    }
  }, [property, reset]);

  const createMut = useMutation({
    mutationFn: (data: Partial<typeof property>) => propertiesApi.create(data),
    onSuccess: (p) => {
      toast.success("Объект создан");
      qc.invalidateQueries({ queryKey: ["admin"] });
      navigate(`/admin/properties/${p.id}`);
    },
    onError: () => toast.error("Ошибка создания"),
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<typeof property>) => propertiesApi.update(Number(id), data),
    onSuccess: () => {
      toast.success("Изменения сохранены");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Ошибка сохранения"),
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      advantages: data.advantages ? data.advantages.split("\n").filter(Boolean) : [],
      cian_url: data.cian_url || null,
    };
    if (isNew) createMut.mutate(payload as never);
    else updateMut.mutate(payload as never);
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-3xl">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-7">
          <Link
            to="/admin/properties"
            className="inline-flex items-center gap-1 text-[13px] transition-colors"
            style={{ color: "#999" }}
          >
            <ChevronLeft size={15} /> Объекты
          </Link>
          <span style={{ color: "#ddd" }}>/</span>
          <h1 className="font-bold" style={{ fontSize: "18px", color: "#111", letterSpacing: "-0.015em" }}>
            {isNew ? "Новый объект" : property?.title || "Редактирование"}
          </h1>
          {!isNew && property?.cian_url && (
            <a
              href={property.cian_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] font-medium ml-auto"
              style={{ color: "#E31E24" }}
            >
              <ExternalLink size={13} />
              Открыть на ЦИАН
            </a>
          )}
        </div>

        {/* ── Парсер ЦИАН (только для новых объектов) ── */}
        {isNew && (
          <div
            className="rounded-[16px] p-6 mb-6"
            style={{ background: "#fff8f8", border: "2px solid rgba(227,30,36,0.15)" }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.07em] mb-1" style={{ color: "#E31E24" }}>
              Загрузить с ЦИАН
            </p>
            <p className="text-[13px] mb-4" style={{ color: "#888" }}>
              Вставьте ссылку — данные и фото подтянутся автоматически. Займёт 30–60 секунд.
            </p>
            <div className="flex gap-3">
              <input
                value={cianUrl}
                onChange={(e) => setCianUrl(e.target.value)}
                placeholder="https://www.cian.ru/sale/flat/123456789/"
                className="field flex-1"
                disabled={parsing}
                onKeyDown={(e) => e.key === "Enter" && handleParseCian()}
              />
              <button
                type="button"
                onClick={handleParseCian}
                disabled={parsing}
                className="btn-red flex-shrink-0"
                style={{ minWidth: 140 }}
              >
                {parsing ? (
                  <><Loader2 size={15} className="animate-spin" /> Загружаю...</>
                ) : (
                  <><Download size={15} /> Загрузить</>
                )}
              </button>
            </div>
            {parsing && (
              <p className="text-[12px] mt-3 animate-pulse" style={{ color: "#E31E24" }}>
                Открываю браузер, скроллю страницу, скачиваю фото... не закрывайте вкладку
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── Основная информация ── */}
          <Card title="Основная информация">
            <Field label="Заголовок *" error={errors.title?.message}>
              <input {...register("title")} className="field" placeholder="2-комн. кв. 48 м², Кутузовский проезд" />
            </Field>
            <Row>
              <Field label="Тип недвижимости *">
                <select {...register("property_type")} className="field">
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Статус *">
                <select {...register("status")} className="field">
                  {Object.entries(PROPERTY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="На главной">
                <select {...register("is_featured", { valueAsNumber: true })} className="field">
                  <option value={0}>Нет</option>
                  <option value={1}>Да ★</option>
                </select>
              </Field>
            </Row>
            <Row cols={3}>
              <Field label="Цена, ₽ *" error={errors.price?.message}>
                <input {...register("price", { valueAsNumber: true })} type="number" className="field" placeholder="58000000" />
              </Field>
              <Field label="Площадь, м² *" error={errors.area?.message}>
                <input {...register("area", { valueAsNumber: true })} type="number" step="0.1" className="field" placeholder="48.8" />
              </Field>
              <Field label="Комнат">
                <input {...register("rooms", { setValueAs: (v) => v === "" ? null : Number(v) })} type="number" className="field" placeholder="2" />
              </Field>
            </Row>
            <Row cols={2}>
              <Field label="Этаж">
                <input {...register("floor", { setValueAs: (v) => v === "" ? null : Number(v) })} type="number" className="field" placeholder="21" />
              </Field>
              <Field label="Всего этажей">
                <input {...register("total_floors", { setValueAs: (v) => v === "" ? null : Number(v) })} type="number" className="field" placeholder="46" />
              </Field>
            </Row>
          </Card>

          {/* ── Расположение ── */}
          <Card title="Расположение">
            <Field label="Адрес *" error={errors.address?.message}>
              <input {...register("address")} className="field" placeholder="Кутузовский проезд, 16А/1" />
            </Field>
            <Field label="Район *" error={errors.district?.message}>
              <input {...register("district")} className="field" placeholder="ЗАО, Дорогомилово" />
            </Field>
            <Row cols={2}>
              <Field label="Широта (lat)">
                <input {...register("latitude", { setValueAs: (v) => v === "" ? null : Number(v) })} type="number" step="any" className="field" placeholder="55.751244" />
              </Field>
              <Field label="Долгота (lng)">
                <input {...register("longitude", { setValueAs: (v) => v === "" ? null : Number(v) })} type="number" step="any" className="field" placeholder="37.618423" />
              </Field>
            </Row>
          </Card>

          {/* ── Описание ── */}
          <Card title="Описание и преимущества">
            <Field label="Описание">
              <textarea
                {...register("description")}
                rows={6}
                className="field"
                style={{ resize: "vertical" }}
                placeholder="Подробное описание объекта..."
              />
            </Field>
          </Card>

          {/* ── Источник и SEO ── */}
          <Card title="Источник и SEO">
            <Field label="Ссылка на ЦИАН" error={errors.cian_url?.message}>
              <div className="relative">
                <input
                  {...register("cian_url")}
                  className="field pr-10"
                  placeholder="https://www.cian.ru/sale/flat/328810696/"
                />
                <ExternalLink
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "#ccc" }}
                />
              </div>
            </Field>
            <Field label="Slug URL (генерируется автоматически)">
              <input {...register("slug")} className="field mt-4" placeholder="2-komn-kv-48-m2-kutuzovskiy" />
            </Field>
          </Card>

          {/* ── Кнопки ── */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting
                ? "Сохранение..."
                : isNew ? "Создать объект" : "Сохранить изменения"}
            </button>
            <Link
              to="/admin/properties"
              className="btn-glass"
            >
              Отмена
            </Link>
            {!isNew && isDirty && (
              <span className="text-[12px]" style={{ color: "#F59E0B" }}>
                Есть несохранённые изменения
              </span>
            )}
          </div>
        </form>

        {/* ── Фотографии ── */}
        {!isNew && property && (
          <div className="mt-6">
            <Card title="Фотографии">
              <ImageUpload
                propertyId={Number(id)}
                images={property.images}
                onUpdate={() => qc.invalidateQueries({ queryKey: ["admin", "property", id] })}
              />
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[16px] p-6"
      style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      <h2
        className="font-bold pb-4 mb-4"
        style={{ fontSize: "13px", color: "#111", letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div className={`grid gap-4 grid-cols-${cols}`}>{children}</div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>
        {label}
      </label>
      {children}
      {error && <p className="text-[12px] mt-1.5 text-red">{error}</p>}
    </div>
  );
}
