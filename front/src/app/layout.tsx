import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GroupsProvider } from "@/components/GroupsProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jiu Diary",
  description: "Онлайн спортивный дневник для тренеров, учеников и родителей",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <GroupsProvider key={user?.id ?? "anonymous"} enabled={user?.role === "COACH"}>
          <div className="flex min-h-screen min-w-0 flex-col">
            <SiteHeader />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </GroupsProvider>
      </body>
    </html>
  );
}
