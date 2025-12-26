import { prisma } from "@/lib/prisma";
import { AccountType, DreCategory } from "@prisma/client";

export const STANDARD_ACCOUNTS = [
    // 1. Receita Bruta
    { code: "1.01", name: "Receita de Serviços", type: AccountType.REVENUE, dreCategory: DreCategory.GROSS_REVENUE },
    { code: "1.02", name: "Receita de Vendas", type: AccountType.REVENUE, dreCategory: DreCategory.GROSS_REVENUE },

    // 2. Impostos
    { code: "2.01", name: "ISS", type: AccountType.EXPENSE, dreCategory: DreCategory.TAXES },
    { code: "2.02", name: "ICMS", type: AccountType.EXPENSE, dreCategory: DreCategory.TAXES },
    { code: "2.03", name: "PIS", type: AccountType.EXPENSE, dreCategory: DreCategory.TAXES },
    { code: "2.04", name: "COFINS", type: AccountType.EXPENSE, dreCategory: DreCategory.TAXES },
    { code: "2.05", name: "Simples Nacional", type: AccountType.EXPENSE, dreCategory: DreCategory.TAXES },

    // 3. Custos Variáveis
    { code: "3.01", name: "Custo do Serviço Prestado", type: AccountType.EXPENSE, dreCategory: DreCategory.SERVICE_COST },
    { code: "3.02", name: "Custo de Mercadorias Vendidas", type: AccountType.EXPENSE, dreCategory: DreCategory.GOODS_COST },
    { code: "3.03", name: "Manutenção de Equipamentos", type: AccountType.EXPENSE, dreCategory: DreCategory.MAINTENANCE_COST },
    { code: "3.04", name: "Combustível", type: AccountType.EXPENSE, dreCategory: DreCategory.LOGISTICS_EXPENSE },

    // 4. Despesas Fixas
    { code: "4.01", name: "Aluguel", type: AccountType.EXPENSE, dreCategory: DreCategory.ADMINISTRATIVE_EXPENSE },
    { code: "4.02", name: "Energia Elétrica", type: AccountType.EXPENSE, dreCategory: DreCategory.ADMINISTRATIVE_EXPENSE },
    { code: "4.03", name: "Água e Esgoto", type: AccountType.EXPENSE, dreCategory: DreCategory.ADMINISTRATIVE_EXPENSE },
    { code: "4.04", name: "Internet e Telefone", type: AccountType.EXPENSE, dreCategory: DreCategory.ADMINISTRATIVE_EXPENSE },
    { code: "4.05", name: "Salários Administrativos", type: AccountType.EXPENSE, dreCategory: DreCategory.PERSONNEL_EXPENSE },
    { code: "4.06", name: "Pró-Labore", type: AccountType.EXPENSE, dreCategory: DreCategory.PERSONNEL_EXPENSE },
    { code: "4.07", name: "Marketing e Publicidade", type: AccountType.EXPENSE, dreCategory: DreCategory.COMMERCIAL_EXPENSE },
    { code: "4.08", name: "Comissões", type: AccountType.EXPENSE, dreCategory: DreCategory.COMMERCIAL_EXPENSE },

    // 5. Despesas Financeiras
    { code: "5.01", name: "Juros Bancários", type: AccountType.EXPENSE, dreCategory: DreCategory.FINANCIAL_EXPENSE },
    { code: "5.02", name: "Tarifas Bancárias", type: AccountType.EXPENSE, dreCategory: DreCategory.FINANCIAL_EXPENSE },

    // 6. Investimentos e Empréstimos
    { code: "6.01", name: "Aquisição de Ativos", type: AccountType.ASSET, dreCategory: DreCategory.INVESTMENT },
    { code: "6.02", name: "Amortização de Empréstimos", type: AccountType.LIABILITY, dreCategory: DreCategory.LOAN_AMORTIZATION },

    // 7. Depreciação
    { code: "7.01", name: "Depreciação de Máquinas", type: AccountType.EXPENSE, dreCategory: DreCategory.ASSET_DEPRECIATION },

    // 8. Lucros
    { code: "8.01", name: "Distribuição de Lucros", type: AccountType.EQUITY, dreCategory: DreCategory.PROFIT_DISTRIBUTION },
];

export async function ensureStandardAccounts() {
    const existingCount = await prisma.chartOfAccount.count();
    if (existingCount === 0) {
        console.log("Seeding standard Chart of Accounts...");
        for (const acc of STANDARD_ACCOUNTS) {
            await prisma.chartOfAccount.upsert({
                where: { code: acc.code },
                update: {},
                create: {
                    ...acc,
                    systemDefault: true,
                    active: true
                }
            });
        }
    }
}
