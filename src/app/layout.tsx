import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blu_bot | Enterprise WhatsApp AI Agent Platform',
  description: 'Deploy autonomous AI customer support agents over WhatsApp.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#07080F] text-[#E2E8F0] selection:bg-[#4F6EF7]/30 font-['DM_Sans']">
        {children}
      </body>
    </html>
  );
}