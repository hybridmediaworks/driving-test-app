import { ArrowRight } from "lucide-react";

type PremiumInfo = {
  title: string;
  subtitle: string;
  features: string[];
  testimonials?: { review: string; username: string; source: string };
  rating?: { star: string; students: string; passingRate?: string };
};

export default function PremiumBanner({ premiumInfo }: { premiumInfo: PremiumInfo }) {
  return (
    <div className="premium-cta relative flex items-center justify-between overflow-hidden rounded-2xl p-8 text-white shadow-xl">
      <div className="space-y-3">
        <h3 className="max-w-2xl text-3xl font-semibold">{premiumInfo.title}</h3>

        <p className="max-w-2xl opacity-90">{premiumInfo.subtitle}</p>

        <div className="flex gap-2 text-xs">
          {premiumInfo.features?.map((feature, index) => (
            <span key={index} className="rounded-full border border-white/25 bg-white/20 px-3 py-1 text-xs">
              {feature}
            </span>
          ))}
        </div>

        {premiumInfo.testimonials && (
          <p className="text-sm italic">
            &quot;{premiumInfo.testimonials.review}&quot;
            <span className="not-italic">
              {" "}
              - {premiumInfo.testimonials.username}, {premiumInfo.testimonials.source}
            </span>
          </p>
        )}

        <p className="text-sm">
          ★ <b>{premiumInfo.rating?.star}/5</b> from {premiumInfo.rating?.students}+ students
          {premiumInfo.rating?.passingRate && <span> - {premiumInfo.rating.passingRate}% pass rate</span>}
        </p>
      </div>

      <button className="flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 font-semibold text-[#6c5ce7]">
        Get Premium
        <ArrowRight />
      </button>
    </div>
  );
}
