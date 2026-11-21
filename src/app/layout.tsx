import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Noble Property Management',
  description: 'Private portfolio operations for the Noble family properties',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
