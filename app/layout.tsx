import type { Metadata } from 'next';
import { Fraunces, Zen_Kaku_Gothic_New, DM_Mono } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['SOFT'],
  display: 'swap',
});

const zenKaku = Zen_Kaku_Gothic_New({
  variable: '--font-zen-kaku',
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
});

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'omakai.food',
  description: 'The chef picks. You eat.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${zenKaku.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
