import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ToastProvider } from "@/hooks/use-toast"
import "./global.css"

export const metadata: Metadata = {
  title: "随机美食 - 发现你的下一道美味",
  description: "一个随机美食发现网站，让你轻松探索各种美食",
  generator: "zs3t",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} bg-background text-foreground`}>
        <ToastProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  )
}
