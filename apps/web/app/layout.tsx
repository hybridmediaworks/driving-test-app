import type { Metadata } from "next";
import { Inter, Overpass, Sora } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

// Overpass descends from Highway Gothic, the lettering on US road signs — the admin dashboard's
// headline figures are set in it so the numbers read as signage rather than as a generic display
// face. Loaded here beside the others; only the admin surfaces reference the variable.
const overpass = Overpass({
  variable: "--font-overpass",
  subsets: ["latin"],
  weight: ["600", "700"],
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
