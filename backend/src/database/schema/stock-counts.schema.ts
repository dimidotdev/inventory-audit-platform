import { pgTable, text } from 'drizzle-orm/pg-core';
import { employees } from './employees.schema';

export const stockCounts = pgTable('stock_counts', {
  id: text('id').primaryKey(),
  codigo: text('codigo').notNull().unique(),
  dataAgendada: text('data_agendada').notNull(),
  responsavelId: text('responsavel_id')
    .notNull()
    .references(() => employees.id),
  status: text('status', {
    enum: ['EM_ANDAMENTO', 'FINALIZADA'],
  })
    .notNull()
    .default('EM_ANDAMENTO'),
  criadoEm: text('criado_em').notNull(),
  atualizadoEm: text('atualizado_em').notNull(),
});
