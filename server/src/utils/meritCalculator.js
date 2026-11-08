import { BRANCH_QUOTAS } from '../data/initialStore.js';

/**
 * Computes PCM Aggregate Percentage
 */
export const calculatePcmAggregate = (physics, chemistry, math) => {
  const p = Number(physics) || 0;
  const c = Number(chemistry) || 0;
  const m = Number(math) || 0;
  if (!p || !c || !m) return 0;
  const avg = (p + c + m) / 3;
  return Number(avg.toFixed(2));
};

/**
 * Checks general B.Tech eligibility
 */
export const checkEligibility = (pcmPercent, examRank, examType = 'WBJEE') => {
  const meetsAcademicCutoff = pcmPercent >= 60.0;
  const hasRank = Boolean(examRank && examRank > 0);

  const eligibleDepartments = [];
  const ineligibleDepartments = [];

  for (const [key, quota] of Object.entries(BRANCH_QUOTAS)) {
    const cutoff = examType === 'WBJEE' ? quota.cutoffRankWBJEE : quota.cutoffRankJEE;
    if (meetsAcademicCutoff && hasRank && examRank <= cutoff) {
      eligibleDepartments.push({
        branch: key,
        name: quota.name,
        cutoff,
        candidateRank: examRank
      });
    } else {
      ineligibleDepartments.push({
        branch: key,
        name: quota.name,
        cutoff,
        reason: !meetsAcademicCutoff
          ? 'PCM aggregate below 60.0%'
          : examRank > cutoff
          ? `Rank (${examRank}) exceeds cutoff (${cutoff})`
          : 'Rank required'
      });
    }
  }

  return {
    isOverallEligible: meetsAcademicCutoff && hasRank && eligibleDepartments.length > 0,
    pcmPercent,
    meetsAcademicCutoff,
    eligibleDepartments,
    ineligibleDepartments
  };
};

/**
 * Calculates Composite Merit Score out of 100
 * - 40% Entrance Rank normalized score
 * - 35% 12th PCM aggregate
 * - 25% 10th Board aggregate
 */
export const calculateMeritScore = (application) => {
  const pcm = application.academic?.pcmPercentage || 0;
  const p10 = application.academic?.percent10 || 0;
  const rank = application.academic?.examRank || 100000;
  
  // Normalize rank: 1 -> 100, 100000 -> 0
  const normalizedRankScore = Math.max(0, Math.min(100, 100 - (rank / 1000)));
  const compositeScore = (normalizedRankScore * 0.40) + (pcm * 0.35) + (p10 * 0.25);
  
  return Number(compositeScore.toFixed(2));
};
