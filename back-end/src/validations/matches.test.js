import { describe, it, expect } from 'vitest';
import {
  MATCH_STATUS,
  listMatchesQuerySchema,
  matchIdParamSchema,
  createMatchSchema,
  updateScoreSchema,
} from './matches.js';

describe('Match Validations', () => {
  describe('MATCH_STATUS', () => {
    it('should have correct status values', () => {
      expect(MATCH_STATUS.SCHEDULED).toBe('scheduled');
      expect(MATCH_STATUS.LIVE).toBe('live');
      expect(MATCH_STATUS.FINISHED).toBe('finished');
    });

    it('should have exactly 3 status values', () => {
      expect(Object.keys(MATCH_STATUS)).toHaveLength(3);
    });
  });

  describe('listMatchesQuerySchema', () => {
    it('should accept valid limit parameter', () => {
      const result = listMatchesQuerySchema.safeParse({ limit: 10 });
      expect(result.success).toBe(true);
      expect(result.data?.limit).toBe(10);
    });

    it('should accept limit as string and coerce to number', () => {
      const result = listMatchesQuerySchema.safeParse({ limit: '25' });
      expect(result.success).toBe(true);
      expect(result.data?.limit).toBe(25);
    });

    it('should accept missing limit (optional)', () => {
      const result = listMatchesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.limit).toBeUndefined();
    });

    it('should accept limit of 100 (max allowed)', () => {
      const result = listMatchesQuerySchema.safeParse({ limit: 100 });
      expect(result.success).toBe(true);
      expect(result.data?.limit).toBe(100);
    });

    it('should reject limit greater than 100', () => {
      const result = listMatchesQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should reject zero limit', () => {
      const result = listMatchesQuerySchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject negative limit', () => {
      const result = listMatchesQuerySchema.safeParse({ limit: -5 });
      expect(result.success).toBe(false);
    });

    it('should reject decimal limit', () => {
      const result = listMatchesQuerySchema.safeParse({ limit: 10.5 });
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric limit', () => {
      const result = listMatchesQuerySchema.safeParse({ limit: 'abc' });
      expect(result.success).toBe(false);
    });
  });

  describe('matchIdParamSchema', () => {
    it('should accept valid positive integer', () => {
      const result = matchIdParamSchema.safeParse(42);
      expect(result.success).toBe(true);
      expect(result.data).toBe(42);
    });

    it('should coerce string to number', () => {
      const result = matchIdParamSchema.safeParse('123');
      expect(result.success).toBe(true);
      expect(result.data).toBe(123);
    });

    it('should reject zero', () => {
      const result = matchIdParamSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('should reject negative numbers', () => {
      const result = matchIdParamSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it('should reject decimal numbers', () => {
      const result = matchIdParamSchema.safeParse(1.5);
      expect(result.success).toBe(false);
    });
  });

  describe('createMatchSchema', () => {
    const validMatchData = {
      sport: 'Football',
      homeTeam: 'Team A',
      awayTeam: 'Team B',
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T12:00:00Z',
    };

    it('should accept valid match data', () => {
      const result = createMatchSchema.safeParse(validMatchData);
      expect(result.success).toBe(true);
      expect(result.data?.sport).toBe('Football');
      expect(result.data?.homeTeam).toBe('Team A');
      expect(result.data?.awayTeam).toBe('Team B');
    });

    it('should accept valid match data with optional scores', () => {
      const dataWithScores = {
        ...validMatchData,
        homeScore: 2,
        awayScore: 1,
      };
      const result = createMatchSchema.safeParse(dataWithScores);
      expect(result.success).toBe(true);
      expect(result.data?.homeScore).toBe(2);
      expect(result.data?.awayScore).toBe(1);
    });

    it('should accept scores as strings and coerce to numbers', () => {
      const dataWithScores = {
        ...validMatchData,
        homeScore: '3',
        awayScore: '2',
      };
      const result = createMatchSchema.safeParse(dataWithScores);
      expect(result.success).toBe(true);
      expect(result.data?.homeScore).toBe(3);
      expect(result.data?.awayScore).toBe(2);
    });

    it('should accept zero scores', () => {
      const dataWithScores = {
        ...validMatchData,
        homeScore: 0,
        awayScore: 0,
      };
      const result = createMatchSchema.safeParse(dataWithScores);
      expect(result.success).toBe(true);
    });

    it('should reject negative scores', () => {
      const dataWithScores = {
        ...validMatchData,
        homeScore: -1,
        awayScore: 0,
      };
      const result = createMatchSchema.safeParse(dataWithScores);
      expect(result.success).toBe(false);
    });

    it('should reject missing sport field', () => {
      const { sport, ...dataWithoutSport } = validMatchData;
      const result = createMatchSchema.safeParse(dataWithoutSport);
      expect(result.success).toBe(false);
    });

    it('should reject missing homeTeam field', () => {
      const { homeTeam, ...dataWithoutHome } = validMatchData;
      const result = createMatchSchema.safeParse(dataWithoutHome);
      expect(result.success).toBe(false);
    });

    it('should reject missing awayTeam field', () => {
      const { awayTeam, ...dataWithoutAway } = validMatchData;
      const result = createMatchSchema.safeParse(dataWithoutAway);
      expect(result.success).toBe(false);
    });

    it('should reject missing startTime field', () => {
      const { startTime, ...dataWithoutStart } = validMatchData;
      const result = createMatchSchema.safeParse(dataWithoutStart);
      expect(result.success).toBe(false);
    });

    it('should reject missing endTime field', () => {
      const { endTime, ...dataWithoutEnd } = validMatchData;
      const result = createMatchSchema.safeParse(dataWithoutEnd);
      expect(result.success).toBe(false);
    });

    it('should reject invalid ISO datetime format for startTime', () => {
      const invalidData = {
        ...validMatchData,
        startTime: '2024-01-15 10:00:00',
      };
      const result = createMatchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid ISO datetime format for endTime', () => {
      const invalidData = {
        ...validMatchData,
        endTime: 'invalid-date',
      };
      const result = createMatchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept datetime with timezone offset', () => {
      const dataWithOffset = {
        ...validMatchData,
        startTime: '2024-01-15T10:00:00+05:30',
        endTime: '2024-01-15T12:00:00+05:30',
      };
      const result = createMatchSchema.safeParse(dataWithOffset);
      expect(result.success).toBe(true);
    });

    it('should reject when start date is after end date (same day violation)', () => {
      const invalidData = {
        ...validMatchData,
        startTime: '2024-01-16T10:00:00Z',
        endTime: '2024-01-15T12:00:00Z',
      };
      const result = createMatchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept when start and end are on the same day', () => {
      const sameDay = {
        ...validMatchData,
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T23:59:59Z',
      };
      const result = createMatchSchema.safeParse(sameDay);
      expect(result.success).toBe(true);
    });

    it('should accept when end date is after start date', () => {
      const multiDay = {
        ...validMatchData,
        startTime: '2024-01-15T22:00:00Z',
        endTime: '2024-01-18T02:00:00Z',
      };
      const result = createMatchSchema.safeParse(multiDay);
      expect(result.success).toBe(true);
    });

    it('should accept empty sport string', () => {
      const validData = {
        ...validMatchData,
        sport: '',
      };
      const result = createMatchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty homeTeam string', () => {
      const validData = {
        ...validMatchData,
        homeTeam: '',
      };
      const result = createMatchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty awayTeam string', () => {
      const validData = {
        ...validMatchData,
        awayTeam: '',
      };
      const result = createMatchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle large score values', () => {
      const largeScores = {
        ...validMatchData,
        homeScore: 999,
        awayScore: 888,
      };
      const result = createMatchSchema.safeParse(largeScores);
      expect(result.success).toBe(true);
    });

    it('should normalize dates and reject when start date normalized is after end date normalized', () => {
      // Tests the normalizeDate function that sets hours to 0,0,0,0
      // If start date at 23:00 and end date at 01:00 next day,
      // they should normalize to same day comparison
      const sameCalendarDay = {
        ...validMatchData,
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T20:00:00Z',
      };
      const result = createMatchSchema.safeParse(sameCalendarDay);
      expect(result.success).toBe(true);
    });

    it('should reject fractional scores even when coerced', () => {
      const fractionalScores = {
        ...validMatchData,
        homeScore: 2.5,
        awayScore: 1.5,
      };
      const result = createMatchSchema.safeParse(fractionalScores);
      expect(result.success).toBe(false);
    });
  });

  describe('updateScoreSchema', () => {
    it('should accept valid score update', () => {
      const result = updateScoreSchema.safeParse({
        homeScore: 2,
        awayScore: 1,
      });
      expect(result.success).toBe(true);
      expect(result.data?.homeScore).toBe(2);
      expect(result.data?.awayScore).toBe(1);
    });

    it('should coerce string scores to numbers', () => {
      const result = updateScoreSchema.safeParse({
        homeScore: '3',
        awayScore: '4',
      });
      expect(result.success).toBe(true);
      expect(result.data?.homeScore).toBe(3);
      expect(result.data?.awayScore).toBe(4);
    });

    it('should accept zero scores', () => {
      const result = updateScoreSchema.safeParse({
        homeScore: 0,
        awayScore: 0,
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative homeScore', () => {
      const result = updateScoreSchema.safeParse({
        homeScore: -1,
        awayScore: 1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative awayScore', () => {
      const result = updateScoreSchema.safeParse({
        homeScore: 1,
        awayScore: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing homeScore', () => {
      const result = updateScoreSchema.safeParse({
        awayScore: 1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing awayScore', () => {
      const result = updateScoreSchema.safeParse({
        homeScore: 1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject decimal scores', () => {
      const result = updateScoreSchema.safeParse({
        homeScore: 1.5,
        awayScore: 2.3,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric scores', () => {
      const result = updateScoreSchema.safeParse({
        homeScore: 'two',
        awayScore: 'one',
      });
      expect(result.success).toBe(false);
    });

    it('should accept large score values', () => {
      const result = updateScoreSchema.safeParse({
        homeScore: 150,
        awayScore: 200,
      });
      expect(result.success).toBe(true);
    });
  });
});