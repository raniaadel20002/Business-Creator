


export interface SavedProject {
  id: string;
  projectName: string;
  concept: string;
  type: string;
  planData: string;
  createdAt: string;
}

export interface UserData {
  // Step 1: Personal Data
  fullName: string;
  email: string;
  age: string;
  phone: string;
  gender: string;
  socialLinks: string;
  nationality: string;
  country?: string;
  city: string;
  ultimateDream: string;
  
  // Step 2: Educational & Professional
  educationLevel: string;
  fieldOfStudy: string;
  professionalExperience: string;
  trainingCourses: string;
  basicSkills: string;
  
  // Step 3: Financial & Resources
  availableCapital: string;
  fundingSources: string;
  availableEquipment: string;
  
  // Step 4: Interests & Hobbies
  hobbies: string;
  fieldInterests: string;
  followedContent: string;
  inspiringActivities: string;
  talent: string;
  
  // Step 5: Organizational & Administrative
  managementExperience: string;
  expectedChallenges: string;
  
  // Step 6: Additional Notes & Preferences
  initialIdeas: string;
  specialNotes: string;
  projectTypePreference: string;
  executionPreference: string;
  businessTypePreference: string;
  preferredProjectModels?: string[];
  preferredIndustries?: string[];
  customIndustry?: string;
  geolocation?: { lat: number; lng: number } | null;
  clarifyingAnswers?: { question: string; answer: string }[];
  excludedIdeas?: string[];
  previousProjects?: string[];
}

export interface ChallengeAdviceItem {
  title: string;
  advice: string;
  links: { name: string; url: string }[];
}

export interface RejectionReport {
  rejectionReasonSummary: string;
  failureGates: string[];
  alternatives: {
    projectName: string;
    concept: string;
    rationale: string;
  }[];
  correctionPlan: string[];
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  decision: 'ACCEPT' | 'REJECT' | 'PIVOT';
  matrix: {
    designThinkingScore: number;
    leanStartupScore: number;
    porterFiveForcesScore: number;
    pestelScore: number;
    trizScore: number;
    iso31000Score: number;
    okrScore: number;
    aidaScore: number;
    maslowScore: number;
    kaizenScore: number;
  };
  existentialCheck: {
    genuineProblem: string;
    willingnessToPay: string;
    userExecutionCapability: string;
    timingRight: string;
  };
  rejectionReport?: RejectionReport;
}

export interface ExecutionBlueprint {
  days: {
    day: number;
    action: string;
    costEstimate: string;
    expectedOutcome: string;
    tools: string[];
    measurementMetric: string;
  }[];
  weeks: {
    week: number;
    milestone: string;
    tasks: string[];
    estimatedCost: string;
    successMetric: string;
  }[];
}

