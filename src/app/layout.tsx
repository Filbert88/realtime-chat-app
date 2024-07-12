import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "realtime chat app",
  description: "A simple chat app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="bg-[#2D2E30]">
        <TRPCReactProvider>
          <Providers>
            <div className="">{children}</div>
          </Providers>
        </TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}
