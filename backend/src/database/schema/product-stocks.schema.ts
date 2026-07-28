import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { products } from './products.schema';

export const productStocks = pgTable('product_stocks', {
  id: text('id').primaryKey(),
  produtoId: text('produto_id')
    .notNull()
    .unique()
    .references(() => products.id),
  quantidadeSistema: integer('quantidade_sistema').notNull().default(0),
});
