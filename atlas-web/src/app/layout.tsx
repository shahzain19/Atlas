import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas — Universal Platform for Intelligent Machines",
  description: "Build drones, robots, and autonomous systems with one API. An event-driven autonomy runtime for robots, drones, and multi-agent systems.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
