import { Diamond, Gem, LockKeyhole } from "lucide-react";
import Paragraph from "@/components/ui/Paragraph";

type Step = {
  title: string;
  totalQuestions: string;
  totalTime: string;
  type: "free" | "premium";
  locked?: boolean;
  image: string;
  status?: "next";
};

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

const GAP_REM = 1.25;

function rowWidth(columns: number, count: number): string {
  return `calc((100% - ${(columns - 1) * GAP_REM}rem) / ${columns} * ${count} + ${Math.max(count - 1, 0)} * ${GAP_REM}rem)`;
}

export default function TestSteps({
  steps,
  columns = 5,
}: {
  steps: Step[];
  columns?: number;
}) {
  const rows = chunk(steps, columns);

  return (
    <div className="relative">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`relative grid grid-cols-[repeat(var(--ts-cols),minmax(0,1fr))] gap-5 max-lg:grid-cols-3 max-md:grid-cols-2 ${rowIndex < rows.length - 1 ? "mb-11" : ""}`}
          style={{ "--ts-cols": columns } as React.CSSProperties}
        >
          <div
            className={`before_row pointer-events-none absolute -top-6.75 h-19.5 w-20 border-dashed border-blue-300 max-md:hidden ${
              rowIndex === 0
                ? "left-0 border-b"
                : rowIndex % 2 === 0
                  ? "-right-10 rounded-r-[28px] border border-l-0"
                  : "-left-10 rounded-l-[28px] border border-r-0"
            }`}
          />
          <div
            className={`after_row pointer-events-none absolute top-12 h-[calc(100%-30px)] border-dashed border-blue-300 max-md:hidden ${
              rowIndex === rows.length - 1
                ? "left-0 border-t"
                : rowIndex % 2 === 0
                  ? "-right-10 w-full rounded-r-[28px] border border-l-0"
                  : "left-6 w-full rounded-l-[28px] border border-l"
            }`}
            style={
              rowIndex === rows.length - 1
                ? { width: rowWidth(columns, row.length) }
                : undefined
            }
          />

          {row.map((step, index) => (
            <div
              key={index}
              className="group cursor-pointer rounded transition-all duration-300 hover:-translate-y-0.75"
            >
              <div className="relative overflow-hidden rounded-xl">
                {step.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={step.image}
                    alt=""
                    className="h-32 w-full rounded-xl object-cover transition-all duration-300"
                  />
                )}
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-xl ${
                    step.type === "premium"
                      ? "bg-white/60 backdrop-blur-[2px] group-hover:bg-white/50"
                      : ""
                  }`}
                >
                  {step.type === "premium" && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-4xl ">
                      <Gem className="text-blue-600 w-8 h-8 " />
                    </div>
                  )}
                  {step.status === "next" && (
                    <Paragraph
                      size="sm"
                      color="primary"
                      className="rounded-full bg-white px-3 py-0.5 font-semibold"
                    >
                      Next
                    </Paragraph>
                  )}
                </div>
                {step.type === "free" && (
                  <Paragraph
                    color="white"
                    size="xs"
                    className="absolute top-2 rounded-sm px-1.75 py-0.5 font-semibold tracking-wide uppercase right-2 bg-green-500"
                  >
                    Free
                  </Paragraph>
                )}
              </div>
              <div className="p-4 space-y-2">
                <Paragraph color="dark" className="font-semibold">
                  {step.title}
                </Paragraph>
                <Paragraph color="primary" size="sm" className="font-semibold">
                  {step.totalQuestions} questions · ~{step.totalTime} min
                </Paragraph>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
