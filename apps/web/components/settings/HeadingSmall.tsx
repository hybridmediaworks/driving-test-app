import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

export default function HeadingSmall({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-0.5">
      <Heading as="h3" size="sm">
        {title}
      </Heading>
      {description && (
        <Paragraph size="sm" color="muted">
          {description}
        </Paragraph>
      )}
    </div>
  );
}
