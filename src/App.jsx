import { useState } from 'react';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import NutritionPage from './components/nutrition/NutritionPage.jsx';
import FoodsPage from './components/foods/FoodsPage.jsx';
import TrainingPage from './components/training/TrainingPage.jsx';
import ProgressionPage from './components/progression/ProgressionPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ToolsPage from './pages/ToolsPage.jsx';

export default function App() {
  const [tab, setTab] = useState('dashboard');

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
