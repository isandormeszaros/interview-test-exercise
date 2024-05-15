"use client"

import React from 'react';
import { useForm, Resolver } from 'react-hook-form';
import Link from 'next/link'

const Home: React.FC = () => {
  return (
    
    <div className="container mx-auto bg-white h-screen flex flex-col justify-center items-center">
      <p className="text-2xl sm:text-4xl font-bold relative z-20 bg-clip-text text-transparent bg-gradient-to-b from-purple-200 to-purple-500 py-4">
        Company Dashboard
      </p>
      <Link href="/company" className="flex items-center rounded-md border border-secondary bg-transparent hover:bg-purple-300 hover:bg-opacity-25 pl-3.5 p-1.5 text-sm text-purple-800 bg-purple-300 bg-opacity-25">
        Let's get started
        <svg className="w-6 mt-px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12px" height="12px" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M3 12L21 12M21 12L12.5 3.5M21 12L12.5 20.5" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      </Link>
    </div>
  );
};

export default Home;
