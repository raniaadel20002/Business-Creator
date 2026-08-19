import { GoogleGenAI, Type } from "@google/genai";
import { UserData, BusinessPlan, RejectionReport, ValidationResult, ExecutionBlueprint } from "../types.js";
import { parseCapitalDetails } from "./prompts/projectPrompts.js";
import { createGeminiClient } from "./geminiClient.js";


interface ProjectTypeClassification {
  isTech: boolean;
  isIndustrial: boolean;
  isRetail: boolean;
  isFood: boolean;
  isZeroModel: boolean;
}

const TECH_KEYWORDS = ["تطبيق", "موقع", "منصة", "ذكاء", "saas", "app", "platform"];
const INDUSTRIAL_KEYWORDS = ["مصنع", "صناعة", "إنتاج ضخم", "آلات ثقيلة", "خط إنتاج"];
const RETAIL_KEYWORDS = ["محل", "سوبرماركت", "استئجار متجر"];
const FOOD_KEYWORDS = ["مطعم", "كافيه", "عربة مأكولات"];
const ZERO_MODEL_KEYWORDS = ["وساطة", "عمولة", "سمسرة", "طلب مسبق", "pre-order", "خدمة", "تسويق", "دروب شيبينج", "مطبخ منزلي", "عمل حر", "فريلانسر", "تصميم", "برمجة", "تدريب", "استشارة", "بدون رأس مال", "من الصفر"];

const hasAny = (str: string, words: readonly string[]) => words.some(w => str.includes(w));

function classifyProjectType(conceptLower: string): ProjectTypeClassification {
  return {
    isTech: hasAny(conceptLower, TECH_KEYWORDS),
    isIndustrial: hasAny(conceptLower, INDUSTRIAL_KEYWORDS),
    isRetail: hasAny(conceptLower, RETAIL_KEYWORDS),
    isFood: hasAny(conceptLower, FOOD_KEYWORDS),
    isZeroModel: hasAny(conceptLower, ZERO_MODEL_KEYWORDS)
  };
}

function calculateMinimumCapital(classification: ProjectTypeClassification, isZeroCapital: boolean): number {
  if (isZeroCapital || classification.isZeroModel) return 0;
  if (classification.isIndustrial) return 80000;
  if (classification.isRetail) return 30000;
  if (classification.isTech || classification.isFood) return 15000;
  return 10000;
}

