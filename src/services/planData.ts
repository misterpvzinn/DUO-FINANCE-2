import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ContaPlano, CategoriaPlano, LancamentoFinanceiro } from '../types/finance';

const DEFAULT_ACCOUNTS: Omit<ContaPlano, 'id'>[] = [
  {
    nome: 'Conta Corrente Principal',
    tipo: 'corrente',
    saldoInicialCentavos: 0,
    donoId: '', // Compartilhado
    ativa: true,
    cor: '#3b82f6',
  },
  {
    nome: 'Poupança / Reserva',
    tipo: 'poupanca',
    saldoInicialCentavos: 0,
    donoId: '',
    ativa: true,
    cor: '#10b981',
  },
  {
    nome: 'Carteira Dinheiro',
    tipo: 'carteira',
    saldoInicialCentavos: 0,
    donoId: '',
    ativa: true,
    cor: '#f59e0b',
  },
];

const DEFAULT_CATEGORIES: Omit<CategoriaPlano, 'id'>[] = [
  // 1. Receitas
  { nome: 'Salário', tipo: 'receita', cor: '#10b981', icone: 'Briefcase', ativa: true },
  { nome: 'Freelance & Consultoria', tipo: 'receita', cor: '#059669', icone: 'Laptop', ativa: true },
  { nome: 'Renda Extra & Bônus', tipo: 'receita', cor: '#34d399', icone: 'Coins', ativa: true },
  { nome: 'Rendimentos & Dividendos', tipo: 'receita', cor: '#6ee7b7', icone: 'TrendingUp', ativa: true },
  { nome: 'Reembolsos', tipo: 'receita', cor: '#a7f3d0', icone: 'RotateCcw', ativa: true },

  // 2. Custos Fixos
  { nome: 'Aluguel / Condomínio', tipo: 'custo_fixo', cor: '#6366f1', icone: 'Home', ativa: true },
  { nome: 'Energia, Água & Gás', tipo: 'custo_fixo', cor: '#4f46e5', icone: 'Zap', ativa: true },
  { nome: 'Internet & Telefonia', tipo: 'custo_fixo', cor: '#4338ca', icone: 'Wifi', ativa: true },
  { nome: 'Plano de Saúde & Seguros', tipo: 'custo_fixo', cor: '#3730a3', icone: 'HeartPulse', ativa: true },
  { nome: 'Educação & Mensalidades', tipo: 'custo_fixo', cor: '#312e81', icone: 'GraduationCap', ativa: true },

  // 3. Custos Variáveis
  { nome: 'Supermercado & Feira', tipo: 'custo_variavel', cor: '#f59e0b', icone: 'ShoppingCart', ativa: true },
  { nome: 'Farmácia & Saúde', tipo: 'custo_variavel', cor: '#d97706', icone: 'Pill', ativa: true },
  { nome: 'Transporte & Combustível', tipo: 'custo_variavel', cor: '#b45309', icone: 'Car', ativa: true },
  { nome: 'Vestuário & Cuidados', tipo: 'custo_variavel', cor: '#92400e', icone: 'Shirt', ativa: true },
  { nome: 'Manutenção da Casa', tipo: 'custo_variavel', cor: '#78350f', icone: 'Wrench', ativa: true },

  // 4. Investimentos
  { nome: 'Reserva de Emergência', tipo: 'investimento', cor: '#0ea5e9', icone: 'ShieldCheck', ativa: true },
  { nome: 'Ações & FIIs', tipo: 'investimento', cor: '#0284c7', icone: 'LineChart', ativa: true },
  { nome: 'Renda Fixa / Tesouro', tipo: 'investimento', cor: '#0369a1', icone: 'Landmark', ativa: true },
  { nome: 'Previdência Privada', tipo: 'investimento', cor: '#075985', icone: 'PiggyBank', ativa: true },

  // 5. Lazer
  { nome: 'Restaurantes & Delivery', tipo: 'lazer', cor: '#14b8a6', icone: 'Utensils', ativa: true },
  { nome: 'Viagens & Hospedagem', tipo: 'lazer', cor: '#0d9488', icone: 'Plane', ativa: true },
  { nome: 'Cinema, Streaming & Jogos', tipo: 'lazer', cor: '#0f766e', icone: 'Film', ativa: true },
  { nome: 'Passeios & Experiências', tipo: 'lazer', cor: '#115e59', icone: 'Compass', ativa: true },

  // 6. Dívidas
  { nome: 'Financiamento Imobiliário', tipo: 'divida', cor: '#f43f5e', icone: 'Building', ativa: true },
  { nome: 'Financiamento de Veículo', tipo: 'divida', cor: '#e11d48', icone: 'Key', ativa: true },
  { nome: 'Empréstimos Bancários', tipo: 'divida', cor: '#be123c', icone: 'FileMinus', ativa: true },
];

