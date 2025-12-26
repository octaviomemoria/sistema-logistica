"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionType, TitleStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

type Title = {
    id: string;
    description: string;
    originalValue: number;
    balance: number;
    type: TransactionType;
    dueDate: string;
    competenceDate: string;
    status: TitleStatus;
    account: { name: string, code: string };
};

type Account = {
    id: string;
    name: string;
    code: string;
};

export default function TitlesPage() {
    const [titles, setTitles] = useState<Title[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'));

    // Form
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<TransactionType>("EXPENSE");
    const [dueDate, setDueDate] = useState("");
    const [competenceDate, setCompetenceDate] = useState("");
    const [accountId, setAccountId] = useState("");

    useEffect(() => {
        fetchTitles();
        fetchAccounts();
    }, [startDate, endDate]);

    const fetchAccounts = async () => {
        try {
            const res = await fetch("/api/financial/accounts");
            if (!res.ok) {
                console.error("Failed to fetch accounts:", res.status);
                setAccounts([]);
                return;
            }
            const data = await res.json();
            setAccounts(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error fetching accounts:", e);
            setAccounts([]);
        }
    }

    const fetchTitles = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/financial/titles?startDate=${startDate}&endDate=${endDate}`);
            const data = await res.json();
            setTitles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch titles", error);
            setTitles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/financial/titles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: desc,
                    amount: parseFloat(amount),
                    type,
                    dueDate,
                    competenceDate: competenceDate || dueDate,
                    accountId,
                })
            });

            if (res.ok) {
                setOpen(false);
                fetchTitles();
                // Reset
                setDesc("");
                setAmount("");
                setAccountId("");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusBadge = (status: TitleStatus) => {
        switch (status) {
            case 'PAID': return <Badge className="bg-green-600">Pago</Badge>;
            case 'PARTIAL': return <Badge className="bg-yellow-600">Parcial</Badge>;
            case 'OVERDUE': return <Badge className="bg-red-600">Vencido</Badge>;
            case 'CANCELLED': return <Badge variant="destructive">Cancelado</Badge>;
            default: return <Badge variant="secondary">Aberto</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Títulos (Contas a Pagar/Receber)</h1>
                <div className="flex gap-4 items-center">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-auto"
                    />
                    <span className="text-muted-foreground">até</span>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-auto"
                    />
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>Novo Título</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Adicionar Título</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label>Tipo</label>
                                        <Select value={type} onValueChange={(v: TransactionType) => setType(v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INCOME">Receita</SelectItem>
                                                <SelectItem value="EXPENSE">Despesa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label>Valor (R$)</label>
                                        <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label>Descrição</label>
                                    <Input value={desc} onChange={(e) => setDesc(e.target.value)} required />
                                </div>

                                <div className="space-y-2">
                                    <label>Conta / Categoria</label>
                                    <Select value={accountId} onValueChange={setAccountId}>
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            {accounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label>Vencimento</label>
                                        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label>Competência (Opcional)</label>
                                        <Input type="date" value={competenceDate} onChange={(e) => setCompetenceDate(e.target.value)} />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full">Salvar</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Valor Original</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {titles.map((title) => (
                            <TableRow key={title.id}>
                                <TableCell>{format(new Date(title.dueDate), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{title.description}</TableCell>
                                <TableCell className="text-muted-foreground">{title.account.code} - {title.account.name}</TableCell>
                                <TableCell>
                                    {getStatusBadge(title.status)}
                                </TableCell>
                                <TableCell className={`text-right ${title.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(title.originalValue)}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(title.balance)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && titles.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Nenhum título encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