export class IdeaValidationEngine {
  /**
   * Evaluates the viability of a proposed business concept based on user profile and live market data.
   */
  public static async validateIdea(
    concept: string,
    projectName: string,
    userData: UserData,
    liveMarketData: string
  ): Promise<ValidationResult> {
    const conceptLower = (concept || "").toLowerCase();
    const liveLower = (liveMarketData || "").toLowerCase();
    
    // 1. Parse available capital in EGP using unified helper
    const capInfo = parseCapitalDetails(userData.availableCapital);
    const capital = capInfo.representativeAmount;
    
    // 2. Classify project type & determine capital requirements
    const classification = classifyProjectType(conceptLower);
    const minCapitalNeeded = calculateMinimumCapital(classification, capInfo.isZero);

    // Evaluate existential checks
    const genuineProblem = conceptLower.length > 30 
      ? "المشروع ده بيحل مشكلة حقيقية على أرض الواقع وبيسد فجوة واضحة في السوق بناءً على احتياج الناس الفعلي والبحث."
      : "المشروع لسه مش موضح أوي إيه هي المشكلة الحقيقية اللي بيعاني منها الزبون في منطقته.";
      
    const willingnessToPay = capInfo.isZero
      ? (classification.isZeroModel ? "الزبون عنده رغبة واضحة في الدفع مقابل الخدمة/الطلب المسبق مما يتيح دورة نقدية ممتازة بدون الحاجة لرأس مال تأسيسي." : "المشروع مصمم بنموذج رشيق يتيح تحصيل الإيراد وتغطية التكاليف من أول دفعة عملاء.")
      : (capital >= minCapitalNeeded * 0.4
        ? "الزبون هنا عنده رغبة عالية يدفع مقابل الخدمة/المنتج عشان بيقدّم قيمة مضافة حقيقية وتسعير لايق على جيبه وقدرته الشرائية."
        : "المشروع تم تكييفه بنموذج تدريجي (MVP) ليتناسب مع القوة الشرائية ورأس المال المتاح.");

    const userExecutionCapability = "هنطوع ونوجه مهاراتك وخبراتك وأدواتك كلها عشان تكون ركائز تشغيلية وداعمة ليك في خطة التنفيذ والتشغيل العملي، وده هيسهل عليك البداية ويفرملك أي عقبات.";
    const hasCoreSkills = true;

    const timingRight = !liveLower.includes("انكماش") && !liveLower.includes("حظر")
      ? "التوقيت ده لقطة وممتاز جداً في مصر، خصوصاً مع تسهيل الإجراءات والتراخيص والتشجيع المستمر للبدائل المحلية والمشاريع الصغيرة."
      : "السوق فيه زحمة جامدة أو عليه شوية قيود وصعوبات تنظيمية في القطاع ده دلوقتي.";

    // Mathematical scoring based on criteria
    let designThinkingScore = 85;
    let leanStartupScore = 90;
    let porterFiveForcesScore = 80;
    let pestelScore = 75;
    let trizScore = 80;
    let iso31000Score = 85;
    let okrScore = 85;
    let aidaScore = 80;
    let maslowScore = 85;
    let kaizenScore = 90;

    // Deductions based on resource constraints
    const capitalRatio = capInfo.isZero
      ? 1.0
      : (minCapitalNeeded === 0 ? 1.0 : Math.min(1.0, capital / minCapitalNeeded));

    if (capitalRatio < 0.3 && !capInfo.isZero) {
      pestelScore -= 15;
      iso31000Score -= 15;
    }

    // Porter's Five Forces impact
    if (liveLower.includes("منافسة شديدة") || liveLower.includes("مزدحم") || liveLower.includes("متشبع")) {
      porterFiveForcesScore -= 15;
      aidaScore -= 10;
    }

    // Calculate total weighted score (University Matrix)
    const averageScore = Math.round(
      (designThinkingScore +
        leanStartupScore +
        porterFiveForcesScore +
        pestelScore +
        trizScore +
        iso31000Score +
        okrScore +
        aidaScore +
        maslowScore +
        kaizenScore) /
        10
    );

    const score = Math.max(10, Math.min(100, averageScore));
    let decision: "ACCEPT" | "REJECT" | "PIVOT" = "ACCEPT";
    
    if (score < 50) {
      decision = "REJECT";
    } else if (score < 70) {
      decision = "PIVOT";
    }

    // Prepare Rejection & Pivot Report if needed
    let rejectionReport: RejectionReport | undefined;
    if (decision !== "ACCEPT") {
      const failureGates: string[] = [];
      if (capitalRatio < 0.5 && !capInfo.isZero) {
        failureGates.push(`بوابة رأس المال: التكلفة التقديرية للمشروع هي ${minCapitalNeeded} ج.م كحد أدنى بينما رأس مالك المتاح هو ${capital} ج.م.`);
      }
      if (!hasCoreSkills) {
        failureGates.push(`بوابة المهارة والخبرة: المشروع يتطلب خبرات تقنية/تشغيلية متخصصة غير متوفرة بوضوح في ملفك المهني.`);
      }
      if (liveLower.includes("صعب") || liveLower.includes("منافسة")) {
        failureGates.push(`بوابة تشبع السوق: السوق المحلي يشهد منافسة شرسة تعيق دخول مشروع جديد دون تميز قاطع.`);
      }

      const alternatives = await this.generateAlternativeIdeas(userData, projectName, failureGates);

      rejectionReport = {
        rejectionReasonSummary: `بعد إخضاع فكرة المشروع (${projectName}) لمصفوفة التقييم الاستراتيجية المكونة من 10 معايير (منها Porter's Five Forces و ISO 31000 للمخاطر)، تم رصد مجالات تحتاج لتقوية نموذج العمل.`,
        failureGates,
        alternatives,
        correctionPlan: [
          "تقليص حجم وطبيعة تقديم الخدمة/المنتج ليتناسب مع رأس المال الفعلي.",
          "التركيز على ميزة تنافسية واحدة قوية بدلاً من التشتت في خدمات متعددة.",
          "استغلال المهارات والأدوات الشخصية لتقليل تكلفة الأصول الثابتة والاعتماد على نموذج تشغيل مرن."
        ]
      };
    }

    return {
      isValid: decision === "ACCEPT",
      score,
      decision,
      matrix: {
        designThinkingScore,
        leanStartupScore,
        porterFiveForcesScore,
        pestelScore,
        trizScore,
        iso31000Score,
        okrScore,
        aidaScore,
        maslowScore,
        kaizenScore
      },
      existentialCheck: {
        genuineProblem,
        willingnessToPay,
        userExecutionCapability,
        timingRight
      },
      rejectionReport
    };
  }

