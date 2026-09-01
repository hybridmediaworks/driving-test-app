import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CTASection from "@/components/home/CTASection";
import ExpertProfile from "@/components/experts/ExpertProfile";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import { fetchExpert } from "@/lib/experts-server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const expert = await fetchExpert(slug);

  if (!expert) {
    return { title: "Reviewer not found", robots: { index: false } };
  }

  const title = `${expert.name} — ${expert.title} | DriveLane`;
  const description =
    (expert.intro ?? "").split(/\n{2,}/)[0]?.trim() ||
    `${expert.name} reviews DriveLane's DMV practice content for accuracy.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: expert.photo_url ? [{ url: expert.photo_url }] : undefined,
    },
    alternates: { canonical: `/experts/${expert.slug}` },
  };
}

export default async function ExpertPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const expert = await fetchExpert(slug);

  if (!expert) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: expert.name,
      jobTitle: expert.title,
      ...(expert.photo_url ? { image: expert.photo_url } : {}),
      ...(expert.linkedin_url ? { sameAs: [expert.linkedin_url] } : {}),
      ...(expert.email ? { email: expert.email } : {}),
      ...(expert.intro ? { description: expert.intro.replace(/\n{2,}/g, " ") } : {}),
      worksFor: { "@type": "Organization", name: "DriveLane" },
    },
  };

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" />
        <main className="flex-1">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <ExpertProfile expert={expert} />
          <CTASection />
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}
