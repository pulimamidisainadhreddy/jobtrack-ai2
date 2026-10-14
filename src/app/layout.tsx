import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'JobTrack · Berlin',
  description: 'Private job search dashboard for data engineering applications'
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
