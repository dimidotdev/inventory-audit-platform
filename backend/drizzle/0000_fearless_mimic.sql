CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha" text NOT NULL,
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo_sistema" text NOT NULL,
	"nome" text NOT NULL,
	CONSTRAINT "products_codigo_sistema_unique" UNIQUE("codigo_sistema")
);
--> statement-breakpoint
CREATE TABLE "product_stocks" (
	"id" text PRIMARY KEY NOT NULL,
	"produto_id" text NOT NULL,
	"quantidade_sistema" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_stocks_produto_id_unique" UNIQUE("produto_id")
);
--> statement-breakpoint
CREATE TABLE "stock_counts" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"data_agendada" text NOT NULL,
	"responsavel_id" text NOT NULL,
	"status" text DEFAULT 'EM_ANDAMENTO' NOT NULL,
	"criado_em" text NOT NULL,
	"atualizado_em" text NOT NULL,
	CONSTRAINT "stock_counts_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "stock_count_items" (
	"id" text PRIMARY KEY NOT NULL,
	"contagem_estoque_id" text NOT NULL,
	"produto_id" text NOT NULL,
	"quantidade_sistema_snapshot" integer NOT NULL,
	"quantidade_contada" integer,
	"situacao" text DEFAULT 'A_CONFERIR' NOT NULL,
	"observacao" text
);
--> statement-breakpoint
ALTER TABLE "product_stocks" ADD CONSTRAINT "product_stocks_produto_id_products_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_responsavel_id_employees_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count_items" ADD CONSTRAINT "stock_count_items_contagem_estoque_id_stock_counts_id_fk" FOREIGN KEY ("contagem_estoque_id") REFERENCES "public"."stock_counts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count_items" ADD CONSTRAINT "stock_count_items_produto_id_products_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;