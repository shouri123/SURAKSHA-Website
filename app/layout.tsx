import type { Metadata } from "next";
import "./globals.css";
import { MotionConfig } from "framer-motion";
import { PublicNavbar } from "@/components/navigation/PublicNavbar";
import { PublicFooter } from "@/components/navigation/PublicFooter";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "SURAKSHA | Hydrological Intelligence & Flood Decision Support",
  description:
    "AI-assisted hydrological intelligence and flood decision support platform connecting physical modeling, telemetry observations, and supervisory verification.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var theme=localStorage.getItem('suraksha-theme');if(theme==='light'||theme==='dark'){document.documentElement.classList.toggle('light',theme==='light');document.documentElement.classList.toggle('dark',theme==='dark')}}catch(_){}})()`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-[var(--background)] text-[var(--foreground)] flex flex-col min-h-screen selection:bg-[#0FA978]/30 selection:text-white transition-colors duration-200">
        <MotionConfig reducedMotion="user">
          <ThemeProvider>
            <AuthProvider>
              <PublicNavbar />
              <main className="flex-1">{children}</main>
              <PublicFooter />
            </AuthProvider>
          </ThemeProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
