// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ScholarSync",
  description: "Your complete academic schedule manager for lectures, assignments, quizzes, exams and events.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#ffffff",
                color: "#111111",
                border: "1px solid #e4e4e7",
                fontSize: "13px",
                fontWeight: "500",
                boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                borderRadius: "10px",
              },
              success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
              error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
