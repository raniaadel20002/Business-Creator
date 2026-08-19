import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Bot, User, Loader2, MessageSquare, Trash2, Sparkles, RefreshCw, Info, X, MoreVertical, History, Plus, ChevronRight, Pin, PinOff, Square, Copy, Check, ArrowUp, ArrowDown, ArrowLeft,
  Lightbulb, Search, Users, Briefcase, Megaphone
} from 'lucide-react';
import { UserProfile, BusinessPlan, ChatSession, ChatMessage, TOKEN_COSTS } from '../types';
import { supabase, runAiTask, handleSupabaseError } from '../supabase';
import { useAuth } from './AuthContext';
import { FormattedText, isArabicText } from './FormattedText';
import { InsufficientTokensCard } from './InsufficientTokensCard';

const LOADING_STEPS = [
  { icon: Lightbulb },
  { icon: Search },
  { icon: Users },
  { icon: Briefcase },
  { icon: Megaphone },
];

const ChatLoadingIndicator: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const step = LOADING_STEPS[currentIndex];
  const StepIcon = step.icon;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 text-primary select-none max-w-max" dir="ltr">
      {/* Raw company-colored icon with seamless fade transition (no rotation), extremely compact */}
      <div className="relative w-4.5 h-4.5 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="text-primary flex items-center justify-center"
          >
            <StepIcon size={14} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Companion micro dots to signal active processing, ultra-compact */}
      <div className="flex gap-1 items-center h-4.5">
        <span className="w-1 h-1 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1 h-1 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1 h-1 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center justify-center p-2 -ml-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
      title="نسخ الرد"
    >
      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
    </button>
  );
};

interface AdvisorMessageItemProps {
  msg: ChatMessage;
  onUpgrade?: () => void;
}

