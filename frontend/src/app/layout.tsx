import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Meno - Zoom Bot",
  description: "Schedule your Meno bot to record and transcribe Zoom meetings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-zinc-950 text-zinc-50 min-h-screen flex flex-col`}>
          <header className="border-b border-zinc-800 bg-zinc-900/50">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/" className="font-semibold text-xl tracking-tight text-white">Meno</Link>
                <nav className="flex gap-4">
                  <Link href="/schedule" className="text-zinc-400 hover:text-white transition-colors">Schedule</Link>
                  <Link href="/meetings" className="text-zinc-400 hover:text-white transition-colors">Meetings</Link>
                </nav>
              </div>
              <div>
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </header>
          <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
