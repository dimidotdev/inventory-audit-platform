import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { DRIZZLE } from '../database/database.module';

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('ProductsService', () => {
  let service: ProductsService;
  let mockDb: any;

  const mockProduct = {
    id: 'prod-1',
    codigoSistema: 'ITEM-1001',
    nome: 'Caixa organizadora 30 L',
    quantidadeSistema: 50,
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      transaction: jest.fn(async (fn) => fn(mockDb)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products list', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.leftJoin = jest.fn().mockReturnValue(chain);
      chain.$dynamic = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockReturnValue(chain);
      chain.offset = jest.fn().mockResolvedValue([mockProduct]);
      mockDb.select.mockReturnValue(chain);

      // count query
      const countChain: any = {};
      countChain.from = jest.fn().mockResolvedValue([{ total: 1 }]);
      // Segunda chamada a select (count)
      mockDb.select.mockReturnValueOnce(chain).mockReturnValueOnce(countChain);

      const result = await service.findAll();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('limit', 50);
    });

    it('should filter by search term', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.leftJoin = jest.fn().mockReturnValue(chain);
      chain.$dynamic = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockReturnValue(chain);
      chain.offset = jest.fn().mockResolvedValue([mockProduct]);
      mockDb.select.mockReturnValue(chain);

      const countChain: any = {};
      countChain.from = jest.fn().mockResolvedValue([{ total: 1 }]);
      mockDb.select.mockReturnValueOnce(chain).mockReturnValueOnce(countChain);

      const result = await service.findAll({ busca: 'Caixa' });

      expect(chain.where).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.leftJoin = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([mockProduct]);
      mockDb.select.mockReturnValue(chain);

      const result = await service.findOne('prod-1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException for non-existent product', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.leftJoin = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([]);
      mockDb.select.mockReturnValue(chain);

      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should throw ConflictException for duplicate codigoSistema', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([mockProduct]);
      mockDb.select.mockReturnValue(chain);

      await expect(
        service.create({
          codigoSistema: 'ITEM-1001',
          nome: 'Duplicado',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException for non-existent product', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.leftJoin = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([]);
      mockDb.select.mockReturnValue(chain);

      await expect(service.remove('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
