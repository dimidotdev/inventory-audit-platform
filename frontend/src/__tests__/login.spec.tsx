import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Mock de dependências externas ──────────────────────
const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    employee: null,
    isLoading: false,
    logout: jest.fn(),
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

import LoginPage from '@/app/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o título "Contagem de Estoque"', () => {
    render(<LoginPage />);
    expect(screen.getByText('Contagem de Estoque')).toBeInTheDocument();
  });

  it('deve exibir formulário de login por padrão', () => {
    render(<LoginPage />);
    expect(screen.getByText('Faça login para acessar o sistema')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('deve alternar para aba de registro ao clicar em "Registrar"', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText('Registrar'));

    expect(screen.getByText('Crie sua conta para começar')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument();
  });

  it('deve voltar para aba de login ao clicar em "Login"', () => {
    render(<LoginPage />);

    // Vai para registro
    fireEvent.click(screen.getByText('Registrar'));
    expect(screen.getByText('Crie sua conta para começar')).toBeInTheDocument();

    // Volta para login
    fireEvent.click(screen.getByText('Login'));
    expect(screen.getByText('Faça login para acessar o sistema')).toBeInTheDocument();
  });

  it('deve ter campo de email com tipo "email" no login', () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('deve ter campo de senha com tipo "password" no login', () => {
    render(<LoginPage />);
    const senhaInput = screen.getByLabelText('Senha');
    expect(senhaInput).toHaveAttribute('type', 'password');
  });

  it('deve exibir 3 campos no formulário de registro (nome, email, senha)', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText('Registrar'));

    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('campo senha do registro deve ter minLength=6', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText('Registrar'));

    const senhaInput = screen.getByLabelText('Senha');
    expect(senhaInput).toHaveAttribute('minlength', '6');
  });

  it('deve permitir digitar no campo de email do login', () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'operator@example.com' } });
    expect(emailInput.value).toBe('operator@example.com');
  });

  it('deve exibir as duas abas (Login e Registrar)', () => {
    render(<LoginPage />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Registrar')).toBeInTheDocument();
  });
});
