import { create } from 'zustand';

interface Usuario {
    id: string;
    nome: string;
    email: string;
    perfil: string;
}

interface AuthStore {
    usuario: Usuario | null;
    token: string | null;
    setUsuario: (usuario: Usuario | null) => void;
    setToken: (token: string | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    usuario: null,
    token: null,
    setUsuario: (usuario) => set({ usuario }),
    setToken: (token) => {
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
        set({ token });
    },
    logout: () => {
        localStorage.removeItem('access_token');
        set({ usuario: null, token: null });
    },
}));
