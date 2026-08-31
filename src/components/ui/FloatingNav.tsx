import React, { useState } from 'react';
import { Home, Lightbulb, FolderOpen, Menu, User, LogIn, LayoutDashboard, Building2, Layers, BadgeCheck, Coins } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'motion/react';
import { useAuth } from '../../features/auth/context/AuthContext';
import Logo from '../shared/Logo';

interface FloatingNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onToggleSections?: () => void;
  showSectionsToggle?: boolean;
}

const FloatingNav: React.FC<FloatingNavProps> = ({ currentView, onNavigate, onToggleSections, showSectionsToggle }) => {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const { scrollY } = useScroll();
  const { user, profile } = useAuth();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    
    // Hide when scrolling down past 50px, show when scrolling up
    if (latest > previous && latest > 50) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  });

  const items: Array<{ id: string, icon: React.ElementType, label: string, isMain?: boolean }> = [
    { id: 'home', icon: Building2, label: 'لوحة التحكم' },
    ...(user ? [{ id: 'saved-plans', icon: FolderOpen, label: 'مشاريعي' }] : []),
    { id: 'form', icon: Lightbulb, label: 'مسار جديد' },
    ...(showSectionsToggle ? [{ id: 'sections', icon: Layers, label: 'أقسام الخطة' }] : []),
    { id: 'menu', icon: Menu, label: 'القائمة الرئيسية' },
  ];

  return (
    <motion.div 
      className="sticky top-4 z-30 print:hidden w-full px-3 sm:px-4 md:px-6 max-w-5xl mx-auto"
      initial={{ y: 0, opacity: 1 }}
      animate={{ 
        y: isVisible ? 0 : -80, 
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div 
        className="flex items-center justify-between px-2.5 py-1.5 sm:px-4 sm:py-2 bg-white/80 backdrop-blur-xl border border-gray-100 shadow-xl shadow-black/5 rounded-full" 
        dir="rtl"
      >
        {/* Logo Section */}
        <div className="flex flex-1 justify-start shrink-0 min-w-0">
          <div 
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <Logo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
            <h1 className="hidden xl:block text-sm xl:text-base font-black text-gray-900 tracking-tight whitespace-nowrap">
              Business <span className="text-primary">Creator</span>
            </h1>
          </div>
        </div>

        {/* Center Navigation Icons */}
        <div className="flex justify-center items-center gap-1 sm:gap-2 md:gap-3 shrink-0 px-1 sm:px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'home' && currentView === 'search');
            const isHovered = hoveredIcon === item.id;

            return (
              <div 
                key={item.id} 
                className="relative flex flex-col items-center"
                onMouseEnter={() => setHoveredIcon(item.id)}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                <button
                  onClick={() => item.id === 'sections' && onToggleSections ? onToggleSections() : onNavigate(item.id)}
                  className={`relative group flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full transition-all duration-300 active:scale-95 ${
                    item.isMain 
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:bg-primary/90 hover:scale-105' 
                      : isActive 
                        ? 'bg-primary/10 text-primary scale-105 font-bold' 
                        : 'text-gray-500 hover:bg-primary/5 hover:text-primary hover:scale-105'
                  }`}
                >
                  <Icon size={18} className={`transition-transform duration-300 shrink-0 ${isActive && !item.isMain ? 'scale-110 text-primary' : ''}`} />
                  
                  {item.isMain && (
                    <div className="absolute inset-0 rounded-full bg-white/20 mix-blend-screen opacity-0 group-hover:opacity-100 transition-all"></div>
                  )}
                </button>

                {/* Tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, x: '-50%' }}
                      animate={{ opacity: 1, y: 0, x: '-50%' }}
                      exit={{ opacity: 0, y: 5, x: '-50%' }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-14 left-1/2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-bold rounded-lg whitespace-nowrap pointer-events-none shadow-lg z-50"
                    >
                      {item.label}
                      <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-2 h-2 bg-gray-900/90 rotate-45"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Profile / Auth Section */}
        <div className="flex flex-1 justify-end items-center gap-2 shrink-0">
          {user ? (
            <button 
              onClick={() => onNavigate('profile')}
              className="flex items-center justify-center gap-1.5 bg-orange-50 text-orange-700 w-9 h-9 sm:w-10 sm:h-10 xl:w-auto xl:px-4 xl:py-2 rounded-full hover:bg-orange-100 transition-all font-bold text-sm shrink-0"
              title={profile?.displayName || 'حسابي'}
            >
              <User size={18} className="shrink-0" />
              <span className="hidden xl:flex items-center gap-1 truncate max-w-[120px] text-xs xl:text-sm">
                {profile?.displayName || 'حسابي'}
                <BadgeCheck size={16} className="text-primary shrink-0" />
              </span>
            </button>
          ) : (
            <button 
              onClick={() => onNavigate('login')}
              className="flex items-center justify-center gap-1.5 bg-gray-900 text-white w-9 h-9 sm:w-10 sm:h-10 xl:w-auto xl:px-4 xl:py-2 rounded-full hover:bg-gray-800 transition-all font-bold text-sm shadow-md shrink-0"
              title="دخول"
            >
              <LogIn size={18} className="shrink-0" />
              <span className="hidden xl:block text-xs xl:text-sm">دخول</span>
            </button>
          )}
        </div>

      </div>
    </motion.div>
  );
};

export default FloatingNav;
