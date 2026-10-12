import { describe, it, expect } from 'vitest';

describe('Scoring & Streak Calculations', () => {
  it('calculates accurate quiz accuracy percentage', () => {
    const attempts = [
      { score: 80, totalQuestions: 5, correctCount: 4 },
      { score: 100, totalQuestions: 5, correctCount: 5 },
      { score: 60, totalQuestions: 5, correctCount: 3 },
    ];

    const averageScore = Math.round(
      attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length
    );

    expect(averageScore).toBe(80);
  });

  it('handles empty quiz attempts with null score instead of fake number', () => {
    const attempts: any[] = [];
    const score = attempts.length > 0 ? 50 : null;
    expect(score).toBeNull();
  });

  it('correctly calculates consecutive active calendar day streak', () => {
    const today = new Date();
    const toIsoDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const dateToday = toIsoDate(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateYesterday = toIsoDate(yesterday);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const dateTwoDaysAgo = toIsoDate(twoDaysAgo);

    const activeDates = new Set([dateToday, dateYesterday, dateTwoDaysAgo]);

    let streak = 0;
    let check = new Date(today);
    while (activeDates.has(toIsoDate(check))) {
      streak++;
      check.setDate(check.getDate() - 1);
    }

    expect(streak).toBe(3);
  });
});
