import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DreCategory, TransactionType } from "@prisma/client";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
        return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const transactions = await prisma.financialTransaction.findMany({
        where: {
            competenceDate: {
                gte: startDate,
                lte: endDate
            },
            status: { not: 'CANCELLED' }
        },
        include: {
            account: true
        }
    });

    // Calculate totals by category
    const totals: Record<string, number> = {};

    // Initialize all categories to 0
    Object.values(DreCategory).forEach(cat => totals[cat] = 0);

    transactions.forEach(tx => {
        if (tx.account.dreCategory) {
            const category = tx.account.dreCategory;
            // Expenses are subtracted in the logic below, but here we store raw sums.
            // Usually DRE categories are naturally positive numbers in report, subtractions happen in Logic.
            // We'll trust the amount is positive.
            totals[category] += tx.amount;
        }
    });

    // Structure DRE
    // (=) Receita Bruta
    // (-) Impostos
    // (=) Receita liquida
    // ...

    const grossRevenue = totals[DreCategory.GROSS_REVENUE] || 0;
    const taxes = totals[DreCategory.TAXES] || 0;

    const netRevenue = grossRevenue - taxes;

    const serviceCost = totals[DreCategory.SERVICE_COST] || 0;
    const goodsCost = totals[DreCategory.GOODS_COST] || 0;
    const maintenanceCost = totals[DreCategory.MAINTENANCE_COST] || 0;

    const totalCost = serviceCost + goodsCost + maintenanceCost;

    const grossProfit = netRevenue - totalCost;

    const adminExp = totals[DreCategory.ADMINISTRATIVE_EXPENSE] || 0;
    const commExp = totals[DreCategory.COMMERCIAL_EXPENSE] || 0;
    const finExp = totals[DreCategory.FINANCIAL_EXPENSE] || 0;
    const persExp = totals[DreCategory.PERSONNEL_EXPENSE] || 0;
    const logExp = totals[DreCategory.LOGISTICS_EXPENSE] || 0;

    const totalGeneralExpenses = adminExp + commExp + finExp + persExp + logExp;

    const operationalProfit = grossProfit - totalGeneralExpenses;

    const profitDist = totals[DreCategory.PROFIT_DISTRIBUTION] || 0;
    const investments = totals[DreCategory.INVESTMENT] || 0;
    const loanAmort = totals[DreCategory.LOAN_AMORTIZATION] || 0;
    const depreciation = totals[DreCategory.ASSET_DEPRECIATION] || 0;

    // Net Profit: Usually excludes Investment and Loan Amortization from P&L (they are Cash Flow items), 
    // but User requested structure includes them:
    // (-) Distribuição de Lucros
    // (-) Investimentos
    // (-) Amortização de Emprestimos
    // (-) Depreciação de Ativos
    // (-) Lucro Líquido

    const netProfit = operationalProfit - profitDist - investments - loanAmort - depreciation;

    const report = [
        { label: "Receita Bruta", value: grossRevenue, type: "HEADER", category: DreCategory.GROSS_REVENUE },
        { label: "(-) Impostos", value: taxes, type: "DEDUCTION", category: DreCategory.TAXES },
        { label: "(=) Receita Líquida", value: netRevenue, type: "RESULT" },
        { label: "(-) Custo Total", value: totalCost, type: "DEDUCTION" },
        { label: "    Custo do Serviço Prestado", value: serviceCost, type: "SUB_DEDUCTION", category: DreCategory.SERVICE_COST },
        { label: "    Custo de Mercadorias", value: goodsCost, type: "SUB_DEDUCTION", category: DreCategory.GOODS_COST },
        { label: "    Custos de Manutenção", value: maintenanceCost, type: "SUB_DEDUCTION", category: DreCategory.MAINTENANCE_COST },
        { label: "(=) Lucro Bruto", value: grossProfit, type: "RESULT" },
        { label: "(-) Despesas Gerais", value: totalGeneralExpenses, type: "DEDUCTION" },
        { label: "    Despesas Administrativas", value: adminExp, type: "SUB_DEDUCTION", category: DreCategory.ADMINISTRATIVE_EXPENSE },
        { label: "    Despesas Comerciais", value: commExp, type: "SUB_DEDUCTION", category: DreCategory.COMMERCIAL_EXPENSE },
        { label: "    Despesas Financeiras", value: finExp, type: "SUB_DEDUCTION", category: DreCategory.FINANCIAL_EXPENSE },
        { label: "    Despesas Pessoal", value: persExp, type: "SUB_DEDUCTION", category: DreCategory.PERSONNEL_EXPENSE },
        { label: "    Despesas com Logística", value: logExp, type: "SUB_DEDUCTION", category: DreCategory.LOGISTICS_EXPENSE },
        { label: "(=) Lucro Operacional", value: operationalProfit, type: "RESULT" },
        { label: "(-) Distribuição de Lucros", value: profitDist, type: "DEDUCTION", category: DreCategory.PROFIT_DISTRIBUTION },
        { label: "(-) Investimentos", value: investments, type: "DEDUCTION", category: DreCategory.INVESTMENT },
        { label: "(-) Amortização de Empréstimos", value: loanAmort, type: "DEDUCTION", category: DreCategory.LOAN_AMORTIZATION },
        { label: "(-) Depreciação de Ativos", value: depreciation, type: "DEDUCTION", category: DreCategory.ASSET_DEPRECIATION },
        { label: "(=) Lucro Líquido", value: netProfit, type: "RESULT", highlight: true },
    ];

    return NextResponse.json(report);
}
