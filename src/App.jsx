import { useState } from 'react';
import { useTriage } from './hooks/useTriageSimulation';
import Sidebar from './components/Sidebar';
import RegistrationForm from './components/RegistrationForm';
import RoomStatus from './components/RoomStatus';
import PatientList from './components/PatientList';
import EventLog from './components/EventLog';
import Stats from './components/Stats';
import DailyReport from './components/DailyReport';
import { RotateCcw, FastForward } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('register');
  const { diaActual, resetSimulacion, avanzarTiempo } = useTriage();

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        <header className="top-header">
          <div>
            <h1>Triage Digital - Día {diaActual}</h1>
            <p className="subtitle">Simulación de Recepción y Salas</p>
          </div>
          <div className="time-controls">
            <button
              className="btn-primary"
              onClick={avanzarTiempo}
              title="Avanzar 5 Minutos"
              style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--primary)' }}
            >
              <FastForward size={16} />
              <span>Avanzar 5 min</span>
            </button>
            <button
              className="btn-outline"
              onClick={resetSimulacion}
              title="Reiniciar Simulación"
              style={{ padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#ef4444', color: '#ef4444' }}
            >
              <RotateCcw size={16} />
              <span>Reiniciar</span>
            </button>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'register'  && <RegistrationForm />}
          {activeTab === 'rooms'     && <RoomStatus />}
          {activeTab === 'patients'  && <PatientList />}
          {activeTab === 'stats'     && <Stats />}
          {activeTab === 'report'    && <DailyReport />}
        </div>
      </main>

      <aside className="event-log-sidebar">
        <EventLog />
      </aside>
    </div>
  );
}

export default App;
