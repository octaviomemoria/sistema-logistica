"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type OFXTx = {
    id: string;
    amount: number;
    description: string;
    date: string;
    type: 'CREDIT' | 'DEBIT';
};

export default function ReconciliationPage() {
    const [transactions, setTransactions] = useState<OFXTx[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", e.target.files[0]);

        try {
            const res = await fetch("/api/financial/integrations/ofx", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setTransactions(data);
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Conciliação Bancária (OFX)</h1>
                <div className="flex items-center gap-2">
                    <Input
                        type="file"
                        accept=".ofx"
                        onChange={handleUpload}
                        disabled={uploading}
                        className="w-full max-w-xs"
                    />
                </div>
            </div>

            {transactions.length > 0 && (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{format(new Date(tx.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell className={`text-right font-bold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="sm" variant="outline">Conciliar</Button>
                                        <Button size="sm">Criar Lançamento</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {transactions.length === 0 && !uploading && (
                <div className="text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
                    Faça upload de um arquivo .ofx para iniciar a conciliação.
                </div>
            )}
        </div>
    );
}
