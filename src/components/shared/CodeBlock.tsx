import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const normalizedLang = (language || '').toLowerCase().trim();
  const isPrompt = normalizedLang.includes('prompt') || normalizedLang.includes('برومبت');

  // Human-readable language name
  const getLanguageLabel = () => {
    if (isPrompt) return 'برومبت / Prompt';
    if (!normalizedLang || normalizedLang === 'text' || normalizedLang === 'txt') return 'كود / نص';
    if (normalizedLang === 'js' || normalizedLang === 'javascript') return 'JavaScript';
    if (normalizedLang === 'ts' || normalizedLang === 'typescript') return 'TypeScript';
    if (normalizedLang === 'py' || normalizedLang === 'python') return 'Python';
    if (normalizedLang === 'html') return 'HTML';
    if (normalizedLang === 'css') return 'CSS';
    if (normalizedLang === 'json') return 'JSON';
    if (normalizedLang === 'sql') return 'SQL';
    if (normalizedLang === 'bash' || normalizedLang === 'sh' || normalizedLang === 'shell') return 'Terminal / Bash';
    return normalizedLang;
  };

  // Check if text is predominantly Arabic (for direction)
  const isArabic = /[\u0600-\u06FF]/.test(code);

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-gray-200/90 bg-white shadow-sm text-right dir-rtl w-full max-w-full">
      {/* Top Header Bar - Clean Light Business Creator style */}
      <div 
        dir="ltr"
        className="flex items-center justify-between px-4 py-2 bg-gray-50/90 border-b border-gray-200/80 text-xs text-gray-700 font-sans select-none"
      >
        {/* Left Side: Language / Type Label without dot or icon */}
        <div className="flex items-center">
          <span className="font-bold tracking-wide uppercase text-gray-700 text-xs">
            {getLanguageLabel()}
          </span>
        </div>

        {/* Right Side: Copy Button */}
        <button
          onClick={handleCopy}
          type="button"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer border ${
            copied
              ? 'bg-primary/10 text-primary border-primary/30 shadow-xs'
              : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-primary border-gray-200/90 hover:border-gray-300 shadow-xs active:scale-95'
          }`}
          title="نسخ الكود / البرومبت"
        >
          {copied ? (
            <>
              <Check size={13} className="text-primary stroke-[2.5]" />
              <span>تم النسخ!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>نسخ</span>
            </>
          )}
        </button>
      </div>

      {/* Code / Prompt Text Area - Very light white/off-white background with clear text wrapping */}
      <div 
        dir={isArabic && isPrompt ? 'rtl' : 'ltr'} 
        className="p-4 md:p-4.5 overflow-x-auto bg-[#fafbfc] max-w-full"
      >
        <pre className="font-mono text-[13px] md:text-[14px] leading-relaxed text-gray-900 whitespace-pre-wrap break-words [word-break:break-word] [overflow-wrap:anywhere] m-0 p-0 bg-transparent border-0">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
