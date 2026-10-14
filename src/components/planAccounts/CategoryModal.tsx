import React, { useState, useEffect } from 'react';
import { Tag, X, AlertCircle } from 'lucide-react';
import { CategoriaPlano } from '../../types/finance';
import { Button } from '../ui/Button';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (params: Omit<CategoriaPlano, 'id'>) => Promise<void>;
  categoryToEdit?: CategoriaPlano | null;
  defaultType?: CategoriaPlano['tipo'];
}

const PRESET_COLORS = [
  '#10b981', // Verde
  '#6366f1', // Indigo
  '#f59e0b', // Âmbar
  '#06b6d4', // Ciano
  '#ec4899', // Rosa
  '#8b5cf6', // Roxo
  '#f43f5e', // Rose
  '#64748b', // Slate
];

const TIPO_LABELS: Record<CategoriaPlano['tipo'], string> = {
  receita: 'Receita',
  custo_fixo: 'Custo Fixo',
  custo_variavel: 'Custo Variável',
  investimento: 'Investimento',
  lazer: 'Lazer & Experiências',
  divida: 'Dívida & Financiamento',
};

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  categoryToEdit,
  defaultType = 'custo_variavel',
}: CategoryModalProps) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<CategoriaPlano['tipo']>(defaultType);
  const [cor, setCor] = useState(PRESET_COLORS[0]);
  const [ativa, setAtiva] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categoryToEdit) {
      setNome(categoryToEdit.nome);
      setTipo(categoryToEdit.tipo);
      setCor(categoryToEdit.cor || PRESET_COLORS[0]);
      setAtiva(categoryToEdit.ativa !== false);
    } else {
      setNome('');
      setTipo(defaultType);
      setCor(PRESET_COLORS[0]);
      setAtiva(true);
    }
    setError(null);
  }, [categoryToEdit, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('O nome da categoria é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        nome: nome.trim(),
        tipo,
        cor,
        icone: 'Tag',
        ativa,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar categoria.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabeçalho */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs"
              style={{ backgroundColor: cor }}
            >
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Classificação para despesas e receitas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Grupo / Tipo */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Grupo de Classificação *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as CategoriaPlano['tipo'])}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {(Object.keys(TIPO_LABELS) as CategoriaPlano['tipo'][]).map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nome da Categoria *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Pets, Cinema, Streaming, Vestuário"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Paleta de Cores */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Cor de Destaque
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    cor === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Status Ativa */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
            <div>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                Categoria Ativa
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Categorias ativas aparecem na seleção de novos lançamentos
              </span>
            </div>
            <input
              type="checkbox"
              checked={ativa}
              onChange={(e) => setAtiva(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="text-xs"
            >
              {loading ? 'Salvando...' : categoryToEdit ? 'Atualizar Categoria' : 'Criar Categoria'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
