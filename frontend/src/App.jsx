import React from 'react';
import { Fingerprint, Radio, Scale, ShieldAlert } from 'lucide-react';
import { WindowManagerProvider } from './components/WindowManager';
import Desktop from './components/Desktop';

import BioLab from './components/windows/BioLab';
import Interception from './components/windows/Interception';
import Magistrat from './components/windows/Magistrat';
import AdminPanel from './components/windows/AdminPanel';

// Registre des applications
const APP_REGISTRY = {
  biolab: {
    title: 'BioLab — AFIS',
    description: 'Analyse d\'empreintes digitales',
    icon: <Fingerprint size={20} />,
    component: BioLab,
    onDesktop: true,
    singleton: false,
    width: 880, height: 560,
  },
  interception: {
    title: 'Interception',
    description: 'Écoutes téléphoniques',
    icon: <Radio size={20} />,
    component: Interception,
    onDesktop: true,
    singleton: true,
    width: 900, height: 560,
  },
  magistrat: {
    title: 'Messagerie Magistrat',
    description: 'Communication avec le juge d\'instruction',
    icon: <Scale size={20} />,
    component: Magistrat,
    onDesktop: true,
    singleton: true,
    width: 680, height: 620,
  },
  admin: {
    title: 'Panel MJ',
    description: 'Administration — réservé maîtres du jeu',
    icon: <ShieldAlert size={20} />,
    component: AdminPanel,
    onDesktop: false,
    singleton: true,
    width: 900, height: 580,
  },
};

export default function App() {
  return (
    <WindowManagerProvider registry={APP_REGISTRY}>
      <Desktop />
    </WindowManagerProvider>
  );
}
