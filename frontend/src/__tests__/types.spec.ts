import type {
  Employee,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Product,
  StockCountSummary,
  StockCountDetail,
  StockCountItem,
  PaginatedResponse,
} from '@/types';

describe('Types — contratos de dados', () => {
  it('LoginRequest deve conter email e senha', () => {
    const req: LoginRequest = { email: 'operator@example.com', senha: '123456' };
    expect(req).toHaveProperty('email');
    expect(req).toHaveProperty('senha');
  });

  it('RegisterRequest deve conter nome, email e senha', () => {
    const req: RegisterRequest = {
      nome: 'Operador',
      email: 'operator@example.com',
      senha: '123456',
    };
    expect(req).toHaveProperty('nome');
    expect(req).toHaveProperty('email');
    expect(req).toHaveProperty('senha');
  });

  it('AuthResponse deve conter accessToken e employee', () => {
    const res: AuthResponse = {
      accessToken: 'jwt-token',
      employee: { id: '1', nome: 'Operador', email: 'operator@example.com' },
    };
    expect(res.accessToken).toBe('jwt-token');
    expect(res.employee.id).toBe('1');
  });

  it('Employee deve ter id, nome e email', () => {
    const emp: Employee = {
      id: '1',
      nome: 'Operador',
      email: 'operator@example.com',
    };
    expect(emp.id).toBeDefined();
    expect(emp.nome).toBeDefined();
    expect(emp.email).toBeDefined();
  });

  it('Product deve ter id, codigoSistema, nome e quantidadeSistema', () => {
    const prod: Product = {
      id: '1',
      codigoSistema: 'ITEM-1001',
      nome: 'Caixa organizadora 30 L',
      quantidadeSistema: 50,
    };
    expect(prod.codigoSistema).toBe('ITEM-1001');
    expect(prod.quantidadeSistema).toBe(50);
  });

  it('StockCountItem deve ter campos de snapshot e contagem', () => {
    const item: StockCountItem = {
      id: '1',
      produtoId: 'p1',
      codigoSistema: 'ITEM-1001',
      produtoNome: 'Caixa organizadora 30 L',
      quantidadeSistemaSnapshot: 50,
      quantidadeContada: null,
      situacao: 'A_CONFERIR',
      observacao: null,
    };
    expect(item.quantidadeSistemaSnapshot).toBe(50);
    expect(item.quantidadeContada).toBeNull();
    expect(item.situacao).toBe('A_CONFERIR');
  });

  it('StockCountItem com situação CONFERIDO deve ter contagem igual ao snapshot', () => {
    const item: StockCountItem = {
      id: '2',
      produtoId: 'p1',
      codigoSistema: 'ITEM-1001',
      produtoNome: 'Caixa organizadora 30 L',
      quantidadeSistemaSnapshot: 50,
      quantidadeContada: 50,
      situacao: 'CONFERIDO',
      observacao: null,
    };
    expect(item.quantidadeContada).toBe(item.quantidadeSistemaSnapshot);
    expect(item.situacao).toBe('CONFERIDO');
  });

  it('StockCountItem FALTANTE_EXCEDENTE deve ter observação', () => {
    const item: StockCountItem = {
      id: '3',
      produtoId: 'p1',
      codigoSistema: 'ITEM-1001',
      produtoNome: 'Caixa organizadora 30 L',
      quantidadeSistemaSnapshot: 50,
      quantidadeContada: 45,
      situacao: 'FALTANTE_EXCEDENTE',
      observacao: 'Produto danificado',
    };
    expect(item.quantidadeContada).not.toBe(item.quantidadeSistemaSnapshot);
    expect(item.situacao).toBe('FALTANTE_EXCEDENTE');
    expect(item.observacao).toBeTruthy();
  });

  it('StockCountSummary deve representar resumo da contagem', () => {
    const summary: StockCountSummary = {
      id: '1',
      codigo: '1001',
      dataAgendada: '2026-02-09',
      status: 'EM_ANDAMENTO',
      criadoEm: '2026-02-09T00:00:00Z',
      atualizadoEm: '2026-02-09T00:00:00Z',
      responsavelId: 'emp1',
      responsavelNome: 'Operador',
      responsavelEmail: 'operator@example.com',
    };
    expect(summary.status).toBe('EM_ANDAMENTO');
    expect(summary.codigo).toBe('1001');
  });

  it('StockCountDetail deve estender Summary com resumo e itens agrupados', () => {
    const detail: StockCountDetail = {
      id: '1',
      codigo: '1001',
      dataAgendada: '2026-02-09',
      status: 'EM_ANDAMENTO',
      criadoEm: '2026-02-09T00:00:00Z',
      atualizadoEm: '2026-02-09T00:00:00Z',
      responsavelId: 'emp1',
      responsavelNome: 'Operador',
      responsavelEmail: 'operator@example.com',
      resumo: {
        total: 10,
        aConferir: 5,
        conferidos: 3,
        faltantesExcedentes: 2,
      },
      itens: {
        aConferir: [],
        conferidos: [],
        faltantesExcedentes: [],
      },
    };
    expect(detail.resumo.total).toBe(10);
    expect(detail.resumo.aConferir + detail.resumo.conferidos + detail.resumo.faltantesExcedentes).toBe(detail.resumo.total);
  });

  it('PaginatedResponse deve conter data e pagination', () => {
    const paginated: PaginatedResponse<Product> = {
      data: [
        {
          id: '1',
          codigoSistema: 'ITEM-1001',
          nome: 'Caixa organizadora 30 L',
          quantidadeSistema: 10,
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    expect(paginated.data).toHaveLength(1);
    expect(paginated.pagination.page).toBe(1);
    expect(paginated.pagination.totalPages).toBe(1);
  });
});
