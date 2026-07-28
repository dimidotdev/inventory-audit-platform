import { pgTable, text } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  codigoSistema: text('codigo_sistema').notNull().unique(),
  nome: text('nome').notNull(),
});
