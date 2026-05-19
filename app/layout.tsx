import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Road MLN Generator",
  description: "Create AutoCAD multiline styles for road cross-sections.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
