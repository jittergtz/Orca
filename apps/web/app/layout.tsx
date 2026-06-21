import type { Metadata } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Landing/Navbar';
import Footer from '@/components/Landing/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const instrumentSerif = Instrument_Serif({ 
  weight: '400', 
  style: ['normal', 'italic'],
  subsets: ['latin'], 
  variable: '--font-instrument-serif' 
});

const isDev = process.env.NODE_ENV === 'development';

export const metadata: Metadata = {
  title: 'Orca',
  description: 'Stay Informed about what matters to you',
  icons: {
    icon: [
      { url: isDev ? '/favicon-dev.ico' : '/favicon.ico' },
      {
        url: isDev ? '/favicon-32x32-dev.png' : '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: isDev ? '/favicon-16x16-dev.png' : '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    apple: isDev ? '/apple-touch-icon-dev.png' : '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${instrumentSerif.variable} font-sans`}>
        
      
        {children}
        <Footer/>
     
        </body>
    </html>
  );
}
