// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/Chatbot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlueStore - Web bán hàng hiện đại",
  description: "Cửa hàng bán đồ công nghệ chất lượng cao",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        {/* Navbar luôn hiển thị */}
        <Navbar />
        
        {/* Nội dung của từng trang */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <Chatbot />

        {/* Giả lập Footer */}
        <footer className="border-t bg-white mt-16">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
            © 2024 BlueStore. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}