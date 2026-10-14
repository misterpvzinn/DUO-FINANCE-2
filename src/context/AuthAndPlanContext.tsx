import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { PlanoFinanceiro, ConvitePlano, FiltroPessoa, RegimeVisualizacao } from '../types/couplePlan';

interface AuthAndPlanContextType {
  user: User | null;
  loadingAuth: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Plano
  plano: PlanoFinanceiro | null;
  loadingPlano: boolean;
  criarPlano: (nome: string, rendaMensalCentavos: number) => Promise<string>;
  convidarSegundoMembro: (email: string) => Promise<void>;
  
  // Convites recebidos pelo usuário logado
  convitesPendentes: ConvitePlano[];
  aceitarConvite: (convite: ConvitePlano) => Promise<void>;
  recusarConvite: (conviteId: string) => Promise<void>;
  
  // Filtros Globais do Header
  filtroPessoa: FiltroPessoa;
  setFiltroPessoa: (filtro: FiltroPessoa) => void;
  mesSelecionado: string;
  setMesSelecionado: (mes: string) => void;
  regime: RegimeVisualizacao;
  setRegime: (regime: RegimeVisualizacao) => void;
  
  // Membros para exibição
  membro1Nome: string;
  membro2Nome: string | null;
  segundoMembroUid: string | null;
}

const AuthAndPlanContext = createContext<AuthAndPlanContextType | undefined>(undefined);

