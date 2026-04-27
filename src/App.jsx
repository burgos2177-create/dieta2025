import { useState, useEffect } from 'react';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import NutritionPage from './components/nutrition/NutritionPage.jsx';
import FoodsPage from './components/foods/FoodsPage.jsx';
import TrainingPage from './components/training/TrainingPage.jsx';
import ProgressionPage from './components/progression/ProgressionPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ToolsPage from './pages/ToolsPage.jsx';
import { useTrainingStore } from './store/useTrainingStore.js';
import { useNutritionStore } from './store/useNutritionStore.js';
import { useProfileStore } from './store/useProfileStore.js';
import { useBodyLogStore } from './store/useBodyLogStore.js';
import { useFoodStore } from './store/useFoodStore.js';

export default function App() {
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    useTrainingStore.getState()._initCloud();
    useNutritionStore.getState()._initCloud();
    useProfileStore.getState()._initCloud();
    useBodyLogStore.getState()._initCloud();
    useFoodStore.getState()._initCloud();
  }, []);

  const render = () => {
    switch (tab) {
      case 'dashboard':   return <Dashboard />;
      case 'nutrition':   return <NutritionPage />;
      case 'foods':       return <FoodsPage />;
      case 'training':    return <TrainingPage />;
      case 'progression': return <ProgressionPage />;
      case 'profile':     return <ProfilePage />;
      case 'tools':       return <ToolsPage />;
      default:            return <Dashboard />;
    }
  };

  return (
    <Layout active={tab} onChange={setTab}>
      {render()}
    </Layout>
  );
}
