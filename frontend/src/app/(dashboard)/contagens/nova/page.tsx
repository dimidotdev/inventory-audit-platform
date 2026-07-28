'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import type { StockCountDetail } from '@/types';

export default function NovaContagemPage() {
  const router = useRouter();
  const [dataAgendada, setDataAgendada] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!dataAgendada) {
      toast.error('Informe a data agendada');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<StockCountDetail>('/contagens-estoque', {
        dataAgendada,
      });
      toast.success(`Contagem #${res.data.codigo} criada com sucesso!`);
      router.push(`/contagens/${res.data.id}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Erro ao criar contagem');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/contagens')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Nova Contagem de Estoque
          </h1>
          <p className="text-muted-foreground">
            Crie uma nova contagem e todos os produtos serão incluídos
            automaticamente
          </p>
        </div>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Dados da Contagem</CardTitle>
          <CardDescription>
            Ao criar, o sistema gera automaticamente um snapshot de todos os
            produtos com suas quantidades atuais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data Agendada</Label>
              <Input
                id="data"
                type="date"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              {loading ? 'Criando...' : 'Criar Contagem'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
