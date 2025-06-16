// import type { Metadata } from 'next'
// import './globals.css'

// export const metadata: Metadata = {
//   title: 'Univerify',
//   description: 'Document Verification and sharing platform',
//   generator: 'gikenye',
// }

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode
// }>) {
//   return (
//     <html lang="en">
//       <body>{children}</body>
//     </html>
//   )
// }

import React from "react";
import type { Metadata } from 'next';
import Provider from "../components/provider";
// IMP START - SSR
import { cookieToWeb3AuthState } from "@web3auth/modal";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';

import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { ToastContainer } from 'react-toastify';
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Univerify',
  description: 'Document Verification and sharing platform',
  generator: 'gikenye',
};

// eslint-disable-next-line no-undef
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const web3authInitialState = cookieToWeb3AuthState(headersList.get('cookie'));
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider web3authInitialState={web3authInitialState}>{children}</Provider>
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </body>
    </html>
  );
}