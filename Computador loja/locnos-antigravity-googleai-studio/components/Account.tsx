
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Profile, UserRole } from '../types';
import Toast from './Toast';
import { CogIcon, PlusIcon, TrashIcon, SpinnerIcon, ExclamationTriangleIcon, PhotoIcon, UploadIcon } from './Icons';
import Modal from './Modal';

interface AccountProps {
  profile: Profile;
  onLogout: () => void;
}

const Account: React.FC<AccountProps> = ({ profile, onLogout }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Profile Editing State
  const [myFullName, setMyFullName] = useState(profile.full_name);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', profile.organization_id);

    if (error) {
      setToast({ message: 'Erro ao carregar usuários.', type: 'error' });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [profile.organization_id]);

  // Update local state if profile prop updates (e.g. after app reload)
  useEffect(() => {
      setMyFullName(profile.full_name);
      setAvatarPreview(profile.avatar_url || null);
  }, [profile]);
  
  const handleAddUser = async (email: string, fullName: string, role: UserRole) => {
    setToast({ message: 'Convidar usuários estará disponível em breve.', type: 'success' });
    setIsModalOpen(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === profile.id) {
        setToast({ message: 'Você não pode remover seu próprio perfil.', type: 'error' });
        return;
    }

    if (window.confirm('Tem certeza que deseja remover este usuário da sua organização?')) {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) {
            setToast({ message: `Erro ao remover usuário: ${error.message}`, type: 'error' });
        } else {
            setToast({ message: 'Usuário removido da organização. A conta de autenticação ainda existe e deve ser removida manualmente pelo painel do Supabase.', type: 'success' });
            fetchUsers();
        }
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        setToast({ message: 'Por favor, selecione um arquivo de imagem válido.', type: 'error' });
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'Imagem muito grande. Máximo 5MB.', type: 'error' });
        return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setIsSavingProfile(true);
    
    // Upload to Supabase
    const fileName = `${profile.organization_id}/${profile.id}-${Date.now()}`;
    const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        console.error("Upload Error:", uploadError);
        // If bucket doesn't exist or RLS fails, show error but keep preview for UX until refresh
        if (uploadError.message.includes('Bucket not found')) {
             setToast({ message: 'Erro: Bucket "avatars" não encontrado no Supabase Storage.', type: 'error'});
        } else {
             setToast({ message: `Erro ao enviar imagem: ${uploadError.message}`, type: 'error'});
        }
        setIsSavingProfile(false);
        return;
    }

    // Get Public URL
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    // Update Profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

    if (updateError) {
        setToast({ message: `Erro ao salvar perfil: ${updateError.message}`, type: 'error' });
    } else {
        setToast({ message: 'Foto de perfil atualizada!', type: 'success' });
        // Force a reload of the app/profile would be ideal here, but strictly local state update works for now
        profile.avatar_url = publicUrl; // Optimistic update for parent props if passed by ref (anti-pattern but works for simple case)
    }
    setIsSavingProfile(false);
  };

  const handleSaveProfile = async () => {
      if (!myFullName.trim()) {
          setToast({ message: 'Nome não pode estar vazio.', type: 'error' });
          return;
      }

      setIsSavingProfile(true);
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: myFullName })
        .eq('id', profile.id);

      if (error) {
          setToast({ message: `Erro ao atualizar nome: ${error.message}`, type: 'error' });
      } else {
          setToast({ message: 'Perfil atualizado com sucesso!', type: 'success' });
          // Update the list to reflect changes if user is in the list
          fetchUsers();
      }
      setIsSavingProfile(false);
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
           <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <CogIcon className="w-8 h-8 text-primary"/>
              <h3 className="text-2xl font-semibold text-gray-800">Conta & Usuários</h3>
           </div>
          
           <div className="max-w-4xl mb-10">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">Meu Perfil</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <PhotoIcon className="w-10 h-10" />
                                </div>
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleAvatarChange} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-md hover:bg-primary-hover transition-transform hover:scale-110"
                            title="Alterar foto"
                        >
                            <UploadIcon className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="flex-1 w-full space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                    type="text"
                                    value={myFullName}
                                    onChange={(e) => setMyFullName(e.target.value)}
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Cargo</label>
                            <input
                                type="text"
                                value={profile.role}
                                disabled
                                className="mt-1 block w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-500 rounded-md sm:text-sm capitalize cursor-not-allowed"
                            />
                        </div>
                    </div>
                    <div className="self-end sm:self-center">
                        <button 
                            onClick={handleSaveProfile}
                            disabled={isSavingProfile}
                            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover disabled:bg-gray-400 flex items-center transition-colors"
                        >
                             {isSavingProfile ? <SpinnerIcon className="w-5 h-5 mr-2"/> : null}
                             Salvar Alterações
                        </button>
                    </div>
                </div>
           </div>

           <div className="max-w-4xl">
                <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-gray-700">Membros da Organização</h4>
                    {profile.role === UserRole.ADMIN && (
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Convidar Usuário
                        </button>
                    )}
                </div>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                    Gerencie quem tem acesso à sua área de trabalho.
                </p>

                <div className="overflow-x-auto mt-4 border rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nome</th>
                                <th scope="col" className="px-6 py-3">Cargo</th>
                                <th scope="col" className="px-6 py-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={3} className="text-center py-8"><SpinnerIcon className="w-6 h-6 mx-auto" /></td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-100" />
                                                <span>{user.full_name} {user.id === profile.id && '(Você)'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 capitalize">{user.role}</td>
                                        <td className="px-6 py-4">
                                            {profile.role === UserRole.ADMIN && user.id !== profile.id && (
                                                <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:underline font-medium flex items-center gap-1">
                                                    <TrashIcon className="w-4 h-4" />
                                                    Remover
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
           </div>

           <div className="mt-8 border-t pt-6 max-w-4xl">
                <h4 className="text-lg font-semibold text-red-600">Zona de Perigo</h4>
                <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-semibold text-red-800">Sair da Conta</p>
                        <p className="text-sm text-red-700 mt-1">Isso irá desconectar sua sessão em todos os dispositivos.</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium whitespace-nowrap"
                    >
                        Sair da Conta
                    </button>
                </div>
           </div>
        </div>
      </div>
       <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddUser} />
    </>
  );
};

const AddUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (email: string, fullName: string, role: UserRole) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.ATENDENTE);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(email, fullName, role);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Convidar Novo Usuário">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Endereço de E-mail</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Cargo</label>
                    <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white" required>
                        <option value={UserRole.ATENDENTE}>Atendente</option>
                        <option value={UserRole.TECNICO}>Técnico</option>
                        <option value={UserRole.FRETEIRO}>Freteiro</option>
                        <option value={UserRole.FINANCEIRO}>Financeiro</option>
                        <option value={UserRole.GERENTE}>Gerente</option>
                        <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                </div>
                 <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">Enviar Convite</button>
                </div>
            </form>
        </Modal>
    );
};


export default Account;
