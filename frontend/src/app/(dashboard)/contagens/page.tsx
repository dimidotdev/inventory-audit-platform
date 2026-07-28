'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search } from 'lucide-react';
import type { PaginatedResponse, StockCountSummary } from '@/types';

export default function ContagensPage() {
  const [contagens, setContagens] = useState<StockCountSummary[]>([]);
  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (search?: string, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('busca', search);
      if (status) params.set('status', status);
      params.set('limit', '50');
      const res = await api.get<PaginatedResponse<StockCountSummary>>(
        `/contagens-estoque?${params.toString()}`,
      );
      setContagens(res.data.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      load(busca, statusFilter);
    }, 300);
    return () => clearTimeout(timeout);
  }, [busca, statusFilter, load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Contagens de Estoque
          </h1>
          <p className="text-muted-foreground">
            Gerencie as contagens de estoque agendadas
          </p>
        </div>
        <Link href="/contagens/nova">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Contagem
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou responsável..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('')}
          >
            Todas
          </Button>
          <Button
            variant={statusFilter === 'EM_ANDAMENTO' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('EM_ANDAMENTO')}
          >
            Em Andamento
          </Button>
          <Button
            variant={statusFilter === 'FINALIZADA' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('FINALIZADA')}
          >
            Finalizadas
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Data Agendada</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : contagens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma contagem encontrada
                </TableCell>
              </TableRow>
            ) : (
              contagens.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">
                    #{c.codigo}
                  </TableCell>
                  <TableCell>
                    {new Date(c.dataAgendada).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{c.responsavelNome}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.status === 'FINALIZADA' ? 'secondary' : 'default'
                      }
                    >
                      {c.status === 'FINALIZADA'
                        ? 'Finalizada'
                        : 'Em Andamento'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/contagens/${c.id}`}>
                      <Button variant="outline" size="sm">
                        {c.status === 'FINALIZADA' ? 'Visualizar' : 'Conferir'}
                      </Button>
                    </Link>
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
