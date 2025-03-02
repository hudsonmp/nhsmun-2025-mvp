'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

/**
 * LandingPage Component for MUN Connect
 * 
 * Features:
 * - Responsive navigation with mobile menu
 * - Hero section with platform introduction
 * - Feature cards highlighting platform capabilities
 * - AI Demo section
 * - Call-to-action section
 */
export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-20 pb-16 lg:pt-32 lg:pb-24">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Elevate Your</span>
                <span className="block text-blue-600">Model UN Experience</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
                MUN Connect combines AI-powered research, speechwriting tools, and document management to help you excel in every Model UN conference.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/auth"
                  className="rounded-lg px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Begin Your MUN Journey
                </Link>
                <Link
                  href="#features"
                  className="rounded-lg px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  Explore Features
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Background gradient effect */}
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-blue-50 to-transparent" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything You Need to Excel
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Comprehensive tools designed specifically for Model UN delegates
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="rounded-full bg-blue-600 p-3">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">AI Research Assistant</h3>
              <p className="mt-2 text-gray-600">
                Get instant insights on global issues, country positions, and UN procedures with our AI-powered research tool.
              </p>
            </div>

            <div className="relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="rounded-full bg-blue-600 p-3">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Speechwriting AI</h3>
              <p className="mt-2 text-gray-600">
                Create compelling speeches with AI assistance. Generate and refine drafts based on your key points.
              </p>
            </div>

            <div className="relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="rounded-full bg-blue-600 p-3">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Document Repository</h3>
              <p className="mt-2 text-gray-600">
                Organize and access your position papers and resolutions with our intelligent document management system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-b from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Transform Your MUN Experience?
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Join our community of delegates and start preparing smarter today.
          </p>
          <div className="mt-10">
            <Link
              href="/auth"
              className="inline-block rounded-lg px-8 py-4 text-base font-medium text-blue-600 bg-white hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}