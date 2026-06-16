import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { reviewsApi } from "@/api/reviews";

const schema = z.object({
  name: z.string().min(2, "Введите имя"),
  phone: z.string().min(10, "Введите телефон"),
  message: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ContactCTA() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await reviewsApi.create({
        client_name: data.name,
        text: `Телефон: ${data.phone}${data.message ? "\n" + data.message : ""}`,
        rating: 5,
      });
      setSent(true);
      reset();
      toast.success("Заявка отправлена");
    } catch {
      toast.error("Ошибка отправки");
    }
  };

  return (
    <section style={{ background: "#FAFAFA" }} className="py-20 lg:py-28">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6"
          >
            <h2
              className="font-bold mb-6"
              style={{
                fontSize: "clamp(26px, 4vw, 52px)",
                color: "#111111",
                letterSpacing: "-0.025em",
                lineHeight: 1.08,
              }}
            >
              Готов обсудить<br />
              <span style={{ color: "#999999" }}>вашу покупку</span>
            </h2>
            <p className="mb-10 max-w-md" style={{ fontSize: "17px", color: "#666666", lineHeight: 1.55 }}>
              Бесплатная консультация. Перезваниваю в течение 15 минут.
            </p>

            <ul className="space-y-5">
              {[
                { Icon: Phone,  label: "Телефон", value: "+7 910 277-52-12", href: "tel:+79102775212" },
                { Icon: Mail,   label: "Email",   value: "r.a.ragulin@msk.etagi.com", href: "mailto:r.a.ragulin@msk.etagi.com" },
                { Icon: MapPin, label: "Офис",    value: "Москва, Балтийская 9" },
              ].map(({ Icon, label, value, href }) => {
                const Inner = (
                  <div className="flex items-center gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
                    >
                      <Icon size={17} className="text-red" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "#999999", letterSpacing: "0.06em" }}>{label}</p>
                      <p className="text-[15px] font-semibold" style={{ color: "#111111" }}>{value}</p>
                    </div>
                  </div>
                );
                return (
                  <li key={label}>
                    {href ? <a href={href} className="block transition-opacity hover:opacity-70">{Inner}</a> : Inner}
                  </li>
                );
              })}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6"
          >
            <div
              className="p-8 lg:p-10"
              style={{
                background: "#FFFFFF",
                borderRadius: "24px",
                border: "1px solid rgba(0,0,0,0.04)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 12px 32px rgba(0,0,0,0.04)",
              }}
            >
              <h3 className="font-bold mb-7" style={{ fontSize: "22px", color: "#111111", letterSpacing: "-0.015em" }}>
                Оставить заявку
              </h3>
              {sent ? (
                <div className="py-10 text-center">
                  <p className="font-bold mb-2" style={{ fontSize: "22px", color: "#E31E24", letterSpacing: "-0.015em" }}>Спасибо!</p>
                  <p style={{ fontSize: "15px", color: "#666666" }}>Свяжусь с вами в течение 15 минут</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <input {...register("name")} placeholder="Ваше имя" className="field" />
                    {errors.name && <p className="mt-1.5 text-[12px] text-red">{errors.name.message}</p>}
                  </div>
                  <div>
                    <input {...register("phone")} placeholder="Телефон" type="tel" className="field" />
                    {errors.phone && <p className="mt-1.5 text-[12px] text-red">{errors.phone.message}</p>}
                  </div>
                  <textarea {...register("message")} placeholder="Что ищете? Бюджет, район, параметры..." rows={3} className="field" style={{ resize: "none" }} />
                  <button type="submit" disabled={isSubmitting} className="btn-red w-full">
                    {isSubmitting ? "Отправка..." : "Отправить заявку"}
                    <ArrowRight size={16} strokeWidth={2.2} />
                  </button>
                  <p className="text-[11.5px] text-center" style={{ color: "#999999", lineHeight: 1.5 }}>
                    Нажимая кнопку, вы соглашаетесь на обработку персональных данных
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
