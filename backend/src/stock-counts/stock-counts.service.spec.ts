import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { StockCountsService } from './stock-counts.service';
import { DRIZZLE } from '../database/database.module';

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('StockCountsService', () => {
  let service: StockCountsService;
  let mockDb: any;

  const mockCount = {
    id: 'count-1',
    codigo: '1001',
    dataAgendada: '2025-06-15',
    status: 'EM_ANDAMENTO',
    criadoEm: '2025-06-01T00:00:00.000Z',
    atualizadoEm: '2025-06-01T00:00:00.000Z',
    responsavelId: 'emp-1',
    responsavelNome: 'Admin',
    responsavelEmail: 'admin@example.com',
  };

  const mockItem = {
    id: 'item-1',
    contagemEstoqueId: 'count-1',
    produtoId: 'prod-1',
    quantidadeSistemaSnapshot: 50,
    quantidadeContada: null,
    situacao: 'A_CONFERIR',
    observacao: null,
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      transaction: jest.fn(async (fn) => fn(mockDb)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [StockCountsService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();

    service = module.get<StockCountsService>(StockCountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated stock counts', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.leftJoin = jest.fn().mockReturnValue(chain);
      chain.$dynamic = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.orderBy = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockReturnValue(chain);
      chain.offset = jest.fn().mockResolvedValue([mockCount]);

      const countChain: any = {};
      countChain.from = jest.fn().mockResolvedValue([{ total: 1 }]);

      mockDb.select.mockReturnValueOnce(chain).mockReturnValueOnce(countChain);

      const result = await service.findAll();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should apply status filter', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.leftJoin = jest.fn().mockReturnValue(chain);
      chain.$dynamic = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.orderBy = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockReturnValue(chain);
      chain.offset = jest.fn().mockResolvedValue([mockCount]);

      const countChain: any = {};
      countChain.from = jest.fn().mockResolvedValue([{ total: 1 }]);

      mockDb.select.mockReturnValueOnce(chain).mockReturnValueOnce(countChain);

      await service.findAll({ status: 'EM_ANDAMENTO' });

      expect(chain.where).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException for non-existent count', async () => {
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

    it('should return count with grouped items', async () => {
      // 1a select: contagem
      const countChain: any = {};
      countChain.from = jest.fn().mockReturnValue(countChain);
      countChain.leftJoin = jest.fn().mockReturnValue(countChain);
      countChain.where = jest.fn().mockReturnValue(countChain);
      countChain.limit = jest.fn().mockResolvedValue([mockCount]);

      // 2a select: itens
      const itemsChain: any = {};
      itemsChain.from = jest.fn().mockReturnValue(itemsChain);
      itemsChain.leftJoin = jest.fn().mockReturnValue(itemsChain);
      itemsChain.where = jest.fn().mockResolvedValue([
        {
          ...mockItem,
          codigoSistema: 'ITEM-1001',
          produtoNome: 'Caixa organizadora 30 L',
        },
      ]);

      mockDb.select
        .mockReturnValueOnce(countChain)
        .mockReturnValueOnce(itemsChain);

      const result = await service.findOne('count-1');

      expect(result).toHaveProperty('resumo');
      expect(result.resumo.total).toBe(1);
      expect(result.resumo.aConferir).toBe(1);
      expect(result).toHaveProperty('itens');
      expect(result.itens.aConferir).toHaveLength(1);
    });
  });

  describe('updateItem', () => {
    it('should throw NotFoundException for non-existent item', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([]);
      mockDb.select.mockReturnValue(chain);

      await expect(
        service.updateItem('invalid', {
          contagemEstoqueId: 'count-1',
          quantidadeContada: 50,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for wrong contagemEstoqueId', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([mockItem]);
      mockDb.select.mockReturnValue(chain);

      await expect(
        service.updateItem('item-1', {
          contagemEstoqueId: 'wrong-count',
          quantidadeContada: 50,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException for finalized count', async () => {
      // 1a select: item
      const itemChain: any = {};
      itemChain.from = jest.fn().mockReturnValue(itemChain);
      itemChain.where = jest.fn().mockReturnValue(itemChain);
      itemChain.limit = jest.fn().mockResolvedValue([mockItem]);

      // 2a select: contagem finalizada
      const countChain: any = {};
      countChain.from = jest.fn().mockReturnValue(countChain);
      countChain.where = jest.fn().mockReturnValue(countChain);
      countChain.limit = jest
        .fn()
        .mockResolvedValue([{ ...mockCount, status: 'FINALIZADA' }]);

      mockDb.select
        .mockReturnValueOnce(itemChain)
        .mockReturnValueOnce(countChain);

      await expect(
        service.updateItem('item-1', {
          contagemEstoqueId: 'count-1',
          quantidadeContada: 50,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should require observação when quantity differs', async () => {
      // 1a select: item
      const itemChain: any = {};
      itemChain.from = jest.fn().mockReturnValue(itemChain);
      itemChain.where = jest.fn().mockReturnValue(itemChain);
      itemChain.limit = jest.fn().mockResolvedValue([mockItem]);

      // 2a select: contagem (em andamento)
      const countChain: any = {};
      countChain.from = jest.fn().mockReturnValue(countChain);
      countChain.where = jest.fn().mockReturnValue(countChain);
      countChain.limit = jest.fn().mockResolvedValue([mockCount]);

      mockDb.select
        .mockReturnValueOnce(itemChain)
        .mockReturnValueOnce(countChain);

      await expect(
        service.updateItem('item-1', {
          contagemEstoqueId: 'count-1',
          quantidadeContada: 30, // diferente de 50
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException for non-existent count', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest.fn().mockResolvedValue([]);
      mockDb.select.mockReturnValue(chain);

      await expect(
        service.updateStatus('invalid', { status: 'FINALIZADA' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for already finalized count', async () => {
      const chain: any = {};
      chain.from = jest.fn().mockReturnValue(chain);
      chain.where = jest.fn().mockReturnValue(chain);
      chain.limit = jest
        .fn()
        .mockResolvedValue([{ ...mockCount, status: 'FINALIZADA' }]);
      mockDb.select.mockReturnValue(chain);

      await expect(
        service.updateStatus('count-1', { status: 'FINALIZADA' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
