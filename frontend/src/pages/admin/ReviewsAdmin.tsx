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
      <div className="p-8">
        <h1 className="text-2xl font-bold text-graphite mb-6">Отзывы</h1>

        {pending.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-bold text-graphite">На проверке</h2>
              <span className="bg-brand-red text-white text-xs px-2 py-0.5">{pending.length}</span>
            </div>
            <div className="space-y-3">
              {pending.map((r) => (
                <ReviewRow
                  key={r.id}
                  review={r}
                  onPublish={() => updateMut.mutate({ id: r.id, data: { is_published: true } })}
                  onReject={() => deleteMut.mutate(r.id)}
                  onDelete={() => { if (confirm("Удалить?")) deleteMut.mutate(r.id); }}
                  pending
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-bold text-graphite mb-4">Опубликованные ({published.length})</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-white animate-pulse card-shadow" />
              ))}
            </div>
          ) : published.length === 0 ? (
            <p className="text-sm text-text-muted py-8 text-center">Нет опубликованных отзывов</p>
          ) : (
            <div className="space-y-3">
              {published.map((r) => (
                <ReviewRow
                  key={r.id}
                  review={r}
                  onReject={() => updateMut.mutate({ id: r.id, data: { is_published: false } })}
                  onDelete={() => { if (confirm("Удалить?")) deleteMut.mutate(r.id); }}
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
    <div className={`bg-white p-5 card-shadow border-l-4 ${pending ? "border-yellow-400" : "border-transparent"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-bold text-graphite">{review.client_name}</span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} size={12} className={j < review.rating ? "fill-brand-red text-brand-red" : "text-border-gray"} />
              ))}
            </div>
            <span className="text-xs text-text-muted">{formatDate(review.created_at)}</span>
          </div>
          <p className="text-sm text-text-secondary line-clamp-3">{review.text}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {pending && onPublish && (
            <button
              onClick={onPublish}
              title="Опубликовать"
              className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
            >
              <Check size={15} />
            </button>
          )}
          {!pending && (
            <button
              onClick={onReject}
              title="Снять с публикации"
              className="w-8 h-8 flex items-center justify-center bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
            >
              <X size={15} />
            </button>
          )}
          <button
            onClick={onDelete}
            title="Удалить"
            className="w-8 h-8 flex items-center justify-center bg-red-50 text-brand-red hover:bg-red-100 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