/**
 * Garante que o plano tenha contas e categorias padrão criadas em suas subcoleções no Firestore.
 */
export async function ensurePlanSeedData(planoId: string): Promise<void> {
  if (!planoId) return;

  try {
    // 1. Contas
    const contasRef = collection(db, 'planos', planoId, 'contas');
    const contasSnap = await getDocs(contasRef);
    if (contasSnap.empty) {
      for (let i = 0; i < DEFAULT_ACCOUNTS.length; i++) {
        const item = DEFAULT_ACCOUNTS[i];
        const newDocRef = doc(contasRef, `conta-padrao-${i + 1}`);
        await setDoc(newDocRef, item);
      }
    }

    // 2. Categorias
    const catRef = collection(db, 'planos', planoId, 'categorias');
    const catSnap = await getDocs(catRef);
    if (catSnap.empty) {
      for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
        const item = DEFAULT_CATEGORIES[i];
        const newDocRef = doc(catRef, `cat-padrao-${i + 1}`);
        await setDoc(newDocRef, item);
      }
    }
  } catch (err) {
    console.warn('Erro ao inicializar semente de contas/categorias:', err);
  }
}

/**
 * Assina as contas ativas do plano no Firestore.
 */
export function subscribeAccounts(
  planoId: string,
  callback: (contas: ContaPlano[]) => void
): () => void {
  const contasRef = collection(db, 'planos', planoId, 'contas');
  return onSnapshot(
    contasRef,
    (snap) => {
      const list: ContaPlano[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          nome: data.nome || 'Conta',
          tipo: data.tipo || 'corrente',
          saldoInicialCentavos: data.saldoInicialCentavos || 0,
          donoId: data.donoId ?? '',
          ativa: data.ativa !== false,
          cor: data.cor,
        });
      });
      callback(list);
    },
    (err) => {
      console.error('Erro ao escutar contas:', err);
      callback([]);
    }
  );
}

/**
 * Assina as categorias do plano no Firestore.
 */
export function subscribeCategories(
  planoId: string,
  callback: (categorias: CategoriaPlano[]) => void
): () => void {
  const catRef = collection(db, 'planos', planoId, 'categorias');
  return onSnapshot(
    catRef,
    (snap) => {
      const list: CategoriaPlano[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          nome: data.nome || 'Categoria',
          tipo: data.tipo || 'custo_variavel',
          categoriaPaiId: data.categoriaPaiId,
          cor: data.cor,
          icone: data.icone,
          ativa: data.ativa !== false,
        });
      });
      callback(list);
    },
    (err) => {
      console.error('Erro ao escutar categorias:', err);
      callback([]);
    }
  );
}

/**
 * Cria uma nova conta bancária ou carteira no plano.
 */
