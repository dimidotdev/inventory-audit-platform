import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { eq, like, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import type { DrizzleDB } from '../database/database.module';
import { products, productStocks } from '../database/schema';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateProductStockDto,
} from './dto';

@Injectable()
export class ProductsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(filters?: { busca?: string; page?: number; limit?: number }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const offset = (page - 1) * limit;

    let query = this.db
      .select({
        id: products.id,
        codigoSistema: products.codigoSistema,
        nome: products.nome,
        quantidadeSistema: productStocks.quantidadeSistema,
      })
      .from(products)
      .leftJoin(productStocks, eq(products.id, productStocks.produtoId))
      .$dynamic();

    if (filters?.busca) {
      const termo = `%${filters.busca}%`;
      query = query.where(
        or(like(products.codigoSistema, termo), like(products.nome, termo)),
      );
    }

    const data = await query.limit(limit).offset(offset);

    const [{ total }] = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(products);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const [result] = await this.db
      .select({
        id: products.id,
        codigoSistema: products.codigoSistema,
        nome: products.nome,
        quantidadeSistema: productStocks.quantidadeSistema,
      })
      .from(products)
      .leftJoin(productStocks, eq(products.id, productStocks.produtoId))
      .where(eq(products.id, id))
      .limit(1);

    if (!result) {
      throw new NotFoundException('Produto não encontrado');
    }

    return result;
  }

  async create(dto: CreateProductDto) {
    // Verifica duplicata de código do sistema
    const [existing] = await this.db
      .select()
      .from(products)
      .where(eq(products.codigoSistema, dto.codigoSistema))
      .limit(1);

    if (existing) {
      throw new ConflictException(
        `Código de sistema "${dto.codigoSistema}" já cadastrado`,
      );
    }

    const productId = randomUUID();
    const stockId = randomUUID();

    await this.db.transaction(async (tx) => {
      await tx.insert(products).values({
        id: productId,
        codigoSistema: dto.codigoSistema,
        nome: dto.nome,
      });

      await tx.insert(productStocks).values({
        id: stockId,
        produtoId: productId,
        quantidadeSistema: dto.quantidadeEstoque ?? 0,
      });
    });

    return this.findOne(productId);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id); // garante existência

    if (dto.codigoSistema) {
      const [dup] = await this.db
        .select()
        .from(products)
        .where(eq(products.codigoSistema, dto.codigoSistema))
        .limit(1);
      if (dup && dup.id !== id) {
        throw new ConflictException(
          `Código de sistema "${dto.codigoSistema}" já cadastrado`,
        );
      }
    }

    const updateData: Record<string, string> = {};
    if (dto.nome) updateData.nome = dto.nome;
    if (dto.codigoSistema) updateData.codigoSistema = dto.codigoSistema;

    if (Object.keys(updateData).length > 0) {
      await this.db.update(products).set(updateData).where(eq(products.id, id));
    }

    return this.findOne(id);
  }

  async updateStock(productId: string, dto: UpdateProductStockDto) {
    await this.findOne(productId); // garante existência

    await this.db
      .update(productStocks)
      .set({ quantidadeSistema: dto.quantidadeSistema })
      .where(eq(productStocks.produtoId, productId));

    return this.findOne(productId);
  }

  async remove(id: string) {
    await this.findOne(id); // garante existência

    await this.db.transaction(async (tx) => {
      await tx.delete(productStocks).where(eq(productStocks.produtoId, id));

      await tx.delete(products).where(eq(products.id, id));
    });

    return { message: 'Produto removido com sucesso' };
  }
}
