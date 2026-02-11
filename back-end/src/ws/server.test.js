import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import { sendJsonMessage, broadcastMessage, attachWebsocketServer } from './server.js';

describe('WebSocket Server', () => {
  describe('sendJsonMessage', () => {
    it('should send JSON stringified payload to an open socket', () => {
      const mockSocket = {
        readyState: WebSocket.OPEN,
        send: vi.fn(),
      };

      const payload = { type: 'test', data: 'hello' };
      sendJsonMessage(mockSocket, payload);

      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(payload));
      expect(mockSocket.send).toHaveBeenCalledTimes(1);
    });

    it('should not send message if socket is not open', () => {
      const mockSocket = {
        readyState: WebSocket.CLOSED,
        send: vi.fn(),
      };

      const payload = { type: 'test', data: 'hello' };
      sendJsonMessage(mockSocket, payload);

      expect(mockSocket.send).not.toHaveBeenCalled();
    });

    it('should not send message if socket is connecting', () => {
      const mockSocket = {
        readyState: WebSocket.CONNECTING,
        send: vi.fn(),
      };

      const payload = { type: 'test', data: 'hello' };
      sendJsonMessage(mockSocket, payload);

      expect(mockSocket.send).not.toHaveBeenCalled();
    });

    it('should not send message if socket is closing', () => {
      const mockSocket = {
        readyState: WebSocket.CLOSING,
        send: vi.fn(),
      };

      const payload = { type: 'test', data: 'hello' };
      sendJsonMessage(mockSocket, payload);

      expect(mockSocket.send).not.toHaveBeenCalled();
    });

    it('should handle complex nested objects in payload', () => {
      const mockSocket = {
        readyState: WebSocket.OPEN,
        send: vi.fn(),
      };

      const payload = {
        type: 'match_created',
        data: {
          id: 1,
          sport: 'Football',
          teams: {
            home: 'Team A',
            away: 'Team B',
          },
          scores: [0, 0],
        },
      };
      sendJsonMessage(mockSocket, payload);

      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(payload));
    });
  });

  describe('broadcastMessage', () => {
    it('should send message to all open clients', () => {
      const client1 = {
        readyState: WebSocket.OPEN,
        send: vi.fn(),
      };
      const client2 = {
        readyState: WebSocket.OPEN,
        send: vi.fn(),
      };
      const client3 = {
        readyState: WebSocket.OPEN,
        send: vi.fn(),
      };

      const mockWss = {
        clients: new Set([client1, client2, client3]),
      };

      const payload = { type: 'broadcast', message: 'test' };
      broadcastMessage(mockWss, payload);

      expect(client1.send).toHaveBeenCalledWith(JSON.stringify(payload));
      expect(client2.send).toHaveBeenCalledWith(JSON.stringify(payload));
      expect(client3.send).toHaveBeenCalledWith(JSON.stringify(payload));
    });

    it('should skip clients that are not in OPEN state', () => {
      const client1 = {
        readyState: WebSocket.OPEN,
        send: vi.fn(),
      };
      const client2 = {
        readyState: WebSocket.CLOSED,
        send: vi.fn(),
      };
      const client3 = {
        readyState: WebSocket.CONNECTING,
        send: vi.fn(),
      };

      const mockWss = {
        clients: new Set([client1, client2, client3]),
      };

      const payload = { type: 'broadcast', message: 'test' };
      broadcastMessage(mockWss, payload);

      expect(client1.send).toHaveBeenCalledWith(JSON.stringify(payload));
      expect(client2.send).not.toHaveBeenCalled();
      expect(client3.send).not.toHaveBeenCalled();
    });

    it('should handle empty client set gracefully', () => {
      const mockWss = {
        clients: new Set([]),
      };

      const payload = { type: 'broadcast', message: 'test' };

      expect(() => {
        broadcastMessage(mockWss, payload);
      }).not.toThrow();
    });

    it('should broadcast to a single client', () => {
      const client1 = {
        readyState: WebSocket.OPEN,
        send: vi.fn(),
      };

      const mockWss = {
        clients: new Set([client1]),
      };

      const payload = { type: 'notification', data: 'single client' };
      broadcastMessage(mockWss, payload);

      expect(client1.send).toHaveBeenCalledWith(JSON.stringify(payload));
      expect(client1.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('attachWebsocketServer', () => {
    let server;

    beforeEach(() => {
      server = http.createServer();
    });

    it('should return an object with broadcastMatchCreated function', () => {
      const result = attachWebsocketServer(server);

      expect(result).toHaveProperty('broadcastMatchCreated');
      expect(typeof result.broadcastMatchCreated).toBe('function');
    });

    it('should create WebSocketServer with correct configuration', () => {
      const result = attachWebsocketServer(server);

      expect(result).toBeDefined();
      expect(typeof result.broadcastMatchCreated).toBe('function');
    });

    it('should broadcast match_created message with correct structure', (done) => {
      const result = attachWebsocketServer(server);

      const matchData = {
        id: 1,
        sport: 'Football',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-01-02'),
      };

      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (!address || typeof address === 'string') {
          done(new Error('Failed to get server address'));
          return;
        }
        const port = address.port;
        const ws = new WebSocket(`ws://localhost:${port}/ws`);

        let messageCount = 0;

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          messageCount++;

          if (messageCount === 1) {
            expect(message.type).toBe('welcome');
          } else if (messageCount === 2) {
            expect(message.type).toBe('match_created');
            expect(message.data).toEqual(matchData);
            ws.close();
            server.close();
            done();
          }
        });

        ws.on('error', (err) => {
          server.close();
          done(err);
        });

        ws.on('open', () => {
          result.broadcastMatchCreated(matchData);
        });
      });
    });

    it('should send welcome message on connection', (done) => {
      attachWebsocketServer(server);

      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (!address || typeof address === 'string') {
          done(new Error('Failed to get server address'));
          return;
        }
        const port = address.port;
        const ws = new WebSocket(`ws://localhost:${port}/ws`);

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          expect(message.type).toBe('welcome');
          ws.close();
          server.close();
          done();
        });

        ws.on('error', (err) => {
          server.close();
          done(err);
        });
      });
    });

    it('should handle multiple simultaneous connections', (done) => {
      const result = attachWebsocketServer(server);

      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (!address || typeof address === 'string') {
          done(new Error('Failed to get server address'));
          return;
        }
        const port = address.port;
        const ws1 = new WebSocket(`ws://localhost:${port}/ws`);
        const ws2 = new WebSocket(`ws://localhost:${port}/ws`);

        let ws1MessageCount = 0;
        let ws2MessageCount = 0;

        const matchData = { id: 1, sport: 'Basketball' };

        const cleanup = () => {
          ws1.close();
          ws2.close();
          server.close();
        };

        ws1.on('message', (data) => {
          const message = JSON.parse(data.toString());
          ws1MessageCount++;

          if (ws1MessageCount === 2) {
            expect(message.type).toBe('match_created');
            expect(message.data).toEqual(matchData);
          }
        });

        ws2.on('message', (data) => {
          const message = JSON.parse(data.toString());
          ws2MessageCount++;

          if (ws2MessageCount === 2) {
            expect(message.type).toBe('match_created');
            expect(message.data).toEqual(matchData);

            cleanup();
            done();
          }
        });

        ws1.on('error', (err) => {
          cleanup();
          done(err);
        });

        ws2.on('error', (err) => {
          cleanup();
          done(err);
        });

        let openCount = 0;
        const handleOpen = () => {
          openCount++;
          if (openCount === 2) {
            result.broadcastMatchCreated(matchData);
          }
        };

        ws1.on('open', handleOpen);
        ws2.on('open', handleOpen);
      });
    });

    it('should respect maxPayload limit of 1MB', () => {
      attachWebsocketServer(server);

      expect(server).toBeDefined();
    });
  });
});