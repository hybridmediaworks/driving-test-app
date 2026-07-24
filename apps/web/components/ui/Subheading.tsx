import Paragraph from "@/components/ui/Paragraph";

type Align = "left" | "center" | "right";

const alignClasses: Record<Align, string> = {
  left: "ms-0",
  center: "mx-auto",
  right: "me-0",
};

export default function Subheading({
  text,
  align = "left",
  className = "",
}: {
  text: string;
  align?: Align;
  className?: string;
}) {
  return (
    <Paragraph
      className={`max-w-fit border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase ${alignClasses[align]} ${className}`}
      size="xs"
      color="primary"
    >
      ✦ {text}
    </Paragraph>
  );
}
