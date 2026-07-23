import { useTriage } from '../hooks/useTriageSimulation';

export default function PatientList() {
  const { pacientes, TIPO_URGENCIA, HEX_COLORES, tiempoAbsoluto } = useTriage();

  const getEstadoTexto = (paciente) => {
    switch (paciente.estado) {
      case 0:
        return paciente.sala !== null ? `Espera (Sala ${paciente.sala + 1})` : 'Espera (Sin cupo)';
      case 1:
        return `Atendiéndose (Quedan ${Math.max(0, paciente.finAtencion - tiempoAbsoluto)}m)`;
      case 2:
        return 'Atendido';
      case 3:
        return 'Trasladado';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Registro Global de Pacientes</h2>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden', maxWidth: '100%' }}>
        {pacientes.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Aún no hay pacientes registrados en el sistema.
          </div>
        ) : (
          <table className="data-table">
            <thead style={{ backgroundColor: 'var(--bg-panel)' }}>
              <tr>
                <th>Nº</th>
                <th>Nombre</th>
                <th>Día</th>
                <th>Nivel</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                  <td>{p.dia}</td>
                  <td>
                    <span className="level-badge" style={{ backgroundColor: HEX_COLORES[p.nivel] }}>
                      {TIPO_URGENCIA[p.nivel]}
                    </span>
                  </td>
                  <td style={{ color: p.estado === 1 ? 'var(--primary)' : 'inherit' }}>
                    {getEstadoTexto(p)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
