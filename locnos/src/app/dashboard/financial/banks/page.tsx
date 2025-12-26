"use client";

import { useEffect, useState } from "react";
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
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils"; // Assuming this exists or I should create a local helper

type BankAccount = {
    id: string;
    name: string;
    bankName: string;
    initialBalance: number;
    currentBalance: number;
    active: boolean;
};

export default function BankAccountsPage() {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Form
    const [name, setName] = useState("");
    const [bankName, setBankName] = useState("");
    const [initialBalance, setInitialBalance] = useState("0");

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/financial/bank-accounts");
            if (!res.ok) {
                console.error("Failed to fetch bank accounts:", res.status);
                setAccounts([]);
                return;
            }
            const data = await res.json();
            setAccounts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching bank accounts:", error);
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/financial/bank-accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    bankName,
                    initialBalance: parseFloat(initialBalance)
                })
            });

            if (res.ok) {
                setOpen(false);
                fetchAccounts();
                setName("");
                setBankName("");
                setInitialBalance("0");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const localFormat = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Contas Bancárias</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>Nova Conta</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Conta Bancária</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label>Nome Identificador</label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Itaú Movimento" required />
                            </div>
                            <div className="space-y-2">
                                <label>Instituição</label>
                                <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Ex: Banco Itaú" />
                            </div>
                            <div className="space-y-2">
                                <label>Saldo Inicial (R$)</label>
                                <Input type="number" step="0.01" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} />
                            </div>
                            <Button type="submit" className="w-full">Salvar</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {accounts.map(acc => (
                    <Card key={acc.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {acc.name}
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">{acc.bankName}</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{localFormat(acc.currentBalance)}</div>
                            <p className="text-xs text-muted-foreground">
                                Saldo Inicial: {localFormat(acc.initialBalance)}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
