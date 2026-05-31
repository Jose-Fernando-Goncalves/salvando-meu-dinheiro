// Categorias modularizadas: agrupadas por "grupo" e por tipo (receita/despesa).
// Cada categoria tem id, label, groupId, type, color e icon (nome de ícone lucide-react).

export const CATEGORY_GROUPS = [
  // Receitas
  { id: 'salario', label: 'Salário', type: 'receita' },
  { id: 'renda-extra', label: 'Renda extra', type: 'receita' },
  { id: 'investimentos', label: 'Investimentos', type: 'receita' },
  // Despesas
  { id: 'essenciais', label: 'Essenciais', type: 'despesa' },
  { id: 'moradia', label: 'Moradia', type: 'despesa' },
  { id: 'transporte', label: 'Transporte', type: 'despesa' },
  { id: 'alimentacao', label: 'Alimentação', type: 'despesa' },
  { id: 'lazer', label: 'Lazer', type: 'despesa' },
  { id: 'saude', label: 'Saúde', type: 'despesa' },
  { id: 'compras', label: 'Compras', type: 'despesa' },
  { id: 'educacao', label: 'Educação', type: 'despesa' },
  { id: 'dividas', label: 'Dívidas', type: 'despesa' },
  { id: 'outros', label: 'Outros', type: 'despesa' },
]

export const CATEGORIES = [
  // ── Receitas ──────────────────────────────────────────────────────────────
  { id: 'salario', label: 'Salário', groupId: 'salario', type: 'receita', color: '#10b981', icon: 'Wallet' },
  { id: 'bonus', label: 'Bônus / 13º', groupId: 'salario', type: 'receita', color: '#059669', icon: 'Gift' },
  { id: 'freelance', label: 'Freelance', groupId: 'renda-extra', type: 'receita', color: '#34d399', icon: 'Laptop' },
  { id: 'vendas', label: 'Vendas', groupId: 'renda-extra', type: 'receita', color: '#22c55e', icon: 'Tag' },
  { id: 'dividendos', label: 'Dividendos', groupId: 'investimentos', type: 'receita', color: '#047857', icon: 'TrendingUp' },
  { id: 'rendimentos', label: 'Rendimentos', groupId: 'investimentos', type: 'receita', color: '#065f46', icon: 'PiggyBank' },

  // ── Despesas ──────────────────────────────────────────────────────────────
  { id: 'mercado', label: 'Mercado', groupId: 'alimentacao', type: 'despesa', color: '#f97316', icon: 'ShoppingCart' },
  { id: 'restaurante', label: 'Restaurante / Delivery', groupId: 'alimentacao', type: 'despesa', color: '#fb923c', icon: 'Utensils' },

  { id: 'aluguel', label: 'Aluguel / Financiamento', groupId: 'moradia', type: 'despesa', color: '#ef4444', icon: 'Home' },
  { id: 'contas-casa', label: 'Água / Luz / Gás', groupId: 'moradia', type: 'despesa', color: '#dc2626', icon: 'Zap' },
  { id: 'internet', label: 'Internet / Telefone', groupId: 'moradia', type: 'despesa', color: '#b91c1c', icon: 'Wifi' },

  { id: 'combustivel', label: 'Combustível', groupId: 'transporte', type: 'despesa', color: '#eab308', icon: 'Fuel' },
  { id: 'transporte-app', label: 'App / Ônibus', groupId: 'transporte', type: 'despesa', color: '#ca8a04', icon: 'Car' },

  { id: 'plano-saude', label: 'Plano de saúde', groupId: 'saude', type: 'despesa', color: '#ec4899', icon: 'HeartPulse' },
  { id: 'farmacia', label: 'Farmácia', groupId: 'saude', type: 'despesa', color: '#db2777', icon: 'Pill' },

  { id: 'lazer', label: 'Lazer / Streaming', groupId: 'lazer', type: 'despesa', color: '#8b5cf6', icon: 'Clapperboard' },
  { id: 'viagem', label: 'Viagem', groupId: 'lazer', type: 'despesa', color: '#7c3aed', icon: 'Plane' },

  { id: 'compras', label: 'Compras', groupId: 'compras', type: 'despesa', color: '#06b6d4', icon: 'ShoppingBag' },
  { id: 'educacao', label: 'Educação / Cursos', groupId: 'educacao', type: 'despesa', color: '#0ea5e9', icon: 'GraduationCap' },
  { id: 'dividas', label: 'Dívidas / Cartão', groupId: 'dividas', type: 'despesa', color: '#f43f5e', icon: 'CreditCard' },
  { id: 'outros', label: 'Outros', groupId: 'outros', type: 'despesa', color: '#64748b', icon: 'MoreHorizontal' },
]

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id)

export const categoriesByType = (type) => CATEGORIES.filter((c) => c.type === type)

export const groupsByType = (type) => CATEGORY_GROUPS.filter((g) => g.type === type)

// Agrupa as categorias de um tipo por grupo: [{ group, categories }]
export const categoriesGroupedByType = (type) =>
  groupsByType(type)
    .map((group) => ({
      group,
      categories: CATEGORIES.filter((c) => c.type === type && c.groupId === group.id),
    }))
    .filter((g) => g.categories.length > 0)
