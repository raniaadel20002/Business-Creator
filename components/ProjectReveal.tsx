import React from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';

interface ProjectRevealProps {
  onReveal: () => void;
  userName?: string;
  gender?: string;
}

const ProjectReveal: React.FC<ProjectRevealProps> = ({ onReveal, userName, gender }) => {
  const handleReveal = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ea580c', '#3b82f6', '#f59e0b', '#10b981']
    });
    
    // Slight delay before transitioning
    setTimeout(() => {
      onReveal();
    }, 800);
  };

  const isFemale = gender === 'أنثى' || gender === 'انثى' || gender === 'female';
  const displayName = userName ? userName.trim() : (isFemale ? 'بطلة' : 'بطل');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-12">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="text-4xl md:text-5xl font-black text-text-primary leading-relaxed max-w-4xl"
      >
        {isFemale ? `مبروك يا ${displayName}... ربنا يجعلها فتحة خير عليكِ` : `مبروك يا ${displayName}... ربنا يجعلها فتحة خير عليك`}
      </motion.h2>
      
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        onClick={handleReveal}
        className="px-10 py-5 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-xl font-bold justify-center rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all outline-none"
      >
        افتتح مشروعك
      </motion.button>
    </div>
  );
};

export default ProjectReveal;
