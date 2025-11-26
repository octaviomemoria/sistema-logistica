'use client';

import { redirect } from 'next/navigation';

export default function EntregasPage() {
    // Por enquanto redireciona para dashboard
    // Esta página seria mais útil no app mobile
    redirect('/dashboard');
}
