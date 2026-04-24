import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Strapi v5 GraphQL demo",
  description:
    "Companion frontend for the Strapi v5 GraphQL customization tutorial (Part 2).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-neutral-900">
        <Nav />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
