import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-sm sm:prose-base max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize heading styles
          h1: ({ children }) => (
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-blue-600 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 uppercase tracking-wide">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 uppercase">
              {children}
            </h3>
          ),
          // Customize paragraph styles
          p: ({ children }) => (
            <p className="text-sm sm:text-base text-gray-700 mb-3 leading-relaxed">
              {children}
            </p>
          ),
          // Customize list styles
          ul: ({ children }) => (
            <ul className="list-none space-y-1 mb-4">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className="text-sm sm:text-base text-gray-700 flex items-start">
              <span className="text-blue-600 mr-2 mt-1">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          // Customize strong/bold text
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">
              {children}
            </strong>
          ),
          // Customize emphasis/italic text
          em: ({ children }) => (
            <em className="italic text-gray-800">
              {children}
            </em>
          ),
          // Customize code blocks
          code: ({ children }) => (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">
              {children}
            </code>
          ),
          // Customize blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-600 pl-4 py-2 bg-blue-50 italic text-gray-700 mb-4">
              {children}
            </blockquote>
          ),
          // Customize horizontal rules
          hr: () => (
            <hr className="border-t-2 border-gray-300 my-6" />
          ),
          // Customize links
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;