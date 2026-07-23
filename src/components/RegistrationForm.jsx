import { useState } from 'react';
import { useTriage } from '../hooks/useTriageSimulation';

export default function RegistrationForm() {
  const { registrarPaciente, PREGUNTAS, TIPO_URGENCIA, COLOR_NIVEL, HEX_COLORES, TIEMPO_TEXTO } = useTriage();
  const [nombre, setNombre] = useState('');
  const [paso, setPaso] = useState(0); // 0 = nombre, 1 = preguntas, 2 = resultado
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [nivelCalculado, setNivelCalculado] = useState(null);
  const [pacienteRegistrado, setPacienteRegistrado] = useState(null);

  const startTriage = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return alert("Ingrese un nombre válido");
    setPaso(1);
    setPreguntaActual(0);
  };

  const handleRespuesta = (respuesta) => {
    if (respuesta === 'Si') {
      finalizarTriage(preguntaActual);
    } else {
      if (preguntaActual < 4) {
        setPreguntaActual(preguntaActual + 1);
      } else {
        finalizarTriage(4); // Nivel 4 si todo fue No
      }
    }
  };

  const finalizarTriage = (nivel) => {
    setNivelCalculado(nivel);
    const paciente = registrarPaciente(nombre, nivel);
    if (paciente) {
      setPacienteRegistrado(paciente);
      setPaso(2);
    } else {
      // Limit reached
      setPaso(0);
      setNombre('');
    }
  };

  const resetForm = () => {
    setNombre('');
    setPaso(0);
    setNivelCalculado(null);
    setPacienteRegistrado(null);
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem' }}>Registro de Nuevo Paciente</h2>
      
      {paso === 0 && (
        <form onSubmit={startTriage}>
          <div className="form-group">
            <label className="form-label">Nombre del Paciente</label>
            <input 
              type="text" 
              className="form-input" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Juan Perez"
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary">Iniciar Triage</button>
        </form>
      )}

      {paso === 1 && (
        <div>
          <div className="question-card">
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Pregunta {preguntaActual + 1} de 5
            </div>
            <div className="question-text">
              {PREGUNTAS[preguntaActual]}
            </div>
            <div className="btn-group">
              <button className="btn-outline" onClick={() => handleRespuesta('Si')}>Sí</button>
              <button className="btn-outline" onClick={() => handleRespuesta('No')}>No</button>
            </div>
          </div>
          <button className="btn-outline" onClick={resetForm}>Cancelar</button>
        </div>
      )}

      {paso === 2 && pacienteRegistrado && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Triage Completado</h3>
            <p>Paciente: <strong>{pacienteRegistrado.nombre}</strong></p>
          </div>
          
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            borderTop: `4px solid ${HEX_COLORES[nivelCalculado]}`
          }}>
            <div className="level-badge" style={{ backgroundColor: HEX_COLORES[nivelCalculado], fontSize: '1.25rem', padding: '0.5rem 1.5rem' }}>
              Nivel {nivelCalculado + 1} - {COLOR_NIVEL[nivelCalculado]}
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: '500' }}>
              {TIPO_URGENCIA[nivelCalculado]}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              Tiempo estimado: {TIEMPO_TEXTO[nivelCalculado]}
            </div>
            
            {pacienteRegistrado.sala !== null ? (
              <div style={{ marginTop: '1rem', color: 'var(--primary)' }}>
                Asignado directamente a la Sala {pacienteRegistrado.sala + 1}
              </div>
            ) : (
              <div style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                En espera de cupo físico
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button className="btn-primary" onClick={resetForm}>Registrar Otro Paciente</button>
          </div>
        </div>
      )}
    </div>
  );
}
