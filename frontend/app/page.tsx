'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  const [showAIDemo, setShowAIDemo] = useState(false);
  const [demoQuery, setDemoQuery] = useState('');
  const [demoResponse, setDemoResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-blue-700">
        <div className="absolute inset-0">
          <div className="bg-gradient-to-r from-blue-800 to-indigo-900 opacity-90 h-full w-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
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
                A comprehensive platform for Model UN delegates providing tools for document management, AI-powered research, and speech writing assistance.
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
                    className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
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
                    <form action="#" method="POST" className="space-y-6">
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
                          className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <button
                          type="submit"
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Sign in
                        </button>
                      </div>
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
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white overflow-hidden lg:py-24">
        <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
          <div className="relative">
            <h2 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Features Designed for Model UN Delegates
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
              Our platform provides a comprehensive suite of tools to help you excel in your Model UN journey.
            </p>
          </div>

          <div className="relative mt-12 lg:mt-20 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div className="relative">
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                Document Repository
              </h3>
              <p className="mt-3 text-lg text-gray-500">
                Store, organize, and access your position papers, resolutions, and other important documents in one secure location.
              </p>

              <dl className="mt-10 space-y-10">
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Format Checking</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Our AI automatically checks your documents for proper formatting, ensuring they meet Model UN standards.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Advanced Search</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Find exactly what you need with our powerful search functionality. Filter by committee, country, or topic.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Collaboration</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Easily share documents with your delegation or collaborate on resolutions with allies.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-10 -mx-4 relative lg:mt-0">
              <div className="relative rounded-lg shadow-lg overflow-hidden">
                <img
                  className="relative mx-auto rounded-lg shadow-lg"
                  width="490"
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                  alt="Document Repository"
                />
              </div>
            </div>
          </div>

          <div className="relative mt-12 sm:mt-16 lg:mt-24">
            <div className="lg:grid lg:grid-flow-row-dense lg:grid-cols-2 lg:gap-8 lg:items-center">
              <div className="lg:col-start-2">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                  AI Research Assistant
                </h3>
                <p className="mt-3 text-lg text-gray-500">
                  Access intelligent research tools to gather information on global issues, country positions, and committee topics.
                </p>

                <dl className="mt-10 space-y-10">
                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Instant Answers</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Get immediate responses to your research questions about UN committees, procedures, and global issues.
                    </dd>
                  </div>

                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Country Policy Insights</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Research your assigned country's stance on key issues to develop accurate and compelling position papers.
                    </dd>
                  </div>

                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Source Citations</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      All research comes with proper citations, making it easy to reference in your papers and speeches.
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-10 -mx-4 relative lg:mt-0 lg:col-start-1">
                {/* AI Research Demo */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="px-6 py-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Try the AI Research Assistant</h3>
                    <form onSubmit={handleAIDemo} className="space-y-4">
                      <div>
                        <label htmlFor="demo-query" className="block text-sm font-medium text-gray-700">Ask a question</label>
                        <input
                          type="text"
                          id="demo-query"
                          placeholder="E.g. What is the UN Security Council?"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={demoQuery}
                          onChange={(e) => setDemoQuery(e.target.value)}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          'Ask Question'
                        )}
                      </button>
                    </form>
                    
                    {showAIDemo && (
                      <div className="mt-6 bg-gray-50 rounded-md p-4">
                        <h4 className="text-sm font-medium text-gray-900">Answer:</h4>
                        <p className="mt-2 text-sm text-gray-600">{demoResponse}</p>
                        <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                          <span>Sources: UN.org, CFR.org, Wikipedia</span>
                          <button className="text-blue-600 hover:text-blue-800" onClick={() => setShowAIDemo(false)}>Dismiss</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-12 lg:mt-24">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                  Speechwriting Assistant
                </h3>
                <p className="mt-3 text-lg text-gray-500">
                  Create compelling speeches with our AI-powered writing tools that help you craft persuasive arguments.
                </p>

                <dl className="mt-10 space-y-10">
                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Speech Generation</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Convert your ideas and research into well-structured speeches that follow diplomatic language conventions.
                    </dd>
                  </div>

                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Diplomatic Tone Checker</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Our AI analyzes your speech for appropriate diplomatic language and suggests improvements to enhance persuasiveness.
                    </dd>
                  </div>

                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Talking Points</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Generate relevant talking points based on your country's position and committee topics to prepare for impromptu speeches.
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-10 -mx-4 relative lg:mt-0">
                <div className="relative rounded-lg shadow-lg overflow-hidden">
                  <img
                    className="relative mx-auto rounded-lg shadow-lg"
                    width="490"
                    src="https://images.unsplash.com/photo-1431540015161-0bf868a2d407?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                    alt="Speechwriting"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to elevate your Model UN experience?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-200">
            Join delegates from around the world who are using MUN Connect to prepare for conferences, collaborate with their teams, and develop their diplomatic skills.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
              >
                Sign up for free
              </Link>
            </div>
            <div className="ml-3 inline-flex">
              <Link
                href="/repository"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900"
              >
                Explore documents
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 