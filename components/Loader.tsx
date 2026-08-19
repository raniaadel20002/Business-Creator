
import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lightbulb, Search, Users, Swords, ShieldCheck, Briefcase, Megaphone, Flag } from 'lucide-react';

interface LoaderProps {
  stage: number;
}

const nodesRTL = [
  { id: 1, label: 'الفكرة', x: 92, y: 50, icon: Lightbulb },
  { id: 2, label: 'السوق', x: 80, y: 15, icon: Search },
  { id: 3, label: 'الجمهور', x: 68, y: 85, icon: Users },
  { id: 4, label: 'المنافسين', x: 56, y: 30, icon: Swords },
  { id: 5, label: 'SWOT', x: 44, y: 70, icon: ShieldCheck },
  { id: 6, label: 'النموذج', x: 32, y: 20, icon: Briefcase },
  { id: 7, label: 'التسويق', x: 20, y: 80, icon: Megaphone },
  { id: 8, label: 'النجاح!', x: 8, y: 45, icon: Flag },
];

const Loader: React.FC<LoaderProps> = ({ stage }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        let target = 0;
        let increment = 0;

        if (stage === 0) {
          target = 25;
          increment = 0.6; // Takes ~4 seconds to reach 24%
        } else if (stage === 1) {
          target = 50;
          increment = 0.6;
        } else if (stage === 2) {
          target = 75;
          increment = 0.6;
        } else if (stage === 3) {
          target = 98;
          if (prev < 90) {
            increment = 0.4;
          } else {
            increment = 0.1;
          }
        } else {
          // stage >= 4
          target = 99;
          increment = 0.05;
        }

        if (prev < target) {
          const next = prev + increment;
          return next > target ? target : next;
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [stage]);

  const thresholds = [12, 25, 37, 50, 62, 75, 87, 98];

  const messages = [
    "يتم الآن تحليل معطياتك وتشخيص وضعك الفعلي للبدء...",
    "جارِ مقارنة بياناتك مع احتياجات السوق والفرص المتاحة...",
    "يقوم النظام ببناء هيكل المشروع وتحليل الموارد والمخاطر...",
    "جارِ إنشاء مسار التنفيذ العملي خطوة بخطوة...",
    "يتم الآن تجميع خطة العمل الاستراتيجية الخاصة بك... يرجى الانتظار"
  ];

  const pathD = useMemo(() => {
    return nodesRTL.reduce((acc, node, i) => {
      const px = Math.round((node.x / 100) * 800);
      const py = Math.round((node.y / 100) * 200);
      if (i === 0) return `M ${px} ${py}`;
      const prevNode = nodesRTL[i - 1];
      const prevX = Math.round((prevNode.x / 100) * 800);
      const prevY = Math.round((prevNode.y / 100) * 200);
      const cp1x = prevX - (prevX - px) / 2;
      const cp1y = prevY;
      const cp2x = px + (prevX - px) / 2;
      const cp2y = py;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${px} ${py}`;
    }, "");
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-4">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-4 border-4 border-accent/20 border-b-accent rounded-full flex items-center justify-center animate-spin-slow">
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-lg text-primary select-none font-mono" dir="ltr">
          {Math.round(progress)}%
        </div>
      </div>
      
      <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-12 max-w-2xl animate-pulse">
        {messages[stage] || "انتظر قليلاً..."}
      </h2>
      
      {/* Animated Journey Map */}
      <div className="relative w-full max-w-4xl h-[240px] mt-4 mb-8 select-none">
        <svg viewBox="0 0 800 200" className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
          {/* Base dashed line */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="currentColor" 
            className="text-gray-200"
            strokeWidth="3" 
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
          {/* Animated line */}
          <motion.path 
            d={pathD} 
            fill="none" 
            stroke="currentColor" 
            className="text-primary"
            strokeWidth="4" 
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{
              duration: 0.5,
              ease: "easeOut"
            }}
          />
        </svg>

        {/* Nodes */}
        {nodesRTL.map((node, idx) => {
          const Icon = node.icon;
          const isActive = progress >= thresholds[idx];
          return (
            <motion.div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: isActive ? 1 : 0.8, opacity: isActive ? 1 : 0.5 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className={`border-2 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md relative z-10 transition-colors duration-500 ${isActive ? 'bg-white border-primary/20' : 'bg-gray-100 border-gray-200'}`}>
                <Icon size={16} className={`transition-colors duration-500 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Loader;
