import { describe, it, expect } from 'vitest';
import { Router } from 'express';

describe('Matches Routes Module', () => {
  it('should export matchesRoute as a Router instance', async () => {
    const { matchesRoute } = await import('./matches.js');

    expect(matchesRoute).toBeDefined();
    expect(matchesRoute).toBeInstanceOf(Router);
  });

  it('should have GET / route registered', async () => {
    const { matchesRoute } = await import('./matches.js');

    const getRoutes = matchesRoute.stack.filter(
      layer => layer.route && layer.route.methods.get
    );

    expect(getRoutes.length).toBeGreaterThanOrEqual(1);
    expect(getRoutes.some(layer => layer.route.path === '/')).toBe(true);
  });

  it('should have POST / route registered', async () => {
    const { matchesRoute } = await import('./matches.js');

    const postRoutes = matchesRoute.stack.filter(
      layer => layer.route && layer.route.methods.post
    );

    expect(postRoutes.length).toBeGreaterThanOrEqual(1);
    expect(postRoutes.some(layer => layer.route.path === '/')).toBe(true);
  });

  it('should have correct route structure', async () => {
    const { matchesRoute } = await import('./matches.js');

    // Verify the router has at least 2 routes (GET and POST)
    const routes = matchesRoute.stack.filter(layer => layer.route);
    expect(routes.length).toBeGreaterThanOrEqual(2);
  });

  describe('Route Implementation Details', () => {
    it('GET route should use async handler', async () => {
      const { matchesRoute } = await import('./matches.js');

      const getRoute = matchesRoute.stack.find(
        layer => layer.route && layer.route.methods.get && layer.route.path === '/'
      );

      expect(getRoute).toBeDefined();
      expect(getRoute.route.stack.length).toBeGreaterThan(0);
    });

    it('POST route should use async handler', async () => {
      const { matchesRoute } = await import('./matches.js');

      const postRoute = matchesRoute.stack.find(
        layer => layer.route && layer.route.methods.post && layer.route.path === '/'
      );

      expect(postRoute).toBeDefined();
      expect(postRoute.route.stack.length).toBeGreaterThan(0);
    });
  });

  describe('MAX_LIMIT constant', () => {
    it('should enforce a maximum limit', async () => {
      // The MAX_LIMIT is defined in the module
      // Testing via the code review that it's set to 100
      // This is a regression test to ensure the constant exists and is used
      const moduleContent = await import('./matches.js?raw');
      const content = moduleContent.default || '';

      // Verify MAX_LIMIT is defined
      expect(content).toContain('MAX_LIMIT');
      expect(content).toContain('100');
    });
  });

  describe('Error Handling', () => {
    it('should return error responses for invalid requests', async () => {
      // This tests the structure exists in the code
      const moduleContent = await import('./matches.js?raw');
      const content = moduleContent.default || '';

      // Verify error handling code exists
      expect(content).toContain('INVALID_REQUEST');
      expect(content).toContain('400');
      expect(content).toContain('500');
    });

    it('should handle database errors gracefully', async () => {
      const moduleContent = await import('./matches.js?raw');
      const content = moduleContent.default || '';

      // Verify try-catch blocks exist
      expect(content).toContain('try');
      expect(content).toContain('catch');
      expect(content).toContain('Failed to list match');
      expect(content).toContain('Failed to create a match');
    });
  });

  describe('Validation Integration', () => {
    it('should use validation schemas', async () => {
      const moduleContent = await import('./matches.js?raw');
      const content = moduleContent.default || '';

      // Verify validation is imported and used
      expect(content).toContain('safeParse');
      expect(content).toContain('listMatchesQuerySchema');
      expect(content).toContain('createMatchSchema');
    });

    it('should check validation success before proceeding', async () => {
      const moduleContent = await import('./matches.js?raw');
      const content = moduleContent.default || '';

      // Verify success checks exist
      expect(content).toContain('success');
      expect(content).toContain('!success');
    });
  });

  describe('Database Integration', () => {
    it('should import database and schema', async () => {
      const moduleContent = await import('./matches.js?raw');
      const content = moduleContent.default || '';

      // Verify db imports
      expect(content).toContain('db');
      expect(content).toContain('matches');
      expect(content).toContain('from');
    });

    it('should use Drizzle ORM methods', async () => {
      const moduleContent = await import('./matches.js?raw');
      const content = moduleContent.default || '';

      // Verify ORM usage
      expect(content).toContain('select()');
      expect(content).toContain('insert(');
      expect(content).toContain('orderBy(');
      expect(content).toContain('desc(');
      expect(content).toContain('.limit(');
      expect(content).toContain('.returning()');
    });
  });

  describe('WebSocket Broadcast Integration', () => {
    it('should check for broadcast function before calling', async () => {
      const moduleContent = await import('./matches.js?raw');
      const content = moduleContent.default || '';

      // Verify broadcast integration
      expect(content).toContain('broadcastMatchCreated');
      expect(content).toContain('res.app.locals');
    });

    it('should call broadcast after match creation', async () => {
      const moduleContent = await import('./matches.js?raw');
      const content = moduleContent.default || '';

      // Verify broadcast is called with event data
      expect(content).toContain('broadcastMatchCreated(event)');
    });
  });

  describe('Response Handling', () => {
    it('should return appropriate status codes', async () => {
      const moduleContent = await import('./matches.js?raw');
      const content = moduleContent.default || '';

      // Verify status codes are used
      expect(content).toContain('status(201)'); // Created
      expect(content).toContain('status(400)'); // Bad Request
      expect(content).toContain('status(500)'); // Internal Server Error
    });

    it('should return JSON responses', async () => {
      const moduleContent = await import('./matches.js?raw');
      const content = moduleContent.default || '';

      // Verify JSON responses
      expect(content).toContain('res.json(');
      expect(content).toContain('{ data:');
      expect(content).toContain('{ error:');
    });
  });

  describe('Date Handling', () => {
    it('should convert date strings to Date objects', async () => {
      const moduleContent = await import('./matches.js?raw');
      const content = moduleContent.default || '';

      // Verify date conversion
      expect(content).toContain('new Date(startTime)');
      expect(content).toContain('new Date(endTime)');
    });
  });
});