import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Profile } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import EquipmentList from './components/EquipmentList';
import RentalList from './components/RentalList';
import ClientList from './components/ClientList';
import RentalOperations from './components/RentalOperations';
import IncidentList from './components/IncidentList';
import TaskList from './components/TaskList';
import Reports from './components/Reports';
import ContractManagement from './components/ContractManagement';
import Account from './components/Account';
import Auth from './components/Auth';
import FinancialDashboard from './components/FinancialDashboard';
import { SpinnerIcon } from './components/Icons';
import CompleteProfile from './components/CompleteProfile';

// Componente Wrapper para injetar hooks de navegação onde necessário
const AppContent: React.FC = () => {
  const { session, profile, loading, signOut, refreshProfile } = useAuth();
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Verificar se precisa completar perfil
  React.useEffect(() => {
    if (session && !loading && !profile) {
      setShowProfileCompletion(true);
    } else {
      setShowProfileCompletion(false);
    }
  }, [session, profile, loading]);

  const handleProfileComplete = async (newProfile: Profile) => {
    await refreshProfile();
    setShowProfileCompletion(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <SpinnerIcon className="w-12 h-12 text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (showProfileCompletion) {
    return <CompleteProfile session={session} onProfileComplete={handleProfileComplete} />;
  }

  // Mapeamento de rotas para View type para compatibilidade com componentes existentes
  const getCurrentView = (): any => {
    const path = location.pathname.substring(1);
    return path || 'dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <Sidebar
        currentView={getCurrentView()}
        setView={(view) => {
          navigate(`/${view === 'dashboard' ? '' : view}`);
          setSidebarOpen(false); // Close sidebar on navigation (mobile)
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header
          view={getCurrentView()}
          onBack={() => navigate(-1)}
          historyLength={window.history.length}
          profile={profile}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard profile={profile!} onNavigate={(view) => navigate(`/${view}`)} />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/equipments" element={<EquipmentList profile={profile!} />} />
            <Route path="/rentals" element={<RentalList profile={profile!} />} />
            <Route path="/clients" element={<ClientList profile={profile!} />} />
            <Route path="/operations" element={<RentalOperations profile={profile!} />} />
            <Route path="/incidents" element={<IncidentList profile={profile!} />} />
            <Route path="/tasks" element={<TaskList profile={profile!} />} />
            <Route path="/financial" element={<FinancialDashboard profile={profile!} />} />
            <Route path="/reports" element={<Reports profile={profile!} />} />
            <Route path="/contracts" element={<ContractManagement profile={profile!} />} />
            <Route path="/account" element={<Account profile={profile!} onLogout={handleLogout} />} />
            <Route path="*" element={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-700">Página não encontrada</h2>
                  <button onClick={() => navigate('/')} className="text-primary hover:underline mt-2">Voltar ao Início</button>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;