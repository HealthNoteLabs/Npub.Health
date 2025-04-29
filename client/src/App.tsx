import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NostrProvider } from './components/NostrProvider';
import { ToastProvider } from './components/ui/toast';
import HealthDashboard from './components/dashboard/HealthDashboard';
import WorkoutDashboard from './components/dashboard/WorkoutDashboard';
import MetricHistoryDetail from './components/dashboard/MetricHistoryDetail';
import ComingSoonPage from './components/dashboard/ComingSoonPage';
import AnalyticsPage from './components/dashboard/AnalyticsPage';
import InsightsPage from './components/dashboard/InsightsPage';
import DataPage from './components/dashboard/DataPage';
import Header from './components/ui/Header';
import './App.css';

function App() {
  useEffect(() => {
    // Apply dark mode class to document element based on theme.json
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ToastProvider>
      <NostrProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto p-4 max-w-6xl">
              <Routes>
                <Route path="/" element={<HealthDashboard />} />
                <Route path="/workouts" element={<WorkoutDashboard />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/data" element={<DataPage />} />
                <Route path="/metric/:metricType" element={<MetricHistoryDetail />} />
              </Routes>
            </main>
            
            <footer className="mt-8 py-4 border-t border-border text-center text-muted-foreground text-sm">
              <p>&copy; {new Date().getFullYear()} Npub.Health - A Nostr Health Dashboard</p>
            </footer>
          </div>
        </Router>
      </NostrProvider>
    </ToastProvider>
  );
}

export default App;
