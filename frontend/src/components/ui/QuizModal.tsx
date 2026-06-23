import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import axios from "axios";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 9;

const DEAL_TYPES = ["Купить", "Снять"];
const PROPERTY_TYPES = ["Квартира", "Дом / таунхаус", "Коммерция", "Земельный участок"];
const ROOMS_OPTIONS = ["Студия", "1", "2", "3", "4+", "Любое"];
const YEAR_OPTIONS = ["До 2000", "2000–2010", "2010–2020", "Новостройка", "Не важно"];
const RENOVATION_OPTIONS = ["Без ремонта", "Косметический", "Евроремонт", "Дизайнерский", "Не важно"];
const PAYMENT_OPTIONS = ["Наличные", "Ипотека", "Трейд-ин"];

function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-3 rounded-2xl text-[15px] font-medium transition-all duration-200 text-left"
      style={{
        background: selected ? "#a20d0f" : "#F5F5F5",
        color: selected ? "#fff" : "#333",
        border: selected ? "2px solid #a20d0f" : "2px solid transparent",
      }}
    >
      {label}
    </button>
  );
}

export default function QuizModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const [dealType, setDealType] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [rooms, setRooms] = useState("");
  const [areaFrom, setAreaFrom] = useState("");
  const [areaTo, setAreaTo] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [renovation, setRenovation] = useState("");
  const [payment, setPayment] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [wishes, setWishes] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const isStepValid = () => {
    if (step === 0) return !!dealType;
    if (step === 1) return !!propertyType;
    if (step === 2) return !!rooms;
    if (step === 3) return true;
    if (step === 4) return !!yearBuilt;
    if (step === 5) return !!renovation;
    if (step === 6) return !!payment;
    if (step === 7) return true;
    if (step === 8) return name.trim().length > 1 && phone.trim().length > 6;
    return true;
  };

  const next = () => {
    if (!isStepValid()) return;
    if (step === 6 && payment !== "Ипотека") {
      setStep(8);
    } else {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    }
  };

  const back = () => {
    if (step === 8 && payment !== "Ипотека") {
      setStep(6);
    } else {
      setStep((s) => Math.max(s - 1, 0));
    }
  };

  const submit = async () => {
    if (!isStepValid()) return;
    setSending(true);
    try {
      await axios.post("/api/quiz", {
        deal_type: dealType,
        property_type: propertyType,
        rooms,
        area_from: areaFrom ? Number(areaFrom) : null,
        area_to: areaTo ? Number(areaTo) : null,
        year_built: yearBuilt,
        renovation,
        payment,
        monthly_payment: monthlyPayment ? Number(monthlyPayment) : null,
        down_payment: downPayment ? Number(downPayment) : null,
        wishes: wishes || null,
        name,
        phone,
      });
      setSent(true);
    } catch {
      alert("Ошибка отправки. Попробуйте позвонить напрямую: +7 910 277-52-12");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(0); setSent(false);
      setDealType(""); setPropertyType(""); setRooms("");
      setAreaFrom(""); setAreaTo(""); setYearBuilt(""); setRenovation("");
      setPayment(""); setMonthlyPayment(""); setDownPayment("");
      setWishes(""); setName(""); setPhone("");
    }, 400);
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const stepTitles = [
    "Что вас интересует?",
    "Тип недвижимости",
    "Количество комнат",
    "Площадь",
    "Год постройки",
    "Состояние отделки",
    "Способ оплаты",
    "Ипотечные параметры",
    "Ваши контакты",
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-5"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full sm:max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] overflow-hidden"
            style={{ maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: "#a20d0f" }}>
                  Подбор недвижимости
                </span>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#F4F4F4", color: "#666" }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Progress bar */}
              {!sent && (
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#F0F0F0" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "#a20d0f" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: "calc(92vh - 120px)" }}>
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: "rgba(162,13,15,0.1)" }}
                  >
                    <Check size={28} style={{ color: "#a20d0f" }} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold mb-2" style={{ fontSize: "22px", color: "#111", letterSpacing: "-0.02em" }}>
                    Заявка отправлена!
                  </h3>
                  <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.6 }}>
                    Роман свяжется с вами в ближайшее время и подберёт подходящие варианты.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-6 px-6 py-3 rounded-2xl font-semibold text-white text-[15px]"
                    style={{ background: "#a20d0f" }}
                  >
                    Закрыть
                  </button>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h2 className="font-bold mb-5" style={{ fontSize: "20px", color: "#111", letterSpacing: "-0.02em" }}>
                      {stepTitles[step]}
                    </h2>

                    {step === 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {DEAL_TYPES.map((v) => (
                          <OptionButton key={v} label={v} selected={dealType === v} onClick={() => setDealType(v)} />
                        ))}
                      </div>
                    )}

                    {step === 1 && (
                      <div className="grid grid-cols-2 gap-3">
                        {PROPERTY_TYPES.map((v) => (
                          <OptionButton key={v} label={v} selected={propertyType === v} onClick={() => setPropertyType(v)} />
                        ))}
                      </div>
                    )}

                    {step === 2 && (
                      <div className="grid grid-cols-3 gap-3">
                        {ROOMS_OPTIONS.map((v) => (
                          <OptionButton key={v} label={v} selected={rooms === v} onClick={() => setRooms(v)} />
                        ))}
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-4">
                        <p style={{ fontSize: "14px", color: "#888" }}>Можно оставить пустым</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>
                              От, м²
                            </label>
                            <input
                              type="number"
                              className="field"
                              placeholder="30"
                              value={areaFrom}
                              onChange={(e) => setAreaFrom(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>
                              До, м²
                            </label>
                            <input
                              type="number"
                              className="field"
                              placeholder="80"
                              value={areaTo}
                              onChange={(e) => setAreaTo(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="grid grid-cols-2 gap-3">
                        {YEAR_OPTIONS.map((v) => (
                          <OptionButton key={v} label={v} selected={yearBuilt === v} onClick={() => setYearBuilt(v)} />
                        ))}
                      </div>
                    )}

                    {step === 5 && (
                      <div className="grid grid-cols-2 gap-3">
                        {RENOVATION_OPTIONS.map((v) => (
                          <OptionButton key={v} label={v} selected={renovation === v} onClick={() => setRenovation(v)} />
                        ))}
                      </div>
                    )}

                    {step === 6 && (
                      <div className="grid grid-cols-1 gap-3">
                        {PAYMENT_OPTIONS.map((v) => (
                          <OptionButton key={v} label={v} selected={payment === v} onClick={() => setPayment(v)} />
                        ))}
                      </div>
                    )}

                    {step === 7 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>
                            Комфортный платёж в месяц, ₽
                          </label>
                          <input
                            type="number"
                            className="field"
                            placeholder="80 000"
                            value={monthlyPayment}
                            onChange={(e) => setMonthlyPayment(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>
                            Первоначальный взнос, ₽
                          </label>
                          <input
                            type="number"
                            className="field"
                            placeholder="1 500 000"
                            value={downPayment}
                            onChange={(e) => setDownPayment(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>
                            Пожелания (необязательно)
                          </label>
                          <textarea
                            className="field"
                            rows={3}
                            placeholder="Нужна парковка, хочу ближе к центру..."
                            value={wishes}
                            onChange={(e) => setWishes(e.target.value)}
                            style={{ resize: "none" }}
                          />
                        </div>
                      </div>
                    )}

                    {step === 8 && (
                      <div className="space-y-4">
                        {payment !== "Ипотека" && (
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>
                              Пожелания (необязательно)
                            </label>
                            <textarea
                              className="field"
                              rows={3}
                              placeholder="Нужна парковка, хочу ближе к центру..."
                              value={wishes}
                              onChange={(e) => setWishes(e.target.value)}
                              style={{ resize: "none" }}
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>
                            Ваше имя *
                          </label>
                          <input
                            className="field"
                            placeholder="Иван"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>
                            Телефон *
                          </label>
                          <input
                            className="field"
                            placeholder="+7 900 000-00-00"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                        <p className="text-[12px]" style={{ color: "#AAA" }}>
                          Нажимая «Отправить», вы соглашаетесь на обработку персональных данных.
                        </p>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center gap-3 mt-7">
                      {step > 0 && (
                        <button
                          type="button"
                          onClick={back}
                          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "#F4F4F4", color: "#555" }}
                        >
                          <ChevronLeft size={18} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={step === TOTAL_STEPS - 1 ? submit : next}
                        disabled={!isStepValid() || sending}
                        className="flex-1 h-11 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all duration-200"
                        style={{
                          background: isStepValid() ? "#a20d0f" : "#E8E8E8",
                          color: isStepValid() ? "#fff" : "#AAA",
                        }}
                      >
                        {sending ? (
                          <><Loader2 size={16} className="animate-spin" /> Отправляем...</>
                        ) : step === TOTAL_STEPS - 1 ? (
                          "Отправить заявку"
                        ) : (
                          <>Далее <ChevronRight size={16} /></>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
