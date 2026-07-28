'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';
import type { PaginatedResponse, Product } from '@/types';

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('busca', search);
      params.set('limit', '50');
      const res = await api.get<PaginatedResponse<Product>>(
        `/produtos?${params.toString()}`,
      );
      setProdutos(res.data.data);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      load(busca);
    }, 300);
    return () => clearTimeout(timeout);
  }, [busca, load]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
        <p className="text-muted-foreground">
          Produtos cadastrados no sistema com estoque atual
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por código ou nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Qtd. Sistema</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : produtos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              produtos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">
                    {p.codigoSistema}
                  </TableCell>
                  <TableCell>{p.nome}</TableCell>
                  <TableCell className="text-right font-medium">
                    {p.quantidadeSistema}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
