import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import axios from "axios";

interface Props {
  open: boolean;
  onClose: () => void;
}

type DealType = "Купить" | "Продать" | "Снять" | "";

const PROPERTY_TYPES = ["Квартира", "Дом / таунхаус", "Коммерция", "Земельный участок"];
const ROOMS_OPTIONS  = ["Студия", "1", "2", "3", "4+", "Любое"];
const YEAR_OPTIONS   = ["До 2000", "2000–2010", "2010–2020", "Новостройка", "Не важно"];
const RENOVATION_OPTIONS = ["Без ремонта", "Косметический", "Евроремонт", "Дизайнерский", "Не важно"];
const PAYMENT_OPTIONS    = ["Наличные", "Ипотека", "Трейд-ин"];
const TERM_OPTIONS = [10, 15, 20, 25, 30];

const MORTGAGE_PROGRAMS = [
  { label: "Рыночная",     rate: 28.5, note: "стандартная ставка банков" },
  { label: "Семейная",     rate: 6,    note: "дети до 18 лет" },
  { label: "IT-ипотека",  rate: 6,    note: "сотрудники IT-компаний" },
];

function calcMonthly(price: number, down: number, rate: number, years: number): number {
  const loan = price - down;
  if (loan <= 0 || price <= 0) return 0;
  const r = rate / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(loan / n);
  return Math.round(loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
}

function fmt(n: number): string {
  return n.toLocaleString("ru-RU");
}

function parseNum(s: string): number {
  return Number(s.replace(/\D/g, "")) || 0;
}

function numInput(_val: string, set: (v: string) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    set(digits ? Number(digits).toLocaleString("ru-RU") : "");
  };
}

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

// Steps per deal type
function getSteps(deal: DealType, payment: string): string[] {
  if (!deal) return ["deal_type"];
  if (deal === "Купить") {
    const base = ["deal_type","property_type","rooms","area","year_built","renovation","payment"];
    if (payment === "Ипотека") return [...base, "mortgage_calc", "contacts"];
    return [...base, "contacts"];
  }
  if (deal === "Продать") {
    return ["deal_type","property_type","rooms","area","district","renovation","desired_price","contacts"];
  }
  // Снять
  return ["deal_type","property_type","rooms","area","rent_budget","renovation","contacts"];
}

const STEP_TITLES: Record<string, string> = {
  deal_type:     "Что вас интересует?",
  property_type: "Тип недвижимости",
  rooms:         "Количество комнат",
  area:          "Площадь",
  year_built:    "Год постройки",
  renovation:    "Состояние отделки",
  payment:       "Способ оплаты",
  mortgage_calc: "Расчёт ипотеки",
  district:      "Район или адрес",
  desired_price: "Желаемая цена",
  rent_budget:   "Бюджет аренды",
  contacts:      "Ваши контакты",
};

