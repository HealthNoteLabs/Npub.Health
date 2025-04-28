import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { NostrProvider } from './components/NostrProvider';
import HealthDashboard from './components/dashboard/HealthDashboard';
import WorkoutDashboard from './components/dashboard/WorkoutDashboard';
import MetricHistoryDetail from './components/dashboard/MetricHistoryDetail';
import Header from './components/ui/Header';
import './App.css';

function App() {
  return (
    <NostrProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto p-4 max-w-6xl">
            <div className="mb-6">
              <nav className="flex space-x-4 pb-4 border-b">
                <Link to="/" className="px-4 py-2 font-medium text-blue-600 rounded hover:bg-blue-50">
                  Health Dashboard
                </Link>
                <Link to="/workouts" className="px-4 py-2 font-medium text-blue-600 rounded hover:bg-blue-50">
                  Workouts
                </Link>
              </nav>
            </div>
            
            <Routes>
              <Route path="/" element={<HealthDashboard />} />
              <Route path="/workouts" element={<WorkoutDashboard />} />
              <Route path="/metric/:metricType" element={<MetricHistoryDetail />} />
            </Routes>
          </main>
          
          <footer className="mt-8 py-4 border-t text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Npub.Health - A Nostr Health Dashboard</p>
          </footer>
        </div>
      </Router>
    </NostrProvider>
  );
}

export default App;
