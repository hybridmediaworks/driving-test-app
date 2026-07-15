import StepCard from "./StepCard";

type Step = {
  title: string;
  questions: number;
  type: "free" | "premium";
  locked?: boolean;
  image?: string;
  status?: "next";
};

export default function StepsFlow({ steps }: { steps?: Step[] }) {
  if (!steps) return null;

  return (
    <div className="relative">
      <div className="mb-12 grid grid-cols-5 items-center gap-5">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`${steps.length === 1 ? "col-span-2" : ""} ${steps.length > 5 && index < 5 ? "mb-12" : ""}`}
          >
            <StepCard step={step} />
          </div>
        ))}
      </div>
    </div>
  );
}
