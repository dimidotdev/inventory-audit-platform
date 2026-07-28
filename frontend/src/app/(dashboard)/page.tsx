'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Package, Plus, ArrowRight } from 'lucide-react';
import type { PaginatedResponse, StockCountSummary, Product } from '@/types';

export default function DashboardPage() {
  const { employee } = useAuth();
  const [contagensAtivas, setContagensAtivas] = useState<StockCountSummary[]>([]);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [totalContagens, setTotalContagens] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [contRes, prodRes] = await Promise.all([
          api.get<PaginatedResponse<StockCountSummary>>('/contagens-estoque?status=EM_ANDAMENTO&limit=5'),
          api.get<PaginatedResponse<Product>>('/produtos?limit=1'),
        ]);
        setContagensAtivas(contRes.data.data);
        setTotalContagens(contRes.data.pagination.total);
        setTotalProdutos(prodRes.data.pagination.total);
      } catch {
        // silently fail on dashboard
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {employee?.nome}
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Contagens em Andamento
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : contagensAtivas.length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {totalContagens} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos Cadastrados
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : totalProdutos}
            </div>
            <p className="text-xs text-muted-foreground">
              no sistema
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ação Rápida</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/contagens/nova">
              <Button className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Nova Contagem
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Contagens recentes em andamento */}
      <Card>
        <CardHeader>
          <CardTitle>Contagens em Andamento</CardTitle>
          <CardDescription>
            Últimas contagens que ainda não foram finalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : contagensAtivas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma contagem em andamento.
            </p>
          ) : (
            <div className="space-y-3">
              {contagensAtivas.map((c) => (
                <Link
                  key={c.id}
                  href={`/contagens/${c.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{c.codigo}</span>
                      <Badge variant="outline">Em Andamento</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(c.dataAgendada).toLocaleDateString('pt-BR')} • {c.responsavelNome}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
          {contagensAtivas.length > 0 && (
            <div className="mt-4">
              <Link href="/contagens">
                <Button variant="outline" size="sm" className="w-full">
                  Ver todas as contagens
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