export default function QuizModal({ open, onClose }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);

  // Shared fields
  const [dealType, setDealType]         = useState<DealType>("");
  const [propertyType, setPropertyType] = useState("");
  const [rooms, setRooms]               = useState("");
  const [areaFrom, setAreaFrom]         = useState("");
  const [areaTo, setAreaTo]             = useState("");
  const [yearBuilt, setYearBuilt]       = useState("");
  const [renovation, setRenovation]     = useState("");
  const [wishes, setWishes]             = useState("");
  const [name, setName]                 = useState("");
  const [phone, setPhone]               = useState("");

  // Купить
  const [payment, setPayment]           = useState("");
  // Mortgage calc
  const [propPrice, setPropPrice]       = useState("");
  const [downPayment, setDownPayment]   = useState("");
  const [termYears, setTermYears]       = useState(20);

  // Продать
  const [district, setDistrict]         = useState("");
  const [desiredPrice, setDesiredPrice] = useState("");

  // Снять
  const [rentBudget, setRentBudget]     = useState("");

  const steps = useMemo(() => getSteps(dealType, payment), [dealType, payment]);
  const currentStep = steps[stepIdx] ?? "deal_type";
  const progress = ((stepIdx + 1) / steps.length) * 100;

  const mortgageResults = useMemo(() => {
    const price = parseNum(propPrice);
    const down  = parseNum(downPayment);
    return MORTGAGE_PROGRAMS.map((p) => ({
      ...p,
      monthly: calcMonthly(price, down, p.rate, termYears),
      loan: Math.max(0, price - down),
    }));
  }, [propPrice, downPayment, termYears]);

  const isValid = () => {
    if (currentStep === "deal_type")     return !!dealType;
    if (currentStep === "property_type") return !!propertyType;
    if (currentStep === "rooms")         return !!rooms;
    if (currentStep === "area")          return true;
    if (currentStep === "year_built")    return !!yearBuilt;
    if (currentStep === "renovation")    return !!renovation;
    if (currentStep === "payment")       return !!payment;
    if (currentStep === "mortgage_calc") return parseNum(propPrice) > 0 && parseNum(downPayment) >= 0;
    if (currentStep === "district")      return district.trim().length > 1;
    if (currentStep === "desired_price") return true;
    if (currentStep === "rent_budget")   return true;
    if (currentStep === "contacts")      return name.trim().length > 1 && phone.replace(/\D/g, "").length >= 10;
    return true;
  };

  const next = () => {
    if (!isValid()) return;
    if (stepIdx < steps.length - 1) setStepIdx((i) => i + 1);
  };

  const back = () => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };

  const submit = async () => {
    if (!isValid()) return;
    setSending(true);
    try {
      await axios.post("/api/v1/quiz", {
        deal_type:     dealType,
        property_type: propertyType || null,
        rooms:         rooms || null,
        area_from:     parseNum(areaFrom) || null,
        area_to:       parseNum(areaTo) || null,
        year_built:    yearBuilt || null,
        renovation:    renovation || null,
        payment:       payment || null,
        prop_price:    parseNum(propPrice) || null,
        down_payment:  parseNum(downPayment) || null,
        term_years:    payment === "Ипотека" ? termYears : null,
        district:      district || null,
        desired_price: parseNum(desiredPrice) || null,
        rent_budget:   parseNum(rentBudget) || null,
        wishes:        wishes || null,
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
      setStepIdx(0); setSent(false);
      setDealType(""); setPropertyType(""); setRooms("");
      setAreaFrom(""); setAreaTo(""); setYearBuilt(""); setRenovation("");
      setPayment(""); setPropPrice(""); setDownPayment(""); setTermYears(20);
      setDistrict(""); setDesiredPrice(""); setRentBudget("");
      setWishes(""); setName(""); setPhone("");
    }, 400);
  };

  const isLast = stepIdx === steps.length - 1;

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
                  {dealType ? `${dealType} недвижимость` : "Подбор недвижимости"}
                </span>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#F4F4F4", color: "#666" }}
                >
                  <X size={15} />
                </button>
              </div>
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
            <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: "calc(92vh - 110px)" }}>
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(162,13,15,0.1)" }}>
                    <Check size={28} style={{ color: "#a20d0f" }} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold mb-2" style={{ fontSize: "22px", color: "#111", letterSpacing: "-0.02em" }}>
                    Заявка отправлена!
                  </h3>
                  <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.6 }}>
                    Роман свяжется с вами в ближайшее время.
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
                    key={currentStep + stepIdx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h2 className="font-bold mb-5" style={{ fontSize: "20px", color: "#111", letterSpacing: "-0.02em" }}>
                      {STEP_TITLES[currentStep]}
                    </h2>

                    {/* ── deal_type ── */}
                    {currentStep === "deal_type" && (
                      <div className="grid grid-cols-1 gap-3">
                        {(["Купить", "Продать", "Снять"] as DealType[]).map((v) => (
                          <OptionButton key={v} label={v} selected={dealType === v} onClick={() => setDealType(v)} />
                        ))}
                      </div>
                    )}

                    {/* ── property_type ── */}
                    {currentStep === "property_type" && (
                      <div className="grid grid-cols-2 gap-3">
                        {PROPERTY_TYPES.map((v) => (
                          <OptionButton key={v} label={v} selected={propertyType === v} onClick={() => setPropertyType(v)} />
                        ))}
                      </div>
                    )}

                    {/* ── rooms ── */}
                    {currentStep === "rooms" && (
                      <div className="grid grid-cols-3 gap-3">
                        {ROOMS_OPTIONS.map((v) => (
                          <OptionButton key={v} label={v === "Любое" ? (dealType === "Продать" ? "Другое" : "Любое") : v} selected={rooms === v} onClick={() => setRooms(v)} />
                        ))}
                      </div>
                    )}

                    {/* ── area ── */}
                    {currentStep === "area" && (
                      <div className="space-y-4">
                        <p style={{ fontSize: "14px", color: "#888" }}>Можно оставить пустым</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>От, м²</label>
                            <input type="text" inputMode="numeric" className="field" placeholder="30" value={areaFrom} onChange={numInput(areaFrom, setAreaFrom)} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>До, м²</label>
                            <input type="text" inputMode="numeric" className="field" placeholder="80" value={areaTo} onChange={numInput(areaTo, setAreaTo)} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── year_built ── */}
                    {currentStep === "year_built" && (
                      <div className="grid grid-cols-2 gap-3">
                        {YEAR_OPTIONS.map((v) => (
                          <OptionButton key={v} label={v} selected={yearBuilt === v} onClick={() => setYearBuilt(v)} />
                        ))}
                      </div>
                    )}

                    {/* ── renovation ── */}
                    {currentStep === "renovation" && (
                      <div className="grid grid-cols-2 gap-3">
                        {RENOVATION_OPTIONS.map((v) => (
                          <OptionButton key={v} label={v} selected={renovation === v} onClick={() => setRenovation(v)} />
                        ))}
                      </div>
                    )}

                    {/* ── payment ── */}
                    {currentStep === "payment" && (
                      <div className="grid grid-cols-1 gap-3">
                        {PAYMENT_OPTIONS.map((v) => (
                          <OptionButton key={v} label={v} selected={payment === v} onClick={() => setPayment(v)} />
                        ))}
                      </div>
                    )}

                    {/* ── mortgage_calc ── */}
                    {currentStep === "mortgage_calc" && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>Стоимость, ₽</label>
                            <input type="text" inputMode="numeric" className="field" placeholder="8 000 000" value={propPrice} onChange={numInput(propPrice, setPropPrice)} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>Взнос, ₽</label>
                            <input type="text" inputMode="numeric" className="field" placeholder="2 000 000" value={downPayment} onChange={numInput(downPayment, setDownPayment)} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-2" style={{ color: "#999" }}>Срок</label>
                          <div className="flex gap-2 flex-wrap">
                            {TERM_OPTIONS.map((y) => (
                              <button
                                key={y}
                                type="button"
                                onClick={() => setTermYears(y)}
                                className="px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all"
                                style={{
                                  background: termYears === y ? "#a20d0f" : "#F5F5F5",
                                  color: termYears === y ? "#fff" : "#555",
                                }}
                              >
                                {y} лет
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3 pt-1">
                          <p className="text-[11px] font-bold uppercase tracking-[0.07em]" style={{ color: "#999" }}>
                            Платёж в месяц (примерно)
                          </p>
                          {mortgageResults.map((p) => (
                            <div
                              key={p.label}
                              className="flex items-center justify-between px-4 py-3 rounded-2xl"
                              style={{ background: "#F8F8F8", border: "1px solid rgba(0,0,0,0.05)" }}
                            >
                              <div>
                                <p className="text-[14px] font-semibold" style={{ color: "#111" }}>{p.label}</p>
                                <p className="text-[11px]" style={{ color: "#999" }}>{p.rate}% · {p.note}</p>
                              </div>
                              <p className="text-[16px] font-bold" style={{ color: p.rate < 10 ? "#1a7a3a" : "#a20d0f" }}>
                                {p.monthly > 0 ? `${fmt(p.monthly)} ₽` : "—"}
                              </p>
                            </div>
                          ))}
                          {parseNum(downPayment) > 0 && parseNum(propPrice) > 0 && (
                            <p className="text-[12px]" style={{ color: "#AAA" }}>
                              Сумма кредита: {fmt(Math.max(0, parseNum(propPrice) - parseNum(downPayment)))} ₽
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── district (Продать) ── */}
                    {currentStep === "district" && (
                      <div>
                        <p className="text-[14px] mb-4" style={{ color: "#888" }}>Укажите район или адрес объекта</p>
                        <input className="field" placeholder="Хорошёво-Мнёвники, ул. Мнёвники" value={district} onChange={(e) => setDistrict(e.target.value)} />
                      </div>
                    )}

                    {/* ── desired_price (Продать) ── */}
                    {currentStep === "desired_price" && (
                      <div className="space-y-4">
                        <p style={{ fontSize: "14px", color: "#888" }}>Можно оставить пустым</p>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>Желаемая цена, ₽</label>
                          <input type="text" inputMode="numeric" className="field" placeholder="12 000 000" value={desiredPrice} onChange={numInput(desiredPrice, setDesiredPrice)} />
                        </div>
                      </div>
                    )}

                    {/* ── rent_budget (Снять) ── */}
                    {currentStep === "rent_budget" && (
                      <div className="space-y-4">
                        <p style={{ fontSize: "14px", color: "#888" }}>Максимальная сумма аренды в месяц</p>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>Бюджет, ₽/мес</label>
                          <input type="text" inputMode="numeric" className="field" placeholder="80 000" value={rentBudget} onChange={numInput(rentBudget, setRentBudget)} />
                        </div>
                      </div>
                    )}

                    {/* ── contacts (always last) ── */}
                    {currentStep === "contacts" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>Пожелания (необязательно)</label>
                          <textarea
                            className="field"
                            rows={2}
                            placeholder="Нужна парковка, хочу ближе к центру..."
                            value={wishes}
                            onChange={(e) => setWishes(e.target.value)}
                            style={{ resize: "none" }}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>Ваше имя *</label>
                          <input className="field" placeholder="Иван" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-[0.07em] mb-1.5" style={{ color: "#999" }}>Телефон *</label>
                          <input
                            className="field"
                            placeholder="+7 (900) 000-00-00"
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "").replace(/^[78]/, "");
                              const d = digits.slice(0, 10);
                              let f = "+7";
                              if (d.length > 0) f += " (" + d.slice(0, 3);
                              if (d.length >= 3) f += ") " + d.slice(3, 6);
                              if (d.length >= 6) f += "-" + d.slice(6, 8);
                              if (d.length >= 8) f += "-" + d.slice(8, 10);
                              setPhone(f);
                            }}
                          />
                        </div>
                        <p className="text-[12px]" style={{ color: "#AAA" }}>
                          Нажимая «Отправить», вы соглашаетесь на обработку персональных данных.
                        </p>
                      </div>
                    )}

                    {/* Navigation */}
                    {true && (
                      <div className="flex items-center gap-3 mt-7">
                        <button
                          type="button"
                          onClick={back}
                          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "#F4F4F4", color: "#555" }}
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={isLast ? submit : next}
                          disabled={!isValid() || sending}
                          className="flex-1 h-11 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all duration-200"
                          style={{
                            background: isValid() ? "#a20d0f" : "#E8E8E8",
                            color: isValid() ? "#fff" : "#AAA",
                          }}
                        >
                          {sending ? (
                            <><Loader2 size={16} className="animate-spin" /> Отправляем...</>
                          ) : isLast ? (
                            "Отправить заявку"
                          ) : (
                            <>Далее <ChevronRight size={16} /></>
                          )}
                        </button>
                      </div>
                    )}
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
