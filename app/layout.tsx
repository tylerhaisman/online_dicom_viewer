import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Online DICOM Viewer",
  description: "Free Medical Image Viewer by Tyler Haisman",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
