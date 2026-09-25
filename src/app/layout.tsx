import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = localFont({
  variable: "--font-inter",
  src: [{ path: "./fonts/inter-400.ttf", weight: "400", style: "normal" }, { path: "./fonts/inter-500.ttf", weight: "500", style: "normal" }, { path: "./fonts/inter-600.ttf", weight: "600", style: "normal" }, { path: "./fonts/inter-700.ttf", weight: "700", style: "normal" }],
  display: "swap",
});
const robotoCondensed = localFont({
  variable: "--font-roboto-condensed",
  src: [{ path: "./fonts/roboto-condensed-300.ttf", weight: "300", style: "normal" }, { path: "./fonts/roboto-condensed-400.ttf", weight: "400", style: "normal" }, { path: "./fonts/roboto-condensed-700.ttf", weight: "700", style: "normal" }],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wolverine — Your personal health agent",
  applicationName: "Wolverine",
  icons: { icon: { url: "/wolverine-icon.svg", type: "image/svg+xml" } },
  appleWebApp: {
    capable: true,
    title: "Wolverine",
    statusBarStyle: "black-translucent",
  },
  description:
    "Your daily health briefing, connected activity, and a coach that sees the whole picture.",
};

// Next 15 requires viewport to be its own export; leaving it on `metadata` was
// ignored at build time. maximum-scale/user-scalable are deliberately omitted so
// the page stays pinch-zoomable (WCAG 1.4.4).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111b17",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${robotoCondensed.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
