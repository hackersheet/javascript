import './globals.css';
import '@hackersheet/react-document-content-styles/gist-theme';

import { Inter } from 'next/font/google';
import Link from 'next/link';
import { ThemeProvider } from 'next-themes';

import ThemeSwitcher from '@/components/theme-switcher';

import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Sandbox of @hackersheet packages.',
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <header className="flex items-center mx-auto max-w-screen-sm">
            <div className="text-lg py-10 flex-1">
              <Link href="/">my blog</Link>
            </div>
            <div>
              <ThemeSwitcher />
            </div>
          </header>

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