export function AuthAndPlanProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [plano, setPlano] = useState<PlanoFinanceiro | null>(null);
  const [loadingPlano, setLoadingPlano] = useState(false);
  const [convitesPendentes, setConvitesPendentes] = useState<ConvitePlano[]>([]);

  // Estados Globais de Navegação e Filtro
  const [filtroPessoa, setFiltroPessoa] = useState<FiltroPessoa>('todos');
  const [mesSelecionado, setMesSelecionado] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [regime, setRegime] = useState<RegimeVisualizacao>('competencia');

  // Monitorar Estado de Autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Monitorar Planos em que o usuário é membro
  useEffect(() => {
    if (!user) {
      setPlano(null);
      setLoadingPlano(false);
      return;
    }

    setLoadingPlano(true);
    const planosRef = collection(db, 'planos');
    const q = query(planosRef, where('memberIds', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          setPlano({
            id: docSnap.id,
            nome: data.nome || 'Plano Compartilhado',
            memberIds: data.memberIds || [user.uid],
            membros: data.membros || {},
            criadorUid: data.criadorUid || user.uid,
            criadoEm: data.criadoEm || new Date().toISOString(),
          });
        } else {
          setPlano(null);
        }
        setLoadingPlano(false);
      },
      (error) => {
        console.error('Erro ao escutar plano:', error);
        setLoadingPlano(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Monitorar Convites pendentes enviados para o e-mail do usuário logado
  useEffect(() => {
    if (!user || !user.email) {
      setConvitesPendentes([]);
      return;
    }

    const convitesRef = collection(db, 'convites');
    const q = query(
      convitesRef,
      where('email', '==', user.email.toLowerCase()),
      where('status', '==', 'pendente')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ConvitePlano[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            email: d.email,
            planoId: d.planoId,
            planoNome: d.planoNome || 'Plano Financeiro',
            criadorUid: d.criadorUid,
            criadorNome: d.criadorNome || 'Parceiro(a)',
            status: d.status,
            criadoEm: d.criadoEm || new Date().toISOString(),
          });
        });
        setConvitesPendentes(list);
      },
      (err) => {
        console.error('Erro ao escutar convites:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      alert('Não foi possível efetuar o login com o Google. Verifique os popups do navegador.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setPlano(null);
      setFiltroPessoa('todos');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const criarPlano = async (nome: string, rendaMensalCentavos: number): Promise<string> => {
    if (!user) throw new Error('Usuário precisa estar autenticado.');

    const novoPlanoRef = doc(collection(db, 'planos'));
    const planoId = novoPlanoRef.id;

    const nomeUsuario = user.displayName || user.email?.split('@')[0] || 'Pessoa 1';

    const novoPlanoData = {
      nome: nome.trim(),
      memberIds: [user.uid],
      membros: {
        [user.uid]: {
          papel: 'proprietario',
          nomeExibicao: nomeUsuario,
          email: user.email || '',
          rendaMensalCentavos: Math.max(0, rendaMensalCentavos),
        },
      },
      criadorUid: user.uid,
      criadoEm: new Date().toISOString(),
    };

    await setDoc(novoPlanoRef, novoPlanoData);

    return planoId;
  };

  const convidarSegundoMembro = async (emailDestino: string) => {
    if (!user || !plano) throw new Error('Plano ou usuário não encontrado.');

    const cleanEmail = emailDestino.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('E-mail inválido.');
    }

    const criadorNome =
      plano.membros[user.uid]?.nomeExibicao ||
      user.displayName ||
      user.email?.split('@')[0] ||
      'Parceiro(a)';

    await addDoc(collection(db, 'convites'), {
      email: cleanEmail,
      planoId: plano.id,
      planoNome: plano.nome,
      criadorUid: user.uid,
      criadorNome,
      status: 'pendente',
      criadoEm: new Date().toISOString(),
    });
  };

  const aceitarConvite = async (convite: ConvitePlano) => {
    if (!user) throw new Error('Usuário precisa estar autenticado.');

    const planoRef = doc(db, 'planos', convite.planoId);
    const planoSnap = await getDoc(planoRef);

    if (!planoSnap.exists()) {
      throw new Error('O plano correspondente a este convite não foi encontrado.');
    }

    const planoData = planoSnap.data();
    const currentMemberIds: string[] = planoData.memberIds || [];

    if (currentMemberIds.length >= 2 && !currentMemberIds.includes(user.uid)) {
      throw new Error('Este plano já possui o limite máximo de dois membros.');
    }

    const updatedMemberIds = Array.from(new Set([...currentMemberIds, user.uid]));
    const nomeMembro = user.displayName || user.email?.split('@')[0] || 'Pessoa 2';

    // Atualiza o plano adicionando o novo membro
    await updateDoc(planoRef, {
      memberIds: updatedMemberIds,
      [`membros.${user.uid}`]: {
        papel: 'membro',
        nomeExibicao: nomeMembro,
        email: user.email || '',
        rendaMensalCentavos: 0,
      },
    });

    // Atualiza status do convite
    const conviteRef = doc(db, 'convites', convite.id);
    await updateDoc(conviteRef, {
      status: 'aceito',
    });
  };

  const recusarConvite = async (conviteId: string) => {
    const conviteRef = doc(db, 'convites', conviteId);
    await updateDoc(conviteRef, {
      status: 'recusado',
    });
  };

  // Nomes dos membros para cabeçalho e filtros
  let membro1Nome = 'Pessoa 1';
  let membro2Nome: string | null = null;
  let segundoMembroUid: string | null = null;

  if (plano && plano.membros) {
    const uids = Object.keys(plano.membros);
    if (uids.length > 0) {
      membro1Nome = plano.membros[uids[0]]?.nomeExibicao || 'Pessoa 1';
    }
    if (uids.length > 1) {
      membro2Nome = plano.membros[uids[1]]?.nomeExibicao || 'Pessoa 2';
      segundoMembroUid = uids[1];
    }
  }

  return (
    <AuthAndPlanContext.Provider
      value={{
        user,
        loadingAuth,
        loginWithGoogle,
        logout,
        plano,
        loadingPlano,
        criarPlano,
        convidarSegundoMembro,
        convitesPendentes,
        aceitarConvite,
        recusarConvite,
        filtroPessoa,
        setFiltroPessoa,
        mesSelecionado,
        setMesSelecionado,
        regime,
        setRegime,
        membro1Nome,
        membro2Nome,
        segundoMembroUid,
      }}
    >
      {children}
    </AuthAndPlanContext.Provider>
  );
}

export function useAuthAndPlan(): AuthAndPlanContextType {
  const context = useContext(AuthAndPlanContext);
  if (!context) {
    throw new Error('useAuthAndPlan deve ser usado dentro de um AuthAndPlanProvider');
  }
  return context;
}
