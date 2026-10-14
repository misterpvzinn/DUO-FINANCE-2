import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CategoryGroup, TransactionType } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PALETTE = [
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#84cc16', '#14b8a6', '#64748b'
];

export function CategoryModal({ isOpen, onClose }: CategoryModalProps) {
  const { addCategory } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [group, setGroup] = useState<CategoryGroup>('variable_cost');
  const [color, setColor] = useState('#3b82f6');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome da categoria.');
      return;
    }

    addCategory({
      name: name.trim(),
      type,
      group: type === 'income' ? 'income' : group,
      color,
    });

    setName('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Categoria"
      description="Crie uma categoria para organizar suas receitas e despesas."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900/40">
            {error}
          </div>
        )}

        {/* Type selector */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setGroup('variable_cost');
            }}
            className={`py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Categoria de Despesa
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setGroup('income');
            }}
            className={`py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
              type === 'income'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Categoria de Receita
          </button>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Nome da Categoria *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Assinaturas Digitais, Pets, etc."
            required
          />
        </div>

        {/* Group (if expense) */}
        {type === 'expense' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Classificação / Grupo *
            </label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as CategoryGroup)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              <option value="fixed_cost">Custo Fixo (Moradia, Contas básicas, Saúde)</option>
              <option value="variable_cost">Custo Variável (Alimentação, Transporte, Compras)</option>
              <option value="leisure">Lazer & Estilo de Vida</option>
              <option value="investment">Investimentos & Patrimônio</option>
            </select>
          </div>
        )}

        {/* Color picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Cor de Identificação
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                  color === c ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-white scale-110' : ''
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md">
            Criar Categoria
          </Button>
        </div>
      </form>
    </Modal>
  );
}
