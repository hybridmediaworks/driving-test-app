import Link from "next/link";
import type { ReactNode } from "react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

export default function AuthLayout({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4 py-6 sm:p-6 md:p-10">
      <div className="w-full max-w-lg min-w-0 rounded-3xl bg-white p-5 shadow-2xl lg:rounded-4xl lg:p-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4">
            <Link href="/" className="flex flex-col items-center gap-2 font-medium">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/company-logo.svg" alt="" className="w-full max-w-36.5" />
            </Link>
            <div className="space-y-2 text-center">
              <Heading as="h1" size="sm">
                {title}
              </Heading>
              <Paragraph className="text-center">{description}</Paragraph>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
