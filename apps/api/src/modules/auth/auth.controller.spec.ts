import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { createMockUser, mockAuthGuard } from '../../../test/utils/test-helpers';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller;
  let authService;
  let usersService;

  // Mock request and response objects
  const mockRequest = () => ({
    user: { id: 'user-123', userId: 'user-123', email: 'test@example.com' },
    cookies: {},
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('Mozilla/5.0'),
    socket: { remoteAddress: '127.0.0.1' },
  });

  const mockResponse = () => ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  });

  beforeEach(async () => {
    // Create mock services
    const mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
      validateUser: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
      completeMfaLogin: jest.fn(),
      setPassword: jest.fn(),
      changePassword: jest.fn(),
      hasPassword: jest.fn(),
      createTestSession: jest.fn(),
      setAuthCookies: jest.fn(),
      clearAuthCookies: jest.fn(),
      setOnboardingCompleteCookie: jest.fn(),
      checkAndSetOnboardingCookie: jest.fn(),
      generateDeviceFingerprint: jest.fn().mockReturnValue('mock-fingerprint'),
    };

    const mockUsersService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return JWT tokens', async () => {
      // Arrange
      const registerDto = {
        email: 'newuser@example.com',
        password: 'SecureP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const expectedResponse = new AuthResponseDto(
        'access-token',
        'refresh-token',
        900,
        false,
        undefined,
        'Registration successful',
        'user-123',
      );

      authService.register.mockResolvedValue(expectedResponse);
      const res = mockResponse();

      // Act
      const result = await controller.register(registerDto, res);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.setAuthCookies).toHaveBeenCalledWith(
        res,
        'access-token',
        'refresh-token',
      );
      expect(result).toEqual(expectedResponse);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.requiresMfa).toBe(false);
    });

    it('should create user account successfully', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'Test@1234',
        firstName: 'Test',
        lastName: 'User',
      };

      const authResponse = new AuthResponseDto(
        'token',
        'refresh',
        900,
        false,
      );

      authService.register.mockResolvedValue(authResponse);
      const res = mockResponse();

      // Act
      const result = await controller.register(registerDto, res);

      // Assert
      expect(result).toBeDefined();
      expect(result.tokenType).toBe('Bearer');
      expect(authService.register).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('should return JWT token on valid credentials', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd123',
      };

      const expectedResponse = new AuthResponseDto(
        'access-token',
        'refresh-token',
        900,
        false,
      );

      authService.login.mockResolvedValue(expectedResponse);
      const req = mockRequest();
      const res = mockResponse();

      // Act
      const result = await controller.login(loginDto, req, res);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(req.user);
      expect(authService.setAuthCookies).toHaveBeenCalledWith(
        res,
        'access-token',
        'refresh-token',
      );
      expect(authService.checkAndSetOnboardingCookie).toHaveBeenCalledWith(
        req.user,
        res,
      );
      expect(result).toEqual(expectedResponse);
      expect(result.accessToken).toBe('access-token');
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const req = mockRequest();
      req.user = undefined; // No user attached by guard
      const res = mockResponse();

      // Act & Assert
      await expect(
        controller.login(loginDto, req, res),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        controller.login(loginDto, req, res),
      ).rejects.toThrow('User not authenticated');
    });

    it('should return MFA token when MFA is required', async () => {
      // Arrange
      const loginDto = {
        email: 'mfa-user@example.com',
        password: 'SecureP@ssw0rd123',
      };

      const mfaResponse = new AuthResponseDto(
        undefined,
        undefined,
        undefined,
        true,
        'mfa-temp-token',
        'MFA verification required',
      );

      authService.login.mockResolvedValue(mfaResponse);
      const req = mockRequest();
      const res = mockResponse();

      // Act
      const result = await controller.login(loginDto, req, res);

      // Assert
      expect(result.requiresMfa).toBe(true);
      expect(result.mfaToken).toBe('mfa-temp-token');
      expect(result.accessToken).toBeUndefined();
      expect(authService.setAuthCookies).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Arrange
      const req = mockRequest();
      req.cookies = { refresh_token: 'valid-refresh-token' };

      const expectedResponse = new AuthResponseDto(
        'new-access-token',
        'new-refresh-token',
        900,
        false,
      );

      authService.refresh.mockResolvedValue(expectedResponse);
      const res = mockResponse();

      // Act
      const result = await controller.refresh(req, res);

      // Assert
      expect(authService.refresh).toHaveBeenCalledWith(
        'valid-refresh-token',
        '127.0.0.1',
        'Mozilla/5.0',
        'mock-fingerprint',
      );
      expect(authService.setAuthCookies).toHaveBeenCalledWith(
        res,
        'new-access-token',
        'new-refresh-token',
      );
      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw UnauthorizedException when refresh token is missing', async () => {
      // Arrange
      const req = mockRequest();
      req.cookies = {}; // No refresh token
      const res = mockResponse();

      // Act & Assert
      await expect(
        controller.refresh(req, res),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        controller.refresh(req, res),
      ).rejects.toThrow('Refresh token not found');
    });
  });

  describe('logout', () => {
    it('should logout user and clear cookies', async () => {
      // Arrange
      const req = mockRequest();
      req.cookies = { refresh_token: 'valid-refresh-token' };
      const res = mockResponse();

      authService.logout.mockResolvedValue(undefined);

      // Act
      await controller.logout(req, res);

      // Assert
      expect(authService.logout).toHaveBeenCalledWith(
        'user-123',
        'valid-refresh-token',
      );
      expect(authService.clearAuthCookies).toHaveBeenCalledWith(res);
    });

    it('should clear cookies even when no refresh token is present', async () => {
      // Arrange
      const req = mockRequest();
      req.cookies = {}; // No refresh token
      const res = mockResponse();

      // Act
      await controller.logout(req, res);

      // Assert
      expect(authService.logout).not.toHaveBeenCalled();
      expect(authService.clearAuthCookies).toHaveBeenCalledWith(res);
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices and clear cookies', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();

      authService.logoutAll.mockResolvedValue(undefined);

      // Act
      await controller.logoutAll(req, res);

      // Assert
      expect(authService.logoutAll).toHaveBeenCalledWith('user-123');
      expect(authService.clearAuthCookies).toHaveBeenCalledWith(res);
    });
  });

  describe('completeMfaLogin', () => {
    it('should complete MFA login and return tokens', async () => {
      // Arrange
      const completeMfaDto = {
        mfaToken: 'mfa-temp-token',
        mfaCode: '123456',
      };

      const expectedResponse = new AuthResponseDto(
        'access-token',
        'refresh-token',
        900,
        false,
        undefined,
        'MFA verification successful',
        'user-123',
      );

      authService.completeMfaLogin.mockResolvedValue(expectedResponse);
      const req = mockRequest();
      const res = mockResponse();

      // Act
      const result = await controller.completeMfaLogin(
        completeMfaDto,
        req,
        res,
      );

      // Assert
      expect(authService.completeMfaLogin).toHaveBeenCalledWith(
        'mfa-temp-token',
        '123456',
      );
      expect(authService.setAuthCookies).toHaveBeenCalledWith(
        res,
        'access-token',
        'refresh-token',
      );
      expect(result.accessToken).toBe('access-token');
    });
  });

  describe('setPassword', () => {
    it('should set password for OAuth-only account', async () => {
      // Arrange
      const setPasswordDto = {
        password: 'NewSecure@Pass123',
      };

      const req = mockRequest();
      authService.setPassword.mockResolvedValue(undefined);

      // Act
      await controller.setPassword(req, setPasswordDto);

      // Assert
      expect(authService.setPassword).toHaveBeenCalledWith(
        'user-123',
        'NewSecure@Pass123',
      );
    });
  });

  describe('changePassword', () => {
    it('should change password for existing account', async () => {
      // Arrange
      const changePasswordDto = {
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      };

      const req = mockRequest();
      authService.changePassword.mockResolvedValue(undefined);

      // Act
      await controller.changePassword(req, changePasswordDto);

      // Assert
      expect(authService.changePassword).toHaveBeenCalledWith(
        'user-123',
        'OldPass@123',
        'NewPass@456',
      );
    });
  });

  describe('getPasswordStatus', () => {
    it('should return true when user has password', async () => {
      // Arrange
      const req = mockRequest();
      authService.hasPassword.mockResolvedValue(true);

      // Act
      const result = await controller.getPasswordStatus(req);

      // Assert
      expect(authService.hasPassword).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ hasPassword: true });
    });

    it('should return false when user has no password', async () => {
      // Arrange
      const req = mockRequest();
      authService.hasPassword.mockResolvedValue(false);

      // Act
      const result = await controller.getPasswordStatus(req);

      // Assert
      expect(result).toEqual({ hasPassword: false });
    });
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      // Arrange
      const mockUser = createMockUser({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });

      const req = mockRequest();
      usersService.findById.mockResolvedValue(mockUser as any);

      // Act
      const result = await controller.getMe(req);

      // Assert
      expect(usersService.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      const req = mockRequest();
      usersService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.getMe(req)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.getMe(req)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('testLogin', () => {
    it('should create test session with valid test secret', async () => {
      // Arrange
      const testLoginDto = {
        email: 'test@example.com',
        testSecret: 'valid-test-secret',
      };

      const expectedResponse = new AuthResponseDto(
        'test-access-token',
        'test-refresh-token',
        900,
        false,
      );

      authService.createTestSession.mockResolvedValue(expectedResponse);
      const res = mockResponse();

      // Act
      const result = await controller.testLogin(testLoginDto, res);

      // Assert
      expect(authService.createTestSession).toHaveBeenCalledWith(
        'test@example.com',
        'valid-test-secret',
      );
      expect(authService.setAuthCookies).toHaveBeenCalledWith(
        res,
        'test-access-token',
        'test-refresh-token',
      );
      expect(authService.setOnboardingCompleteCookie).toHaveBeenCalledWith(res);
      expect(result.accessToken).toBe('test-access-token');
    });
  });

  describe('controller initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have authService injected', () => {
      expect(authService).toBeDefined();
    });

    it('should have usersService injected', () => {
      expect(usersService).toBeDefined();
    });
  });
});
