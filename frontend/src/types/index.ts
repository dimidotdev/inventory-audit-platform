// ─── Employee / Auth ─────────────────────────────────────
export interface Employee {
  id: string;
  nome: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface AuthResponse {
  accessToken: string;
  employee: Employee;
}

// ─── Products ────────────────────────────────────────────
export interface Product {
  id: string;
  codigoSistema: string;
  nome: string;
  quantidadeSistema: number;
}

export interface CreateProductRequest {
  codigoSistema: string;
  nome: string;
  quantidadeEstoque?: number;
}

// ─── Stock Counts ────────────────────────────────────────
export type StockCountStatus = 'EM_ANDAMENTO' | 'FINALIZADA';
export type ItemSituacao = 'A_CONFERIR' | 'CONFERIDO' | 'FALTANTE_EXCEDENTE';

export interface StockCountSummary {
  id: string;
  codigo: string;
  dataAgendada: string;
  status: StockCountStatus;
  criadoEm: string;
  atualizadoEm: string;
  responsavelId: string;
  responsavelNome: string;
  responsavelEmail: string;
}

export interface StockCountItem {
  id: string;
  produtoId: string;
  codigoSistema: string;
  produtoNome: string;
  quantidadeSistemaSnapshot: number;
  quantidadeContada: number | null;
  situacao: ItemSituacao;
  observacao: string | null;
}

export interface StockCountDetail extends StockCountSummary {
  resumo: {
    total: number;
    aConferir: number;
    conferidos: number;
    faltantesExcedentes: number;
  };
  itens: {
    aConferir: StockCountItem[];
    conferidos: StockCountItem[];
    faltantesExcedentes: StockCountItem[];
  };
}

export interface CreateStockCountRequest {
  dataAgendada: string;
  responsavelId?: string;
}

export interface UpdateStockCountItemRequest {
  contagemEstoqueId: string;
  quantidadeContada: number;
  observacao?: string;
}

export interface UpdateStockCountStatusRequest {
  status: StockCountStatus;
}

// ─── Pagination ──────────────────────────────────────────
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
