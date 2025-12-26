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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountType, DreCategory } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

type Account = {
    id: string;
    code: string;
    name: string;
    type: AccountType;
    dreCategory: DreCategory | null;
    systemDefault: boolean;
};

export default function ChartOfAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Form State
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [type, setType] = useState<AccountType>("EXPENSE");
    const [dreCategory, setDreCategory] = useState<string>("");

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/financial/accounts");
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setAccounts(data);
        } catch (error) {
            console.error("Failed to fetch accounts", error);
            // Show user-friendly error message
            alert("Erro ao carregar contas. Verifique o console para mais detalhes.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/financial/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    name,
                    type,
                    dreCategory: dreCategory || null
                })
            });

            if (res.ok) {
                setOpen(false);
                fetchAccounts();
                // Reset form
                setCode("");
                setName("");
                setDreCategory("");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getAccountTypeLabel = (type: string) => {
        switch (type) {
            case "ASSET": return "Ativo";
            case "LIABILITY": return "Passivo";
            case "EQUITY": return "Patrimônio Líquido";
            case "REVENUE": return "Receita";
            case "EXPENSE": return "Despesa";
            default: return type;
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Plano de Contas</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>Nova Conta</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Adicionar Conta</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="grid w-full items-center gap-1.5">
                                <label htmlFor="code">Código</label>
                                <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="Ex: 5.03" />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                                <label htmlFor="name">Nome da Conta</label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Viagens" />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                                <label htmlFor="type">Tipo</label>
                                <Select value={type} onValueChange={(val: AccountType) => setType(val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ASSET">Ativo</SelectItem>
                                        <SelectItem value="LIABILITY">Passivo</SelectItem>
                                        <SelectItem value="EQUITY">Patrimônio Líquido</SelectItem>
                                        <SelectItem value="REVENUE">Receita</SelectItem>
                                        <SelectItem value="EXPENSE">Despesa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid w-full items-center gap-1.5">
                                <label htmlFor="dre">Categoria DRE (Opcional)</label>
                                <Select value={dreCategory} onValueChange={setDreCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GROSS_REVENUE">Receita Bruta</SelectItem>
                                        <SelectItem value="TAXES">Impostos</SelectItem>
                                        <SelectItem value="SERVICE_COST">Custo do Serviço</SelectItem>
                                        <SelectItem value="GOODS_COST">Custo de Mercadorias</SelectItem>
                                        <SelectItem value="MAINTENANCE_COST">Custo de Manutenção</SelectItem>
                                        <SelectItem value="ADMINISTRATIVE_EXPENSE">Desp. Administrativas</SelectItem>
                                        <SelectItem value="COMMERCIAL_EXPENSE">Desp. Comerciais</SelectItem>
                                        <SelectItem value="FINANCIAL_EXPENSE">Desp. Financeiras</SelectItem>
                                        <SelectItem value="PERSONNEL_EXPENSE">Desp. Pessoal</SelectItem>
                                        <SelectItem value="LOGISTICS_EXPENSE">Desp. Logística</SelectItem>
                                        <SelectItem value="INVESTMENT">Investimentos</SelectItem>
                                        <SelectItem value="OTHER">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button type="submit" className="w-full">Salvar</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Código</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Categoria DRE</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {accounts.map((acc) => (
                            <TableRow key={acc.id}>
                                <TableCell className="font-medium">{acc.code}</TableCell>
                                <TableCell>{acc.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{getAccountTypeLabel(acc.type)}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {acc.dreCategory || '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    {acc.systemDefault && <Badge variant="secondary">Padrão</Badge>}
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && accounts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Nenhuma conta encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
