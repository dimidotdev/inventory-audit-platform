import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { stockCounts } from './stock-counts.schema';
import { products } from './products.schema';

export const stockCountItems = pgTable('stock_count_items', {
  id: text('id').primaryKey(),
  contagemEstoqueId: text('contagem_estoque_id')
    .notNull()
    .references(() => stockCounts.id),
  produtoId: text('produto_id')
    .notNull()
    .references(() => products.id),
  quantidadeSistemaSnapshot: integer('quantidade_sistema_snapshot').notNull(),
  quantidadeContada: integer('quantidade_contada'),
  situacao: text('situacao', {
    enum: ['A_CONFERIR', 'CONFERIDO', 'FALTANTE_EXCEDENTE'],
  })
    .notNull()
    .default('A_CONFERIR'),
  observacao: text('observacao'),
});
