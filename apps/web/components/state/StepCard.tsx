import { LockKeyhole } from "lucide-react";

type Step = {
  title: string;
  questions: number;
  type: "free" | "premium";
  locked?: boolean;
  image?: string;
  status?: "next";
};

export default function StepCard({ step }: { step: Step }) {
  return (
    <div className="relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1">
      {step.type === "free" && (
        <span className="absolute top-2 left-2 z-10 rounded bg-green-500 px-2 py-0.5 text-[9px] font-semibold text-white">
          FREE
        </span>
      )}

      {step.type === "premium" && (
        <span className="absolute top-2 right-2 z-10 rounded bg-gradient-to-br from-[#f0c27f] to-[#fc5c7d] px-2 py-0.5 text-[9px] font-semibold text-white">
          PREMIUM
        </span>
      )}

      <div className="relative h-[100px] overflow-hidden rounded-lg bg-gray-200">
        {step.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={step.image}
            alt=""
            className={`h-full w-full rounded-lg object-cover transition-all duration-300 ${
              step.locked ? "scale-105 blur-sm" : ""
            }`}
          />
        )}

        {step.locked && <div className="absolute inset-0 rounded-lg bg-white/50 backdrop-blur-[2px]" />}

        {step.status === "next" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-blue-primary shadow">
              Next
            </span>
          </div>
        )}

        {step.locked && (
          <div className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#6c5ce7] text-white">
            <LockKeyhole className="h-4" />
          </div>
        )}
      </div>

      <div className="mt-2">
        <h4 className="text-sm font-medium">{step.title}</h4>
        <p className="text-xs text-gray-500">{step.questions} questions</p>
      </div>
    </div>
  );
}
