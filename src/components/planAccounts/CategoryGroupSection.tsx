import React from 'react';
import { Tag, Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { CategoriaPlano } from '../../types/finance';

interface CategoryGroupSectionProps {
  grupo: {
    id: CategoriaPlano['tipo'];
    label: string;
    desc: string;
    cor: string;
    bgBadge: string;
  };
  categories: CategoriaPlano[];
  onAddCategory: (tipo: CategoriaPlano['tipo']) => void;
  onEditCategory: (cat: CategoriaPlano) => void;
  onToggleActive: (cat: CategoriaPlano) => void;
  onDeleteCategory: (cat: CategoriaPlano) => void;
}

export function CategoryGroupSection({
  grupo,
  categories,
  onAddCategory,
  onEditCategory,
  onToggleActive,
  onDeleteCategory,
}: CategoryGroupSectionProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 p-5 shadow-xs flex flex-col justify-between gap-4">
      {/* Topo do Grupo */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
              style={{ backgroundColor: grupo.cor }}
            />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {grupo.label}
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {categories.length}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {grupo.desc}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAddCategory(grupo.id)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          title={`Adicionar categoria em ${grupo.label}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de Categorias do Grupo */}
      {categories.length === 0 ? (
        <div className="py-6 text-center text-xs text-zinc-400">
          Nenhuma categoria cadastrada neste grupo.
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`py-2.5 flex items-center justify-between gap-3 text-xs transition-opacity ${
                !cat.ativa ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.cor || grupo.cor }}
                />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {cat.nome}
                </span>
                {!cat.ativa && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    Inativa
                  </span>
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEditCategory(cat)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                  title="Editar"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleActive(cat)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                  title={cat.ativa ? 'Desativar' : 'Ativar'}
                >
                  {cat.ativa ? (
                    <XCircle className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCategory(cat)}
                  className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