const AdvisorMessageItem = React.memo(({ msg, onUpgrade }: AdvisorMessageItemProps) => {
  const isArabic = isArabicText(msg.content);
  const isTokenDepleted = msg.content === 'TOKEN_DEPLETED_NOTICE' || msg.content.includes('عفواً، لقد نفد رصيدك من النقاط');

  if (isTokenDepleted) {
    return (
      <div className="flex w-full justify-start">
        <InsufficientTokensCard
          title="مستشار Business Creator"
          badgeText="تنبيه رصيد المحادثة"
          message="عفواً، لقد نفد رصيدك من النقاط. يرجى شراء باقة جديدة لتتمكن من استخدام المحادثة."
          description="باقة رواد الأعمال (PRO) تمنحك 100,000 نقطة لتحليل وتنفيذ غير محدود مع استشارات ذكية متواصلة."
          onUpgrade={onUpgrade}
          className="max-w-lg my-2"
        />
      </div>
    );
  }

  return (
    <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col ${msg.role === 'user' ? 'max-w-[85%] md:max-w-[75%]' : 'w-full'}`}>
        <div 
          dir={isArabic ? 'rtl' : 'ltr'} 
          className={`text-base leading-relaxed ${isArabic ? 'text-right' : 'text-left'} ${
            msg.role === 'user' 
              ? 'bg-gray-100 text-gray-900 px-5 py-3 rounded-3xl rounded-tl-sm shadow-sm' 
              : 'bg-transparent text-text-primary'
          }`}
        >
          {msg.role === 'user' ? (
            <div className="whitespace-pre-wrap">{msg.content}</div>
          ) : (
            <FormattedText className="text-[15px] md:text-[16px]">
              {msg.content}
            </FormattedText>
          )}
        </div>
        {msg.role === 'model' && msg.content && (
          <div className="flex items-center gap-2 mt-2 px-1 text-gray-400">
            <CopyButton text={msg.content} />
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.msg.content === nextProps.msg.content && prevProps.msg.role === nextProps.msg.role && prevProps.msg.timestamp === nextProps.msg.timestamp;
});
AdvisorMessageItem.displayName = 'AdvisorMessageItem';

interface ChatInputAreaProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  onStop: () => void;
  profile: UserProfile;
  onNamingNewChat: () => void;
  onHistoryOpen: () => void;
  onClose: () => void;
  activeSessionId: string | null;
  setChatToDelete: (id: string | null) => void;
  messagesLength: number;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSend,
  isLoading,
  onStop,
  profile,
  onNamingNewChat,
  onHistoryOpen,
  onClose,
  activeSessionId,
  setChatToDelete,
  messagesLength,
}) => {
  const [input, setInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (customText?: string) => {
    const textToSend = customText !== undefined ? customText : input;
    if (!textToSend.trim() || isLoading) return;
    onSend(textToSend);
    if (customText === undefined) {
      setInput('');
    }
  };

  const starters = [
    { label: "💰 كيف أحصل على أول تمويل؟", prompt: "كيف يمكنني الحصول على أول تمويل لمشروعي بناءً على دراسة الجدوى المالية؟" },
    { label: "🚀 خطة تسويق سريعة", prompt: "اقترح لي خطة تسويق سريعة لأول شهر بميزانية منخفضة." },
    { label: "⚠️ ما هي أكبر المخاطر؟", prompt: "ما هي أكبر المخاطر التي قد تواجه مشروعي وكيف أتخطاها?" },
    { label: "⚖️ الإجراءات القانونية", prompt: "ما هي أهم الإجراءات القانونية التي يجب أن أبدأ بها في مصر؟" }
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-2 pb-2 px-4 md:px-6 z-30 pointer-events-none w-full">
      <div className="max-w-3xl mx-auto space-y-2 pointer-events-auto w-full">
        {/* Starter Suggestions Overlay */}
        {messagesLength <= 1 && !isLoading && (
          <div className="flex flex-wrap gap-2 justify-end mb-2">
            {starters.map((starter) => (
              <button
                key={starter.label}
                onClick={() => handleSubmit(starter.prompt)}
                className="bg-white border border-border px-4 py-2 rounded-[24px] text-sm font-bold text-text-secondary hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all shadow-sm cursor-pointer"
              >
                {starter.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 max-w-[95%] xl:max-w-3xl mx-auto w-full mb-1">
          <div className="relative shrink-0 z-40">
            {isMenuOpen && (
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setIsMenuOpen(false)} 
              />
            )}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center justify-center w-11 h-11 bg-white border border-gray-200/80 text-text-primary rounded-full shadow-sm transition-all focus:outline-none ${isMenuOpen ? 'bg-gray-100 rotate-90 text-primary border-primary/30' : 'hover:bg-gray-50'}`}
              title="خيارات السجل والمحادثات"
            >
              <MoreVertical size={16} />
            </button>
            
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute bottom-12 right-0 z-40 w-56 bg-white border border-border rounded-2xl shadow-2xl overflow-hidden py-2"
                >
                  <div className="px-4 py-3 border-b border-border/50 bg-gray-50/50 mb-1 text-right">
                    <p className="text-xs text-text-muted font-bold mb-2">خيارات المستشار</p>
                    <div className="flex flex-col gap-1 text-[11px] text-gray-650 bg-white p-2 rounded-lg border border-border/50 shadow-sm">
                      <div className="flex justify-between items-center" dir="rtl">
                        <span>رصيدك الحالي:</span>
                        <strong className="text-orange-600">{profile?.tokens || 0} نقطة</strong>
                      </div>
                      <div className="flex justify-between items-center" dir="rtl">
                        <span>تكلفة الرسالة:</span>
                        <strong className="text-orange-500">500 نقطة</strong>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { onNamingNewChat(); setIsMenuOpen(false); }}
                    className="w-full flex items-center justify-start gap-3 px-4 py-3 text-right hover:bg-gray-50 transition-colors border-none"
                    dir="rtl"
                  >
                    <Plus size={18} className="text-primary" />
                    <span className="font-bold text-sm">محادثة جديدة</span>
                  </button>
                  
                  <button 
                    onClick={() => { onHistoryOpen(); setIsMenuOpen(false); }}
                    className="w-full flex items-center justify-start gap-3 px-4 py-3 text-right hover:bg-gray-50 transition-colors border-none"
                    dir="rtl"
                  >
                    <History size={18} className="text-text-secondary" />
                    <span className="font-bold text-sm">سجل الشاتات</span>
                  </button>
                  
                  <button 
                    onClick={() => { onClose(); setIsMenuOpen(false); }}
                    className="w-full flex items-center justify-start gap-3 px-4 py-3 text-right hover:bg-gray-50 text-text-secondary transition-colors border-none"
                    dir="rtl"
                  >
                    <ChevronRight size={18} />
                    <span className="font-bold text-sm">الخروج من المستشار</span>
                  </button>
                  
                  <div className="h-px bg-border/50 my-1 mx-2" />
                  
                  <button 
                    onClick={() => {
                       setChatToDelete(activeSessionId);
                       setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-start gap-3 px-4 py-3 text-right hover:bg-red-50 text-red-600 transition-colors border-none"
                    dir="rtl"
                  >
                     <Trash2 size={18} />
                     <span className="font-bold text-sm">مسح الشات الحالي</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 min-w-0">
            <div 
              className="relative bg-white border-2 border-gray-300 hover:border-gray-400 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 rounded-[22px] shadow-md transition-all duration-200"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك هنا..."
                className={`w-full bg-transparent rounded-[22px] pl-12 pr-5 py-3 focus:outline-none resize-none min-h-[44px] max-h-[160px] text-gray-900 text-[15px] leading-relaxed placeholder:text-gray-400 scrollbar-hide block font-medium ${
                  isArabicText(input) ? 'text-right' : 'text-left'
                }`}
                rows={1}
                dir={isArabicText(input) ? 'rtl' : 'ltr'}
              />
              {isLoading ? (
                <button
                  onClick={onStop}
                  className="absolute left-1.5 bottom-1.5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-white hover:bg-black transition-all shadow-md active:scale-95 z-10 border-none"
                  title="إيقاف المستشار"
                >
                  <Square size={12} className="fill-white" />
                </button>
              ) : (
                <motion.button
                  animate={{ 
                    opacity: input.trim() ? 1 : 0.4,
                    scale: input.trim() ? 1 : 0.95
                  }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={input.trim() ? { scale: 1.05 } : {}}
                  onClick={() => handleSubmit()}
                  disabled={!input.trim()}
                  className={`absolute left-1.5 bottom-1.5 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-300 z-10 border-none ${
                    input.trim() 
                      ? 'bg-gradient-to-tr from-primary to-orange-400 text-white shadow-md shadow-primary/20 cursor-pointer' 
                      : 'bg-gray-200/80 text-gray-500'
                  }`}
                >
                  <ArrowUp size={16} />
                </motion.button>
              )}
            </div>
            {profile?.tokens !== undefined && profile.tokens < 500 && (
              <div className="text-center mt-3 relative z-50">
                <span className="text-[11px] px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-100 shadow-sm">
                  عفواً، لقد نفد رصيدك من النقاط. (تكلفة الرسالة 500 نقطة)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
ChatInputArea.displayName = 'ChatInputArea';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  handleSupabaseError(error, operationType, path);
};

interface AdvisorChatProps {
  profile: UserProfile;
  plan: BusinessPlan;
  onClose?: () => void;
  onUpgrade?: () => void;
}

const AdvisorChat: React.FC<AdvisorChatProps> = ({ profile, plan, onClose, onUpgrade }) => {
  const isMountedRef = useRef(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  
  // UI states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isNamingNewChat, setIsNamingNewChat] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  
  const { updateProfile } = useAuth();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<boolean>(false);

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isAtBottomRef = useRef(true);
  const prevMessagesCount = useRef(0);
  const lastScrollTopRef = useRef(0);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
      lastScrollTopRef.current = container.scrollHeight - container.clientHeight;
    } else if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Check if user is scrolling up manually (with a 3px buffer to filter noise)
    const isScrollingUp = lastScrollTopRef.current - scrollTop > 3;
    lastScrollTopRef.current = scrollTop;

    // user is considered at the bottom if they are within 100px of the bottom
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    if (isScrollingUp) {
      // If user is manually scrolling up, disable auto-scrolling
      isAtBottomRef.current = false;
    } else if (isNearBottom) {
      // If user scrolls back near the bottom, enable auto-scrolling
      isAtBottomRef.current = true;
    }

    // show the scroll bottom button if they scrolled up by more than 150px
    if (scrollHeight - scrollTop - clientHeight > 150) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
    }
  };
  const starters = [
    { label: "💰 كيف أحصل على أول تمويل؟", prompt: "كيف يمكنني الحصول على أول تمويل لمشروعي بناءً على دراسة الجدوى المالية؟" },
    { label: "🚀 خطة تسويق سريعة", prompt: "اقترح لي خطة تسويق سريعة لأول شهر بميزانية منخفضة." },
    { label: "⚠️ ما هي أكبر المخاطر؟", prompt: "ما هي أكبر المخاطر التي قد تواجه مشروعي وكيف أتخطاها؟" },
    { label: "⚖️ الإجراءات القانونية", prompt: "ما هي أهم الإجراءات القانونية التي يجب أن أبدأ بها في مصر؟" }
  ];

  const fetchSessions = async () => {
    if (!profile.uid || !plan.id) return;
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', profile.uid)
        .eq('project_id', plan.id);
      
      if (error) throw error;
      
      const docs: ChatSession[] = (data || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        projectId: d.project_id,
        title: d.title,
        messages: d.messages || [],
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        isPinned: d.is_pinned || false,
      })).sort((a: ChatSession, b: ChatSession) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      if (!isMountedRef.current) return;
      setSessions(docs);
      
      if (docs.length > 0) {
        if (!activeSessionId || !docs.find(d => d.id === activeSessionId)) {
          setActiveSessionId(docs[0].id);
          setMessages(docs[0].messages);
        }
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (isMountedRef.current) {
        setIsInitializing(false);
      }
    }
  };

  const togglePin = async (id: string, currentPinStatus: boolean) => {
    if (!id) return;
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ is_pinned: !currentPinStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      fetchSessions();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [profile.uid, plan.id]);

  useEffect(() => {
    const isNewMessageAdded = messages.length > prevMessagesCount.current;
    prevMessagesCount.current = messages.length;

    if (isNewMessageAdded || messages.length <= 1) {
      scrollToBottom('smooth');
      isAtBottomRef.current = true;
    } else if (isLoading && isAtBottomRef.current) {
      scrollToBottom('auto');
    }
  }, [messages, streamingContent, isLoading]);

  const createNewChat = async () => {
    if (!newChatTitle.trim()) return;
    
    setIsInitializing(true);
    const newId = profile.uid + '_' + Date.now().toString() + Math.random().toString(36).substring(7);
    const initialMessage: ChatMessage = {
      role: 'model',
      content: `أهلاً بك! أنا مستشارك الخاص في موضوع "**${newChatTitle}**".\n\nما الذي تود مناقشته بخصوص هذا الموضوع؟`,
      timestamp: new Date().toISOString()
    };
    
    const newSession: ChatSession = {
      id: newId,
      userId: profile.uid,
      projectId: plan.id,
      title: newChatTitle,
      messages: [initialMessage],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      const { error } = await supabase.from('chat_sessions').insert({
        id: newId,
        user_id: profile.uid,
        project_id: plan.id,
        title: newChatTitle,
        messages: [initialMessage],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_pinned: false,
      });
      if (error) throw error;
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);
      setMessages([initialMessage]);
      setIsNamingNewChat(false);
      setNewChatTitle('');
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const deleteChat = async (id: string) => {
    try {
      const { error } = await supabase.from('chat_sessions').delete().eq('id', id);
      if (error) throw error;
      if (activeSessionId === id) {
         setActiveSessionId(null);
         setMessages([]);
      }
      fetchSessions();
      setChatToDelete(null);
    } catch (error) {
       console.error('Failed to delete chat:', error);
    }
  };

  const switchChat = (id: string) => {
    const chat = sessions.find(s => s.id === id);
    if (chat) {
      setActiveSessionId(id);
      setMessages(chat.messages);
      setIsHistoryOpen(false);
    }
  };

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent || !messageContent.trim() || isLoading || !activeSessionId) return;

    abortRef.current = false;

    const userTokens = profile.tokens || 0;
    if (userTokens < TOKEN_COSTS.ADVISOR_MESSAGE) {
      const userMessage: ChatMessage = {
        role: 'user',
        content: messageContent,
        timestamp: new Date().toISOString()
      };
      const lowBalanceMessage: ChatMessage = {
        role: 'model',
        content: 'TOKEN_DEPLETED_NOTICE',
        timestamp: new Date(Date.now() + 100).toISOString()
      };
      setMessages(prev => [...prev, userMessage, lowBalanceMessage]);
      return;
    }

    try {
      await updateProfile({ tokens: userTokens - TOKEN_COSTS.ADVISOR_MESSAGE });
    } catch (err) {
      console.error("Failed to deduct tokens", err);
      alert("حدث خطأ أثناء خصم النقاط، يرجى المحاولة مرة أخرى.");
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    
    try {
      // Save user message by reading current messages and appending
      const { data: currentSession } = await supabase
        .from('chat_sessions')
        .select('messages')
        .eq('id', activeSessionId)
        .single();
      
      const updatedMessages = [...(currentSession?.messages || []), userMessage];
      
      await supabase.from('chat_sessions').update({
        messages: updatedMessages,
        updated_at: new Date().toISOString()
      }).eq('id', activeSessionId);

      // Log advisor message action
      try {
        await supabase.from('logs').insert({
          user_id: profile.uid,
          user_name: profile.displayName || profile.email || 'مستخدم',
          user_email: profile.email || '',
          action: 'إرسال رسالة للمستشار الذكي (Send Advisor Message)',
          details: { projectName: plan.projectName, messageLength: messageContent.length, module: 'Advisor' },
          timestamp: new Date().toISOString()
        });
      } catch (logErr) {
        console.warn("Failed to log advisor message:", logErr);
      }

      const currentTitle = sessions.find(s => s.id === activeSessionId)?.title || "عام";
      
      const previousChatsContext = '';
      
      const systemInstruction = `
        أنت "مستشار بزنس كرياتور" (Business Creator Advisor). 
        خبير استراتيجي، محلل أسواق، ومرشد لرواد الأعمال، وتمثل منصة Business Creator.
        
        وصف المنصة التي تمثلها (Business Creator):
        منصة متخصصة في بناء المشاريع تساعد المستخدمين على بدء مشروع حقيقي قابل للتنفيذ على أرض الواقع أو أونلاين—مش مجرد فكرة. نحن نعتمد على تحليل مشاكل حقيقية في السوق وتحويلها لفرص من أجل بناء مشروع متكامل "على مقاس" المستخدم بناءً على وضعه الحالي، قدراته المالية، وظروفه. نقوم ببناء خطة تنفيذ واضحة من الفكرة لأول دخل.

        سياق المحادثة المخصص الحالي هو حول: "${currentTitle}"
        
        معلومات شاملة ومفصلة عن المستخدم:
        - الاسم: ${profile.userData?.fullName || profile.displayName || 'غير محدد'}
        - جميع البيانات المتوفرة عن المستخدم:
        ${JSON.stringify(profile.userData || {}, null, 2)}
        
        معلومات شاملة عن المشروع الحالي:
        - اسم المشروع: ${plan.projectName || 'غير محدد'}
        - المفهوم الأساسي: ${plan.concept}
        - المبرر: ${plan.rationale}
        - نوع المشروع: ${plan.type}
        - معلومات السوق والجمهور المستهدف: ${JSON.stringify(plan.targetAudience || {}, null, 2)}
        - معلومات الجدوى والتكاليف تقريبية: ${JSON.stringify(plan.feasibility || {}, null, 2)}
        ${previousChatsContext}
        
        🧠 دستور وقواعد الذكاء الاصطناعي داخل منصة Business Creator (التزام صارم ولا استثناءات):

        1. دقة المعلومات والبحث الحي (Live Verified Information):
        أي معلومة تقدمها يجب أن تكون: حقيقية، محدثة، موثوقة، وقابلة للإثبات. 
        يُمنع الاعتماد على المعرفة القديمة المخزنة فقط. استخدم أداة البحث للتحقق من أي معلومة قبل الإجابة.
        تعامل مع كل معلومة على أساس أن المستخدم سيبني عليها قرارات مالية حقيقية.

        2. منع الهبد أو اختلاق المعلومات:
        يُمنع تماماً التخمين أو إعطاء افتراضات غير مؤكدة.
        إذا لم تكن متأكداً، ابحث أولاً. وإذا لم تتوفر المعلومة، صارح المستخدم بذلك بوضوح.

        3. منع الخرافة أو الكلام غير الواقعي:
        إجاباتك يجب أن تكون منطقية وعملية وقابلة للتطبيق. لا لوعود غير واقعية أو كلام نظري.

        4. منع المجاملة والتطبيل:
        لا تجامل أو تتعاطف على حساب الحقيقة.
        خطوة صحيحة = قل إنها صحيحة واشرح لماذا.
        خطوة خاطئة = قل بوضوح وصراحة أنها خاطئة واشرح، ثم ساعده في التصحيح.
        "الحقيقة أولاً ثم الدعم".

        5. كن سنداً للمستخدم:
        افهم ظروفه، شخصيته، وتحدياته. ادعمه وحفزه ووضح له الطريق بدون مبالغة أو كلام فارغ.

        6. منع الكلام السطحي والعام:
        يُمنع التكرار والإجابات العامة. يجب أن تكون إجاباتك مفصلة، عملية، واحترافية. تعلم المستخدم وليس فقط الرد عليه.

        7. أسلوب الكلام واللغة:
        تحدث مع المستخدم بنفس لغته (اختر العربي أو الإنجليزي حسب لغة المستخدم وقوة سياقه).
        - إذا كان يتحدث بالعربية، استخدم اللهجة المصرية الاحترافية أو الفصحى المبسطة لتكون قريباً منه بشكل طبيعي ومحترف.
        - لا تتكلف، ولا تستخدم كلمات مكررة بشكل مزعج، ولا تبالغ بمدحه (مثل تكرار كلمة "ذكي").
        - تنبيه هام وجوهري للغاية بخصوص نوع وجنس المستخدم (Gender):
          * حدد جنس المستخدم من الملف: "${profile.userData?.gender || 'غير محدد'}".
          * إذا كان جنس وفئات المستخدم يعادل "أنثى" أو "انثى" أو "female"، فيجب عليكِ مخاطبتها بصيغة المؤنث طوال المحادثة بالكامل وفي كل جملة ونصح ورسالة بشكل مطلق وصارم وبلا استثناء (مثل: "يا بطلة"، "أهلاً بكِ"، "رائدة أعمال"، "أنتِ"، "تستطيعين"، "مشروعكِ"، "رحلتكِ"، "مستعدة").
          * إذا كان "ذكر" أو "male" أو "غير محدد"، خاطبه بصيغة المذكر طوال الوقت (مثل: "يا بطل"، "أهلاً بك"، "رائد أعمال"، "أنت"، "تستطيع"، "مشروعك"، "رحلتك").
        
        8. 🚫 حماية أسرار المنصة والحظر القاطع لأي أفكار شبيهة بمنصة Business Creator أو محركات إنشاء المشاريع:
        - يُمنع منعاً باتاً ومطلقاً اقتراح أو مساعدة العميل على بناء أو استنساخ أي فكرة مشروع تكون شبيهة بمنصة Business Creator أو محركات توليد المشاريع ودراسات الجدوى بالذكاء الاصطناعي أو بوتات الاستشارات الريادية العامة أو منصات بناء الشركات الناشئة المشابهة لنظامنا!
        - إذا سأل المستخدم عن اقتراح فكرة مشروع، يجب اقتراح مشاريع تجارية حقيقية في قطاعات السوق المختلفة (تجارة وتوزيع، تصنيع محلي، خدمات مهارية وميدانية، أطعمة ومشروبات، تكنولوجيا لقطاعات متخصصة كالعقارات أو الصحة أو التعليم وليس لتوليد المشاريع).
        - إذا سأل صراحة عن بناء منصة لإنشاء المشاريع أو منافسة Business Creator، ارفض بأدب واحترافية ووضح أن هذا المجال محظور وأنك تساعده في بناء مشاريع تجارية متخصصة في الأسواق المستهدفة مع الحفاظ على سرية النظام.

        9. فهم وتسويق المنصة:
        يجب أن تفهم وتسوق باحترافية وتتحدث بكل فخر وحيادية عن Business Creator إذا سُئلت. المنصة تبني مشاريع حقيقية على مقاس المستخدم بخطوات عملية، وليس أفكاراً نظرية.

        10. 🚫 التنوع التام والابتكار الحقيقي عند طلب فكرة بديلة أو إعادة التوليد (Unique & Diverse Ideas):
        إذا طلب المستخدم فكرة مشروع أو طلب إعادة إنشاء أو تغيير الفكرة أو قال 'اقترح فكرة تانية' / 'مش عاجباني الفكرة دي وعايز فكرة تانية خالص' / 'إعادة توليد':
        يجب عليك حتماً تقديم فكرة مشروع جديدة كلياً ومختلفة تماماً عن أي فكرة تم اقتراحها له سابقاً! يُحظر تماماً تكرار نفس الفكرة أو تقديم تعديل طفيف عليها. اقترح فكرة من زاوية مختلفة وفي قطاع مختلف وبنموذج عمل مختلف ومبتكر ومناسب لإمكانياته ورأس ماله.

        11. المهام الخاصة والمنطقية والتعامل مع الأكواد والبرومبتات:
        قدم نصائح مخصصة جداً ومترابطة بناءً على معلومات ملفه ومشروعه ومحادثاته السابقة.
        إجاباتك يجب أن تكون منظمة جداً، سهلة القراءة ومباشرة.
        هام جداً: إذا طلب المستخدم منك كوداً برمجيّاً أو صيغة برومبت (Prompt) أو أمر تشغيلي أو نصاً هيكلياً، يجب عليك دائماً كتابة الكود أو البرومبت داخل بلوك كود ماركداون ثلاثي الأقواس (\`\`\`language ... \`\`\`) مع تحديد لغة الكود أو كتابة \`\`\`prompt للبرومبتات، حتى يظهر للمستخدم في بطاقة احترافية مع زر النسخ.
        الدقة > السرعة. الحقيقة > المجاملة. الفائدة > الكلام الكثير.
      `;

      setStreamingContent('');
      
      const chatHistory = newMessages
        .filter((m, i) => !(i === 0 && m.role === 'model'))
        .map(m => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const res = await runAiTask('chat_message', { systemInstruction, chatHistory, sessionId: activeSessionId }, profile.uid);
      if (abortRef.current) {
        console.log("Chat response generation aborted by user.");
        return;
      }
      const fullResponse = typeof res === 'string' ? res : (res?.text || res?.content || res?.result || '');

      const aiMessage: ChatMessage = {
        role: 'model',
        content: fullResponse,
        timestamp: new Date().toISOString()
      };

      if (abortRef.current) return;

      // Append AI message
      const { data: sessionAfterAI } = await supabase
        .from('chat_sessions')
        .select('messages')
        .eq('id', activeSessionId)
        .single();
      
      const msgsAfterAI = [...(sessionAfterAI?.messages || newMessages), aiMessage];
      await supabase.from('chat_sessions').update({
        messages: msgsAfterAI,
        updated_at: new Date().toISOString()
      }).eq('id', activeSessionId);

      if (abortRef.current) return;

      setMessages(prev => [...prev, aiMessage]);
      setStreamingContent('');
    } catch (error) {
      if (abortRef.current) {
        console.log("Chat error bypassed because user aborted.");
        return;
      }
      if (error instanceof Error && error.message.includes('permission')) {
        console.error('Chat permission error:', error);
      }
      console.error("Chat error:", error);
      const errorMessageStr = error instanceof Error ? error.message : String(error);
      let errorMessage = "عذراً، واجهت مشكلة تقنية. يرجى المحاولة مرة أخرى.";
      
      if (errorMessageStr.includes('429') || errorMessageStr.toLowerCase().includes('quota') || errorMessageStr.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = "لقد وصلنا للحد الأقصى من الرسائل المجانية المسموح بها حالياً. هذا إجراء تنظيمي لضمان عدالة الخدمة للجميع. سأكون بانتظارك، يرجى المحاولة مرة أخرى بعد دقيقتين فقط!";
      } else if (errorMessageStr.includes('safety') || errorMessageStr.includes('blocked')) {
        errorMessage = "عذراً، تم حظر هذا الرد بواسطة فلاتر الأمان. يرجى محاولة طرح السؤال بطريقة مختلفة.";
      }

      setMessages(prev => [...prev, {
        role: 'model',
        content: errorMessage,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 text-text-muted">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="font-bold text-xl animate-pulse">جاري الاستعداد...</p>
      </div>
    );
  }

  // Modals
  if (isNamingNewChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-border">
          <h2 className="text-xl font-bold mb-4">محادثة جديدة</h2>
          <p className="text-text-secondary mb-6 text-sm leading-relaxed">
            ما هو الموضوع أو الجانب الذي تريد مناقشته بخصوص مشروعك في هذه المحادثة؟ (مثال: الشؤون القانونية، الحملة التسويقية الأولى، تطوير المنتج)
          </p>
          <input 
            type="text"
            className="w-full border border-border rounded-xl px-4 py-3 mb-6 focus:ring-2 focus:ring-primary focus:border-primary font-bold"
            placeholder="اكتب اسم المحادثة..."
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') createNewChat();
            }}
            autoFocus
          />
          <div className="flex justify-end gap-3">
             <button 
              onClick={() => setIsNamingNewChat(false)}
              className="px-6 py-2 text-text-secondary hover:bg-gray-100 rounded-xl font-bold"
            >
              إلغاء
            </button>
            <button 
              onClick={createNewChat}
              disabled={!newChatTitle.trim() || isInitializing}
              className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 font-bold transition-all shadow-md"
            >
              بدء النقاش
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isHistoryOpen) {
    return (
      <div className="flex-1 flex flex-col bg-background p-6 overflow-hidden max-w-3xl mx-auto w-full relative">
         <div className="absolute top-4 right-6 z-40">
           <button 
             onClick={onClose}
             className="flex items-center justify-center gap-2 px-4 h-12 bg-white/80 backdrop-blur border border-border/50 text-text-primary rounded-full shadow-md transition-all hover:bg-gray-100 hover:pr-5 group"
             title="الخروج من المستشار"
           >
             <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
             <span className="font-bold text-sm hidden sm:inline">الخروج من المستشار</span>
           </button>
         </div>

         <div className="flex justify-between items-center mb-8 mt-12">
           <h2 className="text-2xl font-bold">سجل المحادثات الذكية</h2>
           <button onClick={() => setIsHistoryOpen(false)} className="p-3 bg-white hover:bg-gray-50 border border-border rounded-full shadow-sm text-sm font-bold">
             العودة للمحادثة
           </button>
         </div>
         <div className="flex-1 overflow-y-auto space-y-4 pb-12">
            {sessions.map((s, i) => (
              <div key={s.id || i} className="relative group">
                <button
                  onClick={() => switchChat(s.id)}
                  className={`w-full text-right py-5 pr-5 pl-24 rounded-2xl border transition-all ${
                    activeSessionId === s.id 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border bg-white hover:bg-gray-50 hover:border-border/80 hover:shadow-sm group-hover:pr-6'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-lg flex items-center gap-2">
                       {s.isPinned && <Pin size={16} className="text-primary fill-primary" />}
                       <span>{s.title || "محادثة"}</span>
                    </div>
                  </div>
                  <div className="text-sm text-text-muted">
                    {new Date(s.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </button>
                <div className="absolute top-1/2 -translate-y-1/2 left-4 flex gap-2 items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(s.id, !!s.isPinned);
                    }}
                    className={`p-2.5 rounded-full bg-white hover:bg-gray-50 transition-all shadow-sm border border-border/50 ${s.isPinned ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    title={s.isPinned ? "إلغاء التثبيت" : "تثبيت المحادثة"}
                  >
                    {s.isPinned ? <PinOff size={20} /> : <Pin size={20} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChatToDelete(s.id);
                    }}
                    className="text-red-500 bg-white hover:bg-red-50 p-2.5 rounded-full transition-all shadow-sm border border-border/50"
                    title="حذف المحادثة"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
               <div className="text-center py-20 text-text-muted">
                 <History size={48} className="mx-auto mb-4 opacity-20" />
                 <p className="font-bold">لا يوجد محادثات سابقة</p>
               </div>
            )}
         </div>
      </div>
    );
  }

  if (!activeSessionId) {
    // Empty state - No active chat
    return (
       <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background relative">
         <div className="absolute top-4 right-6 z-40">
           <button 
             onClick={() => setIsHistoryOpen(true)}
             className="flex items-center justify-center gap-2 px-4 h-12 bg-white/80 backdrop-blur border border-border/50 text-text-primary rounded-full shadow-md transition-all hover:bg-gray-100 hover:pr-5 group"
             title="سجل المحادثات"
           >
             <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
             <span className="font-bold text-sm hidden sm:inline">سجل المحادثات</span>
           </button>
         </div>
         <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary mt-12">
            <MessageSquare size={40} />
         </div>
         <h2 className="text-2xl font-bold mb-4">المستشار المخصص</h2>
         <p className="text-text-secondary text-center max-w-md mb-8 leading-relaxed">
           ابدأ نقاشاً حول أي جانب من جوانب مشروعك. يمكنك إنشاء عدة محادثات منظمة بحسب الموضوعات المختلفة!
         </p>
         <button 
            onClick={() => setIsNamingNewChat(true)}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-105 transition-all"
         >
           <Plus size={24} />
           <span className="font-bold text-lg">بدء أول محادثة مخصصة</span>
         </button>
       </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative w-full max-w-full min-h-0">
      {/* Messages Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-6 pb-20 scrollbar-hide"
      >
        <div className="max-w-[95%] xl:max-w-5xl w-full mx-auto px-4 md:px-6 space-y-8">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div 
                key={`${idx}-${msg.timestamp}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <AdvisorMessageItem msg={msg} onUpgrade={onUpgrade} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming Message Indicator / Rotating Icon Loader */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full justify-start mt-2 px-1 animate-in fade-in duration-500"
            >
              <ChatLoadingIndicator />
            </motion.div>
          )}
          <div ref={chatEndRef} className="h-4" />
        </div>
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.8, y: 10, x: "-50%" }}
            onClick={() => {
              scrollToBottom('smooth');
              isAtBottomRef.current = true;
              setShowScrollBottom(false);
            }}
            className="absolute bottom-16 left-1/2 z-40 bg-white border border-gray-200/80 text-gray-600 hover:text-primary hover:bg-gray-50 p-2.5 rounded-full shadow-lg transition-all flex items-center justify-center cursor-pointer w-9 h-9 active:scale-90"
            title="النزول لأسفل المحادثة"
          >
            <ArrowDown size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Overlay */}
      <ChatInputArea 
        onSend={handleSendMessage}
        isLoading={isLoading}
        onStop={() => { 
          abortRef.current = true; 
          setIsLoading(false); 
        }}
        profile={profile}
        onNamingNewChat={() => setIsNamingNewChat(true)}
        onHistoryOpen={() => setIsHistoryOpen(true)}
        onClose={onClose}
        activeSessionId={activeSessionId}
        setChatToDelete={setChatToDelete}
        messagesLength={messages.length}
      />

      {chatToDelete && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">مسح المحادثة</h3>
            <p className="text-text-secondary mb-8 leading-relaxed">
              هل أنت متأكد من مسح هذه المحادثة بالكامل؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح جميع الرسائل.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setChatToDelete(null)}
                className="flex-1 py-3 text-text-secondary bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors"
              >
                تراجع
              </button>
              <button
                onClick={() => deleteChat(chatToDelete)}
                className="flex-1 py-3 bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-red-600/20"
              >
                <Trash2 size={18} />
                تأكيد المسح
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorChat;
