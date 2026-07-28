import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { DRIZZLE } from '../database/database.module';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hashSync: jest.fn().mockReturnValue('hashed_password'),
  compareSync: jest.fn(),
}));

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('mock-uuid'),
}));

import { compareSync } from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mockDb: any;

  const mockEmployee = {
    id: 'emp-1',
    nome: 'Admin',
    email: 'admin@example.com',
    senha: '$2a$10$hashedpassword',
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return accessToken and employee on valid credentials', async () => {
      // Mock: encontra o employee
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([mockEmployee]);
      mockDb.select.mockReturnValue(chain);

      (compareSync as jest.Mock).mockReturnValue(true);

      const result = await service.login({
        email: 'admin@example.com',
        senha: '123456',
      });

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('employee');
      expect(result.employee).toEqual({
        id: 'emp-1',
        nome: 'Admin',
        email: 'admin@example.com',
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'emp-1',
        email: 'admin@example.com',
        nome: 'Admin',
      });
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([]);
      mockDb.select.mockReturnValue(chain);

      await expect(
        service.login({ email: 'naoexiste@example.com', senha: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([mockEmployee]);
      mockDb.select.mockReturnValue(chain);

      (compareSync as jest.Mock).mockReturnValue(false);

      await expect(
        service.login({ email: 'admin@example.com', senha: 'errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should throw ConflictException for duplicate email', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([mockEmployee]);
      mockDb.select.mockReturnValue(chain);

      await expect(
        service.register({
          nome: 'Novo',
          email: 'admin@example.com',
          senha: '123456',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create employee and return token on valid registration', async () => {
      // select → empty (no duplicate)
      const selectChain: any = {};
      selectChain.from = jest.fn().mockReturnValue(selectChain);
      selectChain.where = jest.fn().mockReturnValue(selectChain);
      selectChain.limit = jest.fn().mockResolvedValue([]);
      mockDb.select.mockReturnValue(selectChain);

      // insert
      const insertChain: any = {};
      insertChain.values = jest.fn().mockResolvedValue(undefined);
      mockDb.insert.mockReturnValue(insertChain);

      const result = await service.register({
        nome: 'Novo Funcionário',
        email: 'novo.operador@example.com',
        senha: '123456',
      });

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result.employee).toEqual({
        id: 'mock-uuid',
        nome: 'Novo Funcionário',
        email: 'novo.operador@example.com',
      });
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return employee profile', async () => {
      const profile = {
        id: 'emp-1',
        nome: 'Admin',
        email: 'admin@example.com',
      };
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([profile]);
      mockDb.select.mockReturnValue(chain);

      const result = await service.getProfile('emp-1');

      expect(result).toEqual(profile);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([]);
      mockDb.select.mockReturnValue(chain);

      await expect(service.getProfile('invalid-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
