import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "IMS — Islamic Messaging System",
  description: "The global platform where Muslims post, build startups, share ideas, and connect. Public, transparent, purposeful.",
  keywords: ["Muslim", "Islamic", "community", "startup", "ideas", "global"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster position="bottom-right" richColors toastOptions={{ style: { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif", fontSize: 13.5, borderRadius: 14 } }} />
      </body>
    </html>
  );
}
