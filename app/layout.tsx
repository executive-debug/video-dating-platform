import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "[PRODUCT_NAME] — Five minutes to connect",
  description:
    "A non-swipe, appointment-based dating platform for career-driven professionals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
