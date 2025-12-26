import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  fetchCurrentProfile,
  fetchOrganization,
  login as loginService,
  logout as logoutService,
  registerUser,
  type RegisterPayload
} from "../services/authService";
import type { Organization, Profile, UserRole } from "../types/domain";
import {
  getSupabaseClient,
  isSupabaseConfigured
} from "../services/supabaseClient";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  loading: boolean;
  configError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(
    isSupabaseConfigured
      ? null
      : "Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."
  );

  const handleSessionChange = useCallback(
    async (session: Session | null) => {
      if (!session) {
        setUser(null);
        setProfile(null);
        setOrganization(null);
        setLoading(false);
        return;
      }

      setUser(session.user);
      const currentProfile = await fetchCurrentProfile();
      setProfile(currentProfile);

      if (currentProfile?.organization_id) {
        const org = await fetchOrganization(currentProfile.organization_id);
        setOrganization(org);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = getSupabaseClient();

    supabase.auth
      .getSession()
      .then(({ data }) => handleSessionChange(data.session))
      .catch((error) => setConfigError(error.message));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSessionChange(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [handleSessionChange]);

  const login = useCallback(async (email: string, password: string) => {
    await loginService(email, password);
  }, []);

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const { user: newUser, organization: newOrg, profile: newProfile } =
        await registerUser(payload);
      setUser(newUser);
      setOrganization(newOrg);
      setProfile(newProfile);
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutService();
    setUser(null);
    setProfile(null);
    setOrganization(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentProfile = await fetchCurrentProfile();
    if (currentProfile) {
      setProfile(currentProfile);
      const org = await fetchOrganization(currentProfile.organization_id);
      setOrganization(org);
    }
  }, []);

  const hasRole = useCallback(
    (roles: UserRole[]) => {
      if (!roles.length) return true;
      if (!profile) return false;
      return roles.includes(profile.role);
    },
    [profile]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      organization,
      loading,
      configError,
      login,
      register,
      logout,
      refreshProfile,
      hasRole
    }),
    [
      user,
      profile,
      organization,
      loading,
      configError,
      login,
      register,
      logout,
      refreshProfile,
      hasRole
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
