import React from 'react';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from './CodeBlock';

interface FormattedTextProps {
  children?: string | any;
  className?: string;
}

export const isArabicText = (text: string | null | undefined): boolean => {
  if (!text) return true;
  const match = text.match(/[a-zA-Z\u0600-\u06FF]/);
  if (!match) return true;
  return /[\u0600-\u06FF]/.test(match[0]);
};

export const cleanText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .replace(/[():"']/g, '')
    .replace(/[“”‘’]/g, '');
};

export const FormattedText: React.FC<FormattedTextProps> = ({ children = '', className = '' }) => {
  if (!children) return null;

  let textToRender = '';
  if (typeof children !== 'string') {
    try {
      // If it has a specific text or description property, we can prefer it
      const obj = children as any;
      if (obj.description) {
        textToRender = obj.description;
      } else if (obj.title) {
        textToRender = `${obj.title} ${obj.description || ''}`;
      } else {
        textToRender = JSON.stringify(obj, null, 2);
      }
    } catch (e) {
      textToRender = String(children);
    }
  } else {
    textToRender = children;
  }

  const isXs = className.includes('text-xs');
  const isArabic = isArabicText(textToRender);

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className={`${isArabic ? 'text-right' : 'text-left'} w-full ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ node, children, ...props }) => (
            <p className={`mb-3 last:mb-0 leading-relaxed font-normal ${isArabic ? 'text-right' : 'text-left'} ${isXs ? 'text-xs' : 'text-sm'}`} {...props}>
              {children}
            </p>
          ),
          strong: ({ node, children, ...props }) => (
            <strong className="font-bold text-gray-900 mx-0.5" {...props}>
              {children}
            </strong>
          ),
          ul: ({ node, children, ...props }) => (
            <ul className={`list-disc list-inside mb-4 space-y-1.5 ${isArabic ? 'pr-2 mr-2 text-right' : 'pl-2 ml-2 text-left'}`} {...props}>
              {children}
            </ul>
          ),
          ol: ({ node, children, ...props }) => (
            <ol className={`list-decimal list-inside mb-4 space-y-1.5 ${isArabic ? 'pr-2 mr-2 text-right' : 'pl-2 ml-2 text-left'}`} {...props}>
              {children}
            </ol>
          ),
          li: ({ node, children, ...props }) => (
            <li className={`leading-relaxed font-normal ${isXs ? 'text-xs' : 'text-sm'}`} {...props}>
              {children}
            </li>
          ),
          h1: ({ node, children, ...props }) => (
            <h1 className={`text-xl font-black mb-3 text-gray-900 pb-1 border-b border-gray-100 ${isArabic ? 'text-right' : 'text-left'}`} {...props}>
              {children}
            </h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2 className={`text-lg font-bold mb-2 text-gray-900 ${isArabic ? 'text-right' : 'text-left'}`} {...props}>
              {children}
            </h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3 className={`text-base font-bold mb-1.5 text-gray-900 ${isArabic ? 'text-right' : 'text-left'}`} {...props}>
              {children}
            </h3>
          ),
          blockquote: ({ node, children, ...props }) => (
            <blockquote className={`my-3 italic text-gray-600 bg-gray-50 py-1 ${isArabic ? 'border-r-4 border-primary/40 pr-3 text-right' : 'border-l-4 border-primary/40 pl-3 text-left'}`} {...props}>
              {children}
            </blockquote>
          ),
          pre: ({ children }) => <>{children}</>,
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isInline = !match && !codeString.includes('\n');

            if (isInline) {
              return (
                <code className="bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 font-mono text-xs md:text-sm font-semibold dir-ltr inline-block mx-0.5 break-all" {...props}>
                  {children}
                </code>
              );
            }

            const language = match ? match[1] : '';
            return <CodeBlock code={codeString} language={language} />;
          },
        }}
      >
        {textToRender}
      </ReactMarkdown>
    </div>
  );
};
