import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claw | 锦诚的个人 AI Agent",
  description: "Claw 是锦诚的个人 AI Agent。你可以问它任何关于锦诚、AI、产品或技术的问题。",
  metadataBase: new URL("https://claw.inon.space"),
  icons: {
    icon: "/gugugaga_static.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
