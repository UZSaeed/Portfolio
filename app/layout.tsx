import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Uzair Saeed — engineer, researcher, builder",
  description:
    "Interactive node-graph portfolio for Uzair Saeed — software, research, outreach, and creativity.",
  keywords: [
    "Uzair Saeed",
    "portfolio",
    "software engineer",
    "neuroscience",
    "UTD",
    "Soma",
    "SpikePrep",
    "Locus",
    "Tokyo Night",
  ],
  openGraph: {
    title: "Uzair Saeed — engineer, researcher, builder",
    description:
      "An interactive node-graph portfolio exploring code, research, outreach, and creativity.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1b26",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jetbrains.variable} ${inter.variable}`}
    >
      <body className="font-mono antialiased bg-dotgrid scanline">
        {children}
      </body>
    </html>
  );
}
