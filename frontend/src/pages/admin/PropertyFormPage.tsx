import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, ExternalLink, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import ImageUpload from "@/components/admin/ImageUpload";
import { propertiesApi } from "@/api/properties";
import { PROPERTY_BADGE_LABELS, PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS } from "@/types";
import type { Property } from "@/types";

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
  renovation:   z.string().optional(),
  year_built:   z.number().nullable().optional(),
  cian_url:     z.string().url("Неверный URL").optional().or(z.literal("")),
  is_featured:  z.number().optional(),
  is_published: z.number().optional(),
  badges:       z.array(z.enum(["new", "price_reduced", "exclusive", "urgent"])).optional(),
  slug:         z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const BADGE_OPTIONS = ["new", "price_reduced", "exclusive", "urgent"] as const;

export default function PropertyFormPage() {
  const { id }  = useParams<{ id: string }>();
  const isNew   = id === "new";
  const navigate = useNavigate();
  const qc      = useQueryClient();

  const { data: property } = useQuery({
    queryKey: ["admin", "property", id],
    queryFn: () => propertiesApi.adminGet(Number(id)),
    enabled: !isNew,
  });

  const [cianUrl, setCianUrl] = useState("");
  const [parsing, setParsing] = useState(false);

  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { property_type: "apartment", status: "sale", is_featured: 0, is_published: 1, badges: [] },
  });

  const propertyType = watch("property_type");
  const hasFloors = !["house", "townhouse", "land"].includes(propertyType);

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
        renovation: property.renovation ?? "",
        year_built: property.year_built ?? null,
        cian_url:  property.cian_url ?? "",
        is_published: property.is_published ?? 1,
        badges: property.badges ?? [],
      } as FormData);
    }
  }, [property, reset]);

  const createMut = useMutation({
    mutationFn: (data: Partial<Property>) => propertiesApi.create(data),
    onSuccess: (p) => {
      toast.success("Объект создан");
      qc.invalidateQueries({ queryKey: ["admin"] });
      navigate(`/admin/properties/${p.id}`);
    },
    onError: () => toast.error("Ошибка создания"),
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<Property>) => propertiesApi.update(Number(id), data),
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
      renovation: data.renovation || null,
      year_built: data.year_built || null,
      badges: data.badges ?? [],
    };
    if (isNew) createMut.mutate(payload as never);
    else updateMut.mutate(payload as never);
  };

  return (
    <AdminLayout>
      <div className="p-10 max-w-5xl">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/admin/properties"
            className="inline-flex items-center gap-1.5 text-[15px] transition-colors"
            style={{ color: "var(--ink-4)" }}
          >
            <ChevronLeft size={15} /> Объекты
          </Link>
          <span style={{ color: "var(--ink-5)" }}>/</span>
          <h1 className="font-bold" style={{ fontSize: "30px", color: "var(--ink)", letterSpacing: "-0.025em" }}>
            {isNew ? "Новый объект" : property?.title || "Редактирование"}
          </h1>
          {!isNew && property?.cian_url && (
            <a
              href={property.cian_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[14px] font-medium ml-auto"
              style={{ color: "#a20d0f" }}
            >
              <ExternalLink size={13} />
              Открыть на ЦИАН
            </a>
          )}
        </div>

        {/* ── Парсер ЦИАН (только для новых объектов) ── */}
        {isNew && (
          <div
            className="rounded-[20px] p-7 mb-7"
            style={{ background: "rgba(162,13,15,0.05)", border: "2px solid rgba(162,13,15,0.15)" }}
          >
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] mb-2" style={{ color: "#a20d0f" }}>
              Загрузить с ЦИАН
            </p>
            <p className="text-[15px] mb-5" style={{ color: "var(--ink-4)" }}>
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
                style={{ minWidth: 168, fontSize: "16px" }}
              >
                {parsing ? (
                  <><Loader2 size={15} className="animate-spin" /> Загружаю...</>
                ) : (
                  <><Download size={15} /> Загрузить</>
                )}
              </button>
            </div>
            {parsing && (
              <p className="text-[14px] mt-4 animate-pulse" style={{ color: "#a20d0f" }}>
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
              <Field label="Публикация">
                <select {...register("is_published", { valueAsNumber: true })} className="field">
                  <option value={1}>Опубликован</option>
                  <option value={0}>Черновик</option>
                </select>
              </Field>
            </Row>
            <Field label="Статусы на карточке">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BADGE_OPTIONS.map((badge) => (
                  <label
                    key={badge}
                    className="flex items-center gap-3.5 rounded-[16px] px-5 py-4"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  >
                    <input
                      type="checkbox"
                      value={badge}
                      {...register("badges")}
                      className="h-5 w-5 accent-[var(--accent)]"
                    />
                    <span style={{ color: "var(--ink)", fontSize: "16px", fontWeight: 500 }}>
                      {PROPERTY_BADGE_LABELS[badge]}
                    </span>
                  </label>
                ))}
              </div>
            </Field>
            <Row cols={3}>
              <Field label="Цена, ₽ *" error={errors.price?.message}>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <PriceInput
                      value={field.value as number | null | undefined}
                      onChange={field.onChange}
                      placeholder="175 000 000"
                    />
                  )}
                />
              </Field>
              <Field label="Площадь, м² *" error={errors.area?.message}>
                <input {...register("area", { valueAsNumber: true })} type="number" step="0.1" className="field" placeholder="48.8" />
              </Field>
              <Field label="Комнат">
                <input {...register("rooms", { setValueAs: (v) => v === "" ? null : Number(v) })} type="number" className="field" placeholder="2" />
              </Field>
            </Row>
            <Row cols={hasFloors ? 2 : 1}>
              {hasFloors && (
                <Field label="Этаж">
                  <input {...register("floor", { setValueAs: (v) => v === "" ? null : Number(v) })} type="number" className="field" placeholder="21" />
                </Field>
              )}
              <Field label={hasFloors ? "Всего этажей" : "Количество этажей"}>
                <input {...register("total_floors", { setValueAs: (v) => v === "" ? null : Number(v) })} type="number" className="field" placeholder="2" />
              </Field>
            </Row>
            <Row cols={2}>
              <Field label="Состояние ремонта">
                <select {...register("renovation")} className="field">
                  <option value="">— не указано —</option>
                  <option value="Без ремонта">Без ремонта</option>
                  <option value="Косметический">Косметический</option>
                  <option value="Евроремонт">Евроремонт</option>
                  <option value="Дизайнерский">Дизайнерский</option>
                  <option value="Черновая отделка">Черновая отделка</option>
                  <option value="Предчистовая отделка">Предчистовая отделка</option>
                </select>
              </Field>
              <Field label="Год постройки">
                <input {...register("year_built", { setValueAs: (v) => v === "" ? null : Number(v) })} type="number" className="field" placeholder="2018" />
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
                  style={{ color: "var(--ink-5)" }}
                />
              </div>
            </Field>
            <Field label="Slug URL (генерируется автоматически)">
              <input {...register("slug")} className="field mt-4" placeholder="2-komn-kv-48-m2-kutuzovskiy" />
            </Field>
          </Card>

          {/* ── Кнопки ── */}
          <div className="flex items-center gap-4 pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ fontSize: "16px", padding: "0.95rem 1.75rem" }}
            >
              {isSubmitting
                ? "Сохранение..."
                : isNew ? "Создать объект" : "Сохранить изменения"}
            </button>
            <Link
              to="/admin/properties"
              className="btn-glass"
              style={{ fontSize: "16px", padding: "0.95rem 1.75rem" }}
            >
              Отмена
            </Link>
            {!isNew && isDirty && (
              <span className="text-[14px] font-medium" style={{ color: "#d97706" }}>
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
      className="rounded-[24px] p-8"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-lg)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
      <h2
        className="font-bold pb-5 mb-5"
        style={{ fontSize: "13px", color: "var(--ink-4)", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}
      >
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div className={`grid gap-4 grid-cols-${cols}`}>{children}</div>
  );
}

function PriceInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  placeholder?: string;
}) {
  const format = (n: number | null | undefined) =>
    n != null && !isNaN(n) ? n.toLocaleString("ru-RU") : "";

  const inputRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState(() => format(value));

  // Sync when form resets with loaded property data
  const prevValue = useRef(value);
  if (prevValue.current !== value) {
    prevValue.current = value;
    setDisplay(format(value));
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = raw === "" ? null : Number(raw);
    setDisplay(raw === "" ? "" : Number(raw).toLocaleString("ru-RU"));
    onChange(num);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      className="field"
    />
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-bold uppercase tracking-[0.08em] mb-2" style={{ color: "var(--ink-4)" }}>
        {label}
      </label>
      {children}
      {error && <p className="text-[13px] mt-2" style={{ color: "#a20d0f" }}>{error}</p>}
    </div>
  );
}
