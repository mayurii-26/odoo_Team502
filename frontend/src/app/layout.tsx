import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DealFlow360 — B2B Sales Operations Platform',
  description:
    'DealFlow360 is an intelligent, self-governing B2B sales operations platform. Manage deals from quotation to payment.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
