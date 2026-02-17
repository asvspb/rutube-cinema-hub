import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseJsonFromText,
  normalizeStringArray,
  normalizeMovieRatingData,
  normalizeKinoRatePayload,
} from '../../server/services/jsonParser.js';

describe('JSON Parser Service', () => {
  describe('parseJsonFromText', () => {
    describe('valid JSON', () => {
      it('should parse valid JSON object', () => {
        const input = '{"name": "test", "value": 123}';
        const result = parseJsonFromText(input);
        assert.deepStrictEqual(result, { name: 'test', value: 123 });
      });

      it('should parse valid JSON array', () => {
        const input = '[1, 2, 3]';
        const result = parseJsonFromText(input);
        assert.deepStrictEqual(result, [1, 2, 3]);
      });

      it('should parse nested JSON', () => {
        const input = '{"outer": {"inner": {"deep": true}}}';
        const result = parseJsonFromText(input);
        assert.deepStrictEqual(result, { outer: { inner: { deep: true } } });
      });

      it('should parse JSON with special characters', () => {
        const input = '{"title": "Привет мир!", "emoji": "🎬"}';
        const result = parseJsonFromText(input);
        assert.strictEqual(result.title, 'Привет мир!');
        assert.strictEqual(result.emoji, '🎬');
      });
    });

    describe('code fences removal', () => {
      it('should strip markdown code fences with json', () => {
        const input = '```json\n{"name": "test"}\n```';
        const result = parseJsonFromText(input);
        assert.deepStrictEqual(result, { name: 'test' });
      });

      it('should strip markdown code fences without language', () => {
        const input = '```\n{"name": "test"}\n```';
        const result = parseJsonFromText(input);
        assert.deepStrictEqual(result, { name: 'test' });
      });

      it('should handle code fences with extra content', () => {
        const input = 'Some text before ```json\n{"name": "test"}\n``` some text after';
        const result = parseJsonFromText(input, 'object');
        assert.deepStrictEqual(result, { name: 'test' });
      });
    });

    describe('JSON extraction from mixed content', () => {
      it('should extract JSON object from text', () => {
        const input = 'Here is some text {"name": "test"} and more text';
        const result = parseJsonFromText(input, 'object');
        assert.deepStrictEqual(result, { name: 'test' });
      });

      it('should extract JSON array from text', () => {
        const input = 'Prefix [1, 2, 3] suffix';
        const result = parseJsonFromText(input, 'array');
        assert.deepStrictEqual(result, [1, 2, 3]);
      });

      it('should handle text with JSON-like content', () => {
        const input = 'The result is: {"status": "ok", "value": 42}';
        const result = parseJsonFromText(input, 'object');
        assert.deepStrictEqual(result, { status: 'ok', value: 42 });
      });
    });

    describe('error handling', () => {
      it('should return null for null input', () => {
        const result = parseJsonFromText(null);
        assert.strictEqual(result, null);
      });

      it('should return null for undefined input', () => {
        const result = parseJsonFromText(undefined);
        assert.strictEqual(result, null);
      });

      it('should return null for empty string', () => {
        const result = parseJsonFromText('');
        assert.strictEqual(result, null);
      });

      it('should return null for non-string input', () => {
        const result = parseJsonFromText(123);
        assert.strictEqual(result, null);
      });

      it('should return null for invalid JSON', () => {
        const result = parseJsonFromText('not json at all');
        assert.strictEqual(result, null);
      });

      it('should return null for truncated JSON', () => {
        const result = parseJsonFromText('{"name": "test"');
        assert.strictEqual(result, null);
      });
    });

    describe('expected type parameter', () => {
      it('should prefer array when expected is array', () => {
        const input = '{"obj": true} [1, 2, 3]';
        const result = parseJsonFromText(input, 'array');
        assert.deepStrictEqual(result, [1, 2, 3]);
      });

      it('should prefer object when expected is object', () => {
        const input = '[1, 2, 3] {"obj": true}';
        const result = parseJsonFromText(input, 'object');
        assert.deepStrictEqual(result, { obj: true });
      });
    });
  });

  describe('normalizeStringArray', () => {
    it('should return array as-is if valid', () => {
      const input = ['a', 'b', 'c'];
      const result = normalizeStringArray(input);
      assert.deepStrictEqual(result, ['a', 'b', 'c']);
    });

    it('should filter non-string values from array', () => {
      const input = ['a', 123, 'b', null, 'c', undefined];
      const result = normalizeStringArray(input);
      assert.deepStrictEqual(result, ['a', 'b', 'c']);
    });

    it('should trim strings in array', () => {
      const input = ['  a  ', 'b', '  c'];
      const result = normalizeStringArray(input);
      assert.deepStrictEqual(result, ['a', 'b', 'c']);
    });

    it('should remove empty strings after trim', () => {
      const input = ['a', '   ', 'b', ''];
      const result = normalizeStringArray(input);
      assert.deepStrictEqual(result, ['a', 'b']);
    });

    it('should convert string to single-element array', () => {
      const result = normalizeStringArray('test');
      assert.deepStrictEqual(result, ['test']);
    });

    it('should trim string before converting to array', () => {
      const result = normalizeStringArray('  test  ');
      assert.deepStrictEqual(result, ['test']);
    });

    it('should return empty array for empty string', () => {
      const result = normalizeStringArray('');
      assert.deepStrictEqual(result, []);
    });

    it('should return empty array for whitespace string', () => {
      const result = normalizeStringArray('   ');
      assert.deepStrictEqual(result, []);
    });

    it('should return empty array for null', () => {
      const result = normalizeStringArray(null);
      assert.deepStrictEqual(result, []);
    });

    it('should return empty array for undefined', () => {
      const result = normalizeStringArray(undefined);
      assert.deepStrictEqual(result, []);
    });

    it('should return empty array for number', () => {
      const result = normalizeStringArray(123);
      assert.deepStrictEqual(result, []);
    });
  });

  describe('normalizeMovieRatingData', () => {
    it('should return null/undefined as-is', () => {
      assert.strictEqual(normalizeMovieRatingData(null), null);
      assert.strictEqual(normalizeMovieRatingData(undefined), undefined);
    });

    it('should return arrays as-is', () => {
      const input = [{ title: 'test' }];
      assert.strictEqual(normalizeMovieRatingData(input), input);
    });

    it('should convert year to string', () => {
      const result = normalizeMovieRatingData({ year: 2024 });
      assert.strictEqual(result.year, '2024');
    });

    it('should keep year as string if already string', () => {
      const result = normalizeMovieRatingData({ year: '2024' });
      assert.strictEqual(result.year, '2024');
    });

    it('should convert kpRating string to number', () => {
      const result = normalizeMovieRatingData({ kpRating: '8.5' });
      assert.strictEqual(result.kpRating, 8.5);
    });

    it('should convert kpRating with comma to number', () => {
      const result = normalizeMovieRatingData({ kpRating: '8,5' });
      assert.strictEqual(result.kpRating, 8.5);
    });

    it('should convert imdbRating string to number', () => {
      const result = normalizeMovieRatingData({ imdbRating: '7.8' });
      assert.strictEqual(result.imdbRating, 7.8);
    });

    it('should convert kpVotes to string', () => {
      const result = normalizeMovieRatingData({ kpVotes: 100000 });
      assert.strictEqual(result.kpVotes, '100000');
    });

    it('should keep kpVotes as string if already string', () => {
      const result = normalizeMovieRatingData({ kpVotes: '100K' });
      assert.strictEqual(result.kpVotes, '100K');
    });

    it('should normalize awards array', () => {
      const result = normalizeMovieRatingData({ awards: ['Oscar Won', '  ', 123] });
      assert.deepStrictEqual(result.awards, ['Oscar Won']);
    });

    it('should remove empty awards', () => {
      const result = normalizeMovieRatingData({ awards: [] });
      assert.strictEqual(result.awards, undefined);
    });

    it('should normalize sources array', () => {
      const result = normalizeMovieRatingData({ sources: ['https://imdb.com/title/tt123'] });
      assert.deepStrictEqual(result.sources, ['https://imdb.com/title/tt123']);
    });

    it('should remove empty sources', () => {
      const result = normalizeMovieRatingData({ sources: [] });
      assert.strictEqual(result.sources, undefined);
    });

    it('should handle complete movie data', () => {
      const input = {
        title: 'Test Movie',
        originalTitle: 'Test Movie Original',
        year: 2024,
        kpRating: '8,5',
        kpVotes: '100K',
        imdbRating: '7.8',
        description: 'Test description',
        awards: ['Oscar Won'],
      };
      const result = normalizeMovieRatingData(input);
      assert.strictEqual(result.title, 'Test Movie');
      assert.strictEqual(result.year, '2024');
      assert.strictEqual(result.kpRating, 8.5);
      assert.strictEqual(result.imdbRating, 7.8);
      assert.deepStrictEqual(result.awards, ['Oscar Won']);
    });
  });

  describe('normalizeKinoRatePayload', () => {
    it('should normalize single object', () => {
      const input = { year: 2024, kpRating: '8.5' };
      const result = normalizeKinoRatePayload(input);
      assert.strictEqual(result.year, '2024');
      assert.strictEqual(result.kpRating, 8.5);
    });

    it('should normalize array of objects', () => {
      const input = [
        { year: 2024, kpRating: '8.5' },
        { year: 2023, kpRating: '7.5' },
      ];
      const result = normalizeKinoRatePayload(input);
      assert.strictEqual(Array.isArray(result), true);
      assert.strictEqual(result[0].year, '2024');
      assert.strictEqual(result[1].year, '2023');
    });

    it('should return null for null', () => {
      assert.strictEqual(normalizeKinoRatePayload(null), null);
    });
  });
});
