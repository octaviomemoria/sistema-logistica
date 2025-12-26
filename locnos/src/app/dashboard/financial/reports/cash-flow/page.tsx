"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionType } from "@prisma/client";

type DailyFlow = {
    income: number;
    expense: number;
    balance: number;
    transactions: any[];
};

type CashFlowData = Record<string, DailyFlow>;

export default function CashFlowPage() {
    const [data, setData] = useState<CashFlowData>({});
    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'));

    useEffect(() => {
        fetchReport();
    }, [startDate, endDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/financial/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const dates = Object.keys(data).sort();

    // Calculate Totals
    const totalIncome = Object.values(data).reduce((acc, curr) => acc + curr.income, 0);
    const totalExpense = Object.values(data).reduce((acc, curr) => acc + curr.expense, 0);
    const totalBalance = totalIncome - totalExpense;

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center print:hidden">
                <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
                <div className="flex gap-4 items-center">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-auto"
                    />
                    <span>até</span>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-auto"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Entradas</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Saídas</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Saldo do Período</CardTitle></CardHeader>
                    <CardContent><div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}</div></CardContent>
                </Card>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right text-green-600">Entradas</TableHead>
                            <TableHead className="text-right text-red-600">Saídas</TableHead>
                            <TableHead className="text-right">Saldo do Dia</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dates.map((date) => (
                            <TableRow key={date}>
                                <TableCell className="font-medium">{format(parseISO(date), 'dd/MM/yyyy (EEEE)', { locale: ptBR })}</TableCell>
                                <TableCell className="text-right text-green-600">
                                    {data[date].income > 0 ? '+ ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data[date].income) : '-'}
                                </TableCell>
                                <TableCell className="text-right text-red-600">
                                    {data[date].expense > 0 ? '- ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data[date].expense) : '-'}
                                </TableCell>
                                <TableCell className={`text-right font-bold ${data[date].balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data[date].balance)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && dates.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    Nenhum fluxo encontrado neste período.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
