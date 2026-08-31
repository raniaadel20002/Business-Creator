import React, { useState, useEffect, useRef } from 'react';
import { UserData, Step, getDailyGenerationStatus, TOKEN_COSTS } from '../../../types/types';
import { GOVERNORATES } from '../../../constants/constants';
import CustomSelect from '../../../components/shared/CustomSelect';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, User, DollarSign, Brain, Settings, Lightbulb, Heart, Briefcase, FileText, Info, Zap, X, MapPin, ArrowDown } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { InsufficientTokensCard } from '../../payments/components/InsufficientTokensCard';

interface ModelItemConfig {
  name: string;
  category: string;
  locations: ('offline' | 'online')[];
  natures: ('product' | 'service')[];
  ideaTypes?: ('traditional' | 'innovative')[];
}

const MODEL_CONFIGS: ModelItemConfig[] = [
  // التجارة والبيع
  { name: "متجر إلكتروني", category: "التجارة والبيع", locations: ['online'], natures: ['product'] },
  { name: "متجر تقليدي", category: "التجارة والبيع", locations: ['offline'], natures: ['product'] },
  { name: "تجارة جملة", category: "التجارة والبيع", locations: ['offline', 'online'], natures: ['product'] },
  { name: "تجارة تجزئة", category: "التجارة والبيع", locations: ['offline', 'online'], natures: ['product'] },
  { name: "توزيع", category: "التجارة والبيع", locations: ['offline', 'online'], natures: ['product'] },
  { name: "استيراد وتصدير", category: "التجارة والبيع", locations: ['offline', 'online'], natures: ['product'] },
  { name: "تجارة متخصصة / Niche", category: "التجارة والبيع", locations: ['offline', 'online'], natures: ['product'] },
  { name: "إعادة بيع المنتجات", category: "التجارة والبيع", locations: ['offline', 'online'], natures: ['product'] },
  { name: "بيع بالطلب", category: "التجارة والبيع", locations: ['offline', 'online'], natures: ['product'] },
  { name: "Dropshipping", category: "التجارة والبيع", locations: ['online'], natures: ['product'] },

  // المنصات والوساطة
  { name: "Marketplace / منصة تجمع بائعين ومشترين", category: "المنصات والوساطة", locations: ['online', 'offline'], natures: ['product', 'service'] },
  { name: "منصة خدمات", category: "المنصات والوساطة", locations: ['online', 'offline'], natures: ['service'] },
  { name: "منصة حجز", category: "المنصات والوساطة", locations: ['online', 'offline'], natures: ['service'] },
  { name: "منصة توصيل", category: "المنصات والوساطة", locations: ['online', 'offline'], natures: ['product', 'service'] },
  { name: "منصة تربط مقدم الخدمة بالعميل", category: "المنصات والوساطة", locations: ['online', 'offline'], natures: ['service'] },
  { name: "وسيط تجاري", category: "المنصات والوساطة", locations: ['offline', 'online'], natures: ['product', 'service'] },
  { name: "Lead Generation / توليد عملاء", category: "المنصات والوساطة", locations: ['online', 'offline'], natures: ['service'] },
  { name: "منصة إعلانات مبوبة", category: "المنصات والوساطة", locations: ['online'], natures: ['product', 'service'] },
  { name: "منصة اشتراكات", category: "المنصات والوساطة", locations: ['online'], natures: ['product', 'service'] },

  // البرمجيات والتكنولوجيا
  { name: "SaaS", category: "البرمجيات والتكنولوجيا", locations: ['online'], natures: ['service'] },
  { name: "تطبيق موبايل", category: "البرمجيات والتكنولوجيا", locations: ['online'], natures: ['service', 'product'] },
  { name: "Web App", category: "البرمجيات والتكنولوجيا", locations: ['online'], natures: ['service'] },
  { name: "منصة B2B", category: "البرمجيات والتكنولوجيا", locations: ['online'], natures: ['service', 'product'] },
  { name: "منصة B2C", category: "البرمجيات والتكنولوجيا", locations: ['online'], natures: ['service', 'product'] },
  { name: "أداة Software Tool", category: "البرمجيات والتكنولوجيا", locations: ['online'], natures: ['service'] },
  { name: "API / خدمة تقنية", category: "البرمجيات والتكنولوجيا", locations: ['online'], natures: ['service'] },
  { name: "مشروع قائم على الذكاء الاصطناعي", category: "البرمجيات والتكنولوجيا", locations: ['online'], natures: ['service', 'product'] },
  { name: "Automation / أتمتة", category: "البرمجيات والتكنولوجيا", locations: ['online'], natures: ['service'] },
  { name: "Marketplace تقني", category: "البرمجيات والتكنولوجيا", locations: ['online'], natures: ['service', 'product'] },

  // الخدمات
  { name: "خدمة للأفراد B2C", category: "الخدمات", locations: ['offline', 'online'], natures: ['service'] },
  { name: "خدمة للشركات B2B", category: "الخدمات", locations: ['offline', 'online'], natures: ['service'] },
  { name: "وكالة", category: "الخدمات", locations: ['offline', 'online'], natures: ['service'] },
  { name: "استشارات", category: "الخدمات", locations: ['offline', 'online'], natures: ['service'] },
  { name: "تدريب وتعليم", category: "الخدمات", locations: ['offline', 'online'], natures: ['service'] },
  { name: "صيانة وإصلاح", category: "الخدمات", locations: ['offline'], natures: ['service'] },
  { name: "خدمات منزلية", category: "الخدمات", locations: ['offline'], natures: ['service'] },
  { name: "خدمات ميدانية", category: "الخدمات", locations: ['offline'], natures: ['service'] },
  { name: "خدمات احترافية", category: "الخدمات", locations: ['offline', 'online'], natures: ['service'] },
  { name: "خدمات اشتراك شهرية", category: "الخدمات", locations: ['offline', 'online'], natures: ['service'] },

  // التصنيع والإنتاج
  { name: "تصنيع منتج", category: "التصنيع والإنتاج", locations: ['offline', 'online'], natures: ['product'] },
  { name: "تجميع منتجات", category: "التصنيع والإنتاج", locations: ['offline', 'online'], natures: ['product'] },
  { name: "تصنيع حسب الطلب", category: "التصنيع والإنتاج", locations: ['offline', 'online'], natures: ['product'] },
  { name: "Private Label", category: "التصنيع والإنتاج", locations: ['offline', 'online'], natures: ['product'] },
  { name: "علامة تجارية خاصة", category: "التصنيع والإنتاج", locations: ['offline', 'online'], natures: ['product'] },
  { name: "أغذية ومشروبات", category: "التصنيع والإنتاج", locations: ['offline', 'online'], natures: ['product'] },
  { name: "منتجات حرفية", category: "التصنيع والإنتاج", locations: ['offline', 'online'], natures: ['product'] },
  { name: "منتجات صناعية", category: "التصنيع والإنتاج", locations: ['offline', 'online'], natures: ['product'] },
  { name: "إعادة تدوير / Upcycling", category: "التصنيع والإنتاج", locations: ['offline', 'online'], natures: ['product'] },

  // المحتوى والإعلام
  { name: "صناعة محتوى", category: "المحتوى والإعلام", locations: ['online'], natures: ['service'] },
  { name: "منصة محتوى", category: "المحتوى والإعلام", locations: ['online'], natures: ['service'] },
  { name: "Media", category: "المحتوى والإعلام", locations: ['online'], natures: ['service'] },
  { name: "Podcast", category: "المحتوى والإعلام", locations: ['online'], natures: ['service'] },
  { name: "قناة", category: "المحتوى والإعلام", locations: ['online'], natures: ['service'] },
  { name: "مجتمع مدفوع", category: "المحتوى والإعلام", locations: ['online'], natures: ['service'] },
  { name: "Newsletter", category: "المحتوى والإعلام", locations: ['online'], natures: ['service'] },
  { name: "تعليم رقمي", category: "المحتوى والإعلام", locations: ['online'], natures: ['service'] },
  { name: "منتجات معلوماتية", category: "المحتوى والإعلام", locations: ['online'], natures: ['product', 'service'] },

  // المشاريع القائمة على الأصول
  { name: "تأجير", category: "المشاريع القائمة على الأصول", locations: ['offline'], natures: ['service', 'product'] },
  { name: "مشاركة الأصول", category: "المشاريع القائمة على الأصول", locations: ['offline', 'online'], natures: ['service', 'product'] },
  { name: "معدات", category: "المشاريع القائمة على الأصول", locations: ['offline'], natures: ['product', 'service'] },
  { name: "سيارات", category: "المشاريع القائمة على الأصول", locations: ['offline'], natures: ['product', 'service'] },
  { name: "مساحات", category: "المشاريع القائمة على الأصول", locations: ['offline'], natures: ['service'] },
  { name: "عقارات", category: "المشاريع القائمة على الأصول", locations: ['offline'], natures: ['service', 'product'] },
  { name: "مخازن", category: "المشاريع القائمة على الأصول", locations: ['offline'], natures: ['service'] },
  { name: "أدوات ومعدات", category: "المشاريع القائمة على الأصول", locations: ['offline'], natures: ['product', 'service'] },

  // نماذج أخرى
  { name: "امتياز تجاري (Franchise)", category: "نماذج أخرى", locations: ['offline'], natures: ['product', 'service'] },
  { name: "أعمال بالاشتراكات (Subscription)", category: "نماذج أخرى", locations: ['online', 'offline'], natures: ['product', 'service'] },
  { name: "عضوية (Membership)", category: "نماذج أخرى", locations: ['online', 'offline'], natures: ['service'] },
  { name: "منح الترخيص (Licensing)", category: "نماذج أخرى", locations: ['online', 'offline'], natures: ['product', 'service'] },
  { name: "تسويق بالعمولة (Affiliate)", category: "نماذج أخرى", locations: ['online'], natures: ['service', 'product'] },
  { name: "قائم على العمولات (Commission)", category: "نماذج أخرى", locations: ['online', 'offline'], natures: ['service', 'product'] },
  { name: "نموذج مجاني مدفوع (Freemium)", category: "نماذج أخرى", locations: ['online'], natures: ['service', 'product'] },
  { name: "قائم على الإعلانات (Advertising)", category: "نماذج أخرى", locations: ['online', 'offline'], natures: ['service', 'product'] },
  { name: "خدمات عند الطلب (On-demand)", category: "نماذج أخرى", locations: ['online', 'offline'], natures: ['service', 'product'] },
  { name: "سوق إلكتروني عند الطلب (On-demand Marketplace)", category: "نماذج أخرى", locations: ['online', 'offline'], natures: ['service', 'product'] }
];

