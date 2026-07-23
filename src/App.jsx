import { useState } from 'react';
import { useTriage } from './hooks/useTriageSimulation';
import Sidebar from './components/Sidebar';
import RegistrationForm from './components/RegistrationForm';
import RoomStatus from './components/RoomStatus';
import PatientList from './components/PatientList';
import EventLog from './components/EventLog';
import Stats from './components/Stats';
import DailyReport from './components/DailyReport';
function App() {
  const [activeTab, setActiveTab] = useState('register');
  const { diaActual } = useTriage();

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        <header className="top-header">
          <div>
            <h1>Triage Digital - Día {diaActual}</h1>
            <p className="subtitle">Simulación de Recepción y Salas</p>
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