export async function createAccount(
  planoId: string,
  accountData: Omit<ContaPlano, 'id'>
): Promise<string> {
  if (!accountData.nome.trim()) {
    throw new Error('O nome da conta é obrigatório.');
  }
  if (accountData.saldoInicialCentavos < 0) {
    throw new Error('O saldo inicial não pode ser negativo.');
  }

  const contasRef = collection(db, 'planos', planoId, 'contas');
  const docRef = await addDoc(contasRef, {
    nome: accountData.nome.trim(),
    tipo: accountData.tipo,
    saldoInicialCentavos: Math.round(accountData.saldoInicialCentavos),
    donoId: accountData.donoId || '',
    ativa: accountData.ativa !== false,
    cor: accountData.cor || '#3b82f6',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Atualiza os dados de uma conta existente.
 */
export async function updateAccount(
  planoId: string,
  accountId: string,
  accountData: Partial<ContaPlano>
): Promise<void> {
  const docRef = doc(db, 'planos', planoId, 'contas', accountId);
  const updateData: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (accountData.nome !== undefined) updateData.nome = accountData.nome.trim();
  if (accountData.tipo !== undefined) updateData.tipo = accountData.tipo;
  if (accountData.saldoInicialCentavos !== undefined) {
    if (accountData.saldoInicialCentavos < 0) {
      throw new Error('O saldo inicial não pode ser negativo.');
    }
    updateData.saldoInicialCentavos = Math.round(accountData.saldoInicialCentavos);
  }
  if (accountData.donoId !== undefined) updateData.donoId = accountData.donoId;
  if (accountData.ativa !== undefined) updateData.ativa = accountData.ativa;
  if (accountData.cor !== undefined) updateData.cor = accountData.cor;

  await updateDoc(docRef, updateData);
}

/**
 * Exclui uma conta se não houver lançamentos vinculados, ou orienta a inativação.
 */
export async function deleteAccount(
  planoId: string,
  accountId: string,
  transactions: LancamentoFinanceiro[]
): Promise<void> {
  const hasTransactions = transactions.some(
    (tx) => tx.contaId === accountId || tx.contaDestinoId === accountId
  );
  if (hasTransactions) {
    throw new Error(
      'Esta conta possui lançamentos financeiros associados. Para preservar o histórico contábil, desative a conta em vez de excluí-la.'
    );
  }

  const docRef = doc(db, 'planos', planoId, 'contas', accountId);
  await deleteDoc(docRef);
}

/**
 * Cria uma nova categoria personalizada no plano.
 */
export async function createCategory(
  planoId: string,
  categoryData: Omit<CategoriaPlano, 'id'>
): Promise<string> {
  if (!categoryData.nome.trim()) {
    throw new Error('O nome da categoria é obrigatório.');
  }

  const catRef = collection(db, 'planos', planoId, 'categorias');
  const docRef = await addDoc(catRef, {
    nome: categoryData.nome.trim(),
    tipo: categoryData.tipo,
    cor: categoryData.cor || '#6366f1',
    icone: categoryData.icone || 'Tag',
    categoriaPaiId: categoryData.categoriaPaiId || null,
    ativa: categoryData.ativa !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Atualiza os dados de uma categoria existente.
 */
export async function updateCategory(
  planoId: string,
  categoryId: string,
  categoryData: Partial<CategoriaPlano>
): Promise<void> {
  const docRef = doc(db, 'planos', planoId, 'categorias', categoryId);
  const updateData: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (categoryData.nome !== undefined) updateData.nome = categoryData.nome.trim();
  if (categoryData.tipo !== undefined) updateData.tipo = categoryData.tipo;
  if (categoryData.cor !== undefined) updateData.cor = categoryData.cor;
  if (categoryData.icone !== undefined) updateData.icone = categoryData.icone;
  if (categoryData.categoriaPaiId !== undefined) {
    updateData.categoriaPaiId = categoryData.categoriaPaiId;
  }
  if (categoryData.ativa !== undefined) updateData.ativa = categoryData.ativa;

  await updateDoc(docRef, updateData);
}

/**
 * Exclui uma categoria se não houver lançamentos vinculados, ou orienta a inativação.
 */
export async function deleteCategory(
  planoId: string,
  categoryId: string,
  transactions: LancamentoFinanceiro[]
): Promise<void> {
  const hasTransactions = transactions.some((tx) => tx.categoriaId === categoryId);
  if (hasTransactions) {
    throw new Error(
      'Esta categoria possui lançamentos associados. Para preservar o histórico dos relatórios, desative a categoria em vez de excluí-la.'
    );
  }

  const docRef = doc(db, 'planos', planoId, 'categorias', categoryId);
  await deleteDoc(docRef);
}

