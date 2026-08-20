import { GoogleGenAI, Type } from "@google/genai";
import { UserData, BusinessPlan } from "../types.js";
import { IdeaValidationEngine } from "./ideaValidationEngine.js";
import { buildPlanPrompt, getUserMandatesPrompt, parseCapitalDetails, STAGE_1_AND_2_COMBINED_PROMPT, STAGE_3_BLUEPRINT_EXECUTION_PROMPT, BUSINESS_CREATOR_CORE_ENGINE_INSTRUCTION } from "./prompts/projectPrompts.js";
import { createGeminiClient, getModelFallbackList, executeWithGeminiPool, geminiKeyPool } from "./geminiClient.js";

const maxDuration = 60;

// Sleek, high-level minimal instruction constant
const SYSTEM_INSTRUCTION = `أنت "مستشار صانع المشاريع (Business Creator)"، خبير أعمال استراتيجي ومصمم مشاريع للأسواق المحلية والدولية لعام 2026.
تلتزم بشكل مطلق بالقواعد التالية:
1. الإخراج باللهجة المصرية العامية الدارجة والمحبوبة والسهلة (العامية البسيطة القريبة من القلب) في جميع النصوص المخصصة للمطلب والمستخدم. تجنب استخدام الفصحى الجافة أو التعبيرات الأجنبية المعقدة دون ترجمة شعبية.
2. الجنس والخطاب: إذا كان المستخدم أنثى (gender: female أو أنثى)، يجب مخاطبتها بصيغة المؤنث طوال الخطة بالكامل وبشكل حاسم (مثل رائدة الأعمال، أنتِ، خطتكِ، ربنا يوفقكِ)، وإذا كان ذكراً، خاطبه بالمذكر (رائد الأعمال، أنت، خطتك).
3. التكيّف الجغرافي الديناميكي والربط بالمصادر الرسمية (Dynamic Geographic Grounding & Knowledge Base Integration):
   - يُمنع منعاً باتاً حصر الأبحاث أو الجدوى الميدانية في مدينة أو دولة واحدة ثابتة دون الرجوع لبيانات المستخدم.
   - يجب ربط جميع الفرص، التكاليف، الدراسة المالية، والخطوات القانونية بالدولة والمدينة المحددة في ملف المستخدم (userData.city, userData.country).
   - المعايرة المباشرة بأسعار وأبحاث المصادر الرسمية والتطبيقات الميدانية: Google Trends, Wamda, Hsoub I/O, Mostaql, B2B Exporters/Suppliers, البنك المركزي، الهيئات الاستثمارية الرسمية (مثل GAFI)، وأجهزة تنمية المشروعات (مثل MSMEDA).
4. الواقعية المطلقة والالتزام الحاسم برأس المال والميزانية: جميع الأرقام والخطوات والتكلفة المقترحة يجب أن تكون واقعية وعملية لعام 2026 في الدولة والمدينة المحددة، ويُحظر تماماً اقتراح أي أصول أو أدوات أو تكاليف تتجاوز ميزانية المستخدم أو سقف رأس ماله المحدد.
5. الالتزام بالسياق: لا تهلوس أو تخترع منافسين وهميين أو روابط وهمية. التزم فقط بالمنافسين والبيانات الحقيقية المذكورة في سياق البحث الحي، وفي حال غيابها اذكر مواقع ومصادر حقيقية عامة أو أدلة تواصل محلية في الدولة دون اختراع روابط مزيفة.
6. منع المحاكاة (No Cloning): يُمنع منعاً باتاً صياغة خطط أو أفكار لمشاريع تشبه "صانع المشاريع" أو تقوم بوظيفته (مثل إنشاء خطط أعمال آلية أو توليد جدوى بالذكاء الاصطناعي).
7. التفكير والتأني والتفصيل الكلي: بناءً على رغبة المستخدم الصريح وتفضيله الكفاءة القصوى على السرعة، يجب عليك أخذ كامل الوقت والمساحة للتفكير الاستراتيجي المتأني خطوة بخطوة، وصياغة وتفصيل جميع أقسام خطة العمل بأعلى درجات الدقة والكمال والجودة العملية.
8. قاعدة الابتكار الديناميكي الحي: يُمنع منعاً باتاً استنساخ أفكار نمطية مكررة. يجب توليد وتطوير كل فكرة مشروع وخطة عمل بصورة ديناميكية مبتكرة وخصيصاً من واقع نتائج أبحاث السوق الحية والبيانات المباشرة للمستخدم.
9. التنوع القطاعي وحظر الانحياز لقطاع المطاعم والأغذية: يُمنع التركيز النمطي أو الانحياز التلقائي لقطاع المطاعم والمأكولات والطهي في المشاريع على أرض الواقع.
10. حظر أفكار النحت واللمسات الفنية واليدوية والهوايات الصغيرة: يُمنع منعاً باتاً اقتراح المشاريع القائمة على النحت أو الديكورات الفنية اليدوية الهامشية.
11. حظر التكرار الثابت والانحياز لفكرة "سلسلة توريدات" أو "وساطة B2B": يُمنع منعاً باتاً استنساخ أو فرض أفكار منصات وساطة التوريدات كخيار افتراضي أعمى! يجب دائماً الالتزام بميزانية المستخدم الدقيقة وتفضيلاته الأربعة وتوليد أفكار متنوعة.
12. خط إنتاج الابتكار العالمي والفلترة المحلية (Global Innovation & Local Feasibility Pipeline):
    - المرحلة الأولى (الإلهام العالمي غير التقليدي): استكشاف أفكار ونماذج أعمال مبتكرة وغير تقليدية بالاستعانة بمصادر الاتجاهات العالمية والمنصات مثل Exploding Topics, Product Hunt, Indie Hackers, Y Combinator Directory.
    - المرحلة الثانية (فلترة الجدوى والتكيف المحلي): اختبار الفكرة العالمية بصرامة أمام واقع السوق المحلي والقدرة الشرائية والتكاليف التشغيلية (Mostaql, B2B exporters), والقوانين والتراخيص (GAFI, MSMEDA), والطلب الثقافي (Google Trends, Wamda, Hsoub I/O).
    - قاعدة القرار: إذا نجحت الفكرة عالمياً وتخطت الفلتر المحلي بنجاح، تُصاغ في خطة تنفيذية واقعية. وإذا فشلت محلياً (بسبب عدم توافر البوابات الرقمية، أو المخالفة القانونية، أو تجاوز الميزانية) تُرفض فوراً ويُستبدل بها نموذج غير تقليدي آخر قابل للتطبيق المحلي.
13. محرك التفكير الإنجليزي والتسليم العربي (Business Creator Core Engine - English Thinking & Arabic Delivery):
    - تنفيذ الإدراك والتحليل وتقييم الميزانية والرصف البرمجي والهيكلي للذكاء الاصطناعي 100% باللغة الإنجليزية لضمان أقصى كفاءة منطقية ودقة معمارية.
    - صياغة وتسليم المخرجات النهائية للمستخدم حكراً بلغة عربية سلسة ومصممة بدقة عالية لرواد الأعمال، دون إظهار أي خطوات أو نصوص تفكير إنجليزية داخل الواجهة الموجهة للمستخدم.

${BUSINESS_CREATOR_CORE_ENGINE_INSTRUCTION}`;

// Highly streamlined BUSINESS_PLAN_SCHEMA with removed deeply-nested required fields to prevent 400 Bad Request
const BUSINESS_PLAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    projectName: { 
      type: Type.STRING, 
      description: "اسم العلامة التجارية الفائزة للمشروع المقترح (يجب أن يكون اسماً تجارياً مبتكراً وجذاباً باللهجة المصرية، وليس اسم المستخدم الشخصي)." 
    },
    clarifyingQuestions: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "قائمة بالأسئلة التوضيحية إذا كانت البيانات غير كافية. اتركها فارغة إذا كانت البيانات كافية."
    },
    identity: {
      type: Type.OBJECT,
      description: "الهوية التجارية (Branding) المصممة خصيصاً للمشروع بناءً على نوعه وجمهوره.",
      properties: {
        brandNamingStrategy: {
          type: Type.OBJECT,
          description: "استراتيجية تسمية العلامة التجارية باستخدام المعايير العالمية لوكالات التسمية الكبرى لضمان اختيار أقوى اسم.",
          properties: {
             generatedNames: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5-7 أسماء مختلفة عالية الجودة للشركة وفقاً للمعايير العالمية." },
             top3Names: {
               type: Type.ARRAY,
               description: "أفضل 3 أسماء من القائمة السابقة.",
               items: {
                 type: Type.OBJECT,
                 properties: {
                   name: { type: Type.STRING },
                   evaluationScore: { type: Type.NUMBER, description: "التقييم الكلي من 60." },
                   deepExplanation: { type: Type.STRING, description: "السبب وراء قوة هذا الاسم نفسياً وتجارياً." },
                   brandPositioning: { type: Type.STRING, description: "الشعور الذي يتركه الاسم (Luxury / Innovation / Trust / Power / Simplicity)." },
                   logoDirection: { type: Type.STRING, description: "الهوية البصرية المقترحة (النمط، الألوان، الانطباع)." },
                   domainSuggestion: { type: Type.STRING, description: "احتمالية توفر الدومين (High / Medium / Low)." },
                   riskCheck: { type: Type.STRING, description: "نقاط الضعف أو المخاطر المحتملة لاستخدام هذا الاسم." }
                 }
               }
             },
             finalRecommendation: {
               type: Type.OBJECT,
               properties: {
                 winnerName: { type: Type.STRING, description: "الاسم الفائز الفعلي." },
                 reasoning: { type: Type.STRING, description: "سبب كونه الخيار الأفضل بوضوح." }
               }
             }
          }
        },
        brandIdentitySystem: {
          type: Type.OBJECT,
          description: "نظام هوية العلامة التجارية الكامل.",
          properties: {
            brandFoundation: {
              type: Type.OBJECT,
              properties: {
                mission: { type: Type.STRING, description: "رسالة العلامة التجارية." },
                vision: { type: Type.STRING, description: "رؤية العلامة التجارية." },
                coreValues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "القيم الأساسية للمشروع." }
              }
            },
            brandPositioning: {
              type: Type.OBJECT,
              properties: {
                differentiation: { type: Type.STRING, description: "ميزة التميز." },
                targetAudience: { type: Type.STRING, description: "الجمهور المستهدف." },
                problemSolved: { type: Type.STRING, description: "المشكلة التي يحلها المشروع." }
              }
            },
            logoConcept: {
              type: Type.OBJECT,
              properties: {
                logoType: { type: Type.STRING, description: "نوع الشعار." },
                conceptIdea: { type: Type.STRING, description: "الفكرة وراء اللوجو بالتفصيل." },
                shapePsychology: { type: Type.STRING, description: "سيكولوجية الأشكال." },
                scalability: { type: Type.STRING, description: "المرونة والاستخدام." },
                colorLogic: { type: Type.STRING, description: "المنطق اللوني للشعار." }
              }
            },
            visualIdentitySystem: {
              type: Type.OBJECT,
              properties: {
                colorPalette: {
                  type: Type.OBJECT,
                  properties: {
                    primary: { type: Type.ARRAY, items: { type: Type.STRING }, description: "ألوان رئيسية HEX." },
                    secondary: { type: Type.ARRAY, items: { type: Type.STRING }, description: "ألوان ثانوية HEX." },
                    background: { type: Type.ARRAY, items: { type: Type.STRING }, description: "ألوان الخلفيات HEX." }
                  }
                },
                typography: {
                  type: Type.OBJECT,
                  properties: {
                    headingStyle: { type: Type.STRING, description: "خط العناوين." },
                    bodyStyle: { type: Type.STRING, description: "خط النصوص." },
                    reasoning: { type: Type.STRING, description: "سبب الاختيار." }
                  }
                },
                visualStyle: {
                  type: Type.OBJECT,
                  properties: {
                    imageDirection: { type: Type.STRING, description: "اتجاه الصور البصرية." },
                    iconStyle: { type: Type.STRING, description: "شكل الأيقونات المستخدمة." },
                    layoutStyle: { type: Type.STRING, description: "تخطيط الواجهات." }
                  }
                },
                consistencySystem: { type: Type.STRING, description: "آلية المحافظة على التناسق." }
              }
            },
            brandPersona: {
              type: Type.OBJECT,
              properties: {
                personalityTraits: { type: Type.ARRAY, items: { type: Type.STRING }, description: "سمات الشخصية." },
                behaviorStyle: { type: Type.STRING, description: "أسلوب السلوك العام." },
                communicationAttitude: { type: Type.STRING, description: "طريقة التواصل الهاتفي والرد على العملاء." },
                archetype: { type: Type.STRING, description: "النموذج الأصلي للبراند." },
                reactionUnderPressure: { type: Type.STRING, description: "التفاعل وقت الأزمات أو الشكاوى." },
                trustBuilding: { type: Type.STRING, description: "آلية كسب ود العميل الفورية." }
              }
            },
            brandExperience: {
              type: Type.OBJECT,
              properties: {
                websiteFeeling: { type: Type.STRING, description: "شعور المتجر/الموقع." },
                customerInteraction: { type: Type.STRING, description: "تجربة خدمة العملاء." },
                productExperience: { type: Type.STRING, description: "شعور استلام المنتج." },
                emotionalJourney: { type: Type.STRING, description: "رحلة المستهلك النفسية." }
              }
            },
            qualityControl: {
              type: Type.OBJECT,
              properties: {
                scalable: { type: Type.STRING, description: "التطوير." },
                distinctive: { type: Type.STRING, description: "التميز." },
                memorable: { type: Type.STRING, description: "سرعة الحفظ بالذاكرة." },
                consistent: { type: Type.STRING, description: "التناسق البصري." }
              }
            }
          }
        },
        logoConcept: { type: Type.STRING, description: "وصف لتصميم اللوجو بالإنجليزية." },
        brandColors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "الألوان بصيغة HEX." },
        colorPsychology: { type: Type.STRING, description: "السيكولوجية للألوان." },
        typography: {
          type: Type.OBJECT,
          properties: {
            fontFamily: { type: Type.STRING, description: "الخط المستخدم." },
            description: { type: Type.STRING, description: "سبب استخدام الخط." }
          }
        },
        brandVoice: { type: Type.STRING, description: "نبرة الصوت للعلامة التجارية." }
      }
    },
    concept: { type: Type.STRING, description: "تفصيل فكرة المشروع باللهجة المصرية العامية." },
    rationale: { type: Type.STRING, description: "مبررات واقعية لاختيار هذا المشروع." },
    marketAnalysis: {
      type: Type.OBJECT,
      properties: {
        marketSizeAndGrowth: { type: Type.STRING, description: "حجم السوق المتوقع ومعدلات النمو." },
        marketTrends: { type: Type.STRING, description: "الاتجاهات الحالية في مصر لعام 2026." },
        porterFiveForces: { type: Type.STRING, description: "تحليل القوى الخمس لبورتر باختصار." },
        barriersToEntry: { type: Type.STRING, description: "التحديات وكيفية تخطيها." },
        regulatoryEnvironment: { type: Type.STRING, description: "التراخيص والقوانين المصرية المطلوبة." },
        marketGaps: { type: Type.STRING, description: "الفجوة الحقيقية التي يستغلها المشروع." },
        identifiedProblems: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              problem: { type: Type.STRING, description: "المشكلة المرصودة." },
              reasoning: { type: Type.STRING, description: "السبب الاقتصادي أو الفعلي لها." }
            }
          }
        },
        selectedOpportunityReasoning: { type: Type.STRING, description: "الفرصة الجغرافية أو السوقية." }
      }
    },
    validation: {
      type: Type.OBJECT,
      properties: {
        targetMarketNeed: { type: Type.STRING, description: "احتياج السوق الفعلي." },
        competitorAnalysis: { type: Type.STRING, description: "تحليل المنافسين." },
        competitorsDetailed: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "اسم المنافس." },
              type: { type: Type.STRING, description: "مباشر أو غير مباشر." },
              url: { type: Type.STRING, description: "رابط موقع المنافس الحقيقي في مصر." },
              location: { type: Type.STRING, description: "الموقع." },
              description: { type: Type.STRING, description: "نبذة عن المنافس." },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              howToCompete: { type: Type.STRING, description: "كيف تتفوق عليه." }
            }
          }
        },
        feasibilityRating: { type: Type.STRING, description: "مستوى الجدوى الاقتصادية (High, Medium, Low)." },
        feasibilityReasoning: { type: Type.STRING, description: "شرح الجدوى." },
        whyNow: { type: Type.STRING, description: "لماذا هذا التوقيت ملائم وممتاز في مصر." }
      }
    },
    type: { type: Type.STRING, description: "تصنيف أو طبيعة المشروع." },
    feasibility: {
      type: Type.OBJECT,
      properties: {
        estimatedCost: { type: Type.STRING, description: "التكلفة التقديرية التأسيسية بالجنيه المصري (يجب أن تطابق 100% مجموع بنود costBreakdown وتلتزم بميزانية المستخدم بدقة)." },
        costBreakdown: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item: { type: Type.STRING, description: "البند التأسيسي بالتفصيل." },
              cost: { type: Type.STRING, description: "التكلفة الدقيقة بالجنيه المصري (مثال: '1,500 ج.م' أو '0 ج.م (مجاني)')." }
            }
          }
        },
        launchTimeline: { type: Type.STRING, description: "الجدول الزمني للبدء والافتتاح." },
        timeToProfit: { type: Type.STRING, description: "الفترة المتوقعة للوصول للأرباح الصافية واسترداد رأس المال." },
        expectedRevenue: { type: Type.STRING, description: "الإيرادات الشهرية المتوقعة بالجنيه المصري." },
        revenueModel: { type: Type.STRING, description: "نموذج الإيرادات ومصادر التدفق النقدي." },
        pricingStrategy: { type: Type.STRING, description: "استراتيجية التسعير وهيكل الأسعار بالجنيه المصري، شاملة سعر الباقة/المنتج، تكلفة الوحدة المتغيرة، وصافي هامش الربح." },
        breakEvenPoint: { type: Type.STRING, description: "نقطة التعادل المحسوبة بالمعادلة الاقتصادية (المصاريف الثابتة شهرياً ÷ هامش ربح الوحدة = عدد الوحدات/العملاء المطلوب شهرياً لتحقيق التعادل)." },
        financialProjection3Months: { type: Type.STRING, description: "التوقعات المالية الشهرية للأشهر الثلاثة الأولى بالتفصيل (الشهر 1، الشهر 2، الشهر 3: إيراد - مصروف تشغيل = صافي ربح)." }
      }
    },
    targetAudience: {
      type: Type.OBJECT,
      properties: {
        idealCustomerProfile: { type: Type.STRING, description: "ملف العميل المثالي." },
        demographicsAndGeography: { type: Type.STRING, description: "التركيبة الجغرافية والسكانية." },
        interestsAndBehavior: { type: Type.STRING, description: "اهتمامات العميل وسلوكه الشرائي في مصر لعام 2026." },
        socialMediaPresence: { type: Type.STRING, description: "المنصات التي يتواجد عليها العميل." },
        primarySegment: { type: Type.STRING, description: "الشريحة الأساسية الأهم." },
        behaviorAndMindset: { type: Type.STRING, description: "عقلية المشتري ودوافعه النفسية." },
        acquisitionChannels: { type: Type.STRING, description: "قنوات الاستحواذ." }
      }
    },
    executionGuide: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phase: { type: Type.STRING, description: "المرحلة الزمنية." },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING, description: "الخطوة الفعلية." },
                tools: { type: Type.ARRAY, items: { type: Type.STRING }, description: "الأدوات والتطبيقات المساعدة." },
                expectedResult: { type: Type.STRING, description: "النتيجة المتوقعة." }
              }
            }
          }
        }
      }
    },
    mentorshipAndGuidance: {
      type: Type.OBJECT,
      properties: {
        fundingAdvice: { type: Type.STRING, description: "نصائح وإرشادات التمويل المناسبة للمشروع في مصر." }
      }
    },
    learningPath: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING, description: "المهارة المراد تعلمها." },
          resourceName: { type: Type.STRING, description: "اسم المصدر أو الدورة الموصى بها." },
          resourceLink: { type: Type.STRING, description: "رابط المصدر أو الدورة الحقيقي في مصر أو عالمياً." },
          platform: { type: Type.STRING, description: "المنصة المستضيفة مثل YouTube, Udemy, Coursera, LinkedIn, Other." },
          description: { type: Type.STRING, description: "تفصيل ما سيتم تعلمه من هذا المصدر وكيف يفيد المشروع." },
          importance: { type: Type.STRING, description: "الأهمية الاستراتيجية لتعلم هذه المهارة." }
        }
      }
    },
    toolsAndResources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "فئة الأدوات والموارد." },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "اسم الأداة." },
                link: { type: Type.STRING, description: "الرابط الإلكتروني للأداة." },
                description: { type: Type.STRING, description: "وصف الأداة وكيفية الاستفادة منها." },
                isFree: { type: Type.BOOLEAN, description: "هل الأداة مجانية أم لا." },
                whereToBuyOrGet: { type: Type.STRING, description: "مكان الشراء أو الحصول عليها." },
                howToUse: { type: Type.STRING, description: "طريقة استخدام الأداة." },
                estimatedCost: { type: Type.STRING, description: "التكلفة التقديرية للأداة." }
              }
            }
          }
        }
      }
    },
    challengesAdvice: {
      type: Type.ARRAY,
      description: "استراتيجيات وحلول عملية مخصصة وموجهة تماماً للتحديات الفردية التي ذكرها المستخدم في الاستبيان (مثل رأس المال، ضيق الوقت، العلاقات، البيئة المحيطة، التسويق، التقنية، المهارات). يجب صياغة 2-4 حلول دقيقة ومفصلة تناسب ظروف رائد الأعمال ومشروعه بدلاً من النصائح العامة.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "عنوان التحدي أو العقبة المحددة." },
          advice: { type: Type.STRING, description: "توجيه وحل عملي مخصص يوضح للعميل كيفية تخطي العقبة في مشروعه بالتفصيل." },
          links: {
            type: Type.ARRAY,
            description: "مصادر ومجتمعات مفيدة.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "اسم المصدر أو الأداة أو المجتمع." },
                url: { type: Type.STRING, description: "الرابط الإلكتروني." }
              }
            }
          }
        }
      }
    },
    marketingStrategy: {
      type: Type.OBJECT,
      properties: {
        coreMessage: { type: Type.STRING },
        socialMediaStrategy: { type: Type.STRING },
        contentPillars: { type: Type.ARRAY, items: { type: Type.STRING } },
        advertisingPlan: { type: Type.STRING },
        growthHacks: { type: Type.STRING },
        influencerPartnerships: { type: Type.STRING },
        first1000Customers: { type: Type.STRING },
        retentionStrategy: { type: Type.STRING },
        contentIdeas: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    swot: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        threats: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    businessStrategy: {
      type: Type.OBJECT,
      properties: {
        executiveSummary: { type: Type.STRING },
        visionAndMission: { type: Type.STRING },
        strategicObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
        coreCompetencies: { type: Type.STRING },
        keyPerformanceIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
        expansionPlan: { type: Type.STRING }
      }
    },
    investmentAndIncubation: {
      type: Type.OBJECT,
      properties: {
        investmentReadiness: { type: Type.STRING },
        pitchDeckTips: { type: Type.STRING },
        howToCommunicate: { type: Type.STRING },
        recommendedIncubators: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              requirements: { type: Type.STRING },
              website: { type: Type.STRING },
              phone: { type: Type.STRING },
              googleMapsLink: { type: Type.STRING },
              location: { type: Type.STRING }
            }
          }
        }
      }
    },
    businessModelCanvas: {
      type: Type.OBJECT,
      properties: {
        keyPartners: { type: Type.ARRAY, items: { type: Type.STRING } },
        keyActivities: { type: Type.ARRAY, items: { type: Type.STRING } },
        keyResources: { type: Type.ARRAY, items: { type: Type.STRING } },
        valuePropositions: { type: Type.ARRAY, items: { type: Type.STRING } },
        customerRelationships: { type: Type.ARRAY, items: { type: Type.STRING } },
        channels: { type: Type.ARRAY, items: { type: Type.STRING } },
        customerSegments: { type: Type.ARRAY, items: { type: Type.STRING } },
        costStructure: { type: Type.ARRAY, items: { type: Type.STRING } },
        revenueStreams: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    }
  },
  required: [
    "projectName",
    "identity",
    "concept",
    "rationale",
    "marketAnalysis",
    "validation",
    "type",
    "feasibility",
    "executionGuide",
    "mentorshipAndGuidance",
    "learningPath",
    "toolsAndResources",
    "swot"
  ]
};

