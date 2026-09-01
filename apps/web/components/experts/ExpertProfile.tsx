import { BadgeCheck, Mail } from "lucide-react";
import type { Expert } from "@driving-test-app/shared";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { Linkedin } from "@/components/ui/SocialIcons";
import { formatVerifiedDate } from "@/lib/expert-format";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Splits a section/intro body into paragraphs, rendering a run of "- " lines as a bullet list. */
function RichText({ body }: { body: string }) {
  const blocks = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((line) => line.trim());
        const isList = lines.every((line) => line.startsWith("- "));

        if (isList) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 text-neutral-700">
              {lines.map((line, j) => (
                <li key={j}>{line.slice(2)}</li>
              ))}
            </ul>
          );
        }

        return (
          <Paragraph key={i} size="md">
            {block}
          </Paragraph>
        );
      })}
    </div>
  );
}

/**
 * The full public reviewer profile behind /experts/{slug} — photo, credentials, bio, and the
 * ordered content sections (Education, Methodology, Publications, …). Pure render; the page shell
 * (header/footer/JSON-LD) lives in app/experts/[slug]/page.tsx.
 */
export default function ExpertProfile({ expert }: { expert: Expert }) {
  const introParagraphs = (expert.intro ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-12 lg:py-16">
      <header className="flex flex-col gap-6 border-b border-neutral-200 pb-8 sm:flex-row sm:items-center">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
          {expert.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={expert.photo_url} alt={expert.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-neutral-400">
              {initialsOf(expert.name)}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-1.5">
          <Heading as="h1" size="sm">
            {expert.name}
          </Heading>
          <Paragraph size="lg" color="dark" className="font-medium">
            {expert.title}
          </Paragraph>
          {expert.credentials && expert.credentials !== expert.title && (
            <Paragraph size="sm" color="muted">
              {expert.credentials}
            </Paragraph>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1.5">
            <span className="inline-flex items-center gap-1.5 text-sm text-neutral-600">
              <BadgeCheck className="h-4 w-4 shrink-0 text-green-700" />
              Last verified {formatVerifiedDate(expert.verified_at)}
            </span>
            {expert.linkedin_url && (
              <a
                href={expert.linkedin_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <Linkedin className="h-4 w-4 shrink-0" />
                LinkedIn
              </a>
            )}
            {expert.email && (
              <a
                href={`mailto:${expert.email}`}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {expert.email}
              </a>
            )}
          </div>
        </div>
      </header>

      {introParagraphs.length > 0 && (
        <div className="space-y-3 py-8 text-lg text-neutral-700">
          {introParagraphs.map((p, i) => (
            <p key={i} className="leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      )}

      {expert.sections.length > 0 && (
        <div className="divide-y divide-neutral-200">
          {expert.sections.map((section, i) => (
            <section key={i} className="py-8">
              <Heading as="h2" size="2xs" className="mb-3">
                {section.heading}
              </Heading>
              <RichText body={section.body} />
            </section>
          ))}
        </div>
      )}
    </article>
  );
}
