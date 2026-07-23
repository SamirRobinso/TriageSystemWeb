import { useTriage } from '../hooks/useTriageSimulation';

export default function RoomStatus() {
  const { salas, pacientes, HEX_COLORES } = useTriage();

  const getTipoSalaText = (tipo) => {
    switch (tipo) {
      case 0: return 'Emergencia';
      case 1: return 'Normal';
      default: return 'Sin asignar';
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Estado Físico de Salas</h2>
      
      <div className="rooms-grid">
        {salas.map((sala, i) => (
          <div key={sala.id} className="room-card">
            <div className="room-header">
              <div className="room-title">Sala {i + 1}</div>
              <div className="room-type">{getTipoSalaText(sala.tipo)}</div>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Ocupación: {sala.ocupacion} / 2
            </div>
            
            <div className="slot-container">
              {sala.slots.map((pId, slotIndex) => {
                if (pId === null) {
                  return (
                    <div key={slotIndex} className="slot empty">
                      Cama {slotIndex + 1} (Libre)
                    </div>
                  );
                }
                
                const paciente = pacientes[pId];
                const isActual = sala.actual === pId;
                
                return (
                  <div key={slotIndex} className="slot" style={{ borderLeft: `4px solid ${HEX_COLORES[paciente.nivel]}` }}>
                    <div className="patient-in-slot">
                      <span className="patient-name">{paciente.nombre}</span>
                      <span className="patient-status" style={{ color: isActual ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {isActual ? 'En atención' : 'En espera dentro de la sala'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
