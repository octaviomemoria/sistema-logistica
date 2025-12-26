"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DreLine = {
    label: string;
    value: number;
    type: "HEADER" | "DEDUCTION" | "SUB_DEDUCTION" | "RESULT";
    highlight?: boolean;
};

export default function DrePage() {
    const [report, setReport] = useState<DreLine[]>([]);
    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd')); // Jan 1st
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd')); // Today

    useEffect(() => {
        fetchReport();
    }, [startDate, endDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/financial/reports/dre?startDate=${startDate}&endDate=${endDate}`);
            const data = await res.json();
            setReport(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const getRowStyle = (type: string, highlight?: boolean) => {
        let base = "flex justify-between py-2 border-b text-sm ";
        if (highlight) return base + "font-bold text-lg bg-muted p-4 rounded-md mt-4";

        switch (type) {
            case "HEADER": return base + "font-semibold mt-4 text-base";
            case "RESULT": return base + "font-bold bg-gray-50/50 mt-2";
            case "SUB_DEDUCTION": return base + "pl-8 text-muted-foreground";
            case "DEDUCTION": return base + "font-medium text-red-600/80";
            default: return base;
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8 max-w-4xl">
            <div className="flex justify-between items-center print:hidden">
                <h1 className="text-3xl font-bold">Demonstrativo de Resultados (DRE)</h1>
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
                    <Button onClick={() => window.print()} variant="outline">
                        Imprimir / PDF
                    </Button>
                </div>
            </div>

            <Card className="print:shadow-none print:border-none">
                <CardHeader className="text-center pb-2">
                    <CardTitle>DRE - {format(new Date(startDate), 'dd/MM/yyyy')} a {format(new Date(endDate), 'dd/MM/yyyy')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                    {report.map((item, idx) => (
                        <div key={idx} className={getRowStyle(item.type, item.highlight)}>
                            <span>{item.label}</span>
                            <span>{formatCurrency(item.value)}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
