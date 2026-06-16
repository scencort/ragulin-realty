import { TrendingUp, Award, Users, Star } from "lucide-react";
import StatsBand from "@/components/ui/StatsBand";

const stats = [
  { Icon: TrendingUp, raw: 500,  suffix: "+", label: "Завершённых сделок",       sub: "за 10 лет работы",    decimals: 0 },
  { Icon: Award,      raw: 10,   suffix: "+", label: "Лет на рынке Москвы",      sub: "с 2014 года",          decimals: 0 },
  { Icon: Users,      raw: 98,   suffix: "%", label: "Возвращающихся клиентов",  sub: "рекомендуют друзьям",  decimals: 0 },
  { Icon: Star,       raw: 4.9,  suffix: "",  label: "Средняя оценка работы",    sub: "по отзывам клиентов",  decimals: 1 },
];

export default function Stats() {
  return <StatsBand items={stats} />;
}
