'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

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
  const [showAIDemo, setShowAIDemo] = useState(false);
  const [demoQuery, setDemoQuery] = useState('');
  const [demoResponse, setDemoResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [heroEmail, setHeroEmail] = useState('');
  const [heroPassword, setHeroPassword] = useState('');
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroError, setHeroError] = useState('');
  const router = useRouter();

  const handleAIDemo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate AI response with a delay
    setTimeout(() => {
      const responses = [
        "The United Nations Security Council (UNSC) has primary responsibility for maintaining international peace and security. It consists of 15 members with 5 permanent members (China, France, Russia, UK, USA) who have veto power. The Council can establish peacekeeping operations, enact sanctions, and authorize military action.",
        "When researching nuclear non-proliferation for the DISEC committee, focus on the Nuclear Non-Proliferation Treaty (NPT), IAEA safeguards, and recent developments like the Iran nuclear deal. Consider perspectives from nuclear and non-nuclear states and analyze regional security contexts.",
        "Climate financing refers to local, national, or transnational financing from public, private, and alternative sources that supports mitigation and adaptation actions addressing climate change. The Green Climate Fund (GCF) is a critical mechanism established by the UNFCCC to assist developing countries.",
        "The International Court of Justice (ICJ) is the principal judicial organ of the United Nations. It settles legal disputes between states and gives advisory opinions on legal questions. It is composed of 15 judges elected by the General Assembly and Security Council for nine-year terms."
      ];
      
      // Select a random response from the array
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setDemoResponse(randomResponse);
      setIsLoading(false);
      setShowAIDemo(true);
    }, 1500);
  };

  const handleHeroSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setHeroError('');
    setHeroLoading(true);

    try {
      await authAPI.login({ email: heroEmail, password: heroPassword });
      router.push('/repository'); // Redirect to repository after successful login
    } catch (err: any) {
      setHeroError(err.response?.data?.message || 'Failed to sign in');
    } finally {
      setHeroLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0020 5.5v-1.95" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-800">MUN Connect</span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-6">
              <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                Features
              </Link>
              <Link href="/repository" className="text-gray-600 hover:text-blue-600 transition-colors">
                Repository
              </Link>
              <Link href="/research" className="text-gray-600 hover:text-blue-600 transition-colors">
                AI Research
              </Link>
              <Link href="/speech" className="text-gray-600 hover:text-blue-600 transition-colors">
                Speechwriting
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/auth" className="text-gray-600 hover:text-blue-600 transition-colors">
                Log in
              </Link>
              <Link 
                href="/auth" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                Sign up
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-2">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                Features
              </Link>
              <Link href="/repository" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                Repository
              </Link>
              <Link href="/research" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                AI Research
              </Link>
              <Link href="/speech" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                Speechwriting
              </Link>
              <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">
                Log in
              </Link>
              <Link href="/auth" className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700 px-3 py-2">
                Sign up
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-700 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="bg-gradient-to-r from-blue-800 to-indigo-900 opacity-90 h-full w-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1>
                <span className="block text-sm font-semibold uppercase tracking-wide text-blue-200 sm:text-base lg:text-sm xl:text-base">
                  Model United Nations Platform
                </span>
                <span className="mt-1 block text-4xl tracking-tight font-extrabold text-white sm:text-5xl xl:text-6xl">
                  MUN Connect
                </span>
              </h1>
              <p className="mt-3 text-base text-blue-200 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Research, prepare, and deliver with confidence. MUN Connect combines AI-powered research, speechwriting tools, and document management for Model UN delegates.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Link
                    href="/repository"
                    className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600"
                  >
                    Document Repository
                  </Link>
                  <Link
                    href="/research"
                    className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-900 bg-white hover:bg-gray-50"
                  >
                    Research Assistant
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-12 sm:mt-16 lg:mt-0 lg:col-span-6">
              <div className="bg-white sm:max-w-md sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden lg:max-w-none">
                <div className="px-4 py-8 sm:px-10">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Sign in with
                    </p>
                    <div className="mt-1 grid grid-cols-3 gap-3">
                      <div>
                        <button
                          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          <span className="sr-only">Sign in with Google</span>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </button>
                      </div>
                      <div>
                        <button
                          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          <span className="sr-only">Sign in with GitHub</span>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path
                              fillRule="evenodd"
                              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                      <div>
                        <button
                          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          <span className="sr-only">Sign in with Microsoft</span>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        Or
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <form onSubmit={handleHeroSignIn} className="space-y-6">
                      <div>
                        <label htmlFor="email" className="sr-only">
                          Email
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="Email"
                          required
                          value={heroEmail}
                          onChange={(e) => setHeroEmail(e.target.value)}
                          className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label htmlFor="password" className="sr-only">
                          Password
                        </label>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          placeholder="Password"
                          required
                          value={heroPassword}
                          onChange={(e) => setHeroPassword(e.target.value)}
                          className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <button
                          type="submit"
                          disabled={heroLoading}
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {heroLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                      </div>
                      {heroError && (
                        <div className="text-sm text-red-600">
                          {heroError}
                        </div>
                      )}
                    </form>
                  </div>
                </div>
                <div className="px-4 py-6 bg-gray-50 border-t-2 border-gray-200 sm:px-10">
                  <p className="text-xs leading-5 text-gray-500">
                    By signing up, you agree to our{' '}
                    <a href="#" className="font-medium text-gray-900 hover:underline">
                      Terms
                    </a>
                    ,{' '}
                    <a href="#" className="font-medium text-gray-900 hover:underline">
                      Data Policy
                    </a>{' '}
                    and{' '}
                    <a href="#" className="font-medium text-gray-900 hover:underline">
                      Cookies Policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Elevate your MUN performance
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Our platform provides the tools you need to excel at every step of the Model UN process.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <FeatureCard 
                title="AI Research Assistant" 
                description="Get intelligent insights on any topic with our AI-powered research tool. Save time and enhance your position papers with relevant country policies and UN documents."
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                }
                onClick={() => router.push('/research')}
              />

              <FeatureCard 
                title="Speechwriting AI" 
                description="Create compelling speeches with our AI-powered tools. Generate and refine speech drafts based on your bullet points or use our guided templates."
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                }
                onClick={() => router.push('/speech')}
              />

              <FeatureCard 
                title="Document Repository" 
                description="Upload, categorize, and search position papers and resolutions efficiently. Our formatting checker ensures your documents comply with MUN standards."
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
                onClick={() => router.push('/repository')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Experience our AI Research Assistant
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Try a demo of our AI-powered research tool that helps delegates find accurate information quickly.
            </p>
          </div>

          <div className="mt-12 max-w-lg mx-auto">
            {!showAIDemo ? (
              <form onSubmit={handleAIDemo} className="space-y-6">
                <div>
                  <label htmlFor="demoQuery" className="block text-sm font-medium text-gray-700">
                    Ask a question about Model UN
                  </label>
                  <div className="mt-1">
                    <input
                      id="demoQuery"
                      name="demoQuery"
                      type="text"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g., What are the powers of the UN Security Council?"
                      value={demoQuery}
                      onChange={(e) => setDemoQuery(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Get Answer'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Research Results
                  </h3>
                  <button
                    onClick={() => {
                      setShowAIDemo(false);
                      setDemoQuery('');
                    }}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
                  >
                    New Question
                  </button>
                </div>
                <div className="border-t border-gray-200">
                  <div className="px-4 py-5 sm:p-6 prose max-w-none">
                    <p className="text-gray-800">{demoResponse}</p>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Sources: UN Documentation, International Relations Database
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to elevate your MUN experience?
          </h2>
          <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
            Join our community of delegates and start improving your preparation today.
          </p>
          <div className="mt-8">
            <Link 
              href="/auth" 
              className="inline-block px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10 shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0020 5.5v-1.95" />
                  </svg>
                </div>
                <span className="text-xl font-bold">MUN Connect</span>
              </div>
              <p className="mt-4 text-gray-400">
                MUN Connect is the all-in-one platform designed specifically for Model UN delegates, providing tools for research, speechwriting, and document management.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Resources</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/guides" className="text-gray-400 hover:text-white transition-colors">MUN Guides</Link>
                </li>
                <li>
                  <Link href="/templates" className="text-gray-400 hover:text-white transition-colors">Templates</Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Platform</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} MUN Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Feature Card Component
 * Displays an individual feature with icon, title, and description
 */
function FeatureCard({ title, description, icon, onClick }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  const shortDescription = description.split('. ')[0] + '.';
  const fullDescription = description;

  return (
    <div 
      className="bg-gray-50 rounded-xl shadow-sm p-8 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ height: '300px' }}
    >
      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      
      {/* Short description - visible by default, hides on hover */}
      <p className={`text-gray-600 transition-opacity duration-300 ${isHovered ? 'opacity-0 absolute' : 'opacity-100'}`}>
        {shortDescription}
      </p>
      
      {/* Full description - hidden by default, shows on hover */}
      <div 
        className={`absolute inset-0 bg-blue-600 p-8 flex flex-col justify-center transition-all duration-300 ${
          isHovered ? 'opacity-95 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
        <p className="text-blue-100">
          {fullDescription}
        </p>
        <div className="mt-4 text-white font-medium">
          Learn more →
        </div>
      </div>
    </div>
  );
} 