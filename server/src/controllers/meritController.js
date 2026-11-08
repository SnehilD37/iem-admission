import { store } from '../data/initialStore.js';
import { checkEligibility, calculatePcmAggregate, calculateMeritScore } from '../utils/meritCalculator.js';

export const checkApplicantEligibility = (req, res) => {
  const { physics, chemistry, math, examRank, examType } = req.body;
  
  const pcm = calculatePcmAggregate(physics, chemistry, math);
  const result = checkEligibility(pcm, Number(examRank) || 0, examType || 'WBJEE');

  res.json({
    success: true,
    ...result
  });
};

export const getMeritRanking = (req, res) => {
  const apps = store.applications.map(app => {
    const score = calculateMeritScore(app);
    return {
      ...app,
      meritScore: score
    };
  });

  // Sort descending by meritScore
  apps.sort((a, b) => b.meritScore - a.meritScore);

  res.json({
    success: true,
    meritList: apps.map((app, index) => ({
      meritRank: index + 1,
      id: app.id,
      fullName: app.personal?.fullName,
      meritScore: app.meritScore,
      pcmPercentage: app.academic?.pcmPercentage,
      examType: app.academic?.examType,
      examRank: app.academic?.examRank,
      allottedBranch: app.allottedBranch,
      status: app.status,
      preferences: app.preferences
    }))
  });
};

export const batchAllotSeats = (req, res) => {
  let countAllotted = 0;
  
  const eligibleApps = store.applications
    .filter(a => a.status === 'VERIFIED_ELIGIBLE' && !a.allottedBranch)
    .sort((a, b) => (a.academic?.examRank || 999999) - (b.academic?.examRank || 999999));

  for (const app of eligibleApps) {
    const prefs = app.preferences || ['CSE', 'IT', 'ECE'];
    for (const pref of prefs) {
      const quota = store.quotas[pref];
      if (quota && quota.allotted < quota.totalSeats) {
        quota.allotted += 1;
        app.allottedBranch = pref;
        app.status = 'SEAT_OFFERED';
        app.allotmentDate = new Date().toISOString();
        app.history.push({
          timestamp: new Date().toISOString(),
          event: `Auto-allotted seat in ${pref} via Batch Allotment Algorithm`,
          actor: 'Merit Engine'
        });
        countAllotted++;
        break;
      }
    }
  }

  res.json({
    success: true,
    message: `Batch allotment run completed. ${countAllotted} candidate(s) offered seats.`,
    countAllotted,
    quotas: store.quotas
  });
};
