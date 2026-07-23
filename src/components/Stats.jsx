import { useTriage } from '../hooks/useTriageSimulation';

export default function Stats() {
  const { pacientes, salas, diaActual } = useTriage();

  const totalPacientes = pacientes.length;
  let enEspera = 0;
  let enAtencion = 0;
  let atendidos = 0;
  let trasladados = 0;

  let sumaTiempos = 0;
  let conteoPacientesEsperaYAtencion = 0;

  pacientes.forEach(p => {
    if (p.estado === 0) enEspera++;
    else if (p.estado === 1) enAtencion++;
    else if (p.estado === 2) atendidos++;
    else if (p.estado === 3) trasladados++;

    if (p.estado === 0 || p.estado === 1) {
      const tiempoRestante = p.estado === 1 ? Math.max(0, p.finAtencion ?? 0) : (p.duracion ?? 0);
      sumaTiempos += tiempoRestante;
      conteoPacientesEsperaYAtencion++;
    }
  });

  const promedioEspera = conteoPacientesEsperaYAtencion > 0 
    ? Math.round(sumaTiempos / conteoPacientesEsperaYAtencion) 
    : 0;

  const ocupadosTotal = salas.reduce((acc, s) => acc + s.ocupacion, 0);
  const cuposTotales = salas.length * 2; // 5 salas * 2

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Estadísticas del Sistema</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>{totalPacientes}</div>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Pacientes Totales</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#eab308' }}>{enEspera}</div>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>En Espera</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#22c55e' }}>{enAtencion}</div>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>En Atención</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#94a3b8' }}>{atendidos}</div>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Atendidos</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#ef4444' }}>{trasladados}</div>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Internados</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Ocupación de Salas</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Camas Ocupadas</span>
          <span style={{ fontWeight: 600 }}>{ocupadosTotal} / {cuposTotales}</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-card)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${(ocupadosTotal / cuposTotales) * 100}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Promedio Estimado de Espera</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>
            {conteoPacientesEsperaYAtencion === 0 ? "N/A" : `~${promedioEspera}`}
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            {conteoPacientesEsperaYAtencion === 0 ? "Sin pacientes en espera o atención" : "minutos por paciente"}
            {conteoPacientesEsperaYAtencion > 0 && (
              <>
                <br />
                <span style={{ fontSize: '0.85rem' }}>(Calculado con {conteoPacientesEsperaYAtencion} pacientes pendientes)</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Información de Jornada</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Día Actual: <strong style={{ color: 'var(--text-main)' }}>{diaActual}</strong></p>
      </div>
    </div>
  );
}
