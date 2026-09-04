import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FloatChat — ARGO Ocean Data NLP 3D Visualizer',
  description: 'Natural language query interface for ARGO ocean float data with 3D Globe visualization & depth profile analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
