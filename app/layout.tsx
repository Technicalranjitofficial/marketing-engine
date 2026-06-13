import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Marketing Engine | Email Campaigns & Automation",
  description: "High-performance email marketing platform with advanced automation, analytics, and A/B testing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="relative min-h-screen">
          {/* Background gradient effect */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[hsl(var(--primary)/0.08)] blur-[100px]" />
            <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-[hsl(var(--gradient-mid)/0.06)] blur-[100px]" />
            <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-[hsl(var(--gradient-end)/0.05)] blur-[100px]" />
          </div>
          {children}
        </div>
        <Toaster 
          theme="dark" 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            },
          }}
        />
      </body>
    </html>
  );
}
