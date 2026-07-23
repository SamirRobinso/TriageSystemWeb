import { useState } from 'react';
import { useTriage } from './hooks/useTriageSimulation';
import Sidebar from './components/Sidebar';
import RegistrationForm from './components/RegistrationForm';
import RoomStatus from './components/RoomStatus';
import PatientList from './components/PatientList';
import EventLog from './components/EventLog';
import Stats from './components/Stats';
import DailyReport from './components/DailyReport';
import { Clock, RotateCcw, Timer, Play, Pause } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('register');
  const { tiempoAbsoluto, contadorGlobal, diaActual, avanzarTiempo, resetSimulacion, isRunning, toggleRunning } = useTriage();

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
            <div className="time-display" title="Tiempo simulado del día actual">
              <Clock className="icon" size={18} />
              <span>Día: {contadorGlobal} min</span>
            </div>
            <div className="time-display" title="Tiempo total ejecutado en toda la simulación">
              <Timer className="icon" size={18} style={{ color: '#22c55e' }} />
              <span>Total: {tiempoAbsoluto} min</span>
            </div>
            <button className="btn-primary" onClick={avanzarTiempo} title="Avanzar 5 minutos manualmente">
              Avanzar 5 min
            </button>
            <button 
              className="btn-outline"
              onClick={toggleRunning}
              title={isRunning ? 'Pausar simulación automática' : 'Iniciar simulación automática'}
              style={{ padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: isRunning ? '#eab308' : '#22c55e', color: isRunning ? '#eab308' : '#22c55e' }}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              <span>{isRunning ? 'Pausar' : 'Auto'}</span>
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
          {activeTab === 'register' && <RegistrationForm />}
          {activeTab === 'rooms' && <RoomStatus />}
          {activeTab === 'patients' && <PatientList />}
          {activeTab === 'stats' && <Stats />}
          {activeTab === 'report' && <DailyReport />}
        </div>
      </main>

      <aside className="event-log-sidebar">
        <EventLog />
      </aside>
    </div>
  );
}

export default App;
