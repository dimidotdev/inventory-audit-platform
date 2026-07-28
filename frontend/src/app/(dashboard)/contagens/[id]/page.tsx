'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Save,
  Lock,
  Search,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import type { StockCountDetail, StockCountItem } from '@/types';

// ─── Item "A Conferir" ──────────────────────────────────
function ItemAConferir({
  item,
  contagemId,
  onUpdated,
  readOnly,
}: {
  item: StockCountItem;
  contagemId: string;
  onUpdated: () => void;
  readOnly: boolean;
}) {
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [showObs, setShowObs] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    const qtd = parseInt(quantidade, 10);
    if (isNaN(qtd) || qtd < 0) {
      toast.error('Informe uma quantidade válida');
      return;
    }

    // Se diferente do sistema, precisa de observação
    if (qtd !== item.quantidadeSistemaSnapshot && !observacao.trim()) {
      setShowObs(true);
      toast.warning('Quantidade difere do sistema. Informe uma observação.');
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/itens-contagem-estoque/${item.id}`, {
        contagemEstoqueId: contagemId,
        quantidadeContada: qtd,
        ...(qtd !== item.quantidadeSistemaSnapshot && { observacao: observacao.trim() }),
      });
      toast.success(`${item.produtoNome} conferido!`);
      onUpdated();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Erro ao conferir item');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {item.codigoSistema}
            </span>
          </div>
          <p className="font-medium truncate">{item.produtoNome}</p>
          <p className="text-sm text-muted-foreground">
            Qtd. sistema: <span className="font-medium">{item.quantidadeSistemaSnapshot}</span>
          </p>
        </div>
      </div>

      {!readOnly && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              placeholder="Qtd. contada"
              value={quantidade}
              onChange={(e) => {
                setQuantidade(e.target.value);
                const qtd = parseInt(e.target.value, 10);
                if (!isNaN(qtd) && qtd !== item.quantidadeSistemaSnapshot) {
                  setShowObs(true);
                } else {
                  setShowObs(false);
                  setObservacao('');
                }
              }}
              className="w-32"
            />
            <Button
              onClick={handleConfirm}
              disabled={loading || !quantidade}
              size="sm"
              className="gap-1"
            >
              <Check className="h-3 w-3" />
              Confirmar
            </Button>
          </div>

          {showObs && (
            <Textarea
              placeholder="Observação obrigatória (ex: produto danificado, erro de cadastro)"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Item "Conferido" ───────────────────────────────────
function ItemConferido({ item }: { item: StockCountItem }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {item.codigoSistema}
          </span>
        </div>
        <p className="font-medium truncate">{item.produtoNome}</p>
      </div>
      <div className="text-right">
        <span className="text-sm font-medium text-green-700 dark:text-green-400">
          {item.quantidadeContada} un.
        </span>
      </div>
    </div>
  );
}

// ─── Item "Faltante/Excedente" ──────────────────────────
function ItemFaltanteExcedente({ item }: { item: StockCountItem }) {
  const diff = (item.quantidadeContada ?? 0) - item.quantidadeSistemaSnapshot;
  const isFaltante = diff < 0;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
      <div className="flex items-start gap-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {item.codigoSistema}
            </span>
          </div>
          <p className="font-medium truncate">{item.produtoNome}</p>
          <div className="mt-1 flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              Sistema: {item.quantidadeSistemaSnapshot}
            </span>
            <span className="text-muted-foreground">
              Contado: {item.quantidadeContada}
            </span>
            <Badge
              variant="outline"
              className={
                isFaltante
                  ? 'border-red-300 text-red-700 dark:border-red-800 dark:text-red-400'
                  : 'border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400'
              }
            >
              {isFaltante ? (
                <ArrowDown className="mr-1 h-3 w-3" />
              ) : (
                <ArrowUp className="mr-1 h-3 w-3" />
              )}
              {isFaltante ? 'Faltante' : 'Excedente'} ({Math.abs(diff)})
            </Badge>
          </div>
          {item.observacao && (
            <p className="mt-2 text-sm text-muted-foreground italic">
              &ldquo;{item.observacao}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ───────────────────────────────────
export default function ContagemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [contagem, setContagem] = useState<StockCountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFinalizar, setShowFinalizar] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [busca, setBusca] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get<StockCountDetail>(
        `/contagens-estoque/${id}`,
      );
      setContagem(res.data);
    } catch {
      toast.error('Erro ao carregar contagem');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSalvar() {
    try {
      await api.patch(`/contagens-estoque/${id}/status`, {
        status: 'EM_ANDAMENTO',
      });
      toast.success('Contagem salva!');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Erro ao salvar');
      }
    }
  }

  async function handleFinalizar() {
    setFinalizando(true);
    try {
      await api.patch(`/contagens-estoque/${id}/status`, {
        status: 'FINALIZADA',
      });
      toast.success('Contagem finalizada com sucesso!');
      setShowFinalizar(false);
      load();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Erro ao finalizar');
      }
    } finally {
      setFinalizando(false);
    }
  }

  // Filtro por busca local (código ou nome do produto)
  function filterItems(items: StockCountItem[]) {
    if (!busca.trim()) return items;
    const termo = busca.toLowerCase();
    return items.filter(
      (i) =>
        i.codigoSistema.toLowerCase().includes(termo) ||
        i.produtoNome.toLowerCase().includes(termo),
    );
  }

  if (loading || !contagem) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Carregando contagem...
      </div>
    );
  }

  const isFinalizada = contagem.status === 'FINALIZADA';
  const aConferir = filterItems(contagem.itens.aConferir);
  const conferidos = filterItems(contagem.itens.conferidos);
  const faltantesExcedentes = filterItems(contagem.itens.faltantesExcedentes);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/contagens')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Contagem #{contagem.codigo}
              </h1>
              <Badge
                variant={isFinalizada ? 'secondary' : 'default'}
              >
                {isFinalizada ? (
                  <>
                    <Lock className="mr-1 h-3 w-3" />
                    Finalizada
                  </>
                ) : (
                  'Em Andamento'
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Data: {new Date(contagem.dataAgendada).toLocaleDateString('pt-BR')}
              {' • '}Responsável: {contagem.responsavelNome}
            </p>
          </div>
        </div>

        {!isFinalizada && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSalvar} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar contagem
            </Button>
            <Button onClick={() => setShowFinalizar(true)} className="gap-2">
              <Lock className="h-4 w-4" />
              Finalizar conferência
            </Button>
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">{contagem.resumo.total}</div>
            <p className="text-xs text-muted-foreground">Total de itens</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-blue-600">
              {contagem.resumo.aConferir}
            </div>
            <p className="text-xs text-muted-foreground">A conferir</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-green-600">
              {contagem.resumo.conferidos}
            </div>
            <p className="text-xs text-muted-foreground">Conferidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-amber-600">
              {contagem.resumo.faltantesExcedentes}
            </div>
            <p className="text-xs text-muted-foreground">Divergentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar produto por código ou nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Seção: A Conferir */}
      {aConferir.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">
              A Conferir ({aConferir.length})
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {aConferir.map((item) => (
              <ItemAConferir
                key={item.id}
                item={item}
                contagemId={contagem.id}
                onUpdated={load}
                readOnly={isFinalizada}
              />
            ))}
          </div>
        </section>
      )}

      {aConferir.length > 0 &&
        (conferidos.length > 0 || faltantesExcedentes.length > 0) && (
          <Separator />
        )}

      {/* Seção: Faltantes / Excedentes */}
      {faltantesExcedentes.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold">
              Faltantes / Excedentes ({faltantesExcedentes.length})
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {faltantesExcedentes.map((item) => (
              <ItemFaltanteExcedente key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {faltantesExcedentes.length > 0 && conferidos.length > 0 && (
        <Separator />
      )}

      {/* Seção: Conferidos */}
      {conferidos.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">
              Conferidos ({conferidos.length})
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {conferidos.map((item) => (
              <ItemConferido key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Modal de finalização */}
      <Dialog open={showFinalizar} onOpenChange={setShowFinalizar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar conferência</DialogTitle>
            <DialogDescription>
              Deseja concluir a conferência código:{' '}
              <strong>{contagem.codigo}</strong>? Ao confirmar não será
              possível continuar a fazer a conferência posteriormente.
            </DialogDescription>
          </DialogHeader>
          {contagem.resumo.aConferir > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <strong>Atenção:</strong> ainda há{' '}
              {contagem.resumo.aConferir} item(ns) não conferido(s).
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFinalizar(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleFinalizar} disabled={finalizando}>
              {finalizando ? 'Finalizando...' : 'Confirmar finalização'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