export interface BusinessPlan {
  id?: string;
  projectName: string;
  identity: {
    brandNamingStrategy?: {
      generatedNames: string[];
      top3Names: {
        name: string;
        evaluationScore: number;
        deepExplanation: string;
        brandPositioning: string;
        logoDirection: string;
        domainSuggestion: string;
        riskCheck: string;
      }[];
      finalRecommendation: {
        winnerName: string;
        reasoning: string;
      };
    };
    logoSystem?: {
      logoConceptExplanation: string;
      primarySvg: string;
      blackSvg: string;
      whiteSvg: string;
      faviconSvg: string;
      primaryPromptForImageAI: string;
      usageNote: string;
      primaryPngBase64?: string;
    };
    brandIdentitySystem?: {
      brandFoundation: {
        mission: string;
        vision: string;
        coreValues: string[];
      };
      brandPositioning: {
        differentiation: string;
        targetAudience: string;
        problemSolved: string;
      };
      logoConcept: {
        logoType: string;
        conceptIdea: string;
        shapePsychology: string;
        scalability: string;
        colorLogic: string;
      };
      visualIdentitySystem: {
        colorPalette: {
          primary: string[];
          secondary: string[];
          background: string[];
        };
        typography: {
          headingStyle: string;
          bodyStyle: string;
          reasoning: string;
        };
        visualStyle: {
          imageDirection: string;
          iconStyle: string;
          layoutStyle: string;
        };
        consistencySystem: string;
      };
      brandPersona: {
        personalityTraits: string[];
        behaviorStyle: string;
        communicationAttitude: string;
        archetype: string;
        reactionUnderPressure: string;
        trustBuilding: string;
      };
      brandExperience: {
        websiteFeeling: string;
        customerInteraction: string;
        productExperience: string;
        emotionalJourney: string;
      };
      qualityControl: {
        scalable: string;
        distinctive: string;
        memorable: string;
        consistent: string;
      };
    };
    logoConcept: string;
    brandColors: string[];
    typography?: {
      fontFamily: string;
      description: string;
    };
    colorPsychology?: string;
    brandVoice?: string;
  };
  concept: string;
  rationale: string;
  marketAnalysis: {
    marketSizeAndGrowth: string;
    marketTrends: string;
    porterFiveForces: string;
    barriersToEntry: string;
    regulatoryEnvironment: string;
    marketGaps: string;
    identifiedProblems: { problem: string; reasoning: string }[];
    selectedOpportunityReasoning: string;
  };
  validation: {
    targetMarketNeed: string;
    competitorAnalysis: string;
    competitorsDetailed?: {
      name: string;
      type: 'مباشر' | 'غير مباشر';
      url: string;
      location: string;
      description: string;
      strengths: string[];
      weaknesses: string[];
      howToCompete: string;
    }[];
    feasibilityRating: 'Low' | 'Medium' | 'High';
    feasibilityReasoning: string;
    whyNow: string;
  };
  type: string;
  feasibility: {
    estimatedCost: string;
    costBreakdown: { item: string; cost: string }[];
    launchTimeline: string;
    timeToProfit: string;
    expectedRevenue: string;
    revenueModel: string;
    pricingStrategy: string;
    breakEvenPoint: string;
    financialProjection3Months: string;
  };
  targetAudience: {
    idealCustomerProfile: string;
    demographicsAndGeography: string;
    interestsAndBehavior: string;
    socialMediaPresence: string;
    primarySegment: string;
    behaviorAndMindset: string;
    acquisitionChannels: string;
  };
  executionGuide: {
    phase: string;
    steps: {
      action: string;
      tools: string[];
      expectedResult: string;
    }[];
  }[];
  mentorshipAndGuidance: {
    fundingAdvice: string;
  };
  learningPath: {
    skill: string;
    resourceName: string;
    resourceLink: string;
    platform: 'YouTube' | 'Udemy' | 'Coursera' | 'LinkedIn' | 'Other';
    description: string;
    importance: string;
  }[];
  toolsAndResources: {
    category: string;
    suggestions: { 
      name: string; 
      link?: string; 
      description: string; 
      isFree: boolean;
      whereToBuyOrGet: string;
      howToUse: string;
      estimatedCost: string;
    }[];
  }[];
  challengesAdvice?: ChallengeAdviceItem[];
  marketingStrategy: {
    coreMessage: string;
    socialMediaStrategy: string;
    contentPillars: string[];
    advertisingPlan: string;
    growthHacks: string;
    influencerPartnerships: string;
    first1000Customers: string;
    retentionStrategy: string;
    contentIdeas: string[];
  };
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  businessStrategy?: {
    executiveSummary: string;
    visionAndMission: string;
    strategicObjectives: string[];
    coreCompetencies: string;
    keyPerformanceIndicators: string[];
    expansionPlan: string;
  };
  investmentAndIncubation?: {
    investmentReadiness: string;
    pitchDeckTips: string;
    howToCommunicate: string;
    recommendedIncubators: {
      name: string;
      type: string;
      description: string;
      requirements: string;
      website: string;
      phone: string;
      googleMapsLink: string;
      location: string;
    }[];
  };
  businessModelCanvas?: {
    keyPartners: string[];
    keyActivities: string[];
    keyResources: string[];
    valuePropositions: string[];
    customerRelationships: string[];
    channels: string[];
    customerSegments: string[];
    costStructure: string[];
    revenueStreams: string[];
  };
  clarifyingQuestions?: string[];
  isPro?: boolean;
  isExecuted?: boolean;
  validationResult?: ValidationResult;
  executionBlueprint?: ExecutionBlueprint;
}

export type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type SubscriptionTier = 'FREE' | 'PRO';

export interface UserProfile {
  uid: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  subscriptionPlan?: SubscriptionTier;
  userData?: UserData;
  tokens?: number;
  dailyGenerations?: number;
  lastGenerationDate?: string;
  createdAt: string;
  updatedAt?: string;
  banned?: boolean;
  formStatus?: 'started' | 'completed';
  lastFormUpdateAt?: string;
  reminderEmailSent?: boolean;
}

export interface ActivityLog {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  module: string;
  timestamp: string;
  details?: any;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  projectId?: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
}

export interface UserNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'balance_depleted' | 'recharge_renew' | 'project_created' | 'logo_created' | 'feedback_submitted' | 'info' | 'error' | 'support_reply';
  createdAt: string;
  read: boolean;
  suggestWhatsApp?: boolean;
  isOfficial?: boolean;
}

export const TOKEN_COSTS = {
  IDEA_GENERATION: 25000,
  LOGO_GENERATION: 10000,
  ADVISOR_MESSAGE: 500,
  COMPLETE_PRO_PLAN: 25000,
} as const;

export function getDailyGenerationStatus(profile: UserProfile | null | undefined): {
  hasReachedLimit: boolean;
  currentCount: number;
  remainingSeconds: number;
  formattedTimeLeft: string;
} {
  if (!profile) {
    return { hasReachedLimit: false, currentCount: 0, remainingSeconds: 0, formattedTimeLeft: '' };
  }

  const isAdmin = profile.email === 'ashrafmena999@gmail.com';
  if (isAdmin) {
    return { hasReachedLimit: false, currentCount: 0, remainingSeconds: 0, formattedTimeLeft: '' };
  }

  if ((profile.tokens || 0) >= TOKEN_COSTS.IDEA_GENERATION) {
    return { hasReachedLimit: false, currentCount: 0, remainingSeconds: 0, formattedTimeLeft: '' };
  }

  const isFreePlan = !profile.subscriptionPlan || profile.subscriptionPlan === 'FREE';
  if (!isFreePlan) {
    return { hasReachedLimit: false, currentCount: 0, remainingSeconds: 0, formattedTimeLeft: '' };
  }

  const lastGen = profile.lastGenerationDate;
  const rawCount = profile.dailyGenerations || 0;

  if (!lastGen || rawCount <= 0) {
    return { hasReachedLimit: false, currentCount: 0, remainingSeconds: 0, formattedTimeLeft: '' };
  }

  let lastGenTime = 0;
  if (lastGen.includes('T')) {
    lastGenTime = new Date(lastGen).getTime();
  } else {
    lastGenTime = new Date(lastGen + 'T00:00:00.000Z').getTime();
  }

  if (isNaN(lastGenTime)) {
    return { hasReachedLimit: false, currentCount: 0, remainingSeconds: 0, formattedTimeLeft: '' };
  }

  const now = Date.now();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  const elapsedMs = now - lastGenTime;

  if (elapsedMs >= twentyFourHoursMs) {
    return { hasReachedLimit: false, currentCount: 0, remainingSeconds: 0, formattedTimeLeft: '' };
  }

  const remainingMs = twentyFourHoursMs - elapsedMs;
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  let formattedTimeLeft = '';
  if (hours > 0) {
    formattedTimeLeft = `${hours} ساعة و ${minutes} دقيقة و ${seconds} ثانية`;
  } else if (minutes > 0) {
    formattedTimeLeft = `${minutes} دقيقة و ${seconds} ثانية`;
  } else {
    formattedTimeLeft = `${seconds} ثانية`;
  }

  return {
    hasReachedLimit: true,
    currentCount: 1,
    remainingSeconds,
    formattedTimeLeft
  };
}

