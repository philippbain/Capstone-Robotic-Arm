import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capstone Robotic Arm",
  description: "Next.js starter website for the Capstone Robotic Arm project."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
