import { useState } from 'react';
import { useTriage } from './hooks/useTriageSimulation';
import Sidebar from './components/Sidebar';
import RegistrationForm from './components/RegistrationForm';
import RoomStatus from './components/RoomStatus';
import PatientList from './components/PatientList';
import EventLog from './components/EventLog';
import Stats from './components/Stats';
import { Clock } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('register');
  const { tiempoAbsoluto, diaActual, avanzarTiempo } = useTriage();

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
            <div className="time-display">
              <Clock className="icon" />
              <span>Tiempo Simulado: {tiempoAbsoluto} min</span>
            </div>
            <button className="btn-primary" onClick={avanzarTiempo}>
              Avanzar 5 min
            </button>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'register' && <RegistrationForm />}
          {activeTab === 'rooms' && <RoomStatus />}
          {activeTab === 'patients' && <PatientList />}
          {activeTab === 'stats' && <Stats />}
        </div>
      </main>

      <aside className="event-log-sidebar">
        <EventLog />
      </aside>
    </div>
  );
}

export default App;
