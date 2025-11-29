/**
 * HTTP Test Client Utility
 * Wrapper around supertest for consistent API testing
 *
 * Provides authenticated and unauthenticated request helpers
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Test user interface for authentication
 */
export interface TestUser {
  id: string;
  email: string;
  orgId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'ASSISTANT';
  accessToken?: string;
  refreshToken?: string;
}

/**
 * HTTP Test Client
 * Provides methods for making authenticated and unauthenticated HTTP requests
 */
export class TestClient {
  private app: INestApplication;
  private baseUrl: string;

  /**
   * Constructor
   * @param app - NestJS application instance
   */
  constructor(app: INestApplication) {
    this.app = app;
    this.baseUrl = '/api/v1';
  }

  /**
   * Create a test client from a NestJS testing module
   * @param moduleRef - Testing module reference
   * @returns TestClient instance
   */
  static async create(moduleRef: TestingModule): Promise<TestClient> {
    const app = moduleRef.createNestApplication();
    await app.init();
    return new TestClient(app);
  }

  /**
   * Make an unauthenticated GET request
   */
  get(path: string): request.Test {
    return request(this.app.getHttpServer()).get(`${this.baseUrl}${path}`);
  }

  /**
   * Make an unauthenticated POST request
   */
  post(path: string): request.Test {
    return request(this.app.getHttpServer())
      .post(`${this.baseUrl}${path}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * Make an unauthenticated PATCH request
   */
  patch(path: string): request.Test {
    return request(this.app.getHttpServer())
      .patch(`${this.baseUrl}${path}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * Make an unauthenticated PUT request
   */
  put(path: string): request.Test {
    return request(this.app.getHttpServer())
      .put(`${this.baseUrl}${path}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * Make an unauthenticated DELETE request
   */
  delete(path: string): request.Test {
    return request(this.app.getHttpServer()).delete(`${this.baseUrl}${path}`);
  }

  /**
   * Make an authenticated GET request
   */
  authGet(path: string, token: string): request.Test {
    return request(this.app.getHttpServer())
      .get(`${this.baseUrl}${path}`)
      .set('Authorization', `Bearer ${token}`);
  }

  /**
   * Make an authenticated POST request
   */
  authPost(path: string, token: string): request.Test {
    return request(this.app.getHttpServer())
      .post(`${this.baseUrl}${path}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * Make an authenticated PATCH request
   */
  authPatch(path: string, token: string): request.Test {
    return request(this.app.getHttpServer())
      .patch(`${this.baseUrl}${path}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * Make an authenticated PUT request
   */
  authPut(path: string, token: string): request.Test {
    return request(this.app.getHttpServer())
      .put(`${this.baseUrl}${path}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * Make an authenticated DELETE request
   */
  authDelete(path: string, token: string): request.Test {
    return request(this.app.getHttpServer())
      .delete(`${this.baseUrl}${path}`)
      .set('Authorization', `Bearer ${token}`);
  }

  /**
   * Login a user and return access token
   * @param email - User email
   * @param password - User password
   * @returns Access token
   */
  async login(email: string, password: string): Promise<string> {
    const response = await this.post('/auth/login').send({ email, password });

    if (response.status !== 200) {
      throw new Error(`Login failed: ${response.body.error?.message}`);
    }

    return response.body.data.accessToken;
  }

  /**
   * Create a test user with authentication tokens
   * @param userData - User data
   * @returns TestUser with tokens
   */
  async createAuthenticatedUser(userData: {
    email: string;
    password: string;
    orgId: string;
    role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'ASSISTANT';
  }): Promise<TestUser> {
    // Register user
    const registerResponse = await this.post('/auth/register').send({
      email: userData.email,
      password: userData.password,
      orgId: userData.orgId,
      role: userData.role || 'MEMBER',
    });

    if (registerResponse.status !== 201) {
      throw new Error(`User creation failed: ${registerResponse.body.error?.message}`);
    }

    const user = registerResponse.body.data;

    // Login to get tokens
    const loginResponse = await this.post('/auth/login').send({
      email: userData.email,
      password: userData.password,
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.body.error?.message}`);
    }

    return {
      id: user.id,
      email: user.email,
      orgId: user.orgId,
      role: user.role,
      accessToken: loginResponse.body.data.accessToken,
      refreshToken: loginResponse.body.data.refreshToken,
    };
  }

  /**
   * Assert successful response
   */
  assertSuccess(response: request.Response, expectedStatus = 200): void {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
  }

  /**
   * Assert error response
   */
  assertError(
    response: request.Response,
    expectedStatus: number,
    expectedErrorCode?: string,
  ): void {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message');

    if (expectedErrorCode) {
      expect(response.body.error.code).toBe(expectedErrorCode);
    }
  }

  /**
   * Assert pagination metadata
   */
  assertPagination(response: request.Response): void {
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('pageSize');
    expect(response.body.meta).toHaveProperty('hasMore');
    expect(typeof response.body.meta.total).toBe('number');
    expect(typeof response.body.meta.page).toBe('number');
    expect(typeof response.body.meta.pageSize).toBe('number');
    expect(typeof response.body.meta.hasMore).toBe('boolean');
  }

  /**
   * Close the application
   */
  async close(): Promise<void> {
    await this.app.close();
  }

  /**
   * Get the NestJS application instance
   */
  getApp(): INestApplication {
    return this.app;
  }
}
