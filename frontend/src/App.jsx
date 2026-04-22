import React from 'react';
import { Fingerprint, Radio, Scale, ShieldAlert, Loader2 } from 'lucide-react';
import { WindowManagerProvider } from './components/WindowManager';
import Desktop from './components/Desktop';
import Login from './components/Login';
import { useAuth } from './hooks/useAuth';

import BioLab from './components/windows/BioLab';
import Interception from './components/windows/Interception';
import Magistrat from './components/windows/Magistrat';
import AdminPanel from './components/windows/AdminPanel';

export const AuthContext = React.createContext(null);

function buildRegistry(profile) {
  const reg = {
    biolab: {
      title: 'BioLab — AFIS',
      description: 'Analyse d\'empreintes digitales',
      icon: <Fingerprint size={20} />, component: BioLab,
      onDesktop: true, width: 880, height: 560,
    },
    interception: {
      title: 'Interception',
      description: 'Écoutes téléphoniques',
      icon: <Radio size={20} />, component: Interception,
      onDesktop: true, singleton: true, width: 900, height: 560,
    },
    magistrat: {
      title: 'Messagerie Magistrat',
      description: 'Communication avec le juge d\'instruction',
      icon: <Scale size={20} />, component: Magistrat,
      onDesktop: true, singleton: true, width: 720, height: 640,
    },
  };
  if (profile?.role === 'mj') {
    reg.admin = {
      title: 'Panel MJ',
      description: 'Administration — Maîtres du jeu',
      icon: <ShieldAlert size={20} />, component: AdminPanel,
      onDesktop: true, singleton: true, width: 960, height: 600,
    };
  }
  return reg;
}

export default function App() {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="h-screen w-screen bg-bureau-900 flex items-center justify-center text-accent-blue gap-2">
        <Loader2 className="animate-spin" /> Authentification du terminal...
      </div>
    );
  }

  if (!auth.session) return <Login auth={auth} />;

  return (
    <AuthContext.Provider value={auth}>
      <WindowManagerProvider registry={buildRegistry(auth.profile)}>
        <Desktop />
      </WindowManagerProvider>
    </AuthContext.Provider>
  );
}
