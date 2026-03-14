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

export const metadata: Metadata = {
  title: 'Orca',
  description: 'Stay Informed about what matters to you'
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
