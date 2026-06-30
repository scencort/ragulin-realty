import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { authApi } from "@/api/auth";
import { setToken, isAuthenticated } from "@/utils/auth";
import { BrandLogo } from "@/components/ui/BrandLogo";

const schema = z.object({
  email:    z.string().email("Введите email"),
  password: z.string().min(1, "Введите пароль"),
});
type FormData = z.infer<typeof schema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isAuthenticated()) navigate("/admin");
  }, [navigate]);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data.email, data.password);
      setToken(res.access_token);
      navigate("/admin");
    } catch {
      toast.error("Неверный email или пароль");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <BrandLogo className="h-16 w-auto mx-auto mb-8" />
          <h1
            className="font-bold"
            style={{ fontSize: "26px", color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            Панель управления
          </h1>
          <p className="text-[15px] mt-2" style={{ color: "var(--ink-4)" }}>Только для администраторов</p>
        </div>

        <div
          className="p-8 rounded-[24px]"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-lg)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-[0.08em] mb-2"
                style={{ color: "var(--ink-4)" }}
              >
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="admin@ragulin.ru"
                autoComplete="email"
                className="field"
              />
              {errors.email && (
                <p className="text-[12px] mt-1.5" style={{ color: "#a20d0f" }}>{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                className="block text-[11px] font-bold uppercase tracking-[0.08em] mb-2"
                style={{ color: "var(--ink-4)" }}
              >
                Пароль
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="field"
              />
              {errors.password && (
                <p className="text-[12px] mt-1.5" style={{ color: "#a20d0f" }}>{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-red w-full mt-2"
              style={{ justifyContent: "center", fontSize: "15px", padding: "0.9rem 1.5rem" }}
            >
              {isSubmitting ? "Вход..." : "Войти"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
