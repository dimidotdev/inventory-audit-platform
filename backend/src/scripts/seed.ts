import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { hashSync } from 'bcryptjs';
import { employees, products, productStocks } from '../database/schema';
import { databaseSslOptions } from '../database/database.config';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada.');
  process.exit(1);
}

async function seed() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: databaseSslOptions(
      process.env.DATABASE_SSL,
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
    ),
  });
  const db = drizzle(pool);

  console.log('🌱 Seeding database...');

  // ─── Employees ────────────────────────────────────────────
  const existingEmployees = await db.select().from(employees);
  if (existingEmployees.length === 0) {
    const seedEmployees = [
      {
        id: randomUUID(),
        nome: 'Admin',
        email: 'admin@example.com',
        senha: hashSync('123456', 10),
      },
      {
        id: randomUUID(),
        nome: 'Operador Um',
        email: 'operador.um@example.com',
        senha: hashSync('123456', 10),
      },
      {
        id: randomUUID(),
        nome: 'Operador Dois',
        email: 'operador.dois@example.com',
        senha: hashSync('123456', 10),
      },
    ];

    for (const emp of seedEmployees) {
      await db.insert(employees).values(emp);
    }
    console.log(`✅ ${seedEmployees.length} funcionários criados`);
  } else {
    console.log(`⏩ Funcionários já existem (${existingEmployees.length})`);
  }

  // ─── Products + Stock ─────────────────────────────────────
  const existingProducts = await db.select().from(products);
  if (existingProducts.length === 0) {
    const seedProducts = [
      { codigo: 'ITEM-1001', nome: 'Caixa organizadora 30 L', qtd: 48 },
      { codigo: 'ITEM-1002', nome: 'Etiqueta adesiva 100 × 50 mm', qtd: 240 },
      { codigo: 'ITEM-1003', nome: 'Filme stretch 500 mm', qtd: 72 },
      { codigo: 'ITEM-1004', nome: 'Palete plástico 1000 × 1200 mm', qtd: 36 },
      { codigo: 'ITEM-1005', nome: 'Luva de proteção tamanho M', qtd: 160 },
      { codigo: 'ITEM-1006', nome: 'Fita para embalagem 48 mm', qtd: 96 },
      { codigo: 'ITEM-1007', nome: 'Prancheta de inventário', qtd: 28 },
      { codigo: 'ITEM-1008', nome: 'Lacre numerado', qtd: 320 },
      { codigo: 'ITEM-1009', nome: 'Bobina térmica 80 mm', qtd: 84 },
      { codigo: 'ITEM-1010', nome: 'Marcador permanente', qtd: 64 },
    ];

    for (const p of seedProducts) {
      const productId = randomUUID();
      await db.insert(products).values({
        id: productId,
        codigoSistema: p.codigo,
        nome: p.nome,
      });

      await db.insert(productStocks).values({
        id: randomUUID(),
        produtoId: productId,
        quantidadeSistema: p.qtd,
      });
    }
    console.log(`✅ ${seedProducts.length} produtos criados com estoque`);
  } else {
    console.log(`⏩ Produtos já existem (${existingProducts.length})`);
  }

  await pool.end();
  console.log('🌱 Seed concluído!');
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
