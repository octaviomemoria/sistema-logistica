import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { Profile } from '../types';

interface AuthContextType {
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setProfile(null);
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);

            if (currentSession) {
                await fetchProfile(currentSession.user.id);
            }

            setLoading(false);
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            setSession(newSession);
            if (newSession) {
                await fetchProfile(newSession.user.id);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
    };

    const refreshProfile = async () => {
        if (session) {
            await fetchProfile(session.user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ session, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
