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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#F7F7F8" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <BrandLogo className="h-8 w-auto mx-auto mb-6" />
          <h1 className="font-bold" style={{ fontSize: "20px", color: "#111", letterSpacing: "-0.015em" }}>
            Вход в панель управления
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "#999" }}>Только для администраторов</p>
        </div>

        <div
          className="p-8 rounded-[20px]"
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="admin@ragulin.ru"
                autoComplete="email"
                className="field"
              />
              {errors.email && <p className="text-[12px] text-red mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>
                Пароль
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="field"
              />
              {errors.password && <p className="text-[12px] text-red mt-1.5">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-2"
              style={{ justifyContent: "center" }}
            >
              {isSubmitting ? "Вход..." : "Войти"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