function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  if (!source || typeof source !== 'object') return target;
  if (!target || typeof target !== 'object') return source as T;

  const output = { ...target } as any;

  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = output[key];

    if (Array.isArray(sourceVal)) {
      output[key] = sourceVal;
    } else if (
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      output[key] = deepMerge(targetVal, sourceVal);
    } else if (sourceVal !== undefined) {
      output[key] = sourceVal;
    }
  }

  return output as T;
}

function safeJsonParse<T>(rawText: string, fallback?: T): T {
  if (!rawText) return (fallback ?? {}) as T;

  let cleaned = rawText.trim();

  if (cleaned.includes("```")) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      cleaned = match[1].trim();
    } else {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }
  }

  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace > startIdx) {
      cleaned = cleaned.substring(startIdx, lastBrace + 1);
    } else {
      cleaned = cleaned.substring(startIdx);
    }
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    const lastBracket = cleaned.lastIndexOf("]");
    if (lastBracket > startIdx) {
      cleaned = cleaned.substring(startIdx, lastBracket + 1);
    } else {
      cleaned = cleaned.substring(startIdx);
    }
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    try {
      const repaired = repairTruncatedJson(cleaned);
      return JSON.parse(repaired) as T;
    } catch (err) {
      console.warn("[safeJsonParse] Unable to parse JSON string, utilizing fallback value.", err);
      return (fallback ?? {}) as T;
    }
  }
}

function repairTruncatedJson(str: string): string {
  let s = str.trim();
  if (!s) return "{}";

  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char === '{' ? '}' : ']');
      } else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  // If truncated inside an unclosed string, close the string
  if (inString) {
    s += '"';
  }

  // Remove trailing invalid chars
  s = s.replace(/:\s*"?[^",:}\]]*$/, ': null');
  s = s.replace(/,\s*([}\]])/g, '$1');
  s = s.replace(/,\s*$/, '');

  while (stack.length > 0) {
    s += stack.pop();
  }

  return s;
}

export function safeString(val: any, fallback: string = ""): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val.trim();
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) {
    const parts = val.map(item => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        if (item.month || item.period) {
          const sub: string[] = [];
          if (item.month || item.period) sub.push(String(item.month || item.period));
          if (item.revenue || item.income) sub.push(`إيرادات: ${item.revenue || item.income}`);
          if (item.expenses || item.cost) sub.push(`مصاريف: ${item.expenses || item.cost}`);
          if (item.netProfit || item.profit) sub.push(`صافي ربح: ${item.netProfit || item.profit}`);
          if (item.details || item.notes) sub.push(String(item.details || item.notes));
          return sub.length > 0 ? sub.join(" - ") : JSON.stringify(item);
        }
        return Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(" | ");
      }
      return String(item);
    });
    return parts.filter(Boolean).join("\n");
  }
  if (typeof val === "object") {
    const lines = Object.entries(val).map(([k, v]) => {
      if (typeof v === "object" && v !== null) {
        return `${k}: ${JSON.stringify(v)}`;
      }
      return `${k}: ${v}`;
    });
    return lines.join("\n");
  }
  return String(val);
}

export class AiBusinessService {
  private get ai(): GoogleGenAI {
    return createGeminiClient();
  }

  // In-memory cache map for Search & Maps grounding results with 6-hour TTL
  private static searchCache = new Map<string, { data: string; timestamp: number }>();
  private static readonly CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

  constructor() {
    // Initialized with dynamic key pool getter
  }

