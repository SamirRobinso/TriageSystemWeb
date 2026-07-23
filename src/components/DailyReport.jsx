import { useTriage } from '../hooks/useTriageSimulation';
import { CalendarCheck, ArrowRight } from 'lucide-react';

export default function DailyReport() {
  const { pacientes, diaActual, finalizarDia, TIPO_URGENCIA, COLOR_NIVEL, HEX_COLORES } = useTriage();

  const pacientesHoy = pacientes.filter(p => p.dia === diaActual);

  let atendidosDia = 0;
  let enEsperaDia = 0;
  let siendoAtendidosDia = 0;
  let trasladadosDia = 0;

  const porNivel = [
    { atendidos: 0, espera: 0, atendiendo: 0, trasladados: 0 },
    { atendidos: 0, espera: 0, atendiendo: 0, trasladados: 0 },
    { atendidos: 0, espera: 0, atendiendo: 0, trasladados: 0 },
    { atendidos: 0, espera: 0, atendiendo: 0, trasladados: 0 },
    { atendidos: 0, espera: 0, atendiendo: 0, trasladados: 0 },
  ];

  pacientesHoy.forEach(p => {
    const lvl = p.nivel;
    if (p.estado === 2) {
      atendidosDia++;
      porNivel[lvl].atendidos++;
    } else if (p.estado === 0) {
      enEsperaDia++;
      porNivel[lvl].espera++;
    } else if (p.estado === 1) {
      siendoAtendidosDia++;
      porNivel[lvl].atendiendo++;
    } else if (p.estado === 3) {
      trasladadosDia++;
      porNivel[lvl].trasladados++;
    }
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Reporte de Fin de Día</h2>
          <p className="subtitle">Resumen del Día {diaActual}</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={finalizarDia}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#22c55e' }}
        >
          <CalendarCheck size={18} />
          <span>Finalizar Día {diaActual} y Pasar al Día {diaActual + 1}</span>
          <ArrowRight size={18} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{pacientesHoy.length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Registrados Hoy</div>
        </div>
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#22c55e' }}>{atendidosDia}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Atendidos</div>
        </div>
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>{siendoAtendidosDia}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Siendo Atendidos</div>
        </div>
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#eab308' }}>{enEsperaDia}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>En Espera</div>
        </div>
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>{trasladadosDia}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Trasladados</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Detalle por Nivel de Urgencia (Día {diaActual})</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nivel / Tipo</th>
              <th>Color</th>
              <th>Atendidos</th>
              <th>En Atención</th>
              <th>En Espera</th>
              <th>Trasladados</th>
            </tr>
          </thead>
          <tbody>
            {porNivel.map((stat, lvl) => (
              <tr key={lvl}>
                <td style={{ fontWeight: 600 }}>{TIPO_URGENCIA[lvl]}</td>
                <td>
                  <span className="level-badge" style={{ backgroundColor: HEX_COLORES[lvl] }}>
                    {COLOR_NIVEL[lvl]}
                  </span>
                </td>
                <td style={{ fontWeight: 500, color: '#22c55e' }}>{stat.atendidos}</td>
                <td>{stat.atendiendo}</td>
                <td>{stat.espera}</td>
                <td style={{ color: stat.trasladados > 0 ? '#ef4444' : 'inherit' }}>{stat.trasladados}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Pacientes Atendidos Hoy</h3>
        {pacientesHoy.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay registro de pacientes hoy.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pacientesHoy.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: '0.5rem' }}>
                <span><strong>{p.nombre}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>({p.nhc})</span></span>
                <span className="level-badge" style={{ backgroundColor: HEX_COLORES[p.nivel] }}>{TIPO_URGENCIA[p.nivel]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
