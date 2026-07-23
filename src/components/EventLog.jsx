import { useTriage } from '../hooks/useTriageSimulation';

export default function EventLog() {
  const { eventLog } = useTriage();

  return (
    <>
      <div className="log-header">
        Novedades (Log)
      </div>
      <div className="log-list">
        {eventLog.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
            No hay eventos recientes.
          </div>
        ) : (
          eventLog.map((log, index) => (
            <div key={index} className="log-item">
              <span className="log-time">Minuto {log.time}</span>
              {log.msg}
            </div>
          ))
        )}
      </div>
    </>
  );
}