  /**
   * Generates a step-by-step 90-day execution roadmap based on the validated project type and user budget.
   */
  public static generateExecutionRoadmap(
    concept: string,
    projectName: string,
    userData: UserData,
    liveMarketData: string
  ): ExecutionBlueprint {
    const conceptLower = (concept || "").toLowerCase();
    const capInfo = parseCapitalDetails(userData.availableCapital);
    const isZero = capInfo.isZero;
    
    const isTech = conceptLower.includes("تطبيق") || conceptLower.includes("موقع") || conceptLower.includes("منصة");
    const isFood = conceptLower.includes("مطعم") || conceptLower.includes("أكل") || conceptLower.includes("وجبات") || conceptLower.includes("مطبخ");
    
    type RawWeek = { w: number; m: string; t: string[]; c: string; s: string };
    type RawDay = { d: number; a: string; c: string; e: string; t: string[]; m: string };

    let weeksData: RawWeek[] = [];
    let daysData: RawDay[] = [];

    // Helper to generate weeks based on project type and available budget
    if (isTech) {
      // Digital / SaaS / App Roadmap
      weeksData = [
        { 
          w: 1, 
          m: "تحديد معالم المنتج ومخطط الرحلة للعميل", 
          t: ["تصميم مسار المستخدم User Flow", "تحديد الخصائص الأساسية للنموذج الأولي MVP", "رسم الاسكتشات الأولية لواجهات المنصة"], 
          c: "0 ج.م (أدوات مجانية)", 
          s: "مستند مبسط وواضح لهيكل ووظيفة المنتج" 
        },
        { 
          w: 2, 
          m: "بناء الهوية البصرية وإطلاق صفحة العرض", 
          t: ["تصميم اللوجو واختيار الألوان عبر أدوات التصميم", "بناء صفحة هبوط أولية (Landing Page) مجانية", "وضع نموذج جمع الطلبات المبكرة وقائمة الانتظار"], 
          c: isZero ? "0 ج.م (استضافة ونطاق مجاني)" : "300 ج.م (نطاق واستضافة أولية)", 
          s: "صفحة هبوط نشطة وجاهزة لاستقبال الزوار" 
        },
        { 
          w: 3, 
          m: "تجهيز البنية التحتية وقنوات التواصل المباشر", 
          t: ["تفعيل حساب WhatsApp Business التجاري والرد الآلي", "إعداد آلية استقبال التحويلات (Instapay / فودافون كاش / دفع إلكتروني)", "اختبار استقبال الطلبات والرسائل التجريبية"], 
          c: "0 ج.م (تفعيل مجاني)", 
          s: "جاهزية قناة التواصل واستقبال المدفوعات" 
        },
        { 
          w: 4, 
          m: "إطلاق حملة الوصول وجذب أول العملاء", 
          t: ["نشر محتوى فيديو تعريفي جذاب على TikTok و Reels", "التفاعل في المجموعات والمنتديات المهنية المستهدفة", isZero ? "نشر عروض ترويجية مباشرة بالعمولة والتسويق الشفهي" : "إطلاق إعلان ممول مصغر على Meta"], 
          c: isZero ? "0 ج.م (تسويق عضوي وفيروسي)" : "500 ج.م (إعلان ممول مستهدف)", 
          s: "الحصول على أول 50 عميلاً مسجلاً أو مهتماً" 
        }
      ];

      // Daily tasks (first 10 days)
      daysData = [
        { d: 1, a: "زيارة وتصفح 5 تطبيقات/منصات منافسة في مصر ورصد نقاط قوتهم وضعفهم في مراجعات العملاء.", c: "0 ج.م", e: "تحديد 3 ميزات تنافسية تجعلك فريداً.", t: ["خرائط جوجل", "Google Search"], m: "تقرير تحليل منافسين مكون من صفحة واحدة" },
        { d: 2, a: "صياغة الرسالة التسويقية وعرض القيمة الفريد (UVP) لحل مشكلة التكلفة والسرعة.", c: "0 ج.م", e: "تجهيز نص العرض الرئيسي الجاهز للنشر.", t: ["Google Docs"], m: "وجود صياغة UVP واضحة ومقنعة" },
        { d: 3, a: "إنشاء حساب تجاري رسمي على WhatsApp Business وتهيئته بكتالوج الخدمات المبدئي.", c: "0 ج.م", e: "تجهيز رابط تواصل فوري وسريع للعملاء.", t: ["WhatsApp Business"], m: "الملف التجاري جاهز 100%" },
        { d: 4, a: isZero ? "إنشاء صفحة أو موقع مجاني عبر Canva Websites أو Notion لتوفير تكلفة الدومين." : "حجز اسم نطاق (دومين) للمشروع واستضافة سحابية اقتصادية.", c: isZero ? "0 ج.م" : "250 ج.م", e: "رابط ويب فعال لنشره للجمهور.", t: isZero ? ["Canva", "Linktree"] : ["Hostinger", "GoDaddy"], m: "رابط الموقع منشور ويعمل" },
        { d: 5, a: "بناء صفحة هبوط أولية بسيطة تشرح الفكرة وتمنح الزوار ميزة حصرية عند التسجيل المبكر.", c: "0 ج.م", e: "صفحة جمع بيانات المشتركين الأوائل فعالة.", t: ["Google Forms", "Canva"], m: "نموذج التسجيل يعمل ويستقبل البيانات" },
        { d: 6, a: "تصميم 3 تصاميم إعلانية جذابة لصفحات السوشيال ميديا الخاصة بك.", c: "0 ج.م", e: "تواجد بصري احترافي وجاذب للعين.", t: ["Canva"], m: "3 منشورات جاهزة للتنزيل والنشر" },
        { d: 7, a: "تأمين وسيلة الدفع والتسليم: تفعيل المحافظ الإلكترونية وInstapay وتجهيز الفواتير.", c: "0 ج.م", e: "جاهزية استقبال الأموال بصورة فورية وآمنة.", t: ["Instapay", "Vodafone Cash"], m: "تفعيل الدفع الرقمي لاستقبال الأموال" },
        { d: 8, a: isZero ? "نشر مقاطع قصيرة (Reels) تشرح حل المشكلة في جروبات ومجتمعات العملاء المهتمين." : "إطلاق أول إعلان ممول مصغر يستهدف المدينة والاهتمامات بدقة.", c: isZero ? "0 ج.م" : "200 ج.م", e: "بدء التفاعل والرسائل من المهتمين.", t: isZero ? ["TikTok", "Facebook Groups"] : ["Meta Ads Manager"], m: "الوصول لأول 10 رسائل استفسار" },
        { d: 9, a: "متابعة العملاء الذين سجلوا وتجميع آرائهم وتعديل العرض بناءً على ملاحظاتهم.", c: "0 ج.م", e: "بناء ثقة مبكرة وتوثيق طلبات العملاء.", t: ["WhatsApp"], m: "تأكيد اهتمام 5 عملاء حقيقيين على الأقل" },
        { d: 10, a: "تحليل نتائج الأيام العشرة الأولى وحساب تكلفة ومعدل التحويل لإعداد خطة التوسع.", c: "0 ج.م", e: "معرفة جدوى المشروع الفورية وقدرتك على مواصلة التشغيل.", t: ["Google Sheets"], m: "تقرير أداء ومبيعات مبدئي" }
      ];
    } else if (isFood) {
      // F&B Food Truck / Home Kitchen / Catering Roadmap
      weeksData = [
        { 
          w: 1, 
          m: "تحديد قائمة الطعام (Menu) والموردين المحليين", 
          t: ["إعداد قائمة طعام مركزة (3-5 أصناف أساسية فقط)", "حساب تكلفة الخامات (Food Cost) بالقرش للوجبة", "الاتفاق مع تجار الجملة للخامات والتغليف"], 
          c: isZero ? "0 ج.م (استخدام أدوات ومطبخ المنزل)" : "300 ج.م (خامات تجريبية)", 
          s: "منيو جاهز ومحسوب التكلفة وجاهزية الموردين" 
        },
        { 
          w: 2, 
          m: "إنشاء الهوية البصرية وإطلاق صفحات التواصل", 
          t: ["تصميم لوجو جذاب وصور للمنيو بشكل احترافي عبر كانفا", "تجهيز صفحة فيسبوك وإنستجرام وتصوير خطوات الطهي بجودة عالية", "تجهيز التغليف والملصقات"], 
          c: isZero ? "0 ج.م (تصميم ذاتي مجاني)" : "400 ج.م (طباعة ملصقات وتغليف أولي)", 
          s: "صفحات تواصل نشطة وتغليف جاهز ومميز" 
        },
        { 
          w: 3, 
          m: "بناء خطة التوزيع والشحن المحلي بنظام الطلب المسبق", 
          t: ["الاتفاق مع طيار توصيل مستقل في منطقتك الجغرافية", "تحديد أسعار التوصيل بناءً على المسافة لتغطية التكلفة", isZero ? "تفعيل نظام الطلب المسبق (Pre-Order) لتحصيل الثمن أولاً" : "تجهيز مخزون أولي من الخامات"], 
          c: "0 ج.م (اتفاق بالعمولة/الرحلة)", 
          s: "تأكيد آلية التوصيل في زمن أقل من 40 دقيقة" 
        },
        { 
          w: 4, 
          m: "الافتتاح التجريبي وبدء استقبال الطلبات", 
          t: ["تقديم عينات لـ 10 أشخاص من المحيطين مقابل مراجعات مصورة", isZero ? "نشر العروض في المجموعات السكنية المجاورة" : "إطلاق إعلان ممول محلي بمحيط 3 كم", "بدء استقبال الطلبات وحساب صافي الربح اليومي"], 
          c: isZero ? "0 ج.م (تسويق محلي مباشر)" : "500 ج.م (إعلان ممول محلي)", 
          s: "بيع أول دفعة وجبات وتحقيق تقييمات إيجابية" 
        }
      ];

      // Daily tasks (first 10 days)
      daysData = [
        { d: 1, a: "زيارة 3 منافسين محليين ورصد أصنافهم وطرق التعبئة ومستوى الأسعار.", c: "0 ج.م", e: "معرفة الثغرات في جودة وتغليف المنافسين للتفوق عليهم.", t: ["خرائط جوجل", "فيسبوك"], m: "تقرير مقارنة أسعار وجودة" },
        { d: 2, a: "تحديد قائمة الطعام النهائية المكونة من 3-4 أصناف مميزة وغير تقليدية.", c: "0 ج.م", e: "قائمة طعام واضحة ومحددة وجذابة للزبائن.", t: ["Canva", "Google Docs"], m: "قائمة طعام جاهزة ومصممة بصرياً" },
        { d: 3, a: "إعداد جدول تكلفة الخامات لكل صنف بالجرام والقرش لضمان هامش ربح لا يقل عن 50%.", c: "0 ج.م", e: "تحديد السعر العادل وهوامش الربح بدقة.", t: ["Google Sheets"], m: "ملف حسابات تكلفة الوجبات" },
        { d: 4, a: isZero ? "تجهيز أدوات المطبخ والعلب المتاحة منزلياً لبدء أول طلبات بالطلب المسبق." : "شراء مستلزمات تغليف مبدئية بسعر الجملة من سوق الموردين.", c: isZero ? "0 ج.م" : "300 ج.م", e: "تأمين التغليف المناسب لحفظ الحرارة.", t: ["أسواق الموردين المحلية"], m: "تأمين مستلزمات التعبئة" },
        { d: 5, a: "إنشاء صفحة تجارية على فيسبوك وإنستجرام ووضع صور شهية للمنتجات وتصميم غلاف جذاب.", c: "0 ج.م", e: "واجهة رقمية احترافية تفتح شهية الزائر.", t: ["Canva", "Facebook Pages"], m: "الصفحات منشورة وجاهزة" },
        { d: 6, a: "تصوير فيديو قصير (Reels) يشرح نظافة المطبخ والوصفة المميزة التي تقدمها.", c: "0 ج.م", e: "بناء اتصال وثقة مبكرة مع زبائن منطقتك.", t: ["CapCut", "Instagram Reels"], m: "نشر الفيديو وتلقي أول تفاعلات" },
        { d: 7, a: "الاتفاق مع طيار توصيل مستقل في محيطك السكني لتسليم الطلبات بنظام الأجرة لكل مشوار.", c: "0 ج.م", e: "شبكة توصيل يعتمد عليها لحماية جودة الطعام.", t: ["مجموعات فيسبوك المحلية"], m: "الاتفاق على سعر التوصيل لكل منطقة" },
        { d: 8, a: "عرض تذوق لـ 5 عملاء أو معارف في منطقتك لكتابة رأيهم الصادق ومشاركته.", c: isZero ? "0 ج.م (من خامات البيت)" : "150 ج.م", e: "الحصول على أول توصيات حقيقية تكسر حاجز التردد لدى الزبائن.", t: ["WhatsApp"], m: "نشر 3 ريفيوهات إيجابية مصورة" },
        { d: 9, a: isZero ? "نشر عروض الافتتاح في جروبات السكن والنوادي والمكاتب المجاورة." : "إطلاق إعلان ممول دقيق جغرافياً لمحيط 2 كم يروج لعرض الافتتاح.", c: isZero ? "0 ج.م" : "200 ج.م", e: "تلقي أول طلبات مبيعات فعلية.", t: isZero ? ["Facebook Groups", "WhatsApp"] : ["Meta Ads Manager"], m: "تلقي أول 5 طلبات شراء مدفوعة" },
        { d: 10, a: "تحليل نتائج اليوم الأول: سرعة التوصيل، رضا العملاء، وحساب صافي الربح اليومي.", c: "0 ج.م", e: "ترسيخ نظام تشغيل متين بلا أخطاء.", t: ["Google Sheets"], m: "ملف حسابات اليوم الأول ورضا العملاء 100%" }
      ];
    } else {
      // General service / Retail / Local business roadmap
      weeksData = [
        { 
          w: 1, 
          m: "تحديد باقات الخدمة ودراسة المنافسين بدقة", 
          t: ["تحديد باقات الخدمة أو المنتجات الأساسية وأسعارها وهوامش ربحها", "زيارة المنافسين ومعرفة أسعارهم الحالية في السوق", "بناء هوية بصرية وشعار جذاب عبر كانفا"], 
          c: "0 ج.م (أدوات مجانية)", 
          s: "استقرار تسعير الخدمات وبناء الهوية باحترافية" 
        },
        { 
          w: 2, 
          m: "بناء الحضور الرقمي وقنوات التواصل المباشر", 
          t: ["إنشاء صفحة تجارية واحترافية على فيسبوك وتيك توك", "عمل تصميمات ترويجية تبرز الفوائد والحلول للعملاء", "بناء كارت شخصي رقمي وتجهيز رسائل الرد الفوري"], 
          c: "0 ج.م (أدوات مجانية)", 
          s: "جاهزية الصفحات بنسبة 100% لاستقبال الرسائل" 
        },
        { 
          w: 3, 
          m: "التشبيك وبناء الثقة وشهادات العملاء", 
          t: ["تقديم الخدمة لـ 2 من العملاء المختارين مقابل الحصول على ريفيوهات فيديو حقيقية", "نشر محتوى تعليمي مفيد يجيب على أسئلة العملاء الشائعة", "عمل عروض ترويجية مباشرة لقائمة المعارف والشركات المجاورة"], 
          c: "0 ج.م (مجهود تشغيلي)", 
          s: "أول 2 ريفيو إيجابي موثق يعزز المصداقية" 
        },
        { 
          w: 4, 
          m: "التشغيل التجاري وإطلاق حملة المبيعات الأولى", 
          t: [isZero ? "التسويق المباشر عبر زيارة المحلات والأنشطة والجروبات المحلية" : "إطلاق حملة إعلانية ممولة دقيقة تستهدف مدينتك والمهتمين فقط", "متابعة العملاء والرد الفوري لإنهاء المبيعات", "تحسين جودة الخدمة لضمان استمرارية العملاء"], 
          c: isZero ? "0 ج.م (تسويق مباشر وعلاقات)" : "350 ج.م (إعلان ممول محلي)", 
          s: "استقطاب أول 3 إلى 5 عملاء حقيقيين مدفوعين" 
        }
      ];

      // Daily tasks (first 10 days)
      daysData = [
        { d: 1, a: "زيارة 3 منافسين محليين للتعرف على عروضهم وأسعارهم وطرق تعاملهم مع الزبائن.", c: "0 ج.م", e: "معرفة الثغرات في خدمات المنافسين لتقديم حلول أفضل.", t: ["خرائط جوجل", "فيسبوك"], m: "تقرير فجوات السوق والأسعار المنافسة" },
        { d: 2, a: "تحديد قائمة خدماتك أو منتجاتك بالأسعار وشروط الحجز والتوصيل الميسرة.", c: "0 ج.م", e: "تجهيز عرض تجاري واضح وجاذب مكتوب.", t: ["Google Docs"], m: "مستند الخدمات والأسعار النهائي" },
        { d: 3, a: "بناء وتحديث حساب WhatsApp Business وتفعيل كتالوج الخدمات لتسهيل الطلب.", c: "0 ج.م", e: "واجهة تواصل تجارية سهلة للعميل بنقرة واحدة.", t: ["WhatsApp Business"], m: "كتالوج المنتجات مفعل وجاهز" },
        { d: 4, a: "تصميم لوجو ومجموعة من المنشورات الجذابة لصفحة الفيسبوك تعكس الجدية والاحترافية.", c: "0 ج.م", e: "وجود هوية بصرية مريحة ومقنعة للعميل.", t: ["Canva"], m: "اللوجو والتصاميم جاهزة للاستخدام" },
        { d: 5, a: "تجهيز الأدوات والمعدات الأساسية اللازمة للتشغيل الفوري (الموجودة لديك أو استغلال المتاح).", c: "0 ج.م", e: "جاهزية الأدوات لبدء تقديم الخدمة فوراً دون تأخير.", t: ["المعدات الشخصية المتاحة"], m: "الأدوات مجربة وتعمل بكفاءة" },
        { d: 6, a: "نشر أول منشورين في صفحتك التجارية يشرحان حلولاً للمشاكل الشائعة التي يعاني منها جمهورك.", c: "0 ج.م", e: "إثبات مصداقية وحل حقيقي يقنع الزائر بطلب خدمتك.", t: ["Canva", "Facebook Pages"], m: "نشر المنشورات والحصول على أول تفاعلات" },
        { d: 7, a: "التعريف بنفسك وبخدمتك للمحلات والشركات المجاورة في منطقتك مع إرسال كارت رقمي مميز.", c: "0 ج.م", e: "بناء علاقات شخصية قوية مع زبائن محتملين في منطقتك.", t: ["WhatsApp", "خرائط جوجل"], m: "تواصل مباشر مع 20 جهة مهتمة" },
        { d: 8, a: "تنفيذ الخدمة تجريبياً لعميلين في محيطك مقابل أن يقوما بنشر رأيهما الصادق.", c: "0 ج.م", e: "الحصول على ريفيوهات حقيقية تكسر حاجز الخوف لدى الآخرين.", t: ["WhatsApp"], m: "الحصول على أول تقييمين موثقين" },
        { d: 9, a: isZero ? "نشر عروض مميزة في مجموعات الأنشطة التجارية المحلية." : "إطلاق إعلان ممول مستهدف جغرافياً يروج لعرض الافتتاح والحجز السريع.", c: isZero ? "0 ج.م" : "250 ج.م", e: "تلقي أول طلبات مكالمات أو رسائل للحجز الفعلي.", t: isZero ? ["Facebook Groups"] : ["Meta Ads Manager"], m: "تلقي 3 طلبات حجز خدمة فعلية" },
        { d: 10, a: "تنفيذ الخدمة لأول دفعة عملاء بكل إتقان، مع جمع آرائهم وحساب صافي الربح المستحق.", c: "0 ج.م", e: "كسب ولاء عملاء دائمين وحساب تكاليف التشغيل بدقة.", t: ["Google Sheets"], m: "رضا العملاء بنسبة 100% وتسجيل الإيرادات الأولى" }
      ];
    }

    const weeklyMilestones = weeksData.map(item => ({
      week: item.w,
      milestone: item.m,
      tasks: item.t,
      estimatedCost: item.c,
      successMetric: item.s
    }));

    const dailyTasks = daysData.map(item => ({
      day: item.d,
      action: item.a,
      costEstimate: item.c,
      expectedOutcome: item.e,
      tools: item.t,
      measurementMetric: item.m
    }));

    return {
      days: dailyTasks,
      weeks: weeklyMilestones
    };
  }

