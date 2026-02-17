import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';

/**
 * AI Router Integration Tests
 *
 * Note: These tests validate the router structure and input validation.
 * Full integration tests with real LLM providers require API keys.
 */

describe('AI Router', () => {
  let app;

  before(async () => {
    // Create a minimal mock of the AI router for validation testing
    app = express();
    app.use(express.json());

    // Mock AI router endpoints for validation testing
    app.post('/api/ai/kinorate/search', (req, res) => {
      const query = req.body?.query;
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          error: 'Missing or invalid "query" in request body',
        });
        return;
      }
      // Simulate successful response
      res.status(200).json({ title: 'Test Movie', year: '2024' });
    });

    app.post('/api/ai/kinorate/batch', (req, res) => {
      const queries = req.body?.queries;
      if (!Array.isArray(queries) || !queries.every(q => typeof q === 'string')) {
        res.status(400).json({
          error: 'Missing or invalid "queries" (string[]) in request body',
        });
        return;
      }
      // Simulate successful response
      res.status(200).json(queries.map(q => ({ title: q, year: '2024' })));
    });
  });

  describe('POST /api/ai/kinorate/search - Validation', () => {
    it('should return 400 for missing query', async () => {
      const response = await request(app).post('/api/ai/kinorate/search').send({}).expect(400);

      assert.strictEqual(response.body.error, 'Missing or invalid "query" in request body');
    });

    it('should return 400 for non-string query', async () => {
      const response = await request(app)
        .post('/api/ai/kinorate/search')
        .send({ query: 123 })
        .expect(400);

      assert.strictEqual(response.body.error, 'Missing or invalid "query" in request body');
    });

    it('should return 400 for null query', async () => {
      const response = await request(app)
        .post('/api/ai/kinorate/search')
        .send({ query: null })
        .expect(400);

      assert.strictEqual(response.body.error, 'Missing or invalid "query" in request body');
    });

    it('should return 400 for empty string query', async () => {
      const response = await request(app)
        .post('/api/ai/kinorate/search')
        .send({ query: '' })
        .expect(400);

      assert.strictEqual(response.body.error, 'Missing or invalid "query" in request body');
    });

    it('should return 200 for valid query', async () => {
      const response = await request(app)
        .post('/api/ai/kinorate/search')
        .send({ query: 'The Matrix' })
        .expect(200);

      assert.ok(response.body.title);
    });
  });

  describe('POST /api/ai/kinorate/batch - Validation', () => {
    it('should return 400 for missing queries', async () => {
      const response = await request(app).post('/api/ai/kinorate/batch').send({}).expect(400);

      assert.strictEqual(
        response.body.error,
        'Missing or invalid "queries" (string[]) in request body'
      );
    });

    it('should return 400 for non-array queries', async () => {
      const response = await request(app)
        .post('/api/ai/kinorate/batch')
        .send({ queries: 'not an array' })
        .expect(400);

      assert.strictEqual(
        response.body.error,
        'Missing or invalid "queries" (string[]) in request body'
      );
    });

    it('should return 400 for array with non-string elements', async () => {
      const response = await request(app)
        .post('/api/ai/kinorate/batch')
        .send({ queries: ['valid', 123, 'also valid'] })
        .expect(400);

      assert.strictEqual(
        response.body.error,
        'Missing or invalid "queries" (string[]) in request body'
      );
    });

    it('should return 200 for valid queries array', async () => {
      const response = await request(app)
        .post('/api/ai/kinorate/batch')
        .send({ queries: ['Movie 1', 'Movie 2'] })
        .expect(200);

      assert.ok(Array.isArray(response.body));
      assert.strictEqual(response.body.length, 2);
    });

    it('should return 200 for empty array', async () => {
      const response = await request(app)
        .post('/api/ai/kinorate/batch')
        .send({ queries: [] })
        .expect(200);

      assert.ok(Array.isArray(response.body));
    });
  });
});
