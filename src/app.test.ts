import request from 'supertest';
import app from './app';

describe('HRMS API Tests', () => {
  describe('Health Endpoint', () => {
    it('should return 200 status and success message', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'HRMS API Running',
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');
      
      expect(response.status).toBe(404);
    });
  });
});