  /**
   * Helper to parse a capital string into EGP number using unified helper.
   */
  private static parseCapital(capitalStr?: string): number {
    return parseCapitalDetails(capitalStr).representativeAmount;
  }

  /**
   * Generates custom pivot alternatives suited to the user's skills and budget using Gemini.
   */
  private static async generateAlternativeIdeas(
    userData: UserData,
    originalProjectName?: string,
    failureGates?: string[]
  ): Promise<{ projectName: string; concept: string; rationale: string }[]> {
    const capInfo = parseCapitalDetails(userData.availableCapital);
    const capital = capInfo.representativeAmount;
    const genderSuffix = userData.gender === "female" ? "ة" : "";
    
    const fallbacks = [
      {
        projectName: `رائد${genderSuffix} للتسويق والخدمات الرقمية المصغرة`,
        concept: "تقديم خدمات إدارة صفحات التواصل الاجتماعي، وكتابة المحتوى، وتصميم الصور البسيطة عبر كانفا لأصحاب المحلات والأنشطة التجارية المحلية في محيطك الجغرافي برسم شهري مبسط.",
        rationale: `يتناسب تماماً مع ميزانيتك المتاحة (${capInfo.label}) حيث لا يتطلب أي تكلفة تأسيسية أو أصول مادية—فقط لابتوب وهاتف ذكي ومهاراتك الحالية، ويتفادى تماماً بوابة التمويل المرتفعة.`
      },
      {
        projectName: "متجر تميز الإلكتروني المحلي",
        concept: "متجر إلكتروني مصغر يعتمد على تسويق وبيع منتجات يدوية أو ملابس جاهزة من مصنع محلي بالمنطقة الجغرافية بعد الاتفاق معهم على أخذ هامش ربح وتصوير المنتجات، مع الشحن الفوري عند طلب العميل بنظام الطلب المسبق.",
        rationale: "يتغلب على تكلفة الأصول والمخازن المرتفعة حيث تبدأ بشراء السلعة فقط بعد تلقي ثمنها من الزبون الفعلي، مما يضمن تدفقاً نقدياً فورياً ومخاطرة شبه منعدمة."
      },
      {
        projectName: "سفرة الهناء للمأكولات المنزلية",
        concept: "تأسيس مطبخ منزلي لطهي وجبات الغداء والمخبوزات الصحية الطازجة اليومية وتوريدها للموظفين والشركات المجاورة في منطقتك الجغرافية عبر التعاقد مع طيار توصيل محلي.",
        rationale: "يستفيد من رغبة الموظفين الدائمة في تناول طعام نظيف وبسعر مناسب لتقليل تكلفة الإيجار والديكورات الباهظة للمطاعم العادية، ويبدأ بخامات بسيطة لا تتعدى الميزانية المحددة لتجربة أولى آمنة."
      }
    ];

    const ai = createGeminiClient();

    const city = userData.city || "مصر";
    const availableCapital = userData.availableCapital || "غير محدد";
    const projectTypePref = userData.projectTypePreference || "غير محدد";
    const executionPref = userData.executionPreference || "غير محدد";
    const businessTypePref = userData.businessTypePreference || "غير محدد";

    const prompt = `أنت مستشار مبتكر في مجال الأعمال متخصص في السوق المصري. تم رفض فكرة المشروع الأصلية أو أن هناك حاجة لأفكار بديلة بناءً على التقييم الاستراتيجي.
مهمتك هي اقتراح ما يصل إلى 3 أفكار مشاريع بديلة متميزة وقابلة للتنفيذ للغاية تناسب تماماً حالة رائد الأعمال وتفضيلاته.

ملف رائد الأعمال وتفضيلاته:
- الموقع الجغرافي (المدينة/المنطقة): ${city}
- رأس المال المتاح: ${availableCapital}
- نوع المشروع المفضل (تقليدي أم مبتكر): ${projectTypePref}
- مكان التنفيذ المفضل (أونلاين أم على أرض الواقع أم كلاهما): ${executionPref}
- طبيعة المشروع (منتج أم خدمة أم كلاهما): ${businessTypePref}

${originalProjectName ? `- اسم المشروع الأصلي المرفوض: ${originalProjectName}` : ""}
${failureGates && failureGates.length > 0 ? `- أسباب فشل الفكرة الأصلية في بوابات التقييم:\n${failureGates.map(f => `  * ${f}`).join("\n")}` : ""}

القواعد والقيود الصارمة للأفكار البديلة (مبدأ التوليد المباشر Zero-Shot):
1. قاعدة التركيز على منتج/خدمة واحدة: يجب أن تركز كل فكرة بديلة مقترحة بشكل صارم على منتج رئيسي واحد أو خدمة واحدة فقط. لا تدمج عدة نماذج أعمال ولا تقدم منصات هجينة معقدة.
2. التنوع والابتكار الديناميكي: استنتج الأفكار ديناميكياً من الطلب الحقيقي في السوق وقيود ميزانية المستخدم. لا تعتمد على القوالب الكليشيهية أو أمثلة البرومبت الثابتة أو التصنيفات المحددة سلفاً.
3. القابلية للتنفيذ: تأكد من أن الأفكار عملية للغاية، وواقعية، ويمكن تنفيذها فوراً في حدود رأس المال المتاح والقيود الجغرافية للمستخدم.
4. اللهجة المصرية العامية: اكتب جميع حقول JSON الموجهة للمستخدم ("projectName", "concept", "rationale") بالكامل باللهجة المصرية العامية باستخدام مصطلحات تجارية دافئة وشائعة ودارجة. تجنب اللغة العربية الفصحى الجافة والرسمية.
5. الوضوح والبساطة: اجعل جميع الشروحات بسيطة ومباشرة وواضحة وخالية تماماً من المصطلحات المعقدة. صف الإجراءات التجارية بشكل ملموس.

أخرج النتيجة حصرياً كمصفوفة JSON صالحة مطابقة للهيكل المطلوب. لا تضف أي نص حواري قبل أو بعد JSON.`;

    try {
      console.log("[IdeaValidationEngine] Calling Gemini to generate custom alternative ideas...");
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "أنت مستشار مبتكر في مجال الأعمال متخصص في السوق المصري. أخرج حصرياً مصفوفة JSON صالحة مطابقة لهيكل الاستجابة المطلوب. يجب كتابة جميع النصوص داخل حقول JSON (projectName, concept, rationale) بالكامل باللهجة المصرية العامية باستخدام مصطلحات تجارية بسيطة وواضحة وشائعة وخالية من المصطلحات المعقدة. لا تكتب أي غلاف ماركداون أو نصوص شارحة خارج JSON.",
          responseMimeType: "application/json",
          temperature: 0.8,
          topP: 0.95,
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                projectName: { type: Type.STRING },
                concept: { type: Type.STRING },
                rationale: { type: Type.STRING }
              },
              required: ["projectName", "concept", "rationale"]
            }
          }
        }
      });

      const text = response.text ? response.text.trim() : "";
      if (text) {
        let cleanedText = text;
        if (cleanedText.startsWith("```json")) {
          cleanedText = cleanedText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        }
        const ideas = JSON.parse(cleanedText);
        if (Array.isArray(ideas) && ideas.length > 0) {
          console.log("[IdeaValidationEngine] Successfully generated alternative ideas via Gemini.");
          return ideas.slice(0, 3);
        }
      }
    } catch (e) {
      console.error("[IdeaValidationEngine] Error during generation of alternative ideas:", e);
    }

    console.warn("[IdeaValidationEngine] Falling back to standard alternatives.");
    return fallbacks;
  }
}
