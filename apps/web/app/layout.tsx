import type { Metadata } from "next";
import localFont from "next/font/local";
import VerifiedEmailGate from "@/components/auth/VerifiedEmailGate";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";
import { cn } from "@/lib/utils";

/**
 * The three faces are served from `app/fonts` rather than through `next/font/google`.
 *
 * `next/font/google` downloads each face from fonts.gstatic.com during the build, and that fetch
 * fails intermittently — roughly one build in six, measured locally — with Turbopack reporting it
 * as `Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'`. On a
 * deploy pipeline that reads as a random red build. Nothing is lost by committing the files:
 * `next/font/google` already self-hosted them in the output, so these were always served from our
 * own origin. The only thing that changes is when they are downloaded — once, at commit time,
 * instead of on every build.
 *
 * Each file is the latin subset of the variable font, so one file covers the whole weight range
 * instead of one per weight (118 KB for all three). All three are Open Font License.
 *
 * To refresh one: fetch `https://fonts.googleapis.com/css2?family=<Name>:wght@<min>..<max>` with a
 * modern browser's user agent and take the `.woff2` whose unicode-range begins `U+0000-00FF`.
 */
const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const sora = localFont({
  src: "./fonts/sora-latin-variable.woff2",
  variable: "--font-sora",
  weight: "100 800",
  display: "swap",
});

// Overpass descends from Highway Gothic, the lettering on US road signs — the admin dashboard's
// headline figures are set in it so the numbers read as signage rather than as a generic display
// face. Loaded here beside the others; only the admin surfaces reference the variable.
const overpass = localFont({
  src: "./fonts/overpass-latin-variable.woff2",
  variable: "--font-overpass",
  weight: "100 900",
  display: "swap",
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
      className={cn(
        "h-full",
        "antialiased",
        inter.variable,
        sora.variable,
        overpass.variable,
        "font-sans",
      )}
      // The theme script below adds `dark` to this element before hydration, so the class list
      // React rendered on the server never matches the one it finds on the client.
      suppressHydrationWarning
    >
      <head>
        <script
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          // Applies the saved theme before paint to avoid a flash of the wrong theme.
          // Defaults to "light" (not "system") — dark is opt-in from the account menu's
          // Night Mode switch, so nobody gets flipped by their OS setting alone.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var a=localStorage.getItem('appearance')||'light';var d=a==='dark'||(a==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        <AuthProvider>
          <VerifiedEmailGate>{children}</VerifiedEmailGate>
        </AuthProvider>
      </body>
    </html>
  );
}
