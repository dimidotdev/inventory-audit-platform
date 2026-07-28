import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { eq, like, or, sql, desc } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import type { DrizzleDB } from '../database/database.module';
import {
  stockCounts,
  stockCountItems,
  products,
  productStocks,
  employees,
} from '../database/schema';
import {
  CreateStockCountDto,
  UpdateStockCountItemDto,
  UpdateStockCountStatusDto,
} from './dto';

@Injectable()
export class StockCountsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * Lista todas as contagens de estoque com filtros opcionais.
   */
  async findAll(filters?: {
    status?: 'EM_ANDAMENTO' | 'FINALIZADA';
    busca?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = this.db
      .select({
        id: stockCounts.id,
        codigo: stockCounts.codigo,
        dataAgendada: stockCounts.dataAgendada,
        status: stockCounts.status,
        criadoEm: stockCounts.criadoEm,
        atualizadoEm: stockCounts.atualizadoEm,
        responsavelId: stockCounts.responsavelId,
        responsavelNome: employees.nome,
        responsavelEmail: employees.email,
      })
      .from(stockCounts)
      .leftJoin(employees, eq(stockCounts.responsavelId, employees.id))
      .$dynamic();

    // Filtro por status
    if (filters?.status) {
      query = query.where(eq(stockCounts.status, filters.status));
    }

    // Busca por código ou nome do responsável
    if (filters?.busca) {
      const termo = `%${filters.busca}%`;
      query = query.where(
        or(like(stockCounts.codigo, termo), like(employees.nome, termo)),
      );
    }

    const data = await query
      .orderBy(desc(stockCounts.criadoEm))
      .limit(limit)
      .offset(offset);

    // Total para paginação
    const [{ total }] = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(stockCounts);

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

  /**
   * Busca uma contagem por ID, com todos os items agrupados por situação.
   */
  async findOne(id: string) {
    const [count] = await this.db
      .select({
        id: stockCounts.id,
        codigo: stockCounts.codigo,
        dataAgendada: stockCounts.dataAgendada,
        status: stockCounts.status,
        criadoEm: stockCounts.criadoEm,
        atualizadoEm: stockCounts.atualizadoEm,
        responsavelId: stockCounts.responsavelId,
        responsavelNome: employees.nome,
        responsavelEmail: employees.email,
      })
      .from(stockCounts)
      .leftJoin(employees, eq(stockCounts.responsavelId, employees.id))
      .where(eq(stockCounts.id, id))
      .limit(1);

    if (!count) {
      throw new NotFoundException('Contagem de estoque não encontrada');
    }

    // Busca itens com dados do produto
    const items = await this.db
      .select({
        id: stockCountItems.id,
        produtoId: stockCountItems.produtoId,
        codigoSistema: products.codigoSistema,
        produtoNome: products.nome,
        quantidadeSistemaSnapshot: stockCountItems.quantidadeSistemaSnapshot,
        quantidadeContada: stockCountItems.quantidadeContada,
        situacao: stockCountItems.situacao,
        observacao: stockCountItems.observacao,
      })
      .from(stockCountItems)
      .leftJoin(products, eq(stockCountItems.produtoId, products.id))
      .where(eq(stockCountItems.contagemEstoqueId, id));

    // Agrupamento por situação (estado derivado)
    const aConferir = items.filter((i) => i.situacao === 'A_CONFERIR');
    const conferidos = items.filter((i) => i.situacao === 'CONFERIDO');
    const faltantesExcedentes = items.filter(
      (i) => i.situacao === 'FALTANTE_EXCEDENTE',
    );

    return {
      ...count,
      resumo: {
        total: items.length,
        aConferir: aConferir.length,
        conferidos: conferidos.length,
        faltantesExcedentes: faltantesExcedentes.length,
      },
      itens: {
        aConferir,
        conferidos,
        faltantesExcedentes,
      },
    };
  }

  /**
   * Cria uma nova contagem, gerando snapshot do estoque atual.
   * Usa transação para garantir atomicidade.
   */
  async create(dto: CreateStockCountDto, userId: string) {
    const responsavelId = dto.responsavelId || userId;

    // Verifica se o responsável existe
    const [resp] = await this.db
      .select()
      .from(employees)
      .where(eq(employees.id, responsavelId))
      .limit(1);

    if (!resp) {
      throw new NotFoundException('Funcionário responsável não encontrado');
    }

    // Busca todos os produtos com estoque
    const produtosComEstoque = await this.db
      .select({
        produtoId: products.id,
        quantidadeSistema: productStocks.quantidadeSistema,
      })
      .from(products)
      .innerJoin(productStocks, eq(products.id, productStocks.produtoId));

    if (produtosComEstoque.length === 0) {
      throw new BadRequestException(
        'Não há produtos cadastrados com estoque para iniciar uma contagem',
      );
    }

    const now = new Date().toISOString();
    const countId = randomUUID();

    // Transação atômica: gera código + insere contagem + insere items
    await this.db.transaction(async (tx) => {
      // Gera código sequencial atômico dentro da transação
      const [result] = await tx
        .select({ maxCodigo: sql<number>`MAX(CAST(codigo AS INTEGER))` })
        .from(stockCounts);
      const codigo = String(((result?.maxCodigo as number | null) ?? 1000) + 1);

      // Cria a contagem
      await tx.insert(stockCounts).values({
        id: countId,
        codigo,
        dataAgendada: dto.dataAgendada,
        responsavelId,
        status: 'EM_ANDAMENTO',
        criadoEm: now,
        atualizadoEm: now,
      });

      // Cria items com snapshot do estoque atual (imutabilidade)
      for (const prod of produtosComEstoque) {
        await tx.insert(stockCountItems).values({
          id: randomUUID(),
          contagemEstoqueId: countId,
          produtoId: prod.produtoId,
          quantidadeSistemaSnapshot: prod.quantidadeSistema,
          quantidadeContada: null,
          situacao: 'A_CONFERIR',
          observacao: null,
        });
      }
    });

    return this.findOne(countId);
  }

  /**
   * Atualiza quantidade contada de um item.
   * Recalcula situação automaticamente.
   * Usa transação para garantir consistência.
   */
  async updateItem(itemId: string, dto: UpdateStockCountItemDto) {
    // Busca o item
    const [item] = await this.db
      .select()
      .from(stockCountItems)
      .where(eq(stockCountItems.id, itemId))
      .limit(1);

    if (!item) {
      throw new NotFoundException('Item de contagem não encontrado');
    }

    // Valida se o item pertence à contagem informada
    if (item.contagemEstoqueId !== dto.contagemEstoqueId) {
      throw new BadRequestException(
        'O item não pertence à contagem de estoque informada',
      );
    }

    // Verifica se a contagem está em andamento
    const [count] = await this.db
      .select()
      .from(stockCounts)
      .where(eq(stockCounts.id, item.contagemEstoqueId))
      .limit(1);

    if (!count) {
      throw new NotFoundException('Contagem de estoque não encontrada');
    }

    if (count.status === 'FINALIZADA') {
      throw new ForbiddenException(
        'Contagem já finalizada. Não é possível editar itens.',
      );
    }

    // Calcula situação com base na contagem
    let situacao: 'CONFERIDO' | 'FALTANTE_EXCEDENTE';
    if (dto.quantidadeContada === item.quantidadeSistemaSnapshot) {
      situacao = 'CONFERIDO';
    } else {
      situacao = 'FALTANTE_EXCEDENTE';

      // Observação obrigatória quando faltante/excedente
      if (!dto.observacao || dto.observacao.trim() === '') {
        throw new BadRequestException(
          'Observação é obrigatória quando a quantidade contada difere da quantidade do sistema',
        );
      }
    }

    const now = new Date().toISOString();

    // Transação: atualiza item + timestamp da contagem
    await this.db.transaction(async (tx) => {
      await tx
        .update(stockCountItems)
        .set({
          quantidadeContada: dto.quantidadeContada,
          situacao,
          observacao:
            situacao === 'FALTANTE_EXCEDENTE' ? dto.observacao!.trim() : null,
        })
        .where(eq(stockCountItems.id, itemId));

      await tx
        .update(stockCounts)
        .set({ atualizadoEm: now })
        .where(eq(stockCounts.id, item.contagemEstoqueId));
    });

    // Retorna item atualizado com dados do produto
    const [updated] = await this.db
      .select({
        id: stockCountItems.id,
        produtoId: stockCountItems.produtoId,
        codigoSistema: products.codigoSistema,
        produtoNome: products.nome,
        quantidadeSistemaSnapshot: stockCountItems.quantidadeSistemaSnapshot,
        quantidadeContada: stockCountItems.quantidadeContada,
        situacao: stockCountItems.situacao,
        observacao: stockCountItems.observacao,
      })
      .from(stockCountItems)
      .leftJoin(products, eq(stockCountItems.produtoId, products.id))
      .where(eq(stockCountItems.id, itemId))
      .limit(1);

    return updated;
  }

  /**
   * Atualiza o status da contagem (salvar parcial ou finalizar).
   */
  async updateStatus(id: string, dto: UpdateStockCountStatusDto) {
    const [count] = await this.db
      .select()
      .from(stockCounts)
      .where(eq(stockCounts.id, id))
      .limit(1);

    if (!count) {
      throw new NotFoundException('Contagem de estoque não encontrada');
    }

    if (count.status === 'FINALIZADA') {
      throw new ForbiddenException(
        'Contagem já finalizada. Não é possível alterar o status.',
      );
    }

    const now = new Date().toISOString();

    await this.db
      .update(stockCounts)
      .set({
        status: dto.status,
        atualizadoEm: now,
      })
      .where(eq(stockCounts.id, id));

    return this.findOne(id);
  }
}
