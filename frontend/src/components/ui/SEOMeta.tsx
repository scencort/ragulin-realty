import { Helmet } from "react-helmet-async";

interface SEOMetaProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
}

export default function SEOMeta({
  title = "Рагулин Роман — Эксперт по недвижимости в Москве",
  description = "Ведущий эксперт по недвижимости компании «Этажи» в Москве. Покупка, продажа и аренда.",
  ogTitle,
  ogDescription,
  ogImage,
  canonical,
}: SEOMetaProps) {
  const fullTitle = title.includes("Рагулин") ? title : `${title} | Рагулин Роман`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="ru_RU" />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || fullTitle} />
      <meta name="twitter:description" content={ogDescription || description} />
    </Helmet>
  );
}
