import type { Metadata } from 'next'
import { Libre_Baskerville } from 'next/font/google'
import './globals.css'

const libreBaskerville = Libre_Baskerville({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-libre-baskerville',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DealFlow360 — B2B Sales Platform',
  description:
    'DealFlow360 is an intelligent, self-governing B2B sales operations platform. Manage deals from quotation to payment.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={libreBaskerville.variable}>
      <body className={libreBaskerville.className}>{children}</body>
    </html>
  )
}
