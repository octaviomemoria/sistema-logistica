import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Profile, UserRole } from '../types';
import { Session } from '@supabase/supabase-js';
import { SpinnerIcon } from './Icons';

interface CompleteProfileProps {
  session: Session;
  onProfileComplete: (profile: Profile) => void;
}

const CompleteProfile: React.FC<CompleteProfileProps> = ({ session, onProfileComplete }) => {
  const [loading, setLoading] = useState(false);
  // Try to pre-fill company name from metadata captured during signup
  const [companyName, setCompanyName] = useState(session.user.user_metadata.company_name || '');
  const [fullName, setFullName] = useState(session.user.user_metadata.full_name || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Create the organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: companyName })
      .select()
      .single();

    if (orgError || !orgData) {
      setError(`Erro ao criar a organização: ${orgError?.message || 'Não foi possível obter os dados da organização.'}`);
      setLoading(false);
      return;
    }

    // 2. Create the user profile
    const newProfile: Profile = {
      id: session.user.id,
      organization_id: orgData.id,
      full_name: fullName,
      role: UserRole.ADMIN, // First user of an org is always Admin
    };

    const { error: profileError } = await supabase.from('profiles').insert(newProfile);

    if (profileError) {
      setError(`Erro ao criar o perfil: ${profileError.message}`);
      setLoading(false);
      return;
    }

    // 3. Success, notify App.tsx
    onProfileComplete(newProfile);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-4xl font-extrabold text-primary">
          Locnos
        </h1>
        <h2 className="mt-2 text-center text-xl font-bold text-gray-800">
          Bem-vindo(a)! Complete seu cadastro.
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Estamos quase lá. Só precisamos de mais alguns detalhes para configurar sua conta.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  disabled
                  value={session.user.email || ''}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Seu Nome Completo
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Nome da sua Locadora
              </label>
              <div className="mt-1">
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Ex: Aluga Tudo Equipamentos"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
              >
                {loading && <SpinnerIcon className="w-5 h-5 mr-2"/>}
                {loading ? 'Configurando...' : 'Finalizar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;