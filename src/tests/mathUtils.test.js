import { solveQuadraticInequality, solveLinearInequality } from '../utils/mathUtils';

describe('Math Utils Tests', () => {
  describe('solveQuadraticInequality', () => {
    test('should solve quadratic inequality with positive discriminant', () => {
      const params = {
        a: 1,
        b: -5,
        c: 6,
        operator: '>'
      };
      
      const solution = solveQuadraticInequality(params);
      
      expect(solution.discriminant).toBe(1);
      expect(solution.roots).toHaveLength(2);
      expect(solution.roots[0]).toBeCloseTo(2);
      expect(solution.roots[1]).toBeCloseTo(3);
      expect(solution.intervals).toHaveLength(2);
    });

    test('should solve quadratic inequality with zero discriminant', () => {
      const params = {
        a: 1,
        b: -4,
        c: 4,
        operator: '>'
      };
      
      const solution = solveQuadraticInequality(params);
      
      expect(solution.discriminant).toBe(0);
      expect(solution.roots).toHaveLength(1);
      expect(solution.roots[0]).toBeCloseTo(2);
    });

    test('should handle invalid input', () => {
      const params = {
        a: 'invalid',
        b: 2,
        c: 3,
        operator: '>'
      };
      
      expect(() => solveQuadraticInequality(params)).toThrow('Параметры должны быть числами');
    });
  });

  describe('solveLinearInequality', () => {
    test('should solve linear inequality', () => {
      const params = {
        a: 2,
        b: -4,
        operator: '>'
      };
      
      const solution = solveLinearInequality(params);
      
      expect(solution.root).toBeCloseTo(2);
      expect(solution.intervals).toHaveLength(1);
      expect(solution.explanation).toHaveLength(2);
    });

    test('should handle invalid input', () => {
      const params = {
        a: 'invalid',
        b: 2,
        operator: '>'
      };
      
      expect(() => solveLinearInequality(params)).toThrow('Параметры должны быть числами');
    });
  });
}); 