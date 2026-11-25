import { UserProfile, TOKEN_COSTS } from '../types/types';

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
    formattedTimeLeft = `${hours} \u0633\u0627\u0639\u0629 \u0648 ${minutes} \u062f\u0642\u064a\u0642\u0629 \u0648 ${seconds} \u062b\u0627\u0646\u064a\u0629`;
  } else if (minutes > 0) {
    formattedTimeLeft = `${minutes} \u062f\u0642\u064a\u0642\u0629 \u0648 ${seconds} \u062b\u0627\u0646\u064a\u0629`;
  } else {
    formattedTimeLeft = `${seconds} \u062b\u0627\u0646\u064a\u0629`;
  }

  return {
    hasReachedLimit: true,
    currentCount: 1,
    remainingSeconds,
    formattedTimeLeft
  };
}