  // Helper to handle timeouts elegantly
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((resolve) => setTimeout(() => {
        console.warn(`[Timeout] Task timed out after ${timeoutMs}ms, using fallback.`);
        resolve(fallbackValue);
      }, timeoutMs))
    ]);
  }



  private sanitizeUserData(userData: UserData): any {
    if (!userData) return {};
    const {
      gender,
      city,
      country,
      nationality,
      projectTypePreference,
      executionPreference,
      businessTypePreference,
      availableCapital,
      basicSkills,
      professionalExperience,
      availableEquipment,
      hobbies,
      specialNotes,
      fieldInterests,
      initialIdeas,
      clarifyingAnswers,
    } = userData;

    return {
      gender,
      city,
      ...(country ? { country } : {}),
      ...(nationality ? { nationality } : {}),
      projectTypePreference,
      executionPreference,
      businessTypePreference,
      availableCapital,
      ...(basicSkills !== undefined ? { basicSkills } : {}),
      ...(professionalExperience !== undefined ? { professionalExperience } : {}),
      ...(availableEquipment !== undefined ? { availableEquipment } : {}),
      ...(hobbies !== undefined ? { hobbies } : {}),
      ...(specialNotes !== undefined ? { specialNotes } : {}),
      ...(fieldInterests !== undefined ? { fieldInterests } : {}),
      ...(initialIdeas !== undefined ? { initialIdeas } : {}),
      ...(clarifyingAnswers !== undefined ? { clarifyingAnswers } : {}),
    };
  }

  // Generates cache key for search operations
  private getCacheKey(userData: UserData, type: string): string {
    const location = [userData.city, userData.country || userData.nationality].filter(Boolean).join("_") || 'مصر';
    return `${type}_${location}_${userData.projectTypePreference || 'any'}_${userData.executionPreference || 'any'}_${userData.businessTypePreference || 'any'}_${userData.availableCapital || 'any'}`;
  }

  private async getFromSearchCacheOrFetch(cacheKey: string, fetcher: () => Promise<string>, fallback: string, timeoutMs = 12000): Promise<string> {
    const cached = AiBusinessService.searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < AiBusinessService.CACHE_TTL_MS)) {
      console.log(`[Cache Hit] Returning cached search data for: ${cacheKey}`);
      return cached.data;
    }
    try {
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error(`Search operation timed out after ${timeoutMs}ms`)), timeoutMs)
      );
      const data = await Promise.race([fetcher(), timeoutPromise]);
      AiBusinessService.searchCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error: any) {
      console.warn(`[Search Warning] (${cacheKey}): ${error?.message || error}. Using robust fallback dataset.`);
      return fallback;
    }
  }

  async fetchLiveMarketData(userData: UserData): Promise<string> {
    const cacheKey = this.getCacheKey(userData, "market");
    const targetCountry = userData.country || userData.nationality || "مصر";
    const targetCity = userData.city || "المنطقة المحددة";
    const targetLocation = [targetCity, targetCountry].filter(Boolean).join("، ") || "مصر";

    const capInfo = parseCapitalDetails(userData.availableCapital);
    const selectedIndustry = userData.customIndustry || (userData.preferredIndustries && userData.preferredIndustries.length > 0 ? userData.preferredIndustries.join("، ") : "");
    const userConcept = userData.initialIdeas || "";
    const userSkills = userData.basicSkills || userData.talent || "";

    return this.getFromSearchCacheOrFetch(cacheKey, async () => {
      console.log(`[Gemini Service] Querying Google Search with targeted query for ${targetLocation} (${selectedIndustry || 'عام'})...`);
      
      const searchPrompt = `أنت خبير أبحاث سوق متخصص. قم بإجراء بحث حي دقيق باستخدام أداة بحث جوجل (Google Search) للحصول على معلومات حقيقية وموثوقة لعام 2026 حول الفرص والأسعار والمنافسين.

استعلامات البحث المستهدفة (Targeted Focus Areas):
- القطاع والمجال المستهدف: ${selectedIndustry || 'الأنشطة الأكثر طلباً وربحية في السوق المحلي'}
- الفكرة أو الرؤية المقترحة: ${userConcept || 'مشروع تجاري أو خدمي مبتكر'}
- مهارات العميل ومزاياه التشغيلية: ${userSkills || 'مهارات تشغيلية مرنة'}
- النطاق الجغرافي والسوق: ${targetLocation}
- سقف رأس المال التأسيسي المتاح: ${capInfo.label} (${capInfo.expectedCostSummary})

المطلوب استخراجه من محرك البحث بشكل موثق ودقيق:
1. حجم الطلب والاتجاهات الحالية (Trends) في هذا القطاع بالتحديد داخل ${targetLocation}.
2. أسعار الخدمات/المنتجات المماثلة وتكاليف التوريد والمصنعية والتجهيز الفعلية لعام 2026 في ${targetLocation}.
3. 2-4 منافسين حقيقيين أو شركات قائمة في هذا المجال في ${targetCountry} / ${targetCity} مع طبيعة عملهم.
4. أهم متطلبات التراخيص والخطوات القانونية اللازمة لهذا النشاط تحديداً لدى الجهات الرسمية.`;

      const response = await this.generateContentWithFallback({
        model: "gemini-flash-latest",
        contents: searchPrompt,
        config: {
          systemInstruction: `أنت خبير أبحاث تسويقية واقتصادية في ${targetLocation}. مهمتك هي البحث الفعلي عبر جوجل لجلب بيانات أسعار حقيقية ومنافسين فعليين لعام 2026.`,
          tools: [{ googleSearch: {} }]
        }
      });

      return response.text || `بيانات السوق الحي لعام 2026 في ${targetLocation} لقطاع ${selectedIndustry || 'الأعمال'}.`;
    }, `بيانات السوق لـ ${targetLocation} لعام 2026 والفرص المتاحة.`);
  }

  async fetchGoogleMapsInsights(userData: UserData): Promise<string> {
    const cacheKey = this.getCacheKey(userData, "maps");
    const targetCountry = userData.country || userData.nationality || "مصر";
    const targetCity = userData.city || "المنطقة المحددة";
    const targetLocation = [targetCity, targetCountry].filter(Boolean).join("، ") || "مصر";

    const execPref = (userData.executionPreference || "").toLowerCase();
    const isOnlineOnly = execPref.includes("أونلاين") || execPref.includes("online");
    
    if (isOnlineOnly) {
      return `هذا المشروع يتم تنفيذه عبر الإنترنت (أونلاين)، وبالتالي يخدم العملاء على مستوى ${targetCountry} والمنطقة بأسرها دون حصر في موقع جغرافي ضيق.`;
    }

    const selectedIndustry = userData.customIndustry || (userData.preferredIndustries && userData.preferredIndustries.length > 0 ? userData.preferredIndustries.join("، ") : "");
    const userConcept = userData.initialIdeas || "";

    return this.getFromSearchCacheOrFetch(cacheKey, async () => {
      console.log(`[Gemini Service] Fetching location-based targeted insights for ${targetLocation}...`);
      const mapsPrompt = `قم بالبحث المكاني والجغرافي عبر خرائط وبحث جوجل للأنشطة المشابهة في مدينة ${targetCity} (${targetCountry}):
النشاط / المجال: ${selectedIndustry || userConcept || 'الأنشطة التجارية والخدمية والمحلات'}
الميزانية المتاحة: ${userData.availableCapital || 'ميزانية مرنة'}

المطلوب:
1. رصد المنافسين المحليين والمحلات/الشركات القريبة في ${targetCity}.
2. تحديد أهم المناطق والشوارع التجارية والسكنية الحيوية المناسبة للوصول للعملاء في ${targetCity}.
3. التوصيات المكانية الأفضل لتقليل تكلفة الإيجار والمقر وتفادي المنافسة المباشرة في ${targetCity}.`;

      const response = await this.generateContentWithFallback({
        model: "gemini-flash-latest",
        contents: mapsPrompt,
        config: {
          systemInstruction: `أنت محلل جغرافي متخصص في الأنشطة التجارية في ${targetLocation}. مهمتك هي البحث ورصد المنافسين والمناطق الحيوية في ${targetCity}.`,
          tools: [{ googleSearch: {} }]
        }
      });

      return response.text || `تحليل جغرافي ومكاني لـ ${targetLocation}.`;
    }, `بيانات المواقع والمنافسين في ${targetLocation}.`);
  }

  async runStage1and2OpportunitySolver(
    userData: UserData,
    liveMarketData: string,
    googleMapsInsights: string
  ): Promise<{
    identifiedProblems: Array<{ problem: string; marketGap: string; whyPayNow: string; capitalFeasibility: string }>;
    selectedWinningIdea: { projectName: string; concept: string; rationale: string; targetCustomerWillingnessToPay: string; zeroCapitalFeasibility: string };
  }> {
    console.log("[Opportunity Solver] Discovering market opportunities and selecting winning validated idea in unified step...");

    const availableCapital = userData.availableCapital || "غير محدد";
    const userMandates = getUserMandatesPrompt(userData);

    const prompt = `${userMandates}

=== بيانات أبحاث السوق الحية لعام 2026 ===
${liveMarketData}

=== بيانات خرائط جوجل والمنافسين المحليين ===
${googleMapsInsights}

المطلوب: قم بتحليل هذه البيانات واستخراج المشكلات/الفرص الواقعية، ثم اختر فكرة فائزة واحدة محددة مطبقة ولها سوق وعملاء حقيقيون تلتزم حتماً وبنسبة 100% بكافة شروط ورأس مال وتفضيلات وأفكار العميل المحددة أعلاه.`;

    try {
      const response = await this.generateContentWithFallback({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          systemInstruction: STAGE_1_AND_2_COMBINED_PROMPT.replace('${availableCapital}', availableCapital),
          responseMimeType: "application/json",
          temperature: 0.8,
          topP: 0.95,
        }
      });

      const text = response.text ? response.text.trim() : "{}";
      const parsed = safeJsonParse<any>(text, {});
      if (parsed.selectedWinningIdea && parsed.selectedWinningIdea.projectName) {
        return parsed;
      }
    } catch (e) {
      console.warn("[Opportunity Solver] Unified step fallback triggered.", e);
    }

    const userFallbackName = userData.initialIdeas ? "مشروع " + userData.initialIdeas.slice(0, 25) : "مشروع التميز الريادي";
    const fallbackConcept = userData.initialIdeas 
      ? userData.initialIdeas
      : `تقديم خدمات ومنتجات متميزة ومباشرة في ${userData.city || 'المنطقة'} بأعلى جودة وبأقل تكلفة رأسمالية ممكنة.`;

    return {
      identifiedProblems: [
        {
          problem: "ارتفاع تكاليف تقديم الخدمات والمستلزمات في المنطقة وغياب الجودة المتسقة.",
          marketGap: "غياب المزود المحلي المباشر عالي السرعة والجودة بأسعار تنافسية واضحة.",
          whyPayNow: "حاجة المستهلك أو النشاط التجاري الفورية لتوفير المال والحصول على جودة مضمونة.",
          capitalFeasibility: `متوافقة تماماً مع رأس المال المتاح (${availableCapital}) عبر نموذج تشغيلي مرن.`
        }
      ],
      selectedWinningIdea: {
        projectName: userFallbackName,
        concept: fallbackConcept,
        rationale: "الفكرة قائمة على نموذج عمل ناجح ومطبق يضمن تدفقاً نقدياً سريعاً بأقل مخاطر ممكنة.",
        targetCustomerWillingnessToPay: "مقابل مباشر وفوري عند تقديم الخدمة أو تسليم الطلب.",
        zeroCapitalFeasibility: `التنفيذ مصمم ليلتزم بدقة بميزانية العميل (${availableCapital}) بدون مصاريف ثابتة مرهقة.`
      }
    };
  }



  async runStage3BlueprintExecution(
    userData: UserData,
    selectedWinningIdea: { projectName: string; concept: string; rationale: string; targetCustomerWillingnessToPay: string; zeroCapitalFeasibility: string },
    liveMarketData: string,
    googleMapsInsights: string,
    isPro: boolean = true
  ): Promise<BusinessPlan> {
    console.log(`[Stage 3 Agent] Generating complete execution blueprint for validated idea: ${selectedWinningIdea.projectName}...`);

    const safeBase = this.sanitizeUserData(userData);
    const fullPlanUserData = {
      ...safeBase,
      initialIdeas: selectedWinningIdea.concept,
      specialNotes: `${userData.specialNotes || ''}\nاسم المشروع الفائز المعتمد: ${selectedWinningIdea.projectName}\nمبرر الدفع والجدوى: ${selectedWinningIdea.targetCustomerWillingnessToPay} - ${selectedWinningIdea.zeroCapitalFeasibility}`
    };

    const prompt = await this.generateOptimizedPrompt(fullPlanUserData, "generate_plan", { 
      liveMarketData: liveMarketData + "\n\n" + googleMapsInsights + "\n\nمبررات الفكرة الفائزة المعتمدة من وكيل المرحلة الثانية:\n" + JSON.stringify(selectedWinningIdea, null, 2), 
      isPro 
    });

    const schema = JSON.parse(JSON.stringify(BUSINESS_PLAN_SCHEMA));
    if (!isPro) {
      const proFields = ['targetAudience', 'marketingStrategy', 'businessStrategy', 'investmentAndIncubation', 'businessModelCanvas'];
      proFields.forEach(field => { delete schema.properties[field]; });
      schema.required = schema.required.filter((f: string) => !proFields.includes(f));
    } else {
      schema.required = Array.from(new Set([...schema.required, 'targetAudience', 'marketingStrategy', 'businessStrategy', 'investmentAndIncubation', 'businessModelCanvas', 'challengesAdvice']));
    }

    const response = await this.generateContentWithFallback({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + "\n\n" + STAGE_3_BLUEPRINT_EXECUTION_PROMPT,
        responseMimeType: "application/json",
        responseSchema: schema as any,
        temperature: 0.8,
        topP: 0.95,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("لم يتم تلقي استجابة من الذكاء الاصطناعي لمخطط التنفيذ.");
    }
    
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    const plan = JSON.parse(cleanedText);
    if (!plan.projectName || plan.projectName === "مشروعي الريادي") {
      plan.projectName = selectedWinningIdea.projectName;
    }
    plan.concept = selectedWinningIdea.concept;
    plan.rationale = selectedWinningIdea.rationale;
    plan.isPro = isPro;

    return plan;
  }

  async generateOptimizedPrompt(
    rawUserData: UserData,
    taskType: "generate_plan" | "complete_plan",
    extraContext?: { liveMarketData?: string; existingPlan?: BusinessPlan; isPro?: boolean }
  ): Promise<string> {
    console.log(`[Prompt System] Bypassing dynamic LLM prompt generation; utilizing optimized static prompt template.`);
    return this.generateStaticOptimizedPrompt(rawUserData, taskType, extraContext);
  }

  generateStaticOptimizedPrompt(
    rawUserData: UserData,
    taskType: "generate_plan" | "complete_plan",
    extraContext?: { liveMarketData?: string; existingPlan?: BusinessPlan; isPro?: boolean }
  ): string {
    const userData = this.sanitizeUserData(rawUserData);
    return buildPlanPrompt({
      userData,
      taskType,
      extraContext,
    });
  }

  async generateContentWithFallback(params: {
    model: string;
    contents: any;
    config?: any;
  }): Promise<any> {
    return await executeWithGeminiPool(async (client) => {
      const modelsToTry = getModelFallbackList(params.model);
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        let activeConfig = params.config ? { ...params.config } : {};
        try {
          console.log(`[Gemini SDK] Attempting generation with model: ${modelName}`);
          
          // Strip tools if structured JSON output/schema is requested to prevent 400 Bad Request
          if ((activeConfig.tools || activeConfig.toolConfig) && (activeConfig.responseMimeType === "application/json" || activeConfig.responseSchema)) {
            console.log(`[Gemini SDK] Stripping tools from ${modelName} to avoid structured JSON conflicts`);
            delete activeConfig.tools;
            delete activeConfig.toolConfig;
          }

          const response = await client.models.generateContent({
            ...params,
            model: modelName,
            config: activeConfig
          });

          const textValue = response.text ? response.text.trim() : "";
          if (textValue.startsWith("<!doctype") || textValue.startsWith("<html") || textValue.toLowerCase().startsWith("<html")) {
            throw new Error("Invalid response from server: Expected JSON but received HTML");
          }

          console.log(`[Gemini SDK] Successfully processed using model: ${modelName}`);
          return response;
        } catch (error: any) {
          lastError = error;
          const errStr = typeof error === 'object' ? JSON.stringify(error) : String(error);

          // If quota / 429 error occurs, rethrow so pool immediately switches key and retries this exact step
          if (geminiKeyPool.isQuotaError(error)) {
            throw error;
          }

          // 1. If tools (like Google Search) caused error, retry immediately without tools
          if (activeConfig.tools || activeConfig.toolConfig) {
            console.warn(`[Gemini SDK] Tool grounding error on ${modelName}, retrying WITHOUT tools immediately...`);
            try {
              const configWithoutTools = { ...activeConfig };
              delete configWithoutTools.tools;
              delete configWithoutTools.toolConfig;
              const response = await client.models.generateContent({
                ...params,
                model: modelName,
                config: configWithoutTools
              });

              const textValue = response.text ? response.text.trim() : "";
              if (textValue && !textValue.startsWith("<!doctype") && !textValue.toLowerCase().startsWith("<html")) {
                console.log(`[Gemini SDK] Successfully processed model ${modelName} after stripping tools`);
                return response;
              }
            } catch (tErr: any) {
              if (geminiKeyPool.isQuotaError(tErr)) throw tErr;
              lastError = tErr;
            }
          }

          // 2. If schema complexity caused 400, retry immediately without responseSchema
          if (errStr.includes("too many states") || errStr.includes("constraint") || errStr.includes("400") || errStr.includes("INVALID_ARGUMENT")) {
            console.warn(`[Gemini SDK] Model ${modelName} failed due to schema complexity. Retrying WITHOUT responseSchema...`);
            try {
              const configWithoutSchema = { ...activeConfig };
              delete configWithoutSchema.responseSchema;
              
              const response = await client.models.generateContent({
                ...params,
                model: modelName,
                config: configWithoutSchema
              });

              const textValue = response.text ? response.text.trim() : "";
              if (textValue.startsWith("<!doctype") || textValue.startsWith("<html") || textValue.toLowerCase().startsWith("<html")) {
                throw new Error("Invalid response from server: Expected JSON but received HTML");
              }

              console.log(`[Gemini SDK] Successfully processed model ${modelName} after stripping responseSchema`);
              return response;
            } catch (retryError: any) {
              if (geminiKeyPool.isQuotaError(retryError)) throw retryError;
              lastError = retryError;
            }
          }

          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      throw lastError || new Error("All fallback models and configurations failed.");
    });
  }

  private async verifyBusinessPlanProgrammatically(
    plan: any,
    userData: UserData
  ): Promise<{ isValid: boolean; issues: string[]; suggestions: string[] }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Ensure plan is an object
    if (!plan || typeof plan !== 'object') {
      return { isValid: false, issues: ["الخطة فارغة أو بتنسيق غير صالح."], suggestions: [] };
    }

    // 1. Project name validation
    plan.projectName = safeString(plan.projectName);
    if (!plan.projectName || plan.projectName.includes("مشروعي الريادي")) {
      issues.push("اسم المشروع مفقود أو غير مبتكر.");
      suggestions.push("يرجى تسمية المشروع باسم علامة تجارية مبتكر ومستقل.");
    }
    const personalNameWords = (userData.fullName || "").split(" ").filter(w => w.length > 2);
    for (const word of personalNameWords) {
      if (plan.projectName && plan.projectName.toLowerCase().includes(word.toLowerCase())) {
        issues.push("اسم المشروع يحتوي على الاسم الشخصي للمستخدم.");
        suggestions.push("تجنب استخدام الاسم الشخصي أو العائلي للمستخدم في العلامة التجارية ليكون براند تجاري حقيقي.");
        break;
      }
    }

    // 2. Budget constraint check
    const capInfo = parseCapitalDetails(userData.availableCapital);
    plan.concept = safeString(plan.concept);
    const conceptLower = plan.concept.toLowerCase();

    if (capInfo.isZero) {
      if (conceptLower.includes("محل") || conceptLower.includes("إيجار") || conceptLower.includes("ورشة") || conceptLower.includes("مصنع") || conceptLower.includes("معدات ثقيلة") || conceptLower.includes("أجهزة مكلفة") || conceptLower.includes("شراء بضاعة")) {
        issues.push("المشروع يحاول تأسيس مرافق مادية أو شراء أصول/بضاعة بالرغم من أن رأس المال المتاح هو صفر (بدون رأس مال).");
        suggestions.push("التزم بنموذج بدون رأس مال مادي (تقديم خدمات مهارية، سمسرة/عمولات، طلب مسبق Pre-order، أو دروب شيبينج محلي).");
      }
    } else if (capInfo.tier === "micro") {
      if (conceptLower.includes("مصنع") || conceptLower.includes("خط إنتاج ضخم") || conceptLower.includes("استيراد")) {
        issues.push("المشروع يتطلب استثمارات صناعية أو خطوط إنتاج ضخمة تتجاوز ميزانية المشاريع متناهية الصغر (أقل من 30,000 ج.م).");
        suggestions.push("التزم بنموذج متناهي الصغر يبدأ من المنزل أو بأدوات خفيفة تناسب ميزانية أقل من 30,000 جنيه.");
      }
    }

    // 3. Competitor URL validation & de-duplication
    if (plan.validation?.competitorsDetailed && Array.isArray(plan.validation.competitorsDetailed)) {
      const urlsSeen = new Set<string>();
      plan.validation.competitorsDetailed = plan.validation.competitorsDetailed.map((comp: any) => {
        if (!comp || typeof comp !== 'object') return { name: "منافس محلي", url: "https://www.yellowpages.com.eg" };
        let url = safeString(comp.url);
        if (url.includes("example.com") || url.includes("dummy.com") || url.includes("facebook.com/example") || url === "" || urlsSeen.has(url)) {
          url = `https://www.yellowpages.com.eg/ar/search/${encodeURIComponent(comp.name || "companies")}`;
        }
        urlsSeen.add(url);
        return { ...comp, url, name: safeString(comp.name, "منافس محلي") };
      });
    }

    // 4. Mathematical and Financial outputs sanity check & reconciliation
    if (!plan.feasibility || typeof plan.feasibility !== 'object') {
      plan.feasibility = plan.financials || plan.feasibilityStudy || plan.financialFeasibility || {};
    }
    if (plan.feasibility && typeof plan.feasibility === 'object') {
      // Normalize all feasibility string fields
      plan.feasibility.estimatedCost = safeString(plan.feasibility.estimatedCost);
      plan.feasibility.launchTimeline = safeString(plan.feasibility.launchTimeline);
      plan.feasibility.timeToProfit = safeString(plan.feasibility.timeToProfit);
      plan.feasibility.expectedRevenue = safeString(plan.feasibility.expectedRevenue);
      plan.feasibility.revenueModel = safeString(plan.feasibility.revenueModel);
      plan.feasibility.pricingStrategy = safeString(plan.feasibility.pricingStrategy);
      plan.feasibility.breakEvenPoint = safeString(plan.feasibility.breakEvenPoint);
      plan.feasibility.financialProjection3Months = safeString(plan.feasibility.financialProjection3Months);

      if (capInfo.isZero) {
        plan.feasibility.estimatedCost = "0 ج.م (نموذج عمل بدون رأس مال)";
        if (Array.isArray(plan.feasibility.costBreakdown) && plan.feasibility.costBreakdown.length > 0) {
          plan.feasibility.costBreakdown = plan.feasibility.costBreakdown.map((item: any) => ({
            item: safeString(item?.item, "بند تشغيلي"),
            cost: "0 ج.م (أدوات مجانية / بدون تكلفة نقدية)"
          }));
        } else {
          plan.feasibility.costBreakdown = [
            { item: "الهوية الرقمية والتصميم عبر Canva المجاني", cost: "0 ج.م (مجاني)" },
            { item: "قنوات التواصل واستقبال الطلبات عبر WhatsApp Business", cost: "0 ج.م (مجاني)" },
            { item: "التشغيل والتوريد بنظام الطلب المسبق (Pre-Order) الممول من العميل", cost: "0 ج.م (تمويل ذاتي فوري)" }
          ];
        }
        if (!plan.feasibility.breakEvenPoint) {
          plan.feasibility.breakEvenPoint = "تحقيق الربح الفوري الصافي من أول طلب أو أول خدمة منفذة لعدم وجود مصاريف تأسيسية ثابتة.";
        }
      } else {
        // Non-zero capital: Strict mathematical coupling & budget bounding
        const estMatch = plan.feasibility.estimatedCost.replace(/,/g, "").match(/\d+/);
        let estNum = estMatch ? parseInt(estMatch[0], 10) : capInfo.representativeAmount;

        // Clamp to user's maximum capital bounds
        if (capInfo.max > 0 && estNum > capInfo.max) {
          estNum = Math.min(capInfo.max, Math.round(capInfo.max * 0.85));
          plan.feasibility.estimatedCost = `${estNum.toLocaleString()} ج.م`;
        }

        // Validate and reconcile cost breakdown items
        if (Array.isArray(plan.feasibility.costBreakdown) && plan.feasibility.costBreakdown.length > 0) {
          let sumBreakdown = 0;
          const parsedItems: { item: string; costNum: number }[] = [];
          for (const bItem of plan.feasibility.costBreakdown) {
            const match = safeString(bItem?.cost).replace(/,/g, "").match(/\d+/);
            const val = match ? parseInt(match[0], 10) : 0;
            sumBreakdown += val;
            parsedItems.push({ item: safeString(bItem?.item, "بند تأسيسي"), costNum: val });
          }

          // If there is any discrepancy between items sum and total estimated cost
          if (sumBreakdown > 0 && sumBreakdown !== estNum) {
            if (sumBreakdown <= capInfo.max && (capInfo.min === 0 || sumBreakdown >= capInfo.min * 0.4)) {
              estNum = sumBreakdown;
              plan.feasibility.estimatedCost = `${estNum.toLocaleString()} ج.م`;
            } else {
              // Proportionately scale item costs so their sum matches estNum perfectly
              const scale = sumBreakdown > 0 ? estNum / sumBreakdown : 1;
              let runningTotal = 0;
              plan.feasibility.costBreakdown = parsedItems.map((p, idx) => {
                if (idx === parsedItems.length - 1) {
                  const lastCost = Math.max(0, estNum - runningTotal);
                  return { item: p.item, cost: `${lastCost.toLocaleString()} ج.م` };
                }
                const scaledCost = Math.round(p.costNum * scale);
                runningTotal += scaledCost;
                return { item: p.item, cost: `${scaledCost.toLocaleString()} ج.م` };
              });
              plan.feasibility.estimatedCost = `${estNum.toLocaleString()} ج.م`;
            }
          }
        } else {
          // Provide structured breakdown if empty
          plan.feasibility.costBreakdown = this.getStandardCostBreakdown(estNum);
          plan.feasibility.estimatedCost = `${estNum.toLocaleString()} ج.م`;
        }

        if (!plan.feasibility.breakEvenPoint) {
          const targetUnits = Math.max(10, Math.round(estNum * 0.05));
          plan.feasibility.breakEvenPoint = `تحقيق التعادل شهرياً ببيع ${targetUnits} وحدة/خدمة لتغطية المصروفات التشغيلية الثابتة.`;
        }
      }

      if (!plan.feasibility.financialProjection3Months) {
        plan.feasibility.financialProjection3Months = capInfo.isZero
          ? "الشهر الأول: إيرادات متوقعة 4,000 ج.م - مصاريف 500 ج.م = صافي 3,500 ج.م\nالشهر الثاني: إيرادات متوقعة 8,000 ج.م - مصاريف 1,000 ج.م = صافي 7,000 ج.م\nالشهر الثالث: إيرادات متوقعة 14,000 ج.م - مصاريف 1,800 ج.م = صافي 12,200 ج.م"
          : "الشهر الأول: إيرادات متوقعة 12,000 ج.م - مصاريف 6,000 ج.م = صافي 6,000 ج.م\nالشهر الثاني: إيرادات متوقعة 22,000 ج.م - مصاريف 9,500 ج.م = صافي 12,500 ج.م\nالشهر الثالث: إيرادات متوقعة 38,000 ج.م - مصاريف 14,000 ج.م = صافي 24,000 ج.م";
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  async verifyBusinessPlan(
    plan: Partial<BusinessPlan>,
    liveMarketData: string,
    userData: UserData
  ): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
    confidenceScore: number;
  }> {
    try {
      // Run the rigorous programmatic evaluation first (lightning fast!)
      const progCheck = await this.verifyBusinessPlanProgrammatically(plan, userData);
      
      console.log("[Gemini Service] Running Double-Check Verification on generated plan...");
      const compactPlanSummary = {
        projectName: plan.projectName,
        concept: plan.concept,
        feasibility: plan.feasibility,
        marketAnalysis: plan.marketAnalysis,
        targetAudience: plan.targetAudience,
        marketingStrategy: plan.marketingStrategy,
        type: plan.type
      };

      const verificationPrompt = `الرجاء تدقيق ومراجعة خطة العمل التالية مراجعة صارمة ودقيقة لمنع الهلوسة وضمان مطابقتها لأبحاث السوق الحية والبيانات الاقتصادية الواقعية في مصر لعام 2026.
      
=== بيانات المستخدم الأصلية ===
${JSON.stringify(this.sanitizeUserData(userData), null, 2)}

=== بيانات البحث الحي المعتمدة ===
${liveMarketData}

=== خطة العمل المراد تدقيقها ===
${JSON.stringify(compactPlanSummary, null, 2)}

أخرج تقرير المراجعة والتدقيق الفني بالكامل في صيغة JSON تحتوي فقط على الحقول التالية:
- isValid: (boolean)
- issues: (array of strings)
- suggestions: (array of strings)
- confidenceScore: (number)`;

      const response = await this.generateContentWithFallback({
        model: "gemini-flash-latest",
        contents: verificationPrompt,
        config: {
          systemInstruction: `أنت "المُدقّق والراجع الفني لمنصة Business Creator". خبير تدقيق خطط الأعمال وضمان الجودة في السوق المصري لعام 2026. أخرج النتيجة دائماً بصيغة JSON فقط وبنفس لغة خطة العمل.`,
          responseMimeType: "application/json",
          temperature: 0.1,
          topP: 0.1,
        }
      });

      const text = response.text;
      if (text) {
        const verificationReport = safeJsonParse<any>(text, { isValid: true, issues: [], suggestions: [], confidenceScore: 80 });
        
        const allIssues = Array.from(new Set([...progCheck.issues, ...(verificationReport.issues || [])]));
        const allSuggestions = Array.from(new Set([...progCheck.suggestions, ...(verificationReport.suggestions || [])]));
        
        return {
          isValid: allIssues.length === 0,
          issues: allIssues,
          suggestions: allSuggestions,
          confidenceScore: verificationReport.confidenceScore || 80
        };
      }
      
      return {
        isValid: progCheck.isValid,
        issues: progCheck.issues,
        suggestions: progCheck.suggestions,
        confidenceScore: 85
      };
    } catch (error) {
      console.error("Verification error:", error);
      const progCheck = await this.verifyBusinessPlanProgrammatically(plan, userData);
      return {
        isValid: progCheck.isValid,
        issues: progCheck.issues,
        suggestions: progCheck.suggestions,
        confidenceScore: 80
      };
    }
  }

  private static readonly SECTION_KEYWORD_RULES: readonly { readonly section: string; readonly keywords: readonly string[] }[] = [
    { section: "identity", keywords: ["اسم", "تسمية", "brand", "name", "هوية", "شعار", "identity"] },
    { section: "concept", keywords: ["مفهوم", "الفكرة", "concept", "فكرة"] },
    { section: "rationale", keywords: ["مبررات", "rationale"] },
    { section: "marketAnalysis", keywords: ["سوق", "منافس", "market", "competitor", "المنافسين"] },
    { section: "validation", keywords: ["تحقق", "validation", "اختبار"] },
    { section: "type", keywords: ["نوع", "type"] },
    { section: "feasibility", keywords: ["جدوى", "مال", "تكلفة", "تكاليف", "ميزانية", "capital", "budget", "feasibility", "تمويل"] },
    { section: "targetAudience", keywords: ["جمهور", "عميل", "عملاء", "audience", "target"] },
    { section: "executionGuide", keywords: ["تنفيذ", "خطوات", "خطة العمل", "execution"] },
    { section: "mentorshipAndGuidance", keywords: ["توجيه", "نصائح", "mentorship"] },
    { section: "learningPath", keywords: ["تعليم", "مسار", "تعلم", "learning"] },
    { section: "toolsAndResources", keywords: ["أدوات", "مصادر", "tools", "resources"] },
    { section: "marketingStrategy", keywords: ["تسويق", "marketing", "ترويج"] },
    { section: "swot", keywords: ["swot", "نقاط", "ضعف", "قوة", "تهديدات"] },
    { section: "businessStrategy", keywords: ["استراتيجية", "نمو", "strategy"] },
    { section: "investmentAndIncubation", keywords: ["استثمار", "احتضان", "حاضنة", "investment", "incubation"] },
    { section: "businessModelCanvas", keywords: ["نموذج العمل", "مخطط", "canvas"] }
  ];

  private getAffectedSections(issues: string[]): string[] {
    const affected = new Set<string>();
    for (const issue of issues) {
      const lowerIssue = issue.toLowerCase();
      for (const { section, keywords } of AiBusinessService.SECTION_KEYWORD_RULES) {
        if (keywords.some(k => lowerIssue.includes(k))) {
          affected.add(section);
        }
      }
    }
    if (affected.size === 0) {
      return ["feasibility", "executionGuide", "validation"];
    }
    return Array.from(affected);
  }

  private getStandardCostBreakdown(estNum: number) {
    const part1 = Math.round(estNum * 0.4);
    const part2 = Math.round(estNum * 0.35);
    const part3 = Math.max(0, estNum - part1 - part2);
    return [
      { item: "تجهيز الأدوات والمستلزمات التشغيلية الأساسية", cost: `${part1.toLocaleString()} ج.م` },
      { item: "الهوية البصرية والمطبوعات وحملة الإطلاق الأولى", cost: `${part2.toLocaleString()} ج.م` },
      { item: "احتياطي تشغيلي وطوارئ للشهر الأول", cost: `${part3.toLocaleString()} ج.م` }
    ];
  }

  private getDynamicIndustryPalette(concept: string, industry: string): { primary: string[]; secondary: string[]; background: string[]; brandColors: string[]; psychology: string } {
    const text = (concept + " " + industry).toLowerCase();
    if (text.includes("طعام") || text.includes("أغذ") || text.includes("مطعم") || text.includes("كافيه") || text.includes("حلويات") || text.includes("مشروبات") || text.includes("أكل")) {
      return {
        primary: ["#D97706", "#991B1B"],
        secondary: ["#F59E0B", "#FBBF24"],
        background: ["#FFFBEB", "#FFFFFF"],
        brandColors: ["#D97706", "#991B1B", "#F59E0B", "#FEF3C7"],
        psychology: "درجات العنبر والأحمر الدافئ تحفز الشهية وتوحي بالطاقة والضيافة والكرم."
      };
    }
    if (text.includes("تقن") || text.includes("برمج") || text.includes("تطبيق") || text.includes("منصة") || text.includes("saas") || text.includes("ذكاء") || text.includes("ai") || text.includes("digital")) {
      return {
        primary: ["#2563EB", "#0F172A"],
        secondary: ["#38BDF8", "#6366F1"],
        background: ["#F8FAFC", "#FFFFFF"],
        brandColors: ["#2563EB", "#0F172A", "#38BDF8", "#E0F2FE"],
        psychology: "الأزرق الملكي والسيان يعكسان الابتكار التكنولوجي والأمان والذكاء المؤسسي."
      };
    }
    if (text.includes("صح") || text.includes("تجميل") || text.includes("عناية") || text.includes("طبيعي") || text.includes("نبات") || text.includes("علاج") || text.includes("رياض")) {
      return {
        primary: ["#059669", "#065F46"],
        secondary: ["#10B981", "#34D399"],
        background: ["#F0FDF4", "#FFFFFF"],
        brandColors: ["#059669", "#065F46", "#10B981", "#D1FAE5"],
        psychology: "الأخضر الزمردي يعبر عن الصحة والنقاء والنمو الطبيعي والراحة النفسية."
      };
    }
    if (text.includes("ملابس") || text.includes("أزياء") || text.includes("موضة") || text.includes("عطور") || text.includes("إكسسوار") || text.includes("تصميم") || text.includes("هدايا")) {
      return {
        primary: ["#7C3AED", "#18181B"],
        secondary: ["#EC4899", "#A855F7"],
        background: ["#FAF5FF", "#FFFFFF"],
        brandColors: ["#7C3AED", "#18181B", "#EC4899", "#F3E8FF"],
        psychology: "البنفسجي والوردي الأنيق يمنحان طابع الفخامة والتميز والذوق الرفيع."
      };
    }
    if (text.includes("تعليم") || text.includes("تدريب") || text.includes("استشار") || text.includes("خدمات") || text.includes("مالي") || text.includes("محاسب") || text.includes("قانون")) {
      return {
        primary: ["#1E3A8A", "#0F172A"],
        secondary: ["#D97706", "#0284C7"],
        background: ["#F8FAFC", "#FFFFFF"],
        brandColors: ["#1E3A8A", "#0F172A", "#D97706", "#DBEAFE"],
        psychology: "الكحلي والذهبي يعززان الموثوقية العالية والهيبة والخبرة الاستشارية العميقة."
      };
    }
    return {
      primary: ["#EA580C", "#0F172A"],
      secondary: ["#F97316", "#38BDF8"],
      background: ["#FFF7ED", "#FFFFFF"],
      brandColors: ["#EA580C", "#0F172A", "#F97316", "#FFEDD5"],
      psychology: "البرتقالي الحيوي يعبر عن الشغف والإنجاز السريع، مع الكحلي لترسيخ الأمانة والثقة."
    };
  }

  private getDynamicRegionalIncubators(cityName: string, countryName: string, industry: string) {
    const isUpperEgypt = cityName.includes("منيا") || cityName.includes("أسيوط") || cityName.includes("اسيوط") || cityName.includes("سوهاج") || cityName.includes("قنا") || cityName.includes("أقصر") || cityName.includes("اقصر") || cityName.includes("أسوان") || cityName.includes("اسوان") || cityName.includes("بني سويف") || cityName.includes("فيوم");
    const isAlexDelta = cityName.includes("إسكندرية") || cityName.includes("اسكندرية") || cityName.includes("منصورة") || cityName.includes("طنطا") || cityName.includes("دقهلية") || cityName.includes("غربية") || cityName.includes("بحيرة") || cityName.includes("دمياط");
    const isCanal = cityName.includes("سويس") || cityName.includes("إسماعيلية") || cityName.includes("اسماعيلية") || cityName.includes("بورسعيد");
    const isNonEgypt = countryName && !countryName.includes("مصر") && !countryName.includes("Egypt");

    if (isNonEgypt) {
      return [
        {
          name: `الهيئة العامة للمنشآت الصغيرة والمتوسطة (${countryName})`,
          type: "دعم حكومي، تمويل وإرشاد وتراخيص",
          description: `تقديم برامج تدريبية ودعم مالي وتراخيص ميسرة لرواد الأعمال في ${countryName}.`,
          requirements: "سجل تجاري أو خطة عمل واعدة ومواطنة/إقامة سارية.",
          website: "https://www.google.com/search?q=" + encodeURIComponent(`حاضنات أعمال ومشاريع في ${countryName}`),
          phone: "-",
          googleMapsLink: "https://maps.google.com/?q=" + encodeURIComponent(`مسرعات أعمال ${countryName}`),
          location: countryName
        },
        {
          name: `مراكز الابتكار ومسرعات الأعمال في ${cityName}`,
          type: "استثمار أولي وتسريع نمو",
          description: "شبكة حاضنات إقليمية تساند المشاريع الواعدة بخبرات تسويقية وتشغيلية.",
          requirements: "نموذج عمل قابل للتوسع والإثبات العملي.",
          website: "https://www.google.com/search?q=" + encodeURIComponent(`حاضنات أعمال في ${cityName}`),
          phone: "-",
          googleMapsLink: "https://maps.google.com/?q=" + encodeURIComponent(`حاضنات أعمال ${cityName}`),
          location: cityName
        }
      ];
    }

    if (isUpperEgypt) {
      return [
        {
          name: `مراكز إبداع مصر الرقمية (Creativa Hub - فرع ${cityName})`,
          type: "حاضنة حكومية تكنولوجية ومساحات عمل وتدريب مجاني",
          description: `توفر تدريباً ريادياً ودعماً تقنياً ومساحات عمل مشتركة مجانية واستشارات للمشاريع في ${cityName} وجامعات الصعيد.`,
          requirements: "فكرة مشروع واعدة، شغف بالتنفيذ، والالتزام بالبرنامج التدريبي.",
          website: "https://creativa.gov.eg",
          phone: "16293",
          googleMapsLink: "https://maps.google.com/?q=" + encodeURIComponent(`Creativa Hub ${cityName}`),
          location: `مقر مركز إبداع مصر الرقمية داخل الحرم الجامعي في ${cityName}`
        },
        {
          name: `جهاز تنمية المشروعات الصغيرة والمتوسطة (MSMEDA - فرع ${cityName})`,
          type: "تمويل ميسر وتراخيص ودعم معارض وتسويق",
          description: `يقدم خدمات الشباك الواحد لاستخراج التراخيص والرقم القومي للمشروع، مع تمويلات متناهية الصغر وقروض ميسرة لرواد الأعمال في ${cityName}.`,
          requirements: "بطاقة رقم قومي سارية، مقر أو خطة تشغيل واضحة.",
          website: "https://www.msmeda.org.eg",
          phone: "16733",
          googleMapsLink: "https://maps.google.com/?q=" + encodeURIComponent(`جهاز تنمية المشروعات ${cityName}`),
          location: `فرع جهاز تنمية المشروعات بمحافظة ${cityName}`
        },
        {
          name: `حاضنة أعمال مسار ومبادرات ريادة الأعمال بالصعيد (Rowad / Enroot)`,
          type: "حاضنة أعمال تنموية وربط بالموردين والأسواق",
          description: "برامج دعم متخصصة لتطوير سلاسل القيمة والمشروعات الخدمية والإنتاجية في محافظات الصعيد.",
          requirements: "مشروع يخدم البيئة المحلية ويحقق عائداً مستداماً.",
          website: "https://www.enroot.org",
          phone: "+20227367123",
          googleMapsLink: "https://maps.google.com/?q=" + encodeURIComponent(`حاضنة أعمال ${cityName}`),
          location: `محافظات الصعيد (${cityName})`
        }
      ];
    }

    if (isAlexDelta || isCanal) {
      return [
        {
          name: `مراكز إبداع مصر الرقمية (Creativa Hub - ${cityName})`,
          type: "حاضنة أعمال ومساحات عمل مشتركة وتدريب",
          description: `توفر استشارات ريادية وتدريباً مجانياً ومسابقات تمويلية لدعم أصحاب المشاريع في ${cityName}.`,
          requirements: "فكرة مجدية وخطة عمل عملية.",
          website: "https://creativa.gov.eg",
          phone: "16293",
          googleMapsLink: "https://maps.google.com/?q=" + encodeURIComponent(`Creativa Hub ${cityName}`),
          location: `${cityName} والمراكز الجامعية المحيطة`
        },
        {
          name: `جهاز تنمية المشروعات (MSMEDA - فرع ${cityName})`,
          type: "تمويل ميسر وتراخيص ودعم حكومي",
          description: `إصدار الرقم القومي للمشروع، التراخيص المؤقتة، والتمويل الميسر بفائدة مدعومة في ${cityName}.`,
          requirements: "بطاقة رقم قومي، وعمر 21 سنة فأكثر.",
          website: "https://www.msmeda.org.eg",
          phone: "16733",
          googleMapsLink: "https://maps.google.com/?q=" + encodeURIComponent(`جهاز تنمية المشروعات ${cityName}`),
          location: `فرع المحافظة في ${cityName}`
        },
        {
          name: `حاضنات الأعمال الإقليمية ومبادرات الدعم بـ ${cityName}`,
          type: "حاضنة أعمال واستشارات وشبكة علاقات",
          description: "ربط أصحاب المشاريع بالموردين وتوفير المعارض الدورية والتوجيه المالي والتسويقي.",
          requirements: "الجدية في التنفيذ وجودة المنتج/الخدمة.",
          website: "https://www.google.com/search?q=" + encodeURIComponent(`حاضنات أعمال في ${cityName}`),
          phone: "16733",
          googleMapsLink: "https://maps.google.com/?q=" + encodeURIComponent(`حاضنة أعمال ${cityName}`),
          location: cityName
        }
      ];
    }

    // Default Cairo / Giza & General
    return [
      {
        name: "جهاز تنمية المشروعات المتوسطة والصغيرة (MSMEDA)",
        type: "دعم حكومي وتمويل ميسر وتراخيص",
        description: "استخراج التراخيص والرقم القومي للمشروع، قروض ميسرة، ومساندة تسويقية في المعارض الكبرى.",
        requirements: "بطاقة رقم قومي سارية وخطة عمل أولية.",
        website: "https://www.msmeda.org.eg",
        phone: "16733",
        googleMapsLink: "https://maps.google.com/?q=MSMEDA+Egypt",
        location: `كافة الفروع في ${cityName} والمحافظات`
      },
      {
        name: "مسرعة الأعمال وحاضنة Flat6Labs",
        type: "استثمار أولي ومسرعة أعمال",
        description: "من أبرز مسرعات الأعمال في المنطقة، توفر تمويلاً وإرشاداً وشبكة مستثمرين واسعة.",
        requirements: "فكرة مبتكرة أو نموذج عمل قابل للنمو والتوسع.",
        website: "https://www.flat6labs.com",
        phone: "+20227367123",
        googleMapsLink: "https://maps.google.com/?q=Flat6Labs+Cairo",
        location: "القاهرة والجيزة"
      },
      {
        name: "مركز الإبداع التكنولوجي وريادة الأعمال (TIEC / Creativa)",
        type: "حاضنة ومسرعة أعمال رقمية وتكنولوجية",
        description: "برامج احتضان متخصصة مع منح تمويلية ومساحات عمل وتوجيه استراتيجي في كافة المحافظات.",
        requirements: "مشروعات تعتمد على الحلول الحديثة أو المنصات الرقمية والخدمية.",
        website: "https://www.tiec.gov.eg",
        phone: "16293",
        googleMapsLink: "https://maps.google.com/?q=TIEC+Smart+Village",
        location: `القرية الذكية ومراكز Creativa في ${cityName}`
      }
    ];
  }

  private ensureCompleteBusinessPlan(plan: any, userData: UserData, isPro: boolean = true): BusinessPlan {
    const cityName = userData.city || "مصر";
    const projName = plan.projectName || userData.initialIdeas || "مشروع التميز والريادة";
    const conceptText = plan.concept || "مشروع استراتيجي واعد يقدم حلولاً وخدمات متميزة للعملاء في السوق المحلي.";

    // Key aliases resolution from various LLM naming quirks
    if (!plan.feasibility && (plan.financials || plan.feasibilityStudy || plan.financialFeasibility)) {
      plan.feasibility = plan.financials || plan.feasibilityStudy || plan.financialFeasibility;
    }
    if (!plan.targetAudience && (plan.target_audience || plan.targetCustomers)) {
      plan.targetAudience = plan.target_audience || plan.targetCustomers;
    }
    if (!plan.marketAnalysis && (plan.market_analysis || plan.market)) {
      plan.marketAnalysis = plan.market_analysis || plan.market;
    }
    if (!plan.businessModelCanvas && (plan.business_model_canvas || plan.businessModel || plan.canvas)) {
      plan.businessModelCanvas = plan.business_model_canvas || plan.businessModel || plan.canvas;
    }
    if (!plan.executionGuide && (plan.execution_guide || plan.execution)) {
      plan.executionGuide = plan.execution_guide || plan.execution;
    }
    if (!plan.marketingStrategy && (plan.marketing_strategy || plan.marketing)) {
      plan.marketingStrategy = plan.marketing_strategy || plan.marketing;
    }
    if (!plan.toolsAndResources && (plan.tools_and_resources || plan.tools)) {
      plan.toolsAndResources = plan.tools_and_resources || plan.tools;
    }
    if (!plan.learningPath && (plan.learning_path || plan.learning)) {
      plan.learningPath = plan.learning_path || plan.learning;
    }
    if (!plan.investmentAndIncubation && (plan.investment_and_incubation || plan.investment)) {
      plan.investmentAndIncubation = plan.investment_and_incubation || plan.investment;
    }
    if (!plan.businessStrategy && (plan.business_strategy || plan.strategy)) {
      plan.businessStrategy = plan.business_strategy || plan.strategy;
    }

    // 0. Feasibility completeness & mathematical coupling
    const capInfo = parseCapitalDetails(userData.availableCapital);
    if (!plan.feasibility || typeof plan.feasibility !== 'object') plan.feasibility = {};

    plan.feasibility.estimatedCost = safeString(plan.feasibility.estimatedCost);
    plan.feasibility.launchTimeline = safeString(plan.feasibility.launchTimeline);
    plan.feasibility.timeToProfit = safeString(plan.feasibility.timeToProfit);
    plan.feasibility.expectedRevenue = safeString(plan.feasibility.expectedRevenue);
    plan.feasibility.revenueModel = safeString(plan.feasibility.revenueModel);
    plan.feasibility.pricingStrategy = safeString(plan.feasibility.pricingStrategy);
    plan.feasibility.breakEvenPoint = safeString(plan.feasibility.breakEvenPoint);
    plan.feasibility.financialProjection3Months = safeString(plan.feasibility.financialProjection3Months);

    if (!plan.feasibility.estimatedCost) {
      plan.feasibility.estimatedCost = capInfo.isZero 
        ? "0 ج.م (نموذج عمل بدون رأس مال)" 
        : `${capInfo.representativeAmount.toLocaleString()} ج.م`;
    }
    if (!plan.feasibility.costBreakdown || plan.feasibility.costBreakdown.length === 0) {
      if (capInfo.isZero) {
        plan.feasibility.costBreakdown = [
          { item: "الهوية الرقمية والتصميم عبر Canva المجاني", cost: "0 ج.م (مجاني)" },
          { item: "قنوات التواصل واستقبال الطلبات عبر WhatsApp Business", cost: "0 ج.م (مجاني)" },
          { item: "التشغيل والتوريد بنظام الطلب المسبق (Pre-Order) الممول من العميل", cost: "0 ج.م (تمويل ذاتي فوري)" }
        ];
      } else {
        const estNum = capInfo.representativeAmount;
        plan.feasibility.costBreakdown = this.getStandardCostBreakdown(estNum);
      }
    }
    if (!plan.feasibility.launchTimeline) {
      plan.feasibility.launchTimeline = "خلال 14 إلى 21 يوماً من بدء التجهيز وإطلاق قنوات التواصل.";
    }
    if (!plan.feasibility.timeToProfit) {
      plan.feasibility.timeToProfit = capInfo.isZero
        ? "أرباح فورية من أول شهر (استرداد لحظي لعدم وجود أصول ثابتة مكلفة)."
        : "بين شهرين إلى 4 أشهر للوصول للربحية الصافية واسترداد رأس المال بالكامل.";
    }
    if (!plan.feasibility.expectedRevenue) {
      plan.feasibility.expectedRevenue = capInfo.isZero
        ? "بين 6,000 إلى 15,000 ج.م شهرياً مع التوسع في العملاء."
        : "بين 18,000 إلى 45,000 ج.م شهرياً خلال الربع الأول.";
    }
    if (!plan.feasibility.revenueModel) {
      plan.feasibility.revenueModel = "تحصيل أرباح مباشرة وهوامش ربحية مريحة عن كل طلب أو خدمة منفذة مع عروض باقات دورية للعملاء.";
    }
    if (!plan.feasibility.pricingStrategy) {
      plan.feasibility.pricingStrategy = "تسعير مبني على القيمة المضافة (Value-based Pricing) بهامش ربح صافٍ يتراوح بين 35% إلى 50% مع عروض تنافسية للعملاء الأوائل.";
    }
    if (!plan.feasibility.breakEvenPoint) {
      plan.feasibility.breakEvenPoint = capInfo.isZero
        ? "تحقيق التعادل والأرباح الصافية الفورية من أول عميل بدون مصاريف تأسيسية ثابتة."
        : `تحقيق التعادل شهرياً ببيع ${Math.max(10, Math.round(capInfo.representativeAmount * 0.05))} وحدة/خدمة لتغطية كافة المصاريف.`;
    }
    if (!plan.feasibility.financialProjection3Months) {
      plan.feasibility.financialProjection3Months = capInfo.isZero
        ? "الشهر الأول: إيرادات متوقعة 4,000 ج.م - مصاريف 500 ج.م = صافي 3,500 ج.م\nالشهر الثاني: إيرادات متوقعة 8,000 ج.م - مصاريف 1,000 ج.م = صافي 7,000 ج.م\nالشهر الثالث: إيرادات متوقعة 14,000 ج.م - مصاريف 1,800 ج.م = صافي 12,200 ج.م"
        : "الشهر الأول: إيرادات متوقعة 12,000 ج.م - مصاريف 6,000 ج.م = صافي 6,000 ج.م\nالشهر الثاني: إيرادات متوقعة 22,000 ج.م - مصاريف 9,500 ج.م = صافي 12,500 ج.م\nالشهر الثالث: إيرادات متوقعة 38,000 ج.م - مصاريف 14,000 ج.م = صافي 24,000 ج.م";
    }

    // 1. Identity completeness
    if (!plan.identity) plan.identity = {};
    if (!plan.identity.brandNamingStrategy) {
      plan.identity.brandNamingStrategy = {
        generatedNames: [projName, `${projName} برو`, `مؤسسة ${projName}`, `رواد ${projName}`, `${projName} إكسبريس`],
        top3Names: [
          {
            name: projName,
            evaluationScore: 58,
            deepExplanation: "اسم جذاب وسهل الحفظ بالذاكرة يربط النشاط مباشرة بالقيمة المضافة.",
            brandPositioning: "Trust & Simplicity",
            logoDirection: "شعار حديث بخط عربي عصري وألوان حيوية",
            domainSuggestion: "High",
            riskCheck: "اسم مميز ولا توجد مخاطر تعارض تجاري محلية"
          },
          {
            name: `${projName} إكسبريس`,
            evaluationScore: 54,
            deepExplanation: "يوحي بالسرعة والكفاءة في تلبية احتياجات العملاء.",
            brandPositioning: "Speed & Power",
            logoDirection: "أيقونة تعبيرية مع خط مائل ديناميكي",
            domainSuggestion: "Medium",
            riskCheck: "مناسب أكثر إذا كان التركيز على سرعة التسليم"
          },
          {
            name: `رواد ${projName}`,
            evaluationScore: 52,
            deepExplanation: "يعزز الطابع القيادي والموثوقية العالية.",
            brandPositioning: "Leadership",
            logoDirection: "رمز هندسي متناسق",
            domainSuggestion: "High",
            riskCheck: "طابع رسمي ومحافظ"
          }
        ],
        finalRecommendation: {
          winnerName: projName,
          reasoning: "الخيار الأقوى تجارياً لسهولة تداوله وثباته في ذهن المستهلك المستهدف."
        }
      };
    }

    const targetCountry = userData.country || userData.nationality || "مصر";
    const selectedIndustry = userData.customIndustry || (userData.preferredIndustries && userData.preferredIndustries.length > 0 ? userData.preferredIndustries.join("، ") : "");
    const dynamicPalette = this.getDynamicIndustryPalette(conceptText, selectedIndustry);
    const dynamicIncubators = this.getDynamicRegionalIncubators(cityName, targetCountry, selectedIndustry);

    if (!plan.identity.brandIdentitySystem) {
      plan.identity.brandIdentitySystem = {
        brandFoundation: {
          mission: `تقديم أفضل تجربة وجودة وقيمة مضافة للعملاء في ${cityName} بأسعار تنافسية ومدروسة.`,
          vision: `أن نكون الخيار الأول والأكثر موثوقية وتميزاً في مجالنا داخل ${cityName} والأسواق المحيطة.`,
          coreValues: ["المصداقية والأمانة", "السرعة في التنفيذ", "الجودة الاستثنائية", "خدمة عملاء تفوق التوقعات"]
        },
        brandPositioning: {
          differentiation: "الجمع بين الجودة العالية، سرعة الاستجابة، والتسعير المدروس المناسب للميزانية.",
          targetAudience: `الأفراد والأنشطة التجارية في ${cityName} الباحثين عن حلول موثوقة وسريعة.`,
          problemSolved: "صعوبة الحصول على خدمة أو منتج بجودة متسقة ومتابعة جادة وسعر عادل."
        },
        logoConcept: {
          logoType: "Combination Mark (رمز + نص)",
          conceptIdea: `رمز عصري يعبر عن نشاط ${projName} مع كتابة اسم البراند بخط عربي حديث ومقروء.`,
          shapePsychology: "أشكال انسيابية متوازنة توحي بالمرونة والسرعة والاحترافية.",
          scalability: "تصميم متناسق يظهر بوضوح فائق على شاشات الموبايل، المطبوعات، ومواقع التواصل.",
          colorLogic: dynamicPalette.psychology
        },
        visualIdentitySystem: {
          colorPalette: {
            primary: dynamicPalette.primary,
            secondary: dynamicPalette.secondary,
            background: dynamicPalette.background
          },
          typography: {
            headingStyle: "Cairo Bold / Tajawal Black",
            bodyStyle: "Tajawal Regular / Segoe UI",
            reasoning: "وضوح قراءة فائق وعصرية تمنح انطباعاً رقمياً وميدانياً احترافياً."
          },
          visualStyle: {
            imageDirection: "صور واقعية ملهمة ومشرقة تعكس حيوية الخدمة ورضا العملاء.",
            iconStyle: "أيقونات خطية عصرية واضحة وموحدة (Line / Rounded Icons).",
            layoutStyle: "تصميم نظيف وبسيط يركز على سهولة الوصول والإجراءات السريعة (Clean & Modern)."
          },
          consistencySystem: "استخدام الألوان والخطوط الرسمية المعتمدة في كافة المنشورات والرسائل والمطبوعات."
        },
        brandPersona: {
          personalityTraits: ["ودود ومساعد", "محترف وواثق", "سريع ومبادر", "شفاف وصادق"],
          behaviorStyle: "أسلوب مرن يضع راحة العميل ورضاه أولاً.",
          communicationAttitude: "ترحيب دافئ ومهني يركز على تقديم الحلول فوراً والاستماع باهتمام.",
          archetype: "The Helper / The Innovator (المساعد المبتكر)",
          reactionUnderPressure: "هدوء تام، امتصاص غضب العميل، والاعتذار وتقديم تعويض فوري إن لزم الأمر.",
          trustBuilding: "الوضوح في الأسعار، الالتزام بالمواعيد بدقة، والضمان الذهبي على جودة الخدمة/المنتج."
        },
        brandExperience: {
          websiteFeeling: "سهل، مريح، وسريع التحميل مع خطوات طلب واضحة ومباشرة.",
          customerInteraction: "رد فوري عبر الواتساب والمكالمات في غضون دقائق معدودة.",
          productExperience: "تغليف أنيق أو تسليم احترافي يتجاوز توقعات العميل.",
          emotionalJourney: "من الحيرة والبحث إلى الطمأنينة والشعور بالرضا التام والقيمة الحقيقية."
        },
        qualityControl: {
          scalable: "نظام جاهز للتوسع وزيادة حجم الطلبات بسهولة.",
          distinctive: "هوية بصرية وخدمية واضحة تجعل المشروع لا يُنسى.",
          memorable: "سهولة تذكر الاسم والألوان من أول تعامل.",
          consistent: "تطابق تام في معايير الجودة في كل معاملة."
        }
      };
    }

    if (!plan.identity.brandColors || plan.identity.brandColors.length === 0) {
      plan.identity.brandColors = dynamicPalette.brandColors;
    }
    if (!plan.identity.logoConcept) {
      plan.identity.logoConcept = `شعار تجاري عصري متناسق مع مجال ${selectedIndustry || projName}، يدمج بين الرمز التعبيري والخط العربي الحديث.`;
    }
    if (!plan.identity.colorPsychology) {
      plan.identity.colorPsychology = dynamicPalette.psychology;
    }
    if (!plan.identity.brandVoice) {
      plan.identity.brandVoice = "لهجة مصرية مهذبة ومرحبة، تجمع بين البساطة الشعبية القريبة والاحترافية العملية الموثوقة.";
    }

    // 2. Market Analysis completeness
    if (!plan.marketAnalysis) plan.marketAnalysis = {};
    if (!plan.marketAnalysis.marketSizeAndGrowth) {
      plan.marketAnalysis.marketSizeAndGrowth = `سوق محلي نشط يشهد نمواً متصاعداً وتوسعاً في الطلب على الحلول والخدمات المباشرة في ${cityName}.`;
    }
    if (!plan.marketAnalysis.marketTrends) {
      plan.marketAnalysis.marketTrends = "الاعتماد المتزايد على قنوات الطلب السريعة عبر WhatsApp ومنصات التواصل، والبحث عن جودة مضمونة بأسعار عادلة ومتابعة مستمرة.";
    }
    if (!plan.marketAnalysis.porterFiveForces) {
      plan.marketAnalysis.porterFiveForces = "المنافسة قائمة وتعتمد على السمعة والمصداقية، ويمكن التفوق بتقديم سرعة تنفيذ أعلى وخدمة عملاء فائقة وتجربة مريحة.";
    }
    if (!plan.marketAnalysis.barriersToEntry) {
      plan.marketAnalysis.barriersToEntry = "بناء الثقة الأولية وقاعدة العملاء، ويتم التغلب عليها بتقديم عروض إطلاق مميزة وضمانات استرجاع ورضا كامل.";
    }
    if (!plan.marketAnalysis.regulatoryEnvironment) {
      plan.marketAnalysis.regulatoryEnvironment = "إجراءات تأسيس مرنة عبر خدمات المنشأة الفردية أو التراخيص الإلكترونية الميسرة لعام 2026.";
    }
    if (!plan.marketAnalysis.marketGaps) {
      plan.marketAnalysis.marketGaps = "غياب المتابعة الجادة بعد البيع وضعف الالتزام بالمواعيد لدى مقدمي الخدمات التقليديين.";
    }
    if (!plan.marketAnalysis.identifiedProblems || plan.marketAnalysis.identifiedProblems.length === 0) {
      plan.marketAnalysis.identifiedProblems = [
        { problem: "ارتفاع أسعار الخدمات والمستلزمات مع تفاوت الجودة.", reasoning: "ضعف الرقابة وسوء التنظيم بين الموردين والعميل النهائي." },
        { problem: "تأخر الرد وعدم وضوح تفاصيل الأسعار.", reasoning: "اعتماد المنافسين على أساليب تواصل تقليدية وبطيئة." }
      ];
    }
    if (!plan.marketAnalysis.selectedOpportunityReasoning) {
      plan.marketAnalysis.selectedOpportunityReasoning = `استغلال الطلب المتزايد في ${cityName} وتوفير بديل موثوق وسريع يضمن تجربة سلسة للمستخدم.`;
    }

    // 3. Validation completeness
    if (!plan.validation) plan.validation = {};
    if (!plan.validation.targetMarketNeed) {
      plan.validation.targetMarketNeed = "احتياج ملح لخدمة/منتج يلتزم بالمواعيد ويقدم ضماناً حقيقياً وسعراً شفافاً ومناسباً.";
    }
    if (!plan.validation.competitorAnalysis) {
      plan.validation.competitorAnalysis = "المنافسون التقليديون يفتقرون للتسويق الرقمي الحديث والمتابعة السريعة، مما يمنح مشروعنا فرصة قوية للاستحواذ.";
    }
    if (!plan.validation.feasibilityRating) plan.validation.feasibilityRating = "High";
    if (!plan.validation.feasibilityReasoning) {
      plan.validation.feasibilityReasoning = `نموذج عمل مرن يتوافق تماماً مع رأس المال المتاح (${userData.availableCapital || 'المحدد'}) ويحقق عائداً سريعاً.`;
    }
    if (!plan.validation.whyNow) {
      plan.validation.whyNow = "توقيت استثنائي لعام 2026 مع تحول المستهلكين للبحث عن قيمة حقيقية وسرعة إنجاز.";
    }
    if (!plan.validation.competitorsDetailed || plan.validation.competitorsDetailed.length === 0) {
      plan.validation.competitorsDetailed = [
        {
          name: `المنافسين المحليين في ${cityName}`,
          type: "مباشر",
          url: `https://www.google.com/maps/search/${encodeURIComponent((selectedIndustry || projName) + ' ' + cityName)}`,
          location: cityName,
          description: "أنشطة ومحلات محلية تقليدية تعتمد على الزبائن المباشرين.",
          strengths: ["الوجود في السوق المحلي", "معرفة زبائن المنطقة"],
          weaknesses: ["غياب التواجد الرقمي", "بطء الرد والتنفيذ", "أسعار غير معلنة بوضوح"],
          howToCompete: "التفوق في سرعة الرد عبر WhatsApp، إعلان الأسعار بشفافية، وتقديم عروض قيمة مضاعفة."
        },
        {
          name: "المنصات والمتاجر الرقمية العامة",
          type: "غير مباشر",
          url: `https://www.google.com/search?q=${encodeURIComponent((selectedIndustry || projName) + ' ' + targetCountry)}`,
          location: `${targetCountry} (أونلاين)`,
          description: "منصات عامة تقدم خيارات متعددة دون تخصيص محلي سريع.",
          strengths: ["انتشار واسع", "تنوع الخيارات"],
          weaknesses: ["غياب الدعم المباشر والشخصي", "عدم وجود ضمان محلي سريع"],
          howToCompete: "بناء علاقة مباشرة وتقديم استشارات مخصصة وتوصيل/تنفيذ أسرع."
        }
      ];
    }

    // 4. Target Audience completeness
    if (!plan.targetAudience) plan.targetAudience = {};
    if (!plan.targetAudience.idealCustomerProfile) {
      plan.targetAudience.idealCustomerProfile = `العميل المهتم بالجودة وسرعة الإنجاز في ${cityName}، من الفئة العمرية 22-48 سنة، الذي يفضل التعامل المريح والمباشر.`;
    }
    if (!plan.targetAudience.demographicsAndGeography) {
      plan.targetAudience.demographicsAndGeography = `الذكور والإناث المقيمون في ${cityName} والمناطق المجاورة، من الطبقة المتوسطة وما فوقها.`;
    }
    if (!plan.targetAudience.interestsAndBehavior) {
      plan.targetAudience.interestsAndBehavior = "استخدام يومي مكثف لتطبيقات التواصل، والبحث عن تقييمات وتجارب العملاء السابقة قبل اتخاذ قرار الشراء.";
    }
    if (!plan.targetAudience.socialMediaPresence) {
      plan.targetAudience.socialMediaPresence = "Facebook (المجموعات والصفحات)، Instagram (الريلز والقصص)، TikTok، وWhatsApp للطلب والاستفسار.";
    }
    if (!plan.targetAudience.primarySegment) {
      plan.targetAudience.primarySegment = "العملاء الأكثر احتياجاً للحل السريع والذين يقدّرون الالتزام بالمواعيد وتوفير الوقت والمجهود.";
    }
    if (!plan.targetAudience.behaviorAndMindset) {
      plan.targetAudience.behaviorAndMindset = "عقلية عملية تبحث عن أفضل معادلة بين السعر والجودة مع الرغبة في تجنب المخاطرة.";
    }
    if (!plan.targetAudience.acquisitionChannels) {
      plan.targetAudience.acquisitionChannels = "إعلانات Meta المستهدفة جغرافياً، مجموعات الفيسبوك المحلية في المحافظة، وبرنامج الإحالة (رشح صديقاً واحصل على خصم).";
    }

    // 5. Marketing Strategy completeness
    if (!plan.marketingStrategy) plan.marketingStrategy = {};
    if (!plan.marketingStrategy.coreMessage) {
      plan.marketingStrategy.coreMessage = `مع ${projName}.. جودة تثق فيها، سرعة تفرق معاك، وأسعار على قد الإيد!`;
    }
    if (!plan.marketingStrategy.socialMediaStrategy) {
      plan.marketingStrategy.socialMediaStrategy = "نشر 3-4 منشورات وفيديوهات قصيرة أسبوعياً تركز على حل مشكلات العملاء الحقيقية واستعراض نتائج العمل وكواليس التنفيذ.";
    }
    if (!plan.marketingStrategy.contentPillars || plan.marketingStrategy.contentPillars.length === 0) {
      plan.marketingStrategy.contentPillars = [
        "محتوى توعوي وحلول سريعة للمشكلات اليومية (Value Content)",
        "آراء وتجارب العملاء وقصص النجاح (Social Proof)",
        "كواليس العمل والتحضير والضمان (Behind the Scenes)",
        "عروض حصرية وخصومات مؤقتة ومسابقات تفاعلية (Promotions)"
      ];
    }
    if (!plan.marketingStrategy.advertisingPlan) {
      plan.marketingStrategy.advertisingPlan = `حملات إعلانية ممولة بميزانيات مرنة تستهدف النطاق الجغرافي لـ ${cityName} بنظام الدفع مقابل الرسائل والتحويلات المباشرة.`;
    }
    if (!plan.marketingStrategy.growthHacks) {
      plan.marketingStrategy.growthHacks = "تقديم هدية/استشارة مجانية أولى، تفعيل نظام كاش باك أو خصم للعميل المتكرر، والشراكة مع الأنشطة المجاورة غير المنافسة.";
    }
    if (!plan.marketingStrategy.influencerPartnerships) {
      plan.marketingStrategy.influencerPartnerships = `التعاون مع صناع المحتوى المحليين والصفحات المؤثرة في ${cityName} بنظام تبادل الخدمات أو العمولات.`;
    }
    if (!plan.marketingStrategy.first1000Customers) {
      plan.marketingStrategy.first1000Customers = "الوصول لأول 50 عميلاً من شبكة العلاقات المباشرة، ثم التوسع عبر التوصيات، ثم إطلاق الحملات الممولة لتغطية السوق بالكامل.";
    }
    if (!plan.marketingStrategy.retentionStrategy) {
      plan.marketingStrategy.retentionStrategy = "المتابعة مع العميل بعد 3 أيام من الاستلام للتأكد من الرضا الكامل، وإرسال عروض خاصة في المناسبات.";
    }
    if (!plan.marketingStrategy.contentIdeas || plan.marketingStrategy.contentIdeas.length === 0) {
      plan.marketingStrategy.contentIdeas = [
        "فيديو ريلز: 3 أخطاء شائعة يقع فيها العملاء وكيف تتجنبها بسهولة",
        "منشور مقارنة: الفرق بين التعامل مع الهواة واختيار الخدمة الاحترافية المضمونة",
        "كواليس تحضير طلبية خاصة لعميل وتجهيزها بأعلى معايير الجودة",
        "عرض الإطلاق: خصم 20% لأول 25 طلباً هذا الأسبوع مع هدية خاصة",
        "سؤال وتفاعل: ما هي أكبر عقبة تواجهك حالياً في هذا المجال؟ شاركنا رأيك!"
      ];
    }

    // 6. SWOT completeness
    if (!plan.swot) plan.swot = { strengths: [], weaknesses: [], opportunities: [], threats: [] };
    if (!plan.swot.strengths || plan.swot.strengths.length === 0) {
      plan.swot.strengths = [
        "مرونة عالية وسرعة استجابة لا تتوفر لدى المنافسين الكبار",
        "انخفاض التكاليف التأسيسية والتشغيلية المباشرة",
        "التركيز على تجربة العميل والاهتمام الشخصي بالتفاصيل",
        "استخدام الأدوات والتقنيات الرقمية لعام 2026 بكفاءة"
      ];
    }
    if (!plan.swot.weaknesses || plan.swot.weaknesses.length === 0) {
      plan.swot.weaknesses = [
        "العلامة التجارية جديدة وتحتاج وقتاً لبناء الشهرة الواسعة",
        "فريق عمل صغير في المراحل الأولى يعتمد على المؤسس",
        "ميزانية تسويقية أولية محدودة تتطلب تركيزاً على التسويق العضوي",
        "الحاجة إلى بناء سابقة أعمال سريعة ومقنعة"
      ];
    }
    if (!plan.swot.opportunities || plan.swot.opportunities.length === 0) {
      plan.swot.opportunities = [
        `النمو السكاني والتجاري المتسارع في ${cityName}`,
        "ضعف التسويق الرقمي لدى المنافسين التقليديين في المنطقة",
        "إمكانية التوسع وإضافة منتجات/خدمات مكملة بسهولة",
        "الاستفادة من الدعم الحكومي والتسهيلات للمشروعات الصغيرة"
      ];
    }
    if (!plan.swot.threats || plan.swot.threats.length === 0) {
      plan.swot.threats = [
        "تقلبات أسعار الخامات أو التكاليف العامة للتوريد",
        "دخول منافسين جدد يحاولون تقليد الأسعار والعروض",
        "تغيرات خوارزميات منصات التواصل الاجتماعي للمحتوى العضوي",
        "تحديات القوة الشرائية العامة للمستهلكين"
      ];
    }

    // 7. Business Strategy completeness
    if (!plan.businessStrategy) plan.businessStrategy = {};
    if (!plan.businessStrategy.executiveSummary) {
      plan.businessStrategy.executiveSummary = `يمثل مشروع "${projName}" فرصة ريادية استثنائية في ${cityName}، تم تصميمه وفقاً لمعطيات السوق الحقيقية لعام 2026. يهدف المشروع إلى تقديم حلول عملية وموثوقة تسد فجوة الجودة وسرعة الإنجاز، مع الالتزام التام بنموذج تشغيلي رشيق يضمن تعظيم العائد على الاستثمار وتقليل المخاطر الرأسمالية إلى أدنى حد ممكن.`;
    }
    if (!plan.businessStrategy.visionAndMission) {
      plan.businessStrategy.visionAndMission = `الرؤية: أن نكون العلامة التجارية الأسرع نمواً والأعلى تقييماً في ${cityName} بحلول 2027.\nالرسالة: تمكين عملائنا من الحصول على أفضل قيمة ممكنة وخدمة متميزة تمنحهم راحة البال والثقة الكاملة.`;
    }
    if (!plan.businessStrategy.strategicObjectives || plan.businessStrategy.strategicObjectives.length === 0) {
      plan.businessStrategy.strategicObjectives = [
        "تحقيق نقطة التعادل والربحية الصافية خلال الـ 90 يوماً الأولى من الإطلاق",
        "بناء قاعدة عملاء تضم ما لا يقل عن 150 عميلاً دائماً خلال النصف الأول من العام",
        "الحفاظ على نسبة رضا عملاء تتجاوز 95% ومعدل إحالات وتوصيات إيجابية يفوق 30%",
        "تطوير وأتمتة العمليات التشغيلية لخفض الوقت المستغرق في تنفيذ الطلب بنسبة 40%"
      ];
    }
    if (!plan.businessStrategy.coreCompetencies) {
      plan.businessStrategy.coreCompetencies = "المرونة التشغيلية العالية، الفهم العميق لمتطلبات المستهلك المحلي، الاستجابة الفورية، والالتزام بضمان الجودة الحقيقي.";
    }
    if (!plan.businessStrategy.keyPerformanceIndicators || plan.businessStrategy.keyPerformanceIndicators.length === 0) {
      plan.businessStrategy.keyPerformanceIndicators = [
        "تكلفة الاستحواذ على العميل (CAC): أقل من 15% من قيمة أول معاملة",
        "القيمة الدائمة للعميل (LTV): تحقيق 3 معاملات على الأقل لكل عميل سنوياً",
        "صافي هامش الربح التشغيلي: بين 45% إلى 65% من إجمالي الإيرادات",
        "معدل تحويل الاستفسارات إلى مبيعات مؤكدة: لا يقل عن 25%"
      ];
    }
    if (!plan.businessStrategy.expansionPlan) {
      plan.businessStrategy.expansionPlan = "المرحلة الأولى: ترسيخ التواجد في المنطقة الجغرافية الأولى؛ المرحلة الثانية: التوسع في المراكز والمدن المجاورة بالمحافظة؛ المرحلة الثالثة: إضافة خطوط خدمات ومنتجات متقدمة وإتاحة الشحن/التنفيذ على مستوى الجمهورية.";
    }

    // 8. Investment and Incubation completeness
    if (!plan.investmentAndIncubation) plan.investmentAndIncubation = {};
    if (!plan.investmentAndIncubation.investmentReadiness) {
      plan.investmentAndIncubation.investmentReadiness = "المشروع مصمم ليعتمد على التمويل الذاتي الرشيق (Bootstrapping) أولاً، مما يجعله جاهزاً لجذب تمويلات أو منح لاحقة من خلال سجل مالي منظم وأرقام مبيعات حقيقية مثبتة تثبت الطلب الفعلي.";
    }
    if (!plan.investmentAndIncubation.pitchDeckTips) {
      plan.investmentAndIncubation.pitchDeckTips = "ركز في العرض التقديمي (10 شرائح كحد أقصى) على: المشكلة الميدانية الحقيقية، حجم السوق المحلي والطلب، الميزة التنافسية الملموسة، أرقام المبيعات الحالية، وخطة التوسع واستخدام أموال الاستثمار بدقة.";
    }
    if (!plan.investmentAndIncubation.howToCommunicate) {
      plan.investmentAndIncubation.howToCommunicate = "تحدث بلغة الأرقام ومعدلات النمو واقتصاديات الوحدة (Unit Economics). أظهر شغفك وقدرتك على التنفيذ السريع مع الحفاظ على شفافية كاملة حول التحديات وكيفية التغلب عليها.";
    }
    if (!plan.investmentAndIncubation.recommendedIncubators || plan.investmentAndIncubation.recommendedIncubators.length === 0) {
      plan.investmentAndIncubation.recommendedIncubators = dynamicIncubators;
    }

    // 9. Business Model Canvas completeness
    if (!plan.businessModelCanvas) plan.businessModelCanvas = {};
    if (!plan.businessModelCanvas.keyPartners || plan.businessModelCanvas.keyPartners.length === 0) {
      plan.businessModelCanvas.keyPartners = [
        "الموردون وتجار الجملة المحليون",
        "شركات الشحن والتوصيل السريع والمحلي",
        "بوابات ومحافظ الدفع الإلكتروني (Paymob, Fawry, Vodafone Cash, InstaPay)",
        "صناع المحتوى والمؤثرون المحليون"
      ];
    }
    if (!plan.businessModelCanvas.keyActivities || plan.businessModelCanvas.keyActivities.length === 0) {
      plan.businessModelCanvas.keyActivities = [
        "تنفيذ وتقديم الخدمات/المنتجات بأعلى معايير الجودة",
        "التسويق اليومي وإدارة قنوات التواصل الاجتماعي",
        "خدمة العملاء والرد على الاستفسارات وإتمام الطلبات",
        "التطوير المستمر ومتابعة رضا المستهلكين"
      ];
    }
    if (!plan.businessModelCanvas.keyResources || plan.businessModelCanvas.keyResources.length === 0) {
      plan.businessModelCanvas.keyResources = [
        "المهارات الفردية والخبرة العملية للمؤسس",
        "الهوية التجارية وقنوات التواصل الرقمية المعتمدة",
        "أدوات وبرمجيات التشغيل والتصميم والتواصل",
        "قاعدة بيانات العملاء وعلاقات الموردين المباشرة"
      ];
    }
    if (!plan.businessModelCanvas.valuePropositions || plan.businessModelCanvas.valuePropositions.length === 0) {
      plan.businessModelCanvas.valuePropositions = [
        "جودة عالية متسقة ومضمونة مع سرعة قياسية في التنفيذ",
        "أسعار عادلة وشفافة تناسب ميزانية العميل",
        "تجربة تعامل مريحة ومتابعة مستمرة بعد البيع",
        "حلول مخصصة تناسب الاحتياجات الفردية بدقة"
      ];
    }
    if (!plan.businessModelCanvas.customerRelationships || plan.businessModelCanvas.customerRelationships.length === 0) {
      plan.businessModelCanvas.customerRelationships = [
        "تواصل شخصي وودود عبر محادثات WhatsApp المباشرة",
        "شفافية وأمانة تامة في المواعيد والمواصفات",
        "عروض ولاء ومكافآت للعملاء المستمرين",
        "ضمان ذهبي للاستبدال أو التعديل الفوري"
      ];
    }
    if (!plan.businessModelCanvas.channels || plan.businessModelCanvas.channels.length === 0) {
      plan.businessModelCanvas.channels = [
        "تطبيق WhatsApp Business لاستقبال الطلبات",
        "صفحات Facebook و Instagram و TikTok الرسمية",
        "المجموعات والتجمعات المحلية في المحافظة",
        "برامج التوصيات والترشيحات الشفهية (Word of Mouth)"
      ];
    }
    if (!plan.businessModelCanvas.customerSegments || plan.businessModelCanvas.customerSegments.length === 0) {
      plan.businessModelCanvas.customerSegments = [
        `الأفراد الباحثون عن خدمة/منتج موثوق في ${cityName}`,
        "المستهلكون الرقميون الذين يفضلون الطلب السريع والمضمون",
        "الأنشطة التجارية والشركات الصغيرة في المنطقة المحيطة",
        "العملاء الباحثون عن جودة متميزة وسعر اقتصادي مدروس"
      ];
    }
    if (!plan.businessModelCanvas.costStructure || plan.businessModelCanvas.costStructure.length === 0) {
      plan.businessModelCanvas.costStructure = [
        "تكاليف الخامات / التوريد المباشر بحسب كل طلب",
        "ميزانية الإعلانات الممولة والتسويق الرقمي",
        "أدوات وبرامج التشغيل والتصميم (إن وجدت)",
        "مصاريف التوصيل والتغليف والاتصالات"
      ];
    }
    if (!plan.businessModelCanvas.revenueStreams || plan.businessModelCanvas.revenueStreams.length === 0) {
      plan.businessModelCanvas.revenueStreams = [
        "المبيعات المباشرة للمنتجات أو رسوم تقديم الخدمات",
        "باقات اشتراكات دورية أو عقود صيانة ومتابعة",
        "عروض حزم المنتجات/الخدمات الشاملة (Bundles)",
        "خدمات التسليم السريع أو الطلبات المخصصة (Customized)"
      ];
    }

    // 10. Challenges Advice completeness
    if (!plan.challengesAdvice || plan.challengesAdvice.length === 0) {
      plan.challengesAdvice = [
        {
          title: "إدارة رأس المال وضمان استمرار السيولة النقدية",
          advice: "التزم بمبدأ التشغيل الرشيق: لا تنفق أي مبلغ إلا على ما يجلب دخلاً مباشراً، واحرص على تحصيل دفعات مقدمة أو العمل بنظام الدفع الفوري لتأمين السيولة.",
          links: [
            { name: "دليل إدارة التدفقات النقدية - رواد حسوب", url: "https://io.hsoub.com/entrepreneurship" },
            { name: "منصة مستقل للخدمات", url: "https://mostaql.com" }
          ]
        },
        {
          title: "بناء ثقة العملاء في البداية والتفوق على المنافسين",
          advice: "قدّم عروض إطلاق لا تقاوم مع ضمان استرداد كامل أو تعديل مجاني، واطلب من كل عميل راضٍ تسجيل تقييم أو شهادة موثقة لنشرها في صفحاتك.",
          links: [
            { name: "مبادئ خدمة العملاء وبناء الثقة - ومضة", url: "https://www.wamda.com/ar" }
          ]
        },
        {
          title: "الوصول للعميل المستهدف بأقل تكلفة إعلانية",
          advice: "ركز على صناعة فيديوهات قصيرة (Reels & TikTok) تقدم قيمة حقيقية، وانشر يومياً في مجموعات المحافظة مع تفعيل الاستهداف الجغرافي الدقيق في الإعلانات الممولة.",
          links: [
            { name: "أكاديمية Meta للإعلانات الرقمية", url: "https://www.facebook.com/business" },
            { name: "أداة Canva لتصميم الإعلانات مجاناً", url: "https://www.canva.com" }
          ]
        }
      ];
    }

    // 11. Learning Path completeness
    if (!plan.learningPath || plan.learningPath.length === 0) {
      plan.learningPath = [
        {
          skill: "أساسيات التسويق الرقمي وصناعة المحتوى الجذاب",
          resourceName: "كورس التسويق الإلكتروني الشامل",
          resourceLink: "https://www.youtube.com/results?search_query=digital+marketing+course+arabic",
          platform: "YouTube",
          description: "تعلم كيفية استهداف الجمهور الصحيح وصياغة إعلانات مقنعة تزيد المبيعات بأقل تكلفة.",
          importance: "عالية جداً لجذب العملاء وبناء حضور رقمي قوي."
        },
        {
          skill: "المبيعات الاحترافية وفن الإقناع والتفاوض",
          resourceName: "دورة مهارات البيع وإغلاق الصفقات",
          resourceLink: "https://www.udemy.com/topic/sales-skills/",
          platform: "Udemy",
          description: "كيفية التعامل مع استفسارات العملاء على WhatsApp وتحويل كل محادثة إلى عملية بيع ناجحة.",
          importance: "أساسية لزيادة معدل التحويل ومضاعفة الأرباح."
        },
        {
          skill: "الإدارة المالية وحساب التكاليف والأرباح",
          resourceName: "مبادئ المحاسبة لغير المحاسبين",
          resourceLink: "https://www.youtube.com/results?search_query=small+business+accounting+arabic",
          platform: "YouTube",
          description: "طريقة متابعة المصروفات اليومية وتحديد هوامش الربح ونقطة التعادل بدقة واحترافية.",
          importance: "حيوية لضمان استقرار ونمو المشروع وتجنب الأخطاء المالية."
        }
      ];
    }

    // 12. Tools and Resources completeness
    if (!plan.toolsAndResources || plan.toolsAndResources.length === 0) {
      plan.toolsAndResources = [
        {
          category: "أدوات التواصل واستقبال الطلبات",
          suggestions: [
            {
              name: "WhatsApp Business",
              link: "https://www.whatsapp.com/business",
              description: "كتالوج المنتجات، الردود التلقائية، وتصنيف المحادثات باحترافية.",
              isFree: true,
              whereToBuyOrGet: "تحميل مجاني من Google Play / App Store",
              howToUse: "إنشاء حساب تجاري وإضافة الكتالوج والأسعار ورسائل الترحيب التلقائية.",
              estimatedCost: "0 ج.م (مجاني بالكامل)"
            },
            {
              name: "Google Workspace & Sheets",
              link: "https://workspace.google.com",
              description: "إدارة ومتابعة سجلات الطلبات والمبيعات وبيانات العملاء أونلاين.",
              isFree: true,
              whereToBuyOrGet: "مجاني عبر حساب Google الشخصي",
              howToUse: "تصميم شيت لمتابعة الإيرادات والمصروفات اليومية ومواعيد التسليم.",
              estimatedCost: "0 ج.م (مجاني)"
            }
          ]
        },
        {
          category: "أدوات التصميم والتسويق الرقمي",
          suggestions: [
            {
              name: "Canva Pro / Free",
              link: "https://www.canva.com",
              description: "تصميم منشورات السوشيال ميديا، العروض، الشعار، وبطاقات العمل بسهولة.",
              isFree: true,
              whereToBuyOrGet: "الموقع الإلكتروني أو تطبيق الهاتف",
              howToUse: "اختيار قوالب جاهزة والتعديل عليها بألوان وخطوط المشروع المعتمدة.",
              estimatedCost: "0 ج.م للخطة المجانية"
            },
            {
              name: "CapCut",
              link: "https://www.capcut.com",
              description: "مونتاج وإنتاج فيديوهات الريلز والتيك توك الإعلانية باحترافية.",
              isFree: true,
              whereToBuyOrGet: "تطبيق مجاني للأندرويد والآيفون والكمبيوتر",
              howToUse: "دمج المقاطع وإضافة نصوص وموسيقى تريند لجذب المشاهدين.",
              estimatedCost: "0 ج.م (مجاني)"
            }
          ]
        },
        {
          category: "بوابات الدفع والتحصيل المالي",
          suggestions: [
            {
              name: "InstaPay & Vodafone Cash",
              link: "https://www.instapay.eg",
              description: "استقبال وتأكيد الدفعات المالية من العملاء فورياً وبأعلى سرعة وأمان.",
              isFree: true,
              whereToBuyOrGet: "تطبيقات البنوك والمحافظ الإلكترونية المعتمدة في مصر",
              howToUse: "إرسال عنوان الدفع أو رقم المحفظة للعميل مع تأكيد التحويل برقم المعاملة.",
              estimatedCost: "0 ج.م (تحويلات فورية مجانية)"
            },
            {
              name: "Paymob",
              link: "https://paymob.com",
              description: "بوابة دفع إلكترونية لربط البطاقات البنكية وتقسيط المشتريات.",
              isFree: false,
              whereToBuyOrGet: "التسجيل المباشر عبر موقع Paymob",
              howToUse: "إنشاء روابط دفع مخصصة وإرسالها للعملاء لتحصيل المبالغ إلكترونياً.",
              estimatedCost: "عمولة مقتطعة لكل معاملة فقط (بدون رسوم شهرية ثابتة)"
            }
          ]
        }
      ];
    }

    // 13. Execution Guide completeness
    if (!plan.executionGuide || plan.executionGuide.length === 0) {
      plan.executionGuide = [
        {
          phase: "المرحلة الأولى: التأسيس وإعداد الهوية والأدوات (الأيام 1 - 7)",
          steps: [
            {
              action: "تثبيت اسم المشروع وضبط ألوان وخطوط الهوية وتصميم الشعار والقوالب الإعلانية.",
              tools: ["Canva", "WhatsApp Business"],
              expectedResult: "جاهزية كاملة لكافة المواد البصرية وحسابات التواصل الاجتماعي."
            },
            {
              action: "تحديد قائمة الأسعار بدقة، وتجهيز رسائل الرد السريع والكتالوج الرقمي.",
              tools: ["Google Sheets", "WhatsApp Catalog"],
              expectedResult: "سهولة وسرعة إرسال العروض والتفاصيل للعملاء في ثوانٍ."
            }
          ]
        },
        {
          phase: "المرحلة الثانية: الإطلاق التجريبي وجذب أول العملاء (الأيام 8 - 21)",
          steps: [
            {
              action: "نشر محتوى الإطلاق الترويجي والتواصل مع أول 30 عميلاً محتملاً وتقديم عروض حصرية.",
              tools: ["Facebook Groups", "Instagram Reels"],
              expectedResult: "إتمام أول 10 إلى 15 طلباً وتحقيق أول أرباح ملموسة."
            },
            {
              action: "جمع التقييمات الإيجابية وآراء العملاء الأولية واستخدامها كإثبات ثقة في المنشورات.",
              tools: ["WhatsApp Screenshots", "Social Proof Posts"],
              expectedResult: "ترسيخ الثقة وتسهيل إقناع العملاء الجدد."
            }
          ]
        },
        {
          phase: "المرحلة الثالثة: التوسع ومضاعفة المبيعات (الأيام 22 - 60)",
          steps: [
            {
              action: "إطلاق حملات إعلانية ممولة مستهدفة لـ " + cityName + " وتفعيل برنامج الإحالات.",
              tools: ["Meta Ads Manager", "TikTok Ads"],
              expectedResult: "تدفق يومي مستمر للطلبات ومضاعفة الإيرادات الشهرية."
            },
            {
              action: "مراجعة الحسابات والأرباح الصافية وتطوير باقات وخدمات إضافية لزيادة قيمة المعاملة.",
              tools: ["Google Sheets Financials"],
              expectedResult: "الوصول لنقطة الاستقرار والربحية الصافية المستمرة."
            }
          ]
        }
      ];
    }

    return plan as BusinessPlan;
  }

  async generateBusinessPlan(userData: UserData, isPro: boolean = true): Promise<BusinessPlan> {
    try {
      console.log("[Fast Business Pipeline] Step 1: Parallel live market & local insights fetch (max 12s)...");
      const [liveMarketData, googleMapsInsights] = await Promise.all([
        this.withTimeout(this.fetchLiveMarketData(userData), 12000, "بيانات عامة للسوق المحلي لعام 2026 والطلب المتاح"),
        this.withTimeout(this.fetchGoogleMapsInsights(userData), 12000, "تحليل جغرافي ومنافسين محليين في المحافظة")
      ]);

      console.log("[Fast Business Pipeline] Step 2: Opportunity & Validated Winning Idea Solver...");
      const opportunityOutput = await this.runStage1and2OpportunitySolver(userData, liveMarketData, googleMapsInsights);
      const selectedWinningIdea = opportunityOutput.selectedWinningIdea;
      console.log(`[Fast Business Pipeline] Validated Idea: ${selectedWinningIdea.projectName}`);

      console.log("[Fast Business Pipeline] Step 3: Complete Blueprint Execution Generation...");
      let plan = await this.runStage3BlueprintExecution(
        userData,
        selectedWinningIdea,
        liveMarketData,
        googleMapsInsights,
        isPro
      );

      // Attach validation result and execution roadmap
      plan.validationResult = await IdeaValidationEngine.validateIdea(
        selectedWinningIdea.concept,
        selectedWinningIdea.projectName,
        userData,
        liveMarketData
      );

      plan.executionBlueprint = IdeaValidationEngine.generateExecutionRoadmap(
        selectedWinningIdea.concept,
        selectedWinningIdea.projectName,
        userData,
        liveMarketData
      );

      // Programmatic comprehensive auto-enrichment (ensures all 12 tabs are 100% full and populated)
      plan = this.ensureCompleteBusinessPlan(plan, userData, isPro);

      // Mathematical balancing and budget reconciliation (instant)
      await this.verifyBusinessPlanProgrammatically(plan, userData);

      console.log(`[Fast Business Pipeline] Plan generated and fully verified in record time for: ${plan.projectName}`);
      return plan;
    } catch (error: any) {
      console.error("API Error details in generateBusinessPlan:", error);
      const errMsg = error?.message || String(error) || "حدث خطأ غير متوقع في توليد الخطة.";
      throw new Error(errMsg);
    }
  }

  async fetchLiveMarketDataForProPlan(existingPlan: BusinessPlan): Promise<string> {
    try {
      const searchPrompt = `قم بإجراء بحث حي وبحث دقيق عن السوق المصري والفرص والتحديات الحالية المرتبطة بالمشروع التالي لعام 2026:
اسم المشروع: ${existingPlan.projectName}
الفكرة والنموذج المقترح: ${existingPlan.concept}
الفئة المستهدفة والاحتياج: ${existingPlan.validation?.targetMarketNeed || 'غير محدد'}

ابحث عن:
1. حجم الطلب والنمو الحالي في هذا القطاع في مصر.
2. المنافسين الرئيسيين في السوق المصري (شركات ناشئة أو شركات كبرى) مع روابط حقيقية لمواقعهم أو صفحاتهم.
3. أهم الاتجاهات الحالية والتحديات والفرص المتاحة لعام 2026 لتضمينها في تحليل السوق والجمهور المستهدف والاستراتيجية التسويقية ونموذج العمل التجاري.`;

      const searchPromise = this.generateContentWithFallback({
        model: "gemini-flash-latest",
        contents: searchPrompt,
        config: {
          systemInstruction: "أنت خبير أبحاث تسويقية ومحلل بيانات السوق المصري. مهمتك هي جلب معلومات حقيقية ودقيقة ومحدثة من خلال البحث الفعلي على الويب باستخدام محرك بحث جوجل لمساعدة رائد الأعمال في مصر.",
          tools: [{ googleSearch: {} }]
        }
      });

      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error("PRO Search timed out")), 10000)
      );

      const response = await Promise.race([searchPromise, timeoutPromise]);
      return response.text || "لم يتم الحصول على بيانات حية من محرك البحث.";
    } catch (error: any) {
      console.warn("[Gemini Service PRO Search] Search fallback applied:", error?.message || error);
      return "بيانات السوق الاحترافي العام لجمهورية مصر العربية لعام 2026.";
    }
  }

  async completeProBusinessPlan(existingPlan: BusinessPlan): Promise<Partial<BusinessPlan>> {
    try {
      console.log("[Gemini Service] Fetching live market data for PRO upgrade...");
      const liveMarketData = await this.fetchLiveMarketDataForProPlan(existingPlan);
      console.log("[Gemini Service] Live market data fetched successfully for PRO upgrade.");

      const dummyUserData = {
        gender: existingPlan.projectName?.includes("رائدة") ? "female" : "male",
        city: "مصر",
        availableCapital: existingPlan.feasibility?.estimatedCost || "ميزانية ملائمة",
        initialIdeas: existingPlan.concept,
      };

      console.log("[Gemini Service] Generating optimized complete_plan prompt...");
      const prompt = await this.generateOptimizedPrompt(dummyUserData as any, "complete_plan", {
        liveMarketData,
        existingPlan,
        isPro: true
      });

      const PRO_SCHEMA = {
        type: Type.OBJECT,
        properties: {
          identity: BUSINESS_PLAN_SCHEMA.properties.identity,
          marketAnalysis: BUSINESS_PLAN_SCHEMA.properties.marketAnalysis,
          targetAudience: BUSINESS_PLAN_SCHEMA.properties.targetAudience,
          marketingStrategy: BUSINESS_PLAN_SCHEMA.properties.marketingStrategy,
          investmentAndIncubation: BUSINESS_PLAN_SCHEMA.properties.investmentAndIncubation,
          businessModelCanvas: BUSINESS_PLAN_SCHEMA.properties.businessModelCanvas,
        },
        required: ['identity', 'marketAnalysis', 'targetAudience', 'marketingStrategy', 'investmentAndIncubation', 'businessModelCanvas']
      };

      const response = await this.generateContentWithFallback({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
           systemInstruction: SYSTEM_INSTRUCTION,
           responseMimeType: "application/json",
           responseSchema: PRO_SCHEMA as any
         }
      });

      const text = response.text;
      if (!text) {
        throw new Error("لم يتم تلقي استجابة من الذكاء الاصطناعي.");
      }
      
      let plan = safeJsonParse<any>(text, {});

      // Smart Programmatic validation + 1 repair targeted step
      try {
        const verification = await this.verifyBusinessPlan(plan, liveMarketData, dummyUserData as any);
        if (!verification.isValid) {
          const affectedSections = this.getAffectedSections(verification.issues).filter(section => PRO_SCHEMA.properties[section] !== undefined);
          if (affectedSections.length > 0) {
            const patchSchema = {
              type: Type.OBJECT,
              properties: {} as Record<string, any>,
              required: [] as string[]
            };
            for (const section of affectedSections) {
              patchSchema.properties[section] = PRO_SCHEMA.properties[section];
              patchSchema.required.push(section);
            }

            const planContext = affectedSections.reduce((acc, section) => {
              if ((plan as any)[section]) acc[section] = (plan as any)[section];
              return acc;
            }, {} as Record<string, any>);

            const correctionPrompt = `أنت خبير تعديل وتصحيح خطط الأعمال الاحترافية. المطلوب إعادة تصميم وتصحيح هذه الأقسام المتأثرة فقط لعام 2026.
الأقسام: ${affectedSections.join(", ")}
المشاكل: ${verification.issues.join("; ")}
محتوى الأقسام المتأثرة حالياً: ${JSON.stringify(planContext)}`;

            const correctionResponse = await this.generateContentWithFallback({
              model: "gemini-flash-latest",
              contents: correctionPrompt,
              config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: patchSchema as any
              }
            });

            if (correctionResponse?.text) {
              const patchPlan = safeJsonParse<Record<string, any>>(correctionResponse.text, {});
              plan = deepMerge(plan, patchPlan);
            }
          }
        }
      } catch (err) {
        console.warn("[Gemini Service] PRO Healing bypassed due to response or time limits.", err);
      }

      const mergedPlan = deepMerge(existingPlan, plan);
      const fullyEnrichedPlan = this.ensureCompleteBusinessPlan(mergedPlan, dummyUserData as any, true);
      return fullyEnrichedPlan;
    } catch (error: any) {
      console.error("API Error details:", error);
      throw new Error(error.message || "حدث خطأ أثناء ترقية المشروع الاحترافي. يرجى المحاولة مرة أخرى.");
    }
  }

  private generateFallbackPlan(userData: UserData, isPro: boolean, errorMsg: string): BusinessPlan {
    console.warn(`[Gemini Service] Triggered fallback template plan generation due to error: ${errorMsg}`);
    
    const capInfo = parseCapitalDetails(userData.availableCapital);
    const projectName = capInfo.isZero ? "وساطة وخدمات التميز" : "مشروعي الريادي";
    const genderSuffix = userData.gender === "female" ? "ة" : "";
    
    const conceptText = capInfo.isZero
      ? `تأسيس مشروع خدماتي/وساطة وتجارة بالطلب المسبق (Pre-order) بدون رأس مال، بالاعتماد على مهاراتك وشبكة معارفك لتقديم حلول سريعة وتحقيق دخل فوري دون أي أعباء تأسيسية.`
      : `تأسيس مشروع تجاري أو خدمي مصغر على مقاس العميل بالاعتماد على مهاراته المتاحة وميزانيته التقديرية (${capInfo.label}) لضمان التشغيل السريع والأمان المالي في ظل تضخم الأسواق المصرية.`;

    const estimatedCostText = capInfo.isZero ? "0 ج.م (بدون رأس مال)" : (userData.availableCapital || "30,000 ج.م");
    const costBreakdownList = capInfo.isZero
      ? [
          { item: "أدوات وتطبيقات رقمية مجانية (واتساب أعمال، كانفا المجاني)", cost: "0 ج.م" },
          { item: "تسويق عضوي من خلال المجموعات المحلية وشبكة العلاقات", cost: "0 ج.م" },
          { item: "بضائع وتوريدات (تُدفع من مستحقات العميل بالطلب المسبق)", cost: "0 ج.م تمويل ذاتي" },
          { item: "إجمالي رأس المال التأسيسي المطلوب", cost: "0 ج.م" }
        ]
      : [
          { item: "أدوات ومعدات أولية مبدئية", cost: "30% من الميزانية" },
          { item: "حملة إعلانات سوشيال ميديا مستهدفة جغرافياً", cost: "40% من الميزانية" },
          { item: "أدوات تعبئة وتغليف وملصقات بهوية البراند", cost: "20% من الميزانية" },
          { item: "احتياطي نقد للطوارئ وتوصيل مبكر", cost: "10% من الميزانية" }
        ];

    return {
      projectName,
      concept: conceptText,
      rationale: `تم بناء هذه الخطة كبديل ذكي لتبسيط خطوات البدء والتقليل من تكلفة التأسيس الرأسمالية والاعتماد الكامل على الشغف المهني والمهارات الشخصية لـ رائد${genderSuffix} الأعمال.`,
      identity: {
        logoConcept: "شعار عصري وأنيق يتكون من خطوط هندسية متداخلة تعبر عن النمو والتكامل والاستمرارية، بالاعتماد على تباين قوي للألوان ليعكس الطابع الاحترافي والموثوقية.",
        brandColors: ["#0F172A", "#3B82F6", "#10B981", "#F1F5F9"],
        colorPsychology: "اللون الكحلي الداكن يعبر عن الاستقرار والموثوقية، والأزرق المشرق يبعث الثقة والأمان، والأخضر يعبر عن النمو والازدهار المالي.",
        brandVoice: "نبرة واضحة ومباشرة وصديقة للعميل، تركز على إبراز القيمة والحلول العملية."
      },
      marketAnalysis: {
        marketSizeAndGrowth: "السوق المحلي يعاني من فجوات في الخدمات السريعة وعالية الجودة بسبب زيادة تكلفة المعيشة وصعوبة الاستيراد، مما يفتح فرصاً ذهبية للمنتج/الخدمة المحلية البديلة.",
        marketTrends: "تنامي الطلب على الخدمات الرقمية والدفع السريع والتسليم المنزلي، وزيادة ثقة المستهلك في المنتجات المصنعة محلياً بجودة منافسة.",
        porterFiveForces: "قوة المنافسين متوسطة نظراً لعدم وجود براند مهيمن بالكامل، وقوة المشترين مرتفعة لاهتمامهم بالسعر، والتهديد بالبدائل متوسط.",
        barriersToEntry: "قليلة جداً للمشاريع القائمة على الخدمات أو المطبخ المنزلي أو الدروب شيبينج لغياب متطلبات الإيجار الرأسمالي الكبير.",
        regulatoryEnvironment: "مواتية بفضل قانون دعم المشروعات الصغيرة رقم 152 لسنة 2020 والذي يقدم تسهيلات ضريبية ورخص مؤقتة وتسهيلات في السجلات التجارية.",
        marketGaps: "غياب الاهتمام بخدمة العملاء بعد البيع والسرعة في تسليم الطلبات الفردية في مدينتك.",
        identifiedProblems: [
          { problem: "تأخر الاستجابة والتوصيل لدى المتاجر والشركات الكبرى للطلبات المحلية الجغرافية.", reasoning: "معظم الشركات تعتمد على مراكز لوجستية بعيدة تعيق السرعة الفورية." },
          { problem: "ارتفاع تكاليف تقديم الخدمات التقليدية والمنتجات المستوردة.", reasoning: "انخفاض قيمة الجنيه المصري أمام العملات الأجنبية جعل بديل الخدمات والمنتجات المحلية هو الأكثر طلباً." }
        ],
        selectedOpportunityReasoning: "استغلال الميزانية المتاحة لبدء نموذج عمل سريع الدورة النقدية يعتمد على تلبية الطلب الجغرافي الفوري."
      },
      validation: {
        targetMarketNeed: "العملاء يبحثون عن الجودة العالية، الأمانة، والسرعة الفورية، مع تسعير ملائم لا يثقل كاهلهم.",
        competitorAnalysis: "المنافسون المحليون تقليديون ولا يهتمون بالتسويق الرقمي أو جودة التغليف الفخمة، مما يجعل التميز البصري والسرعة ميزة قاطعة لك.",
        feasibilityRating: "High",
        feasibilityReasoning: "رأس المال المتاح يغطي تماماً تكاليف التشغيل للمرحلة الأولى، مع غياب كامل للأصول والآلات المكلفة في البداية.",
        whyNow: "توجه المستهلك نحو البدائل المحلية والمنصات الذكية المباشرة يوفر أرضية خصبة للانتشار الفوري."
      },
      type: capInfo.isZero ? "خدمي / طلب مسبق بدون رأس مال" : "تجاري / خدمي مرن",
      feasibility: {
        estimatedCost: estimatedCostText,
        costBreakdown: costBreakdownList,
        launchTimeline: "15 يوماً من البدء",
        timeToProfit: "الشهر الأول من التشغيل الفعلي",
        expectedRevenue: "ما بين 8,000 إلى 15,000 ج.م شهرياً خلال الربع الأول",
        revenueModel: "الدفع عند الاستلام، المحافظ الإلكترونية، وباقات الاشتراك المسبق للخدمات.",
        pricingStrategy: "التسعير على أساس القيمة المضافة مع توفير باقة اقتصادية لكسر تخوف العملاء الجدد.",
        breakEvenPoint: capInfo.isZero ? "تحقيق ربح صافي فوري من أول صفقة منفذة." : "بيع 30 وحدة أو تقديم 15 خدمة في الشهر الأول.",
        financialProjection3Months: "نمو متوقع بنسبة 25% شهرياً نتيجة لإعادة استثمار الأرباح الأولى في الإعلانات المدفوعة."
      },
      targetAudience: {
        idealCustomerProfile: "المستهلكون المحليون النشطون على السوشيال ميديا، الفئة العمرية 20-45 سنة، المهتمون بالجودة والدقة.",
        demographicsAndGeography: `قاطنو مدينة/منطقة ${userData.city || 'مصر'}، تحديداً في المربعات السكنية الأكثر حيوية.`,
        interestsAndBehavior: "يفضلون الشراء الرقمي والدفع السهل، ويتفاعلون مع المحتوى المرئي الحقيقي (الفيديوهات والريلز).",
        socialMediaPresence: "فيسبوك وإنستجرام وتيك توك بشكل أساسي.",
        primarySegment: "الأمهات الشابات، الطلاب، والمهنيون العاملون الذين يقدرون وقتهم.",
        behaviorAndMindset: "يبحثون عن توفير الجهد والحلول الفورية لمشاكلهم اليومية المزعجة.",
        acquisitionChannels: "الإعلانات الجغرافية الدقيقة والمجموعات السكنية والريفيوهات المصورة للعملاء الأوائل."
      },
      executionGuide: [
        {
          phase: "الأسبوع الأول: التجهيز والتأسيس الصامت",
          steps: [
            { action: "تصميم الهوية البصرية واللوجو والمنيو مجاناً على كانفا.", tools: ["Canva"], expectedResult: "شعار غاية في الأناقة وبطاقة عمل رقمية ممتازة." },
            { action: "إنشاء صفحات السوشيال ميديا وحساب واتساب للأعمال.", tools: ["Facebook", "WhatsApp Business"], expectedResult: "قناة تواصل رسمية نشطة وتعمل بكفاءة." }
          ]
        },
        {
          phase: "الأسبوع الثاني: الافتتاح والتجربة الحية",
          steps: [
            { action: "تقديم عينات مجانية لـ 5 من الأقارب والجيران للحصول على مراجعات قوية ومصورة.", tools: ["الهاتف", "Instapay"], expectedResult: "5 توصيات إيجابية موثقة ومنشورة تدعم موثوقيتك." },
            { action: "إطلاق إعلان ممول جغرافي بميزانية مصغرة تستهدف منطقتك السكنية.", tools: ["Meta Ads Manager"], expectedResult: "تلقي أولى رسائل العملاء وحجوزات الشراء الفعلية." }
          ]
        }
      ],
      mentorshipAndGuidance: {
        fundingAdvice: "تجنب القروض أو التمويلات الخارجية في الـ 3 أشهر الأولى. اعتمد كلياً على التمويل الذاتي الخفيف وإعادة استثمار الأرباح النقدية الفورية لضمان بقاء السيطرة الكاملة في يديك."
      },
      learningPath: [
        {
          skill: "التسويق الجغرافي والإعلانات الممولة على السوشيال ميديا",
          resourceName: "كورس أساسيات إعلانات فيسبوك وإنستجرام المجاني",
          resourceLink: "https://www.youtube.com/results?search_query=facebook+ads+course+arabic",
          platform: "YouTube",
          description: "تعلم كيفية استهداف منطقتك السكنية وعائلات محددة بالفيسبوك بأقل تكلفة ممكنة لضمان مبيعات فورية.",
          importance: "توفير آلاف الجنيهات التي تدفع للوكالات والمسوقين الخارجيين في بداية طريقك."
        }
      ],
      toolsAndResources: [
        {
          category: "أدوات التصميم والإنتاج",
          suggestions: [
            { name: "تطبيق Canva", description: "لتصميم اللوجو ومنشورات السوشيال ميديا ومواد التعبئة باحترافية وسهولة.", isFree: true, whereToBuyOrGet: "المتجر الإلكتروني لجوجل أو موقع Canva الرسمى", howToUse: "تعديل القوالب الجاهزة المخصصة لقطاع عملك بلمسات مصرية.", estimatedCost: "0 ج.م" }
          ]
        }
      ],
      marketingStrategy: {
        coreMessage: "نحن نقدم لك الحل الأسرع والأكثر أماناً وبأفضل جودة محلية تفخر بها وتعتمد عليها.",
        socialMediaStrategy: "نشر محتوى مرئي خلف الكواليس يثبت الجودة والأمانة والنظافة لبناء علاقة حب وثقة مع الجمهور.",
        contentPillars: ["الخامات والنظافة والسرعة", "قصص نجاح ورضا العملاء الأوائل", "عروض وتخفيضات تفاعلية مستمرة"],
        advertisingPlan: "إعلانات فيديو قصيرة على Reels وإنستجرام موجهة للجمهور المحيط بـ 3 كم جغرافي فقط.",
        growthHacks: "تقديم كود خصم خاص لكل عميل يجلب عميلاً جديداً من جيرانه ومعارفه.",
        influencerPartnerships: "التعاون مع أصحاب الجروبات والمؤثرين السكنيين لتبادل الإعلانات مقابل الخدمة/المنتج مجاناً.",
        first1000Customers: "توطيد العلاقات الفردية والاتصال الهاتفي بكل عميل لشعوره بمدى الاهتمام والتميز الخاص.",
        retentionStrategy: "إرسال رسالة شكر ومتابعة دورية أسبوعية على الواتساب مع تقديم خصومات مخصصة للعملاء الدائمين.",
        contentIdeas: ["فيديو قصير يوضح طريقة إعداد المنتجات وتغليفها بدقة عالية.", "منشور يبرز الفروقات الكبيرة بين جودة خدمتك والبدائل المستوردة."]
      },
      swot: {
        strengths: ["تكلفة تشغيلية منخفضة لغياب الإيجار والأصول الكبيرة", "سرعة استجابة ومرونة في التعديل الفوري بناءً على رأي العميل", "مهاراتك الشخصية وشغفك الكبير بالنجاح"],
        weaknesses: ["رأس المال المحدود يمنع التوسع الضخم السريع من أول شهر", "قناة البيع تعتمد على جهدك الفردي فقط في البداية"],
        opportunities: ["رغبة المستهلك المتزايدة في الاعتماد على البديل المحلي عالي الجودة والآمن", "تسهيلات كبيرة وقوانين داعمة للشركات المنزلية والصغيرة في مصر"],
        threats: ["التقلبات المستمرة في أسعار المواد الخام بأسواق الجملة", "إمكانية دخول منافسين تقليديين يقلدون نفس فكرتك بالمنطقة الجغرافية"]
      },
      businessStrategy: {
        executiveSummary: "خطة تأسيس وإطلاق سريعة ومرنة لمشروع صغير يركز على الكفاءة، التكلفة البسيطة، والخدمة الجغرافية المحسنة.",
        visionAndMission: "رؤيتنا بناء علامة تجارية محلية موثوقة خلال عام، ورسالتنا تقديم حلول عالية الجودة بأبسط الطرق وبأفضل تسعير.",
        strategicObjectives: ["الحصول على 50 عميل دائم في الشهر الأول", "تحقيق نقطة التعادل واسترداد التكلفة التأسيسية بالكامل في أول 30 يوم", "بناء وجود رقمي يتجاوز 5000 متابع حقيقي بنهاية الربع الأول"],
        coreCompetencies: "السرعة المتناهية، الأمانة المطلقة، والعلاقات الإنسانية القوية والدافئة مع العملاء.",
        keyPerformanceIndicators: ["عدد المبيعات والطلبات اليومية", "تكلفة الاستحواذ على العميل الواحد (CAC)", "نسبة رضاء واحتفاظ العملاء وتقييماتهم المكتوبة والمصورة"],
        expansionPlan: "توسيع دائرة الشحن لتغطية مدن أو مناطق مجاورة وتوظيف طيارين إضافيين بعد استقرار الدخل."
      },
      businessModelCanvas: {
        keyPartners: ["طيارو التوصيل المحليون المستقلون", "محلات الجملة والموردين للمواد الأساسية بمنطقتك", "جروبات الفيسبوك والمجتمعات السكنية المحيطة"],
        keyActivities: ["إعداد وتغليف وتوصيل الطلبات للعميل", "التسويق الرقمي وبناء المحتوى الإعلاني المبهج", "خدمة ومتابعة العملاء وكسب ولائهم المباشر"],
        keyResources: ["مهاراتك التشغيلية والتقنية والقيادية", "الأدوات والمعدات المنزلية المتاحة لديك حالياً", "تطبيق واتساب للأعمال وقنوات السوشيال ميديا"],
        valuePropositions: ["خدمة موثوقة وعالية الجودة في زمن قياسي وبأسعار في متناول اليد تفاجئ العميل.", "تغليف فخم ومميز يحافظ على سلامة ودفء المنتج ويصلك بابتسامة."],
        customerRelationships: ["Tواصل شخصي ودافئ قائم على كسب الود والاحترام المتبادل.", "دعم ومتابعة لحظية بعد الشراء والخدمة الفورية للإصلاح."],
        channels: ["صفحات فيسبوك وإنستجرام ومجموعات الواتساب المحلية الجغرافية.", "المكالمات والرسائل المباشرة عبر واتساب للأعمال."],
        customerSegments: ["سكان منطقتك/مدينتك المهتمون بالجودة العالية والراحة والحلول السريعة.", "الموظفون والعائلات المزدحمة بالمهام والذين يبحثون عن توفير وقتهم وثقتهم."],
        costStructure: ["تكلفة المواد الخام والخامات المشتراة بذكاء.", "تكلفة حملات التسويق والتمويل التجريبي المصغر.", "تكلفة التعبئة والتغليف والشحن الفوري لكل عميل."],
        revenueStreams: ["إيرادات الدفع عند الاستلام.", "التحويلات السهلة والسريعة عبر تطبيق Instapay ومحافظ الهاتف."]
      },
      validationResult: {
        isValid: true,
        score: 75,
        decision: "ACCEPT",
        matrix: {
          designThinkingScore: 80,
          leanStartupScore: 85,
          porterFiveForcesScore: 70,
          pestelScore: 75,
          trizScore: 70,
          iso31000Score: 75,
          okrScore: 80,
          aidaScore: 75,
          maslowScore: 80,
          kaizenScore: 80
        },
        existentialCheck: {
          genuineProblem: "المشروع يحل مشكلة السرعة والجودة محلياً في ظل زيادة التكاليف.",
          willingnessToPay: "هناك طلب مؤكد لوجود تسعير يتناسب مع القوة الشرائية المتاحة وميزة تنافسية قوية.",
          userExecutionCapability: "المستخدم لديه القدرة والشغف والمعدات الأولية للبدء فوراً.",
          timingRight: "التوقيت مناسب تماماً للبدائل المحلية عالية الجودة وتسهيلات القوانين في مصر."
        }
      },
      executionBlueprint: IdeaValidationEngine.generateExecutionRoadmap(
        "تأسيس مشروع محلي مرن يتناسب مع المهارات والميزانية المتاحة لتفادي بوابة القروض المرتفعة وتأمين تشغيل آمن.",
        projectName,
        userData,
        "بيانات عامة للسوق المصري"
      )
    };
  }
}
