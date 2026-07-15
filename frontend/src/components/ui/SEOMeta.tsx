import { Helmet } from "react-helmet-async";
import { SITE_NAME, SITE_URL, buildCanonical } from "@/utils/site";

interface SEOMetaProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
}

const DEFAULT_TITLE =
  "\u0420\u0430\u0433\u0443\u043b\u0438\u043d \u0420\u043e\u043c\u0430\u043d \u2014 \u044d\u043a\u0441\u043f\u0435\u0440\u0442 \u043f\u043e \u043d\u0435\u0434\u0432\u0438\u0436\u0438\u043c\u043e\u0441\u0442\u0438 \u0432 \u041c\u043e\u0441\u043a\u0432\u0435";
const DEFAULT_DESCRIPTION =
  "\u0412\u0435\u0434\u0443\u0449\u0438\u0439 \u044d\u043a\u0441\u043f\u0435\u0440\u0442 \u043f\u043e \u043d\u0435\u0434\u0432\u0438\u0436\u0438\u043c\u043e\u0441\u0442\u0438 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438 \u00ab\u042d\u0442\u0430\u0436\u0438\u00bb \u0432 \u041c\u043e\u0441\u043a\u0432\u0435. \u041f\u043e\u043a\u0443\u043f\u043a\u0430, \u043f\u0440\u043e\u0434\u0430\u0436\u0430 \u0438 \u0430\u0440\u0435\u043d\u0434\u0430.";
const BRAND_NAME = "\u0420\u0430\u0433\u0443\u043b\u0438\u043d";
const FULL_BRAND_NAME =
  "\u0420\u0430\u0433\u0443\u043b\u0438\u043d \u0420\u043e\u043c\u0430\u043d";

export default function SEOMeta({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  ogTitle,
  ogDescription,
  ogImage,
  canonical,
}: SEOMetaProps) {
  const fullTitle = title.includes(BRAND_NAME) ? title : `${title} | ${FULL_BRAND_NAME}`;
  const resolvedCanonical =
    canonical ||
    (typeof window !== "undefined" ? `${SITE_URL}${window.location.pathname}` : buildCanonical("/"));
  const resolvedOgImage = ogImage || `${SITE_URL}/apple-touch-icon.png`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index,follow" />
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={resolvedOgImage} />
      <link rel="canonical" href={resolvedCanonical} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || fullTitle} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={resolvedOgImage} />
    </Helmet>
  );
}
