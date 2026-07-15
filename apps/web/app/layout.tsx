import type { Metadata } from "next";
import { Instrument_Sans, Sora } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";
import { cn } from "@/lib/utils";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Driving Test App",
    template: "%s | Driving Test App",
  },
  description: "Practice CDL and driving test questions online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", instrumentSans.variable, sora.variable, "font-sans")}
    >
      <head>
        <script
          // Applies the saved theme before paint to avoid a flash of the wrong theme.
          // Defaults to "light" (not "system") — components have no dark: variants,
          // so auto-following the OS theme would produce a half-styled page.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var a=localStorage.getItem('appearance')||'light';var d=a==='dark'||(a==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
