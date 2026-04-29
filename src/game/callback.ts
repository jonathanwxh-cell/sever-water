import { shouldRenderLuYuanHesitationCallback, shouldRenderTooManyQuestions, getLiuRuyanOneOfThoseIntonation } from '../state';

export default function resolveCallbackNode(choiceId: string, defaultNext: string): string {
  if (choiceId === '3A' && shouldRenderLuYuanHesitationCallback()) return 'callback_3a_lu';
  if (choiceId === '3B') return getLiuRuyanOneOfThoseIntonation() === 'recognition' ? 'callback_3b_liu_recognition' : 'callback_3b_liu';
  if (choiceId === '3C' && shouldRenderTooManyQuestions()) return 'callback_3c_too_many';
  return defaultNext;
}
