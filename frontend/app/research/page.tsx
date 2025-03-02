'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  sources?: {
    title: string;
    url: string;
  }[];
}

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      text: 'Hello! I am your Model UN Research Assistant. I can help you with information about the United Nations, global issues, country positions, committee procedures, and more. What would you like to research today?',
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Popular research topics
  const popularTopics = [
    'UN Security Council powers and procedures',
    'Climate change policy by country',
    'Refugee crisis solutions',
    'Nuclear non-proliferation treaty',
    'Sustainable Development Goals (SDGs)',
    'Human rights framework',
  ];

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: query,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setQuery('');
    
    // Simulate AI response (replace with actual API call in production)
    setTimeout(() => {
      const responses = [
        {
          text: "The United Nations Security Council (UNSC) is one of the six principal organs of the United Nations and is charged with ensuring international peace and security. It has 15 members: 5 permanent members with veto power (China, France, Russia, UK, USA) and 10 non-permanent members elected for 2-year terms. The Security Council can establish peacekeeping operations, enact international sanctions, and authorize military action.",
          sources: [
            { title: "UN.org - Security Council", url: "https://www.un.org/securitycouncil/" },
            { title: "CFR - The UN Security Council", url: "https://www.cfr.org/backgrounder/un-security-council" }
          ]
        },
        {
          text: "The Nuclear Non-Proliferation Treaty (NPT) is an international treaty aimed at preventing the spread of nuclear weapons and technology, promoting cooperation in the peaceful uses of nuclear energy, and achieving nuclear disarmament. It was opened for signature in 1968 and entered into force in 1970. The treaty has three pillars: non-proliferation, disarmament, and peaceful use of nuclear energy. It requires non-nuclear-weapon states to not acquire nuclear weapons and nuclear-weapon states to pursue disarmament.",
          sources: [
            { title: "UN Office for Disarmament Affairs - NPT", url: "https://www.un.org/disarmament/wmd/nuclear/npt/" },
            { title: "IAEA - Nuclear Non-Proliferation Treaty", url: "https://www.iaea.org/topics/nuclear-non-proliferation-treaty" }
          ]
        },
        {
          text: "Climate financing involves funding efforts to mitigate and adapt to climate change. The Paris Agreement established a commitment for developed countries to jointly mobilize $100 billion per year by 2020 to address the needs of developing countries. The Green Climate Fund (GCF) is the largest dedicated climate fund, established within the UNFCCC framework. Climate finance covers various activities including renewable energy development, energy efficiency improvements, sustainable transportation, and adaptation measures for vulnerable communities.",
          sources: [
            { title: "UNFCCC - Climate Finance", url: "https://unfccc.int/topics/climate-finance/the-big-picture/climate-finance-in-the-negotiations" },
            { title: "Green Climate Fund", url: "https://www.greenclimate.fund/" }
          ]
        },
        {
          text: "When drafting a resolution for Model UN, follow these guidelines: 1) Begin with a header including committee name, topic, and sponsors. 2) Start with preambulatory clauses that reference past actions and provide context (these use italicized phrases like 'Recalling'). 3) Follow with operative clauses that propose solutions (numbered and begin with action verbs like 'Requests'). 4) Ensure your clauses are specific, actionable, and realistic. 5) Structure from general to specific actions. 6) Include funding mechanisms and implementation details for credibility.",
          sources: [
            { title: "UNA-USA - Model UN Resolution Guide", url: "https://unausa.org/model-un/how-to-prepare/" },
            { title: "Best Delegate - Resolution Writing", url: "https://bestdelegate.com/resolution-writing/" }
          ]
        }
      ];
      
      // Select a response that seems most relevant to the user's query
      const queryLower = userMessage.text.toLowerCase();
      let responseIndex = 0;
      
      if (queryLower.includes('nuclear') || queryLower.includes('npt') || queryLower.includes('weapon')) {
        responseIndex = 1;
      } else if (queryLower.includes('climate') || queryLower.includes('finance') || queryLower.includes('fund')) {
        responseIndex = 2;
      } else if (queryLower.includes('resolution') || queryLower.includes('draft') || queryLower.includes('writing')) {
        responseIndex = 3;
      }
      
      const selectedResponse = responses[responseIndex];
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: selectedResponse.text,
        sources: selectedResponse.sources
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  // Handle clicking on a popular topic
  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    setQuery(topic);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              AI Research Assistant
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Get instant answers to your Model UN research questions about global issues, country positions, and UN procedures
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Sidebar with research topics */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900">Popular Research Topics</h2>
                <div className="mt-4 space-y-3">
                  {popularTopics.map((topic) => (
                    <button
                      key={topic}
                      className={`w-full text-left px-4 py-2 rounded-md text-sm ${
                        selectedTopic === topic
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => handleTopicClick(topic)}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Research Tips</h3>
                <ul className="mt-4 text-sm text-gray-600 space-y-3">
                  <li className="flex">
                    <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Be specific in your questions
                  </li>
                  <li className="flex">
                    <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ask about country positions on specific issues
                  </li>
                  <li className="flex">
                    <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Request statistics and recent developments
                  </li>
                  <li className="flex">
                    <svg className="h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ask for historical context on conflicts
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow overflow-hidden rounded-lg flex flex-col h-[700px]">
              {/* Chat messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-lg rounded-lg px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                        {message.sources && (
                          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                            <div className="font-bold">Sources:</div>
                            <ul className="mt-1 space-y-1">
                              {message.sources.map((source, index) => (
                                <li key={index}>
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    {source.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-lg rounded-lg px-4 py-3 bg-gray-100 text-gray-800">
                        <div className="flex items-center space-x-2">
                          <div className="bg-gray-200 rounded-full h-2 w-2 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="bg-gray-200 rounded-full h-2 w-2 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          <div className="bg-gray-200 rounded-full h-2 w-2 animate-bounce" style={{ animationDelay: '600ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Input area */}
              <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                <form onSubmit={handleSubmit} className="flex space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Ask a research question..."
                      className="block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !query.trim()}
                  >
                    <svg
                      className="-ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Send
                  </button>
                </form>
                <div className="mt-3 text-xs text-gray-500">
                  <span className="font-medium">Tip:</span> Try asking about UN procedures, country policies, or global issues
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 