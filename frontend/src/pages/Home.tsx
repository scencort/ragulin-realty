import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import SEOMeta from "@/components/ui/SEOMeta";
import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import Advantages from "@/components/home/Advantages";
import WorkProcess from "@/components/home/WorkProcess";
import LatestProperties from "@/components/home/LatestProperties";
import ReviewsSection from "@/components/home/ReviewsSection";
import { seoApi } from "@/api/seo";

export default function Home() {
  const { data: seo } = useQuery({
    queryKey: ["seo", "home"],
    queryFn: () => seoApi.get("home"),
  });

  return (
    <Layout>
      <SEOMeta
        title={seo?.meta_title ?? undefined}
        description={seo?.meta_description ?? undefined}
        ogTitle={seo?.og_title ?? undefined}
        ogDescription={seo?.og_description ?? undefined}
        ogImage={seo?.og_image ?? undefined}
      />
      <Hero />
      <Stats />
      <Advantages />
      <WorkProcess />
      <LatestProperties />
      <ReviewsSection />
    </Layout>
  );
}
