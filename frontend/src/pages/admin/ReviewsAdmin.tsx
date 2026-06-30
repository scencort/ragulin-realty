import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Trash2, Star } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { reviewsApi } from "@/api/reviews";
import { formatDate } from "@/utils/format";

export default function ReviewsAdmin() {
  const qc = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => reviewsApi.adminList(),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { is_published: boolean } }) =>
      reviewsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "reviews"] }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => reviewsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast.success("Отзыв удалён");
    },
  });

  const pending = reviews?.filter((r) => !r.is_published) ?? [];
  const published = reviews?.filter((r) => r.is_published) ?? [];

  return (
    <AdminLayout>
      <div className="p-8 max-w-[900px]">
        {/* Header */}
        <div className="mb-7">
          <h1
            className="font-bold"
            style={{ fontSize: "26px", color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            Отзывы
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "var(--ink-4)" }}>
            {reviews?.length ?? 0} отзывов · {pending.length} на проверке
          </p>
        </div>

        {/* Pending */}
        {pending.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-4">
              <h2 className="text-[14px] font-bold" style={{ color: "var(--ink)" }}>На проверке</h2>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: "#a20d0f" }}
              >
                {pending.length}
              </span>
            </div>
            <div className="space-y-3">
              {pending.map((r) => (
                <ReviewRow
                  key={r.id}
                  review={r}
                  onPublish={() => updateMut.mutate({ id: r.id, data: { is_published: true } })}
                  onReject={() => deleteMut.mutate(r.id)}
                  onDelete={() => { if (confirm("Удалить отзыв?")) deleteMut.mutate(r.id); }}
                  pending
                />
              ))}
            </div>
          </div>
        )}

        {/* Published */}
        <div>
          <h2 className="text-[14px] font-bold mb-4" style={{ color: "var(--ink)" }}>
            Опубликованные ({published.length})
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-[16px] animate-pulse"
                  style={{ background: "var(--skeleton)" }}
                />
              ))}
            </div>
          ) : published.length === 0 ? (
            <p className="text-[14px] py-10 text-center" style={{ color: "var(--ink-4)" }}>
              Нет опубликованных отзывов
            </p>
          ) : (
            <div className="space-y-3">
              {published.map((r) => (
                <ReviewRow
                  key={r.id}
                  review={r}
                  onReject={() => updateMut.mutate({ id: r.id, data: { is_published: false } })}
                  onDelete={() => { if (confirm("Удалить отзыв?")) deleteMut.mutate(r.id); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function ReviewRow({
  review,
  onPublish,
  onReject,
  onDelete,
  pending = false,
}: {
  review: { id: number; client_name: string; text: string; rating: number; created_at: string };
  onPublish?: () => void;
  onReject: () => void;
  onDelete: () => void;
  pending?: boolean;
}) {
  return (
    <div
      className="p-5 rounded-[16px]"
      style={{
        background: "var(--surface)",
        border: `1px solid ${pending ? "rgba(217,119,6,0.35)" : "var(--border-lg)"}`,
        borderLeft: `3px solid ${pending ? "#d97706" : "var(--border-lg)"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-[14px] font-bold" style={{ color: "var(--ink)" }}>
              {review.client_name}
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star
                  key={j}
                  size={12}
                  strokeWidth={1.5}
                  style={{
                    fill: j < review.rating ? "#a20d0f" : "none",
                    color: j < review.rating ? "#a20d0f" : "var(--ink-5)",
                  }}
                />
              ))}
            </div>
            <span className="text-[12px]" style={{ color: "var(--ink-4)" }}>
              {formatDate(review.created_at)}
            </span>
            {pending && (
              <span
                className="text-[10px] font-bold uppercase tracking-[0.07em] px-2 py-0.5 rounded-full"
                style={{ background: "rgba(217,119,6,0.12)", color: "#d97706" }}
              >
                Новый
              </span>
            )}
          </div>

          {/* Text */}
          <p className="text-[14px] line-clamp-3 leading-relaxed" style={{ color: "var(--ink-3)" }}>
            {review.text}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {pending && onPublish && (
            <button
              onClick={onPublish}
              title="Опубликовать"
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
              style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a" }}
            >
              <Check size={15} strokeWidth={2.2} />
            </button>
          )}
          {!pending && (
            <button
              onClick={onReject}
              title="Снять с публикации"
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
              style={{ background: "rgba(217,119,6,0.1)", color: "#d97706" }}
            >
              <X size={15} strokeWidth={2.2} />
            </button>
          )}
          <button
            onClick={onDelete}
            title="Удалить"
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{ background: "rgba(162,13,15,0.08)", color: "#a20d0f" }}
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
