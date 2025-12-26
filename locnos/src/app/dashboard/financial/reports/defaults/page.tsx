"use client";

import { useEffect, useState } from "react";
import { format, differenceInDays } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DefaultItem = {
    id: string;
    dueDate: string;
    amount: number;
    description: string;
    rental?: {
        person: {
            name: string;
            phone: string;
            email: string | null;
        }
    }
};

export default function DefaultsReportPage() {
    const [items, setItems] = useState<DefaultItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDefaults();
    }, []);

    const fetchDefaults = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/financial/reports/defaults");
            const data = await res.json();
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysOverdue = (dateStr: string) => {
        return differenceInDays(new Date(), new Date(dateStr));
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <h1 className="text-3xl font-bold text-red-600">Relatório de Inadimplência</h1>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Dias em Atraso</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Contato</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    {item.rental?.person.name || "N/A"}
                                </TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>{format(new Date(item.dueDate), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>
                                    <Badge variant="destructive">{getDaysOverdue(item.dueDate)} dias</Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-red-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm text-muted-foreground">
                                        <span>{item.rental?.person.phone}</span>
                                        <span>{item.rental?.person.email}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-lg">
                                    Parabéns! Nenhuma inadimplência encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
