import api from '@/lib/api';

interface TestRequestConfig {
  headers: Record<string, string>;
}

interface RequestInterceptorHandler {
  fulfilled: (config: TestRequestConfig) => TestRequestConfig;
}

interface RequestInterceptorManager {
  handlers: RequestInterceptorHandler[];
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('API Client', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('deve ter baseURL configurada para http://localhost:3001', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:3001');
  });

  it('deve ter Content-Type application/json', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('deve ter interceptors de request configurados', () => {
    // O axios registra interceptors internamente
    expect(api.interceptors.request).toBeDefined();
  });

  it('deve ter interceptors de response configurados', () => {
    expect(api.interceptors.response).toBeDefined();
  });

  it('interceptor de request deve adicionar Authorization quando token existe', async () => {
    localStorageMock.setItem('accessToken', 'test-jwt-token');

    // Simula a execução do interceptor pegando o handler registrado
    const config = { headers: {} as Record<string, string> };

    // Acessa o interceptor diretamente
    const requestInterceptors = (
      api.interceptors.request as unknown as RequestInterceptorManager
    ).handlers;
    expect(requestInterceptors.length).toBeGreaterThan(0);

    // Executa o primeiro interceptor fulfilled
    const result = requestInterceptors[0].fulfilled(config);
    expect(result.headers.Authorization).toBe('Bearer test-jwt-token');
  });

  it('interceptor de request não deve adicionar Authorization sem token', async () => {
    const config = { headers: {} as Record<string, string> };
    const requestInterceptors = (
      api.interceptors.request as unknown as RequestInterceptorManager
    ).handlers;
    const result = requestInterceptors[0].fulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });
});