function matchesLocation(locations: string[], location?: string, allowFallback = false): boolean {
  if (!location) return true;
  if (location === 'offline') return locations.includes('offline');
  if (location === 'online') return locations.includes('online') || allowFallback;
  return true;
}

function matchesNature(natures: string[], nature?: string, allowFallback = false): boolean {
  if (!nature) return true;
  if (nature === 'product') return natures.includes('product');
  if (nature === 'service') return natures.includes('service') || allowFallback;
  return true;
}

function getFilteredProjectModels(
  location?: string,
  nature?: string,
  ideaType?: string
): { category: string; options: string[] }[] {
  const categoriesMap: { [cat: string]: string[] } = {};

  MODEL_CONFIGS.forEach(item => {
    const matchLoc = matchesLocation(item.locations, location);
    const matchNature = matchesNature(item.natures, nature);
    const matchIdea = !ideaType || !item.ideaTypes || item.ideaTypes.includes(ideaType as 'traditional' | 'innovative');

    if (matchLoc && matchNature && matchIdea) {
      if (!categoriesMap[item.category]) {
        categoriesMap[item.category] = [];
      }
      categoriesMap[item.category].push(item.name);
    }
  });

  return Object.keys(categoriesMap).map(category => ({
    category,
    options: categoriesMap[category]
  }));
}

interface IndustryItemConfig {
  name: string;
  locations: ('offline' | 'online')[];
  natures: ('product' | 'service')[];
}

const INDUSTRY_CONFIGS: IndustryItemConfig[] = [
  { name: "التكنولوجيا والبرمجيات", locations: ['online', 'offline'], natures: ['service', 'product'] },
  { name: "الذكاء الاصطناعي", locations: ['online', 'offline'], natures: ['service', 'product'] },
  { name: "التجارة الإلكترونية", locations: ['online', 'offline'], natures: ['product', 'service'] },
  { name: "الأغذية والمشروبات", locations: ['offline', 'online'], natures: ['product', 'service'] },
  { name: "المطاعم والكافيهات", locations: ['offline'], natures: ['product', 'service'] },
  { name: "الصحة والعافية", locations: ['offline', 'online'], natures: ['service', 'product'] },
  { name: "الجمال والعناية الشخصية", locations: ['offline', 'online'], natures: ['product', 'service'] },
  { name: "الرياضة واللياقة", locations: ['offline', 'online'], natures: ['service', 'product'] },
  { name: "السيارات", locations: ['offline', 'online'], natures: ['product', 'service'] },
  { name: "العقارات", locations: ['offline', 'online'], natures: ['service', 'product'] },
  { name: "البناء والتشطيبات", locations: ['offline'], natures: ['product', 'service'] },
  { name: "الأثاث والديكور", locations: ['offline', 'online'], natures: ['product', 'service'] },
  { name: "الملابس والأزياء", locations: ['offline', 'online'], natures: ['product', 'service'] },
  { name: "الإكسسوارات", locations: ['offline', 'online'], natures: ['product'] },
  { name: "الإلكترونيات", locations: ['offline', 'online'], natures: ['product'] },
  { name: "التعليم", locations: ['offline', 'online'], natures: ['service'] },
  { name: "الأطفال والأمهات", locations: ['offline', 'online'], natures: ['product', 'service'] },
  { name: "الحيوانات الأليفة", locations: ['offline', 'online'], natures: ['product', 'service'] },
  { name: "السفر والسياحة", locations: ['offline', 'online'], natures: ['service'] },
  { name: "النقل والتوصيل", locations: ['offline', 'online'], natures: ['service'] },
  { name: "الخدمات المنزلية", locations: ['offline'], natures: ['service'] },
  { name: "الخدمات المهنية", locations: ['offline', 'online'], natures: ['service'] },
  { name: "التسويق والإعلان", locations: ['offline', 'online'], natures: ['service'] },
  { name: "الإعلام وصناعة المحتوى", locations: ['online', 'offline'], natures: ['service'] },
  { name: "الزراعة", locations: ['offline'], natures: ['product', 'service'] },
  { name: "الصناعة", locations: ['offline'], natures: ['product'] },
  { name: "الطاقة", locations: ['offline', 'online'], natures: ['product', 'service'] },
  { name: "البيئة والاستدامة", locations: ['offline', 'online'], natures: ['product', 'service'] },
  { name: "الخدمات المالية / FinTech", locations: ['online', 'offline'], natures: ['service'] },
  { name: "الخدمات القانونية", locations: ['offline', 'online'], natures: ['service'] },
  { name: "الخدمات اللوجستية", locations: ['offline', 'online'], natures: ['service'] },
  { name: "الأمن والسلامة", locations: ['offline', 'online'], natures: ['product', 'service'] },
  { name: "الترفيه", locations: ['offline', 'online'], natures: ['service'] },
  { name: "الألعاب", locations: ['online'], natures: ['service', 'product'] },
  { name: "الهدايا والمناسبات", locations: ['offline', 'online'], natures: ['product', 'service'] },
  { name: "المنتجات الفاخرة", locations: ['offline', 'online'], natures: ['product'] },
  { name: "المنتجات المحلية", locations: ['offline', 'online'], natures: ['product'] },
  { name: "B2B / خدمات الشركات", locations: ['offline', 'online'], natures: ['service', 'product'] },
  { name: "B2C / خدمات المستهلكين", locations: ['offline', 'online'], natures: ['service', 'product'] },
  { name: "B2B2C", locations: ['offline', 'online'], natures: ['service', 'product'] }
];

