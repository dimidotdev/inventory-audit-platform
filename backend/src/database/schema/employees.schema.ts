import { pgTable, text } from 'drizzle-orm/pg-core';

export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  senha: text('senha').notNull(),
});