function getFilteredIndustries(
  location?: string,
  nature?: string,
  selectedModels: string[] = []
): string[] {
  const hasConnectingPlatform = selectedModels.some(m =>
    m.includes('Marketplace') ||
    m.includes('منصة') ||
    m.includes('وسيط') ||
    m.includes('توصيل') ||
    m.includes('حجز') ||
    m.includes('تطبيق')
  );

  return INDUSTRY_CONFIGS.filter(item => {
    return matchesLocation(item.locations, location, hasConnectingPlatform) &&
           matchesNature(item.natures, nature, hasConnectingPlatform);
  }).map(item => item.name);
}

interface WizardFormProps {
  onComplete: (data: UserData) => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  initialData?: UserData;
  initialStep?: Step;
  onUpgrade?: () => void;
}

const WizardForm: React.FC<WizardFormProps> = ({ onComplete, isFocusMode, onToggleFocusMode, initialData, initialStep, onUpgrade }) => {
  const [step, setStep] = useState<Step>(initialStep !== undefined ? initialStep : 0);
  const { profile, user, updateProfile } = useAuth();
  const [showLocationTooltip, setShowLocationTooltip] = useState(false);

  useEffect(() => {
    if (initialStep !== undefined) {
      setStep(initialStep);
    }
  }, [initialStep]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const { hasReachedLimit, currentCount, formattedTimeLeft } = getDailyGenerationStatus(profile);

  const [formData, setFormData] = useState<UserData>(() => {
    if (initialData && Object.keys(initialData).length > 0) return initialData;
    try {
      const saved = localStorage.getItem('wizard_pending_form_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            fullName: parsed.fullName || '',
            email: parsed.email || '',
            age: parsed.age || '',
            phone: parsed.phone || '',
            gender: parsed.gender || '',
            socialLinks: parsed.socialLinks || '',
            nationality: parsed.nationality || '',
            city: parsed.city || GOVERNORATES[0] || '',
            ultimateDream: parsed.ultimateDream || '',
            educationLevel: parsed.educationLevel || '',
            fieldOfStudy: parsed.fieldOfStudy || '',
            professionalExperience: parsed.professionalExperience || '',
            trainingCourses: parsed.trainingCourses || '',
            basicSkills: parsed.basicSkills || '',
            availableCapital: parsed.availableCapital || '',
            fundingSources: parsed.fundingSources || '',
            availableEquipment: parsed.availableEquipment || '',
            hobbies: parsed.hobbies || '',
            fieldInterests: parsed.fieldInterests || '',
            followedContent: parsed.followedContent || '',
            inspiringActivities: parsed.inspiringActivities || '',
            talent: parsed.talent || '',
            managementExperience: parsed.managementExperience || '',
            expectedChallenges: parsed.expectedChallenges || '',
            initialIdeas: parsed.initialIdeas || '',
            specialNotes: parsed.specialNotes || '',
            projectTypePreference: parsed.projectTypePreference && parsed.projectTypePreference !== 'both' ? parsed.projectTypePreference : 'innovative',
            executionPreference: parsed.executionPreference && parsed.executionPreference !== 'both' ? parsed.executionPreference : 'online',
            businessTypePreference: parsed.businessTypePreference && parsed.businessTypePreference !== 'both' ? parsed.businessTypePreference : 'product',
            preferredProjectModels: parsed.preferredProjectModels || [],
            preferredIndustries: parsed.preferredIndustries || [],
            customIndustry: parsed.customIndustry || '',
            geolocation: parsed.geolocation || null
          };
        }
      }
    } catch (e) {
      console.error("Error reading form data from local storage", e);
    }
    return {
      fullName: '',
      email: '',
      age: '',
      phone: '',
      gender: '',
      socialLinks: '',
      nationality: '',
      city: GOVERNORATES[0] || '',
      ultimateDream: '',
      educationLevel: '',
      fieldOfStudy: '',
      professionalExperience: '',
      trainingCourses: '',
      basicSkills: '',
      availableCapital: '',
      fundingSources: '',
      availableEquipment: '',
      hobbies: '',
      fieldInterests: '',
      followedContent: '',
      inspiringActivities: '',
      talent: '',
      managementExperience: '',
      expectedChallenges: '',
      initialIdeas: '',
      specialNotes: '',
      projectTypePreference: 'innovative',
      executionPreference: 'online',
      businessTypePreference: 'product',
      preferredProjectModels: [],
      preferredIndustries: [],
      customIndustry: '',
      geolocation: null
    };
  });

  const [isSection4Open, setIsSection4Open] = useState(false);
  const [isSection5Open, setIsSection5Open] = useState(false);

  const section4Ref = useRef<HTMLDivElement>(null);
  const section5Ref = useRef<HTMLDivElement>(null);

  const toggleSection4 = () => {
    const nextState = !isSection4Open;
    setIsSection4Open(nextState);
    if (!nextState && section4Ref.current) {
      setTimeout(() => {
        section4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  };

  const toggleSection5 = () => {
    const nextState = !isSection5Open;
    setIsSection5Open(nextState);
    if (!nextState && section5Ref.current) {
      setTimeout(() => {
        section5Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  };

  const toggleProjectModel = (model: string) => {
    setFormData(prev => {
      const current = prev.preferredProjectModels || [];
      const exists = current.includes(model);
      const updated = exists ? [] : [model];
      return { ...prev, preferredProjectModels: updated };
    });
  };

  const filteredProjectModels = getFilteredProjectModels(
    formData.executionPreference,
    formData.businessTypePreference,
    formData.projectTypePreference
  );

  const filteredIndustries = getFilteredIndustries(
    formData.executionPreference,
    formData.businessTypePreference,
    formData.preferredProjectModels
  );

  // Auto deselect invalid models when earlier preferences change
  useEffect(() => {
    const availableCategories = getFilteredProjectModels(
      formData.executionPreference,
      formData.businessTypePreference,
      formData.projectTypePreference
    );
    const availableModels = new Set(availableCategories.flatMap(c => c.options));

    if (formData.preferredProjectModels && formData.preferredProjectModels.length > 0) {
      const valid = formData.preferredProjectModels.filter(m => availableModels.has(m));
      if (valid.length !== formData.preferredProjectModels.length) {
        setFormData(prev => ({ ...prev, preferredProjectModels: valid }));
      }
    }
  }, [formData.executionPreference, formData.businessTypePreference, formData.projectTypePreference]);

  // Auto deselect invalid industries when earlier preferences change
  useEffect(() => {
    const availableIndustries = new Set(getFilteredIndustries(
      formData.executionPreference,
      formData.businessTypePreference,
      formData.preferredProjectModels
    ));

    if (formData.preferredIndustries && formData.preferredIndustries.length > 0) {
      const valid = formData.preferredIndustries.filter(
        ind => ind === 'لا يهم، اختر أنت المجال الأفضل' || availableIndustries.has(ind)
      );
      if (valid.length !== formData.preferredIndustries.length) {
        setFormData(prev => ({ ...prev, preferredIndustries: valid }));
      }
    }
  }, [formData.executionPreference, formData.businessTypePreference, formData.preferredProjectModels]);

  const toggleIndustry = (industry: string) => {
    setFormData(prev => {
      let current = prev.preferredIndustries || [];
      current = current.filter(i => i !== 'لا يهم، اختر أنت المجال الأفضل');
      const exists = current.includes(industry);
      const updated = exists ? current.filter(i => i !== industry) : [...current, industry];
      return { ...prev, preferredIndustries: updated };
    });
  };

  const selectAnyIndustry = () => {
    setFormData(prev => ({
      ...prev,
      preferredIndustries: ['لا يهم، اختر أنت المجال الأفضل'],
      customIndustry: ''
    }));
  };

  const updateCustomIndustry = (val: string) => {
    setFormData(prev => {
      let current = prev.preferredIndustries || [];
      current = current.filter(i => i !== 'لا يهم، اختر أنت المجال الأفضل');
      return {
        ...prev,
        preferredIndustries: current,
        customIndustry: val
      };
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem('wizard_pending_form_data', JSON.stringify(formData));
    } catch (e) {}
  }, [formData]);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (step === 6 && !formData.geolocation) {
      setShowLocationTooltip(true);
      const timer = setTimeout(() => {
        setShowLocationTooltip(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [step, formData.geolocation]);

  const isZeroCapital = (capital: string) => {
    if (!capital) return false;
    const c = capital.toLowerCase().trim();
    return (
      c.includes('بدون رأس مال') ||
      c.includes('من الصفر') ||
      c === '0' ||
      c === '0 جنيه' ||
      c === 'مبلغ مخصص: 0 جنيه' ||
      c === 'مبلغ مخصص: 0'
    );
  };

  useEffect(() => {
    if (isZeroCapital(formData.availableCapital) && formData.executionPreference === 'offline') {
      setFormData(prev => ({ ...prev, executionPreference: 'online' }));
    }
  }, [formData.availableCapital, formData.executionPreference]);

  const updateField = (field: keyof UserData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1: // مالي: رأس المال المتوفر
        return formData.availableCapital !== '';
      case 2: { // إضافات: تفضيلات شكل ونموذج ومجال المشروع
        const hasModel = Array.isArray(formData.preferredProjectModels) && formData.preferredProjectModels.length > 0;
        const hasIndustry = (Array.isArray(formData.preferredIndustries) && formData.preferredIndustries.length > 0) || (formData.customIndustry ? formData.customIndustry.trim() !== '' : false);
        return hasModel && hasIndustry;
      }
      case 3: // إدارة: العقلية الإدارية والتحديات
        return true;
      case 4: // شغف: الموهبة الفطرية
        return formData.talent.trim() !== '';
      case 5: // مهني: مسار الخبرة والمعرفة
        return true;
      case 6: { // شخصي: البيانات الشخصية
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmailValid = !formData.email || emailRegex.test(formData.email);
        return formData.fullName.trim() !== '' && formData.age.trim() !== '' && formData.ultimateDream.trim() !== '' && isEmailValid;
      }
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (isStepValid()) {
      setStep(prev => (prev < 6 ? prev + 1 : prev) as Step);
      if (user) {
        updateProfile({
          userData: formData,
          formStatus: 'started',
          lastFormUpdateAt: new Date().toISOString(),
          reminderEmailSent: false
        }).catch(err => console.error("Error saving progress to profile:", err));
      }
    }
  };
  const prevStep = () => setStep(prev => (prev > 0 ? prev - 1 : prev) as Step);

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 w-full">
      {/* Header section based on step */}
      <div className="text-center space-y-3 max-w-2xl mx-auto mb-2 sm:mb-4 relative" dir="rtl">
        {step === 0 ? (
          <div className="space-y-1.5 px-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-text-primary leading-tight">
              تحليل <span className="text-primary">المعطيات الشخصية والسوقية</span>
            </h2>
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-700">
              دعنا نصنع منك <span className="text-orange-600">رائد اعمال</span>
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-text-secondary">
              أجب عن الاستبيان التشخيصي بدقة. يقوم النظام بتحليل معطياتك المالية والمهنية لتصميم أدق مسار تنفيذ لمشروع يناسب قدرتك الحالية.
            </p>
          </div>
        ) : (
          <div className="py-1 px-2">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-700">
              دعنا نصنع منك <span className="text-orange-600">رائد اعمال</span>
            </h3>
          </div>
        )}

        {/* Beautifully styled exit button in business creator design */}
        <div className="flex justify-center pt-1.5">
          <button
            type="button"
            onClick={onToggleFocusMode}
            className="flex items-center gap-1.5 px-4 sm:px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-orange-500/15 hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 active:scale-95 cursor-pointer border-none"
          >
            {isFocusMode ? (
              <>
                <X size={14} className="stroke-[2.5]" />
                <span>خروج للتحكم (إظهار القوائم)</span>
              </>
            ) : (
              <>
                <Zap size={14} className="stroke-[2.5]" />
                <span>تفعيل وضع التركيز (ملء الشاشة)</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-soft border border-border min-h-[580px] sm:min-h-[620px] flex flex-col justify-between">
        {/* Progress Bar (Only show if step > 0) */}
        {step > 0 && (
        <div className="bg-background px-3 sm:px-6 md:px-8 py-3 flex justify-between border-b border-border overflow-x-auto select-none rounded-t-2xl">
          {[1, 2, 3, 4, 5, 6].map((s) => {
            const getIcon = (stepNum: number) => {
              switch (stepNum) {
                case 1: return <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
                case 2: return <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
                case 3: return <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
                case 4: return <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
                case 5: return <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
                case 6: return <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
                default: return null;
              }
            };

            return (
              <div key={s} className="flex flex-col items-center min-w-[48px] sm:min-w-[60px]">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-colors ${
                  step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-text-muted'
                }`}>
                  {step > s ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : getIcon(s)}
                </div>
                <span className="text-[9px] sm:text-[10px] mt-1 text-gray-500 text-center font-medium whitespace-nowrap">
                  {s === 1 ? 'مالي' : s === 2 ? 'إضافات' : s === 3 ? 'إدارة' : s === 4 ? 'شغف' : s === 5 ? 'مهني' : 'شخصي'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="p-4 sm:p-6 md:p-8">
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-4 sm:py-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4 sm:mb-6">
              <Brain size={32} className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-text-primary leading-tight">
              بدء التحليل التشخيصي للاستخراج الذكي
            </h2>
            <div className="text-text-secondary space-y-3.5 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed text-right">
              <p>
                يقوم النظام بالبحث في احتياجات السوق ومشاكله الحقيقية جغرافياً وتفضيلاتك الأربعة الحاسمة لتحديد فكرة المشروع المربحة والاسم التجاري، مع عزل خلفيتك الشخصية ومهاراتك تماماً عن فرض أو تقييد الفكرة، لنضمن لك فكرة ناجحة وقابلة للتطبيق تسويقياً.
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-right text-gray-700 text-xs sm:text-sm md:text-base">
                <li><strong>عزل الخلفية الشخصية عن تحديد الفكرة:</strong> نضمن صياغة فكرة المشروع والاسم التجاري بالاعتماد على رصد خرائط جوجل الحقيقي وبحوث السوق وفجوات الطلب، وليس فرض فكرة مقيدة بمهاراتك قد لا تناسب السوق.</li>
                <li><strong>توجيه المهارات لخطة التنفيذ:</strong> نستخدم خبراتك ومهاراتك ومعداتك كعوامل مساعدة وقدرات تشغيلية داخل خطة الإطلاق والتشغيل الفعلي (Execution Roadmap) لتسريع وتسهيل البداية.</li>
                <li><strong>تخصيص الفكرة لتفضيلاتك:</strong> نلتزم تماماً بـ 4 تفضيلات أساسية تختارها أنت (نوع الفكرة، مكان التنفيذ، طبيعة المشروع، ورأس المال).</li>
              </ul>
              <div className="bg-orange-50 border border-orange-100 p-4 sm:p-6 rounded-xl text-gray-800 text-xs sm:text-sm space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-orange-700 text-xs sm:text-sm"><Info size={16}/> تنبيهات النظام للتشخيص الدقيق:</p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>الشفافية:</strong> لا تبالغ في الإمكانيات. النظام مصمم للتعامل حتى مع غياب رأس المال والخبرة.</li>
                  <li><strong>تفصيل المعطيات:</strong> الإجابات القصيرة جداً تضعف قدرة النظام على استخراج خطة دقيقة تعكس تفردك.</li>
                  <li><strong>الوقت المتوقع:</strong> يستغرق الإدخال حوالي 5-10 دقائق؛ وهي حجر الأساس لخطة الإطلاق.</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 bg-orange-600 text-white rounded-xl font-bold text-sm sm:text-base md:text-lg hover:bg-orange-700 transition-all shadow-soft hover:-translate-y-0.5"
            >
              بدء التشخيص المبدئي <ChevronLeft size={20} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-1 px-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2"><DollarSign className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6"/> الموارد المتاحة (الجانب المالي والتقني)</h2>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                الهدف: تحديد نطاق البدء (واقعية المشروع).
              </p>
              <div className="bg-green-50 p-4 rounded-xl text-xs sm:text-sm text-green-800 border border-green-100 flex items-start gap-3 mt-2">
                <Info className="flex-shrink-0 mt-0.5 w-4 h-4 sm:w-5 sm:h-5" />
                <p><strong>المرونة المادية:</strong> سيقوم النظام باقتراح نموذج تشغيلي يتناسب مع ميزانيتك، بما في ذلك إمكانية البدء بدون رأس مال.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رأس المال المتوفر للمشروع *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {['بدون رأس مال (أبدأ من الصفر)', 'أقل من 30 ألف جنيه', '30,000 – 100,000 جنيه', 'أكثر من 100,000 جنيه', 'رأس مال مخصص'].map(b => {
                    const isSelected = b === 'رأس مال مخصص'
                      ? (formData.availableCapital !== '' && !['بدون رأس مال (أبدأ من الصفر)', 'أقل من 30 ألف جنيه', '30,000 – 100,000 جنيه', 'أكثر من 100,000 جنيه'].includes(formData.availableCapital))
                      : formData.availableCapital === b;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          if (b === 'رأس مال مخصص') {
                            updateField('availableCapital', 'مبلغ مخصص: 50,000 جنيه');
                          } else {
                            updateField('availableCapital', b);
                          }
                        }}
                        className={`px-4 py-3 rounded-xl border text-center transition-all text-sm ${
                          isSelected ? 'bg-orange-50 border-orange-600 text-orange-700 ring-1 ring-orange-600 font-bold' : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>

                {formData.availableCapital !== '' && !['بدون رأس مال (أبدأ من الصفر)', 'أقل من 30 ألف جنيه', '30,000 – 100,000 جنيه', 'أكثر من 100,000 جنيه'].includes(formData.availableCapital) && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 bg-orange-50/50 p-4 rounded-xl border border-orange-100 max-w-md">
                    <label className="block text-sm font-medium text-orange-800 mb-1.5">أدخل مبلغ رأس المال المخصص بالجنيه:</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={
                          formData.availableCapital.startsWith('مبلغ مخصص: ')
                            ? formData.availableCapital.replace('مبلغ مخصص: ', '').replace(' جنيه', '')
                            : formData.availableCapital
                        } 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, ''); // digits only
                          const displayVal = val ? Number(val).toLocaleString('en-US') : '';
                          updateField('availableCapital', val ? `مبلغ مخصص: ${displayVal} جنيه` : '');
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-orange-300 focus:ring-2 focus:ring-orange-500 bg-white outline-none pl-24 text-right font-bold"
                        placeholder="مثال: 50,000"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-800 font-bold text-sm">جنيه مصري</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مصادر التمويل الحالية أو المحتملة</label>
                <input type="text" value={formData.fundingSources} onChange={e => updateField('fundingSources', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none" placeholder="مدخرات شخصية، دعم عائلي، تمويل خارجي..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المعدات والأدوات المتاحة</label>
                <p className="text-xs text-orange-600 mb-2">النظام: تحليل هذه المؤشرات يساعد في استغلال الأصول المادية لخفض التكاليف الأولية.</p>
                <input type="text" value={formData.availableEquipment} onChange={e => updateField('availableEquipment', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none" placeholder="هل تمتلك جهاز كمبيوتر، أدوات خاصة بمجال معين؟" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-1 px-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2"><Lightbulb className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6"/> تفضيلات المشروع والملاحظات</h2>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                الهدف: دمج رؤيتك الشخصية وتفضيلاتك مع تحليلنا العلمي. نحن هنا لنخدم رؤيتك، ليس لنفرض عليك فكرة.
              </p>
            </div>
            
            <div className="space-y-4 bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-100">
              <h3 className="font-bold text-gray-800 border-b pb-2 text-sm sm:text-base">تفضيلات شكل المشروع</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">هل تفضل فكرة تقليدية أم مبتكرة (غير تقليدية)؟</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'traditional', label: 'تقليدية' },
                    { id: 'innovative', label: 'مبتكرة' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => updateField('projectTypePreference', p.id)}
                      className={`py-2 rounded-lg border text-sm transition-all ${
                        formData.projectTypePreference === p.id ? 'bg-primary text-white border-primary font-bold' : 'bg-surface border-border hover:border-primary/30'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">مكان التنفيذ المفضل</label>
                {isZeroCapital(formData.availableCapital) && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-2 font-medium flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>تم استبعاد خيار (على أرض الواقع) تلقائياً لأن رأس المال المختار هو (بدون رأس مال)، والمشاريع الميدانية تتطلب أصولاً ومقراً مائياً.</span>
                  </p>
                )}
                <div className={`grid ${isZeroCapital(formData.availableCapital) ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                  {[
                    { id: 'offline', label: 'على أرض الواقع' },
                    { id: 'online', label: 'أونلاين' }
                  ].filter(p => !isZeroCapital(formData.availableCapital) || p.id !== 'offline').map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => updateField('executionPreference', p.id)}
                      className={`py-2 rounded-lg border text-sm transition-all ${
                        formData.executionPreference === p.id ? 'bg-primary text-white border-primary font-bold' : 'bg-surface border-border hover:border-primary/30'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">طبيعة المشروع</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'product', label: 'منتج ملموس' },
                    { id: 'service', label: 'تقديم خدمة' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => updateField('businessTypePreference', p.id)}
                      className={`py-2 rounded-lg border text-sm transition-all ${
                        formData.businessTypePreference === p.id ? 'bg-primary text-white border-primary font-bold' : 'bg-surface border-border hover:border-primary/30'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 4: نوع / نموذج المشروع */}
            <div ref={section4Ref} className="bg-white rounded-xl border border-gray-200 shadow-2xs">
              <button
                type="button"
                onClick={toggleSection4}
                className={`w-full flex items-center justify-between p-4 transition-all text-right cursor-pointer rounded-xl ${
                  isSection4Open ? 'sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-gray-200 shadow-xs rounded-b-none' : 'bg-white hover:bg-orange-50/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-sm flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-1.5">
                      <span>نوع / نموذج المشروع</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(formData.preferredProjectModels && formData.preferredProjectModels.length > 0)
                        ? `تم تحديد: ${formData.preferredProjectModels[0]}`
                        : 'ما نوع المشروع الذي تفضله؟ (انقر للاستعراض والتحديد)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(formData.preferredProjectModels && formData.preferredProjectModels.length > 0) ? (
                    <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2.5 py-0.5 rounded-full">
                      تم التحديد
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2.5 py-0.5 rounded-full">
                      لم يُحدد
                    </span>
                  )}
                  {isSection4Open ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </div>
              </button>

              {isSection4Open && (
                <div className="p-4 sm:p-5 bg-white border-t border-gray-200 space-y-5 animate-in fade-in duration-200">
                  <div className="bg-orange-50/80 p-3 rounded-lg border border-orange-100 space-y-1">
                    <h4 className="font-bold text-gray-800 text-sm sm:text-base">
                      ما نوع / نموذج المشروع الذي تفضله؟
                    </h4>
                    <p className="text-xs text-orange-700 font-medium">
                      *يمكنك تحديد خيار واحد فقط (تم تصفية الخيارات وتحديثها تلقائياً وفقاً لاختياراتك السابقة)*
                    </p>
                  </div>

                  <div className="space-y-4">
                    {filteredProjectModels.map((cat, idx) => (
                      <div key={idx} className="space-y-2">
                        <h5 className="text-xs sm:text-sm font-bold text-gray-800 border-r-2 border-orange-500 pr-2">{cat.category}</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {cat.options.map((opt) => {
                            const isSelected = formData.preferredProjectModels?.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => toggleProjectModel(opt)}
                                className={`text-xs sm:text-sm p-2 sm:p-2.5 rounded-lg border text-right transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                                  isSelected
                                    ? 'bg-primary text-white border-primary font-bold shadow-xs'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-primary/40 hover:bg-white'
                                }`}
                              >
                                <span className="truncate">{opt}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: المجال الذي تريد العمل فيه */}
            <div ref={section5Ref} className="bg-white rounded-xl border border-gray-200 shadow-2xs">
              <button
                type="button"
                onClick={toggleSection5}
                className={`w-full flex items-center justify-between p-4 transition-all text-right cursor-pointer rounded-xl ${
                  isSection5Open ? 'sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-gray-200 shadow-xs rounded-b-none' : 'bg-white hover:bg-orange-50/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-sm flex-shrink-0">
                    5
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-1.5">
                      <span>المجال الذي تريد العمل فيه</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formData.preferredIndustries?.includes('لا يهم، اختر أنت المجال الأفضل')
                        ? 'لا يهم، اختر أنت المجال الأفضل'
                        : (formData.preferredIndustries && formData.preferredIndustries.length > 0) || formData.customIndustry
                        ? `تم تحديد: ${[...(formData.preferredIndustries || []), formData.customIndustry].filter(Boolean).slice(0, 2).join('، ')}`
                        : 'ما المجالات التي تهمك؟ (انقر للاستعراض والتحديد)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {((formData.preferredIndustries && formData.preferredIndustries.length > 0) || formData.customIndustry) ? (
                    <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2.5 py-0.5 rounded-full">
                      {formData.preferredIndustries?.includes('لا يهم، اختر أنت المجال الأفضل') ? 'تلقائي' : `${(formData.preferredIndustries?.length || 0) + (formData.customIndustry ? 1 : 0)} مختار`}
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2.5 py-0.5 rounded-full">
                      لم يُحدد
                    </span>
                  )}
                  {isSection5Open ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </div>
              </button>

              {isSection5Open && (
                <div className="p-4 sm:p-5 bg-white border-t border-gray-200 space-y-5 animate-in fade-in duration-200">
                  <div className="bg-orange-50/80 p-3 rounded-lg border border-orange-100">
                    <div className="flex items-center justify-between mb-1">
                      {((formData.preferredIndustries && formData.preferredIndustries.length > 0) || formData.customIndustry) && (
                        <span className="text-xs font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded">
                          تم تحديد: {formData.preferredIndustries?.includes('لا يهم، اختر أنت المجال الأفضل') ? 'تلقائي' : `${(formData.preferredIndustries?.length || 0) + (formData.customIndustry ? 1 : 0)} مجالات`}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm sm:text-base">
                      ما المجالات التي تهمك؟
                    </h4>
                    <p className="text-xs text-orange-700 font-medium">
                      *يمكنك اختيار مجال واحد أو عدة مجالات تهمك - سيقوم الذكاء الاصطناعي باختيار المجال الأنسب والأعلى ربحية لك وبناء المشروع داخله بالكامل دون خلط أو تشتيت*
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {filteredIndustries.map((ind) => {
                        const isSelected = formData.preferredIndustries?.includes(ind);
                        return (
                          <button
                            key={ind}
                            type="button"
                            onClick={() => toggleIndustry(ind)}
                            className={`text-xs sm:text-sm p-2 sm:p-2.5 rounded-lg border text-right transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-white border-primary font-bold shadow-xs'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-primary/40 hover:bg-white'
                            }`}
                          >
                            <span className="truncate">{ind}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-3 border-t border-gray-100 space-y-3">
                      <button
                        type="button"
                        onClick={selectAnyIndustry}
                        className={`w-full text-xs sm:text-sm p-2.5 rounded-lg border text-center font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          formData.preferredIndustries?.includes('لا يهم، اختر أنت المجال الأفضل')
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-primary/40'
                        }`}
                      >
                        {formData.preferredIndustries?.includes('لا يهم، اختر أنت المجال الأفضل') && <Check className="w-4 h-4" />}
                        <span>لا يهم، اختر أنت المجال الأفضل</span>
                      </button>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">مجال آخر:</label>
                        <input
                          type="text"
                          value={formData.customIndustry || ''}
                          onChange={(e) => updateCustomIndustry(e.target.value)}
                          placeholder="اكتب اسم المجال الذي ترغبه..."
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white text-gray-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">أفكار أولية أو رؤى شخصية</label>
                <textarea value={formData.initialIdeas} onChange={e => updateField('initialIdeas', e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px] bg-background text-text-primary" placeholder="هل لديك أفكار أو رؤى ترغب في دمجها في المشروع؟" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">ملاحظات خاصة</label>
                <textarea value={formData.specialNotes} onChange={e => updateField('specialNotes', e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px] bg-background text-text-primary" placeholder="أي تفاصيل أخرى تعتقد أنها مهمة لتخصيص الخدمة بشكل أفضل؟" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-1 px-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2"><Settings className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6"/> العقلية الإدارية والتحديات</h2>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                الهدف: الاستعداد النفسي والعملي للمخاطر.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الخبرة في إدارة المشاريع</label>
                <textarea value={formData.managementExperience} onChange={e => updateField('managementExperience', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]" placeholder="هل لديك خبرة في تشغيل مشروع أو إدارة فريق؟ وإذا نعم من أين؟" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التحديات المتوقعة والمخاوف</label>
                <p className="text-xs text-orange-600 mb-2">النظام: تحديد المخاطر مسبقاً يمكننا من إدراج حلول بدائية وخطط طوارئ حقيقية في مسار التنفيذ.</p>
                <textarea value={formData.expectedChallenges} onChange={e => updateField('expectedChallenges', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]" placeholder="ما هي العقبات أو المخاوف التي تراها عند بدء المشروع؟" />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-1 px-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2"><Heart className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6"/> الدوافع ونقطة ارتكاز الشغف</h2>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                الهدف: مطابقة المشروع مع مجالات اهتمامك لضمان أعلى معدلات لاستدامة الجهد.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الهوايات والأنشطة المفضلة</label>
                <input type="text" value={formData.hobbies} onChange={e => updateField('hobbies', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none" placeholder="القراءة، الرياضة، الرسم، التكنولوجيا، السفر…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاهتمامات الخاصة بالمجالات</label>
                <input type="text" value={formData.fieldInterests} onChange={e => updateField('fieldInterests', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none" placeholder="تكنولوجيا، موضة، صحة، ثقافة…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المحتوى أو القنوات التي تتابعها</label>
                <input type="text" value={formData.followedContent} onChange={e => updateField('followedContent', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none" placeholder="مدونات، يوتيوب، مؤثرين…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الأنشطة التي تجدها ملهمة</label>
                <input type="text" value={formData.inspiringActivities} onChange={e => updateField('inspiringActivities', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none" placeholder="ورش عمل، قصص نجاح، فعاليات ريادية…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموهبة الفطرية *</label>
                <p className="text-xs text-orange-600 mb-2">النظام: دمج قدراتك الفطرية يمنحك ميزة تنافسية طبيعية في السوق.</p>
                <textarea value={formData.talent} onChange={e => updateField('talent', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]" placeholder="ما الشيء الذي تستطيع القيام به بشكل مميز وبسهولة وتشعر بالاستمتاع أثناء القيام به، حتى بدون تعلم مسبق؟" />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-1 px-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2"><Briefcase className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6"/> مسار الخبرة والمعرفة الاحترافية</h2>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                الهدف: تقييم القدرات الحالية لتحديد الفجوات المعرفية ومتطلبات التشغيل.
              </p>
              <div className="bg-orange-50 p-4 rounded-xl text-xs sm:text-sm text-orange-800 border border-orange-100 flex items-start gap-3 mt-2">
                <Info className="flex-shrink-0 mt-0.5 w-4 h-4 sm:w-5 sm:h-5" />
                <p><strong>لا تقلق من نقص الخبرات:</strong> النظام مصمم لموازنة النقص في الخبرة باقتراح خطوات مدروسة وأدوات تشغيلية مساعدة أو بدائل تقنية.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المستوى التعليمي</label>
                <CustomSelect
                  value={formData.educationLevel}
                  onChange={val => updateField('educationLevel', val)}
                  options={['ثانوي', 'جامعي', 'دراسات عليا', 'أخرى']}
                  placeholder="اختر..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التخصص الدراسي</label>
                <input type="text" value={formData.fieldOfStudy} onChange={e => updateField('fieldOfStudy', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">الخبرة العملية المهنية</label>
                <textarea value={formData.professionalExperience} onChange={e => updateField('professionalExperience', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]" placeholder="مجالات العمل السابقة، سنوات الخبرة، الوظيفة السابقة، الوظيفة الحالية..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">هل حصلت على دورات تدريبية؟ وإذا نعم فما هي؟</label>
                <textarea value={formData.trainingCourses} onChange={e => updateField('trainingCourses', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none min-h-[60px]" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">المهارات الأساسية</label>
                <p className="text-xs text-orange-600 mb-2">النظام: يفيد هذا في تجنب اقتراح متطلبات معقدة وبناء استراتيجية تعتمد على مهاراتك الفعلية.</p>
                <textarea value={formData.basicSkills} onChange={e => updateField('basicSkills', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none min-h-[60px]" placeholder="مهارات تقنية، إدارية، فنية، تسويقية..." />
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-1 px-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2"><User className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6"/> من أنت؟ (البيانات الشخصية)</h2>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                الهدف: بناء الهوية الأساسية لك.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">الاسم الكامل *</label>
                <input type="text" value={formData.fullName} onChange={e => updateField('fullName', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => updateField('email', e.target.value)} 
                  className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors focus:ring-2 focus:ring-orange-500 ${
                    formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                      : 'border-border focus:border-orange-500'
                  }`} 
                />
                {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                  <p className="text-xs text-red-500 mt-1 animate-in fade-in duration-200">يرجى إدخال بريد إلكتروني صحيح (مثال: example@domain.com)</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العمر *</label>
                <input type="number" value={formData.age} onChange={e => updateField('age', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => updateField('phone', e.target.value.replace(/\D/g, ''))} 
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none text-right" 
                  placeholder="أرقام فقط (مثال: 01012345678)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الجنس</label>
                <CustomSelect
                  value={formData.gender}
                  onChange={val => updateField('gender', val)}
                  options={['ذكر', 'أنثى']}
                  placeholder="اختر..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الجنسية / بلد الإقامة</label>
                <input type="text" value={formData.nationality} onChange={e => updateField('nationality', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدينة / المحافظة</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={formData.city} 
                    onChange={e => updateField('city', e.target.value)} 
                    onFocus={() => { if (!formData.geolocation) setShowLocationTooltip(true); }}
                    onMouseEnter={() => { if (!formData.geolocation) setShowLocationTooltip(true); }}
                    list="governorates-list"
                    className="flex-1 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                    placeholder="اختر أو اكتب المحافظة..."
                  />
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => { if (!formData.geolocation) setShowLocationTooltip(true); }}
                      onClick={() => {
                        setShowLocationTooltip(false);
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            async (position) => {
                              const lat = position.coords.latitude;
                              const lng = position.coords.longitude;
                              updateField('geolocation', { lat, lng });
                              try {
                                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`);
                                const data = await res.json();
                                if (data && data.display_name) {
                                  updateField('city', data.display_name);
                                  alert("تم تحديد موقعك بدقة بنجاح! سيساعدنا هذا في دراسة منطقتك والسوق وتخصيص الفرص لك.");
                                } else {
                                  alert("تم تحديد احداثيات موقعك بنجاح! سيتم تخصيص فكرة المشروع لمنطقتك.");
                                }
                              } catch (e) {
                                alert("تم تحديد احداثيات موقعك بنجاح! سيتم تخصيص فكرة المشروع لمنطقتك.");
                              }
                            },
                            (error) => {
                              alert("حدث خطأ أثناء تحديد الموقع، يرجى التأكد من تفعيل الصلاحيات.");
                            }
                          );
                        } else {
                          alert("متصفحك لا يدعم تحديد الموقع.");
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 h-full relative font-medium text-xs sm:text-sm shadow-md transition-transform active:scale-95 ${
                        formData.geolocation 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-200' 
                          : 'bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-orange-500 text-white shadow-orange-500/30'
                      }`}
                      title="تحديد موقعي بدقة"
                    >
                      {!formData.geolocation && (
                        <>
                          <span className="absolute -inset-1 rounded-xl bg-orange-400/40 animate-ping opacity-75 -z-10"></span>
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                          </span>
                        </>
                      )}
                      {formData.geolocation ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <MapPin className="w-4 h-4 text-white" />
                        </>
                      ) : (
                        <MapPin className="w-5 h-5 text-white animate-bounce" />
                      )}
                    </button>

                    <AnimatePresence>
                      {showLocationTooltip && !formData.geolocation && (
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.85 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 450, damping: 25 }}
                          className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-[0_10px_25px_-5px_rgba(249,115,22,0.4)] flex items-center gap-2 whitespace-nowrap border border-white/20"
                        >
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span>اضغط هنا لتحديد موقعك تلقائياً</span>
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowLocationTooltip(false);
                            }}
                            className="bg-black/20 hover:bg-black/40 text-white rounded-full p-1 transition-colors mr-1 shrink-0"
                            title="إغلاق"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {/* Triangle arrow pointing directly down to the location button */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[8px] border-x-transparent border-t-[8px] border-t-amber-600 drop-shadow-md" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <datalist id="governorates-list">
                  {GOVERNORATES.map(g => <option key={g} value={g} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">روابط السوشيال ميديا (اختياري)</label>
                <input type="text" value={formData.socialLinks} onChange={e => updateField('socialLinks', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none" placeholder="LinkedIn, Twitter, etc." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ما هو حلمك الذي تريد الوصول إليه؟ *</label>
                <p className="text-xs text-orange-600 mb-2">النظام: هذا المحرك الأساسي يضمن استمرارية المشروع وربطه بدافع شخصي حقيقي.</p>
                <textarea value={formData.ultimateDream} onChange={e => updateField('ultimateDream', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none min-h-[80px]" placeholder="أحلم بأن..." />
              </div>
            </div>
            
            <div className="bg-primary text-white p-4 sm:p-5 rounded-xl mt-8 text-center shadow-soft">
              <h3 className="text-xl font-bold">شكراً لك على صراحتك!</h3>
            </div>
            
            <div className="mt-8 bg-orange-50 border border-orange-200 p-6 rounded-xl space-y-3">
              <h4 className="flex items-center gap-2 font-bold text-orange-900 border-b border-orange-200 pb-2">
                <Zap size={20} className="text-orange-500" /> 
                قبل البدء في التوليد
              </h4>
              {(!profile || profile.subscriptionPlan === 'FREE') ? (
                <div className="text-orange-800 text-sm space-y-2 leading-relaxed">
                  <p>أنت الآن على <strong>خطة البداية</strong>. من خلال هذه الخطة ستحصل على استثمار حقيقي لوقتك، يمنحك:</p>
                  <ul className="list-disc list-inside px-2">
                    <li>نظرة عامة شاملة لتفاصيل مشروعك.</li>
                    <li>تحليل السوق ونقاط القوة والضعف (SWOT).</li>
                    <li>الاستراتيجية وطريقة التنفيذ خطوة بخطوة.</li>
                    <li>أرقام وماليات مبدئية والأدوات اللازمة.</li>
                  </ul>
                  {hasReachedLimit ? (
                    <div className="pt-2">
                      <InsufficientTokensCard
                        title="Business Creator"
                        badgeText="تنبيه الحد اليومي للمشاريع"
                        message="لقد وصلت للحد الأقصى لإنشاء المشاريع اليوم (مشروع واحد كل 24 ساعة)."
                        description={`تتجدد فرصتك المجانية تلقائياً بعد ${formattedTimeLeft || '24 ساعة'}. أو قم بالترقية الآن لاقتناء باقة رائد الأعمال (PRO) والحصول على 100,000 نقطة للتوليد الفوري دون انتظار.`}
                        onUpgrade={onUpgrade}
                        className="my-2"
                      />
                    </div>
                  ) : (
                    <p className="bg-white/50 p-2 rounded text-orange-900 font-bold border border-orange-100">
                      يمكنك تجربة التوليد <strong>مرة واحدة يومياً</strong> فقط. بعد توليد المشروع، سيتم عرض الخطة الشاملة وعليك الاشتراك لفتح باقي الميزات الإبداعية المتقدمة.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-orange-800 text-sm space-y-2 leading-relaxed">
                  <p>أنت الآن على <strong>خطة رائد الأعمال المدفوعة</strong>. بامتلاكك هذه الخطة، يتم فتح كل الأقسام والميزات المتقدمة مثل الهوية التجارية، تحليل المنافسين، دراسة الجمهور، الشات، وتوليد الشعار.</p>
                  <p className="bg-white/50 p-2 rounded text-orange-900 font-bold border border-orange-100 flex justify-between items-center">
                    <span>الرصيد الحالي: {profile.tokens || 0} نقطة.</span>
                    <span>تكلفة التوليد: 25,000 نقطة.</span>
                  </p>
                  
                  {(profile.tokens || 0) < TOKEN_COSTS.IDEA_GENERATION && (
                    <div className="pt-2">
                      <InsufficientTokensCard
                        title="Business Creator"
                        badgeText="تنبيه رصيد النقاط"
                        message="عفواً، لقد نفد رصيدك من النقاط. يرجى شراء باقة جديدة لتتمكن من إنشاء مشروع متكامل."
                        description="باقة رواد الأعمال (PRO) تمنحك 100,000 نقطة لإطلاق وتنفيذ مشاريعك بالكامل مع استشارات ومميزات غير محدودة."
                        onUpgrade={onUpgrade}
                        className="my-2"
                      />
                    </div>
                  )}
                  {(profile.tokens || 0) >= TOKEN_COSTS.IDEA_GENERATION && (
                    <p className="text-xs text-orange-700">عند انتهاء النقاط الخاصة بك، يمكنك إعادة الشحن في أي وقت بـ 499 جنيه فقط لعدد غير محدود من الفرص الإبداعية.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step > 0 && (
          <div className="mt-10 pt-6 border-t border-border space-y-3">
            {!isStepValid() && step === 1 && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium p-3 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
                <span className="font-bold flex items-center gap-1.5">
                  ⚠️ يرجى تحديد رأس المال المتوفر للمشروع للتمكن من المتابعة.
                </span>
              </div>
            )}
            {!isStepValid() && step === 2 && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium p-3 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
                <span className="font-bold flex items-center gap-1.5">
                  ⚠️ يرجى اختيار (نوع / نموذج المشروع في القسم 4) و (المجال في القسم 5) للتمكن من المتابعة.
                </span>
              </div>
            )}
            {!isStepValid() && step === 4 && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium p-3 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
                <span className="font-bold flex items-center gap-1.5">
                  ⚠️ يرجى كتابة الموهبة الفطرية للتمكن من المتابعة.
                </span>
              </div>
            )}
            {!isStepValid() && step === 6 && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium p-3 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
                <span className="font-bold flex items-center gap-1.5">
                  ⚠️ يرجى إدخال البيانات المطلوبة (الاسم الكامل، العمر، وحلمك الذي تريد الوصول إليه) للتمكن من البدء.
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <button
                onClick={prevStep}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all text-text-secondary hover:bg-background`}
              >
                <ChevronRight size={20} />
                <span>السابق</span>
              </button>
              
              {step < 6 ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className={`flex items-center gap-2 px-8 py-2 rounded-xl transition-all shadow-soft ${
                    isStepValid() ? 'bg-primary text-white hover:bg-orange-600 shadow-primary/20' : 'bg-gray-200 text-text-muted cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>التالي</span>
                  <ChevronLeft size={20} />
                </button>
              ) : hasReachedLimit ? (
                <button
                  onClick={() => {
                    if (onUpgrade) onUpgrade();
                  }}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl transition-all shadow-soft font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20 cursor-pointer"
                >
                  <span>ترقية الباقة الآن</span>
                  <Zap size={20} />
                </button>
              ) : (
                <button
                  onClick={() => onComplete(formData)}
                  disabled={!isStepValid()}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl transition-all shadow-soft font-bold ${
                    isStepValid() ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20' : 'bg-gray-200 text-text-muted cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>ابدأ الآن</span>
                  <Check size={20} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default WizardForm;
