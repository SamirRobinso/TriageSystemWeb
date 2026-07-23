import { createContext, useContext, useState, useEffect } from 'react';

const TriageContext = createContext();

// Constants
const MAX_PACIENTES_POR_DIA = 12;
const CAPACIDAD_SALA = 2;
const PASO_TIEMPO_DEFAULT = 5;
const STORAGE_KEY = 'triage_digital_state_v5';

const PREGUNTAS = [
    "Presenta paro cardiaco, paro respiratorio, shock, sangrado grave o trauma severo?",
    "Presenta trauma moderado, alteracion de conciencia, asfixia, quemadura leve, sangrado moderado o intoxicacion?",
    "Presenta trauma leve sin compromiso de conciencia, infeccion, dolor agudo, deshidratacion, fractura, luxacion o fiebre en menor de 2 anos?",
    "Presenta diarrea, dolor al orinar, alergia, dolor de mas de 24 horas o fiebre en mayor de 2 anos?",
    "Presenta dolor o golpe de mas de 3 dias, dolor de garganta o enfermedad de piel, pelo o unas?"
];

const TIPO_URGENCIA = ["Resucitación", "Emergencia", "Urgencia", "Urgencia menor", "Sin urgencia"];
const COLOR_NIVEL = ["Rojo", "Naranja", "Amarillo", "Verde", "Azul"];
const TIEMPO_TEXTO = ["Atención inmediata", "10-15 minutos", "60 minutos", "120 minutos", "240 minutos"];
const HEX_COLORES = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

const defaultSalas = [
    { id: 0, tipo: 0, ocupacion: 0, slots: [null, null], actual: null },
    { id: 1, tipo: 0, ocupacion: 0, slots: [null, null], actual: null },
    { id: 2, tipo: 1, ocupacion: 0, slots: [null, null], actual: null },
    { id: 3, tipo: 1, ocupacion: 0, slots: [null, null], actual: null },
    { id: 4, tipo: 2, ocupacion: 0, slots: [null, null], actual: null }
];

const getInitialState = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.error("Error loading state from localStorage", e);
    }
    return null;
};

export const TriageProvider = ({ children }) => {
    const savedState = getInitialState();

    const [diaActual, setDiaActual] = useState(savedState?.diaActual ?? 1);
    const [minutoActual, setMinutoActual] = useState(savedState?.minutoActual ?? 0);
    const [pacientes, setPacientes] = useState(savedState?.pacientes ?? []);
    const [eventLog, setEventLog] = useState(savedState?.eventLog ?? []);
    const [salas, setSalas] = useState(savedState?.salas ?? defaultSalas);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ diaActual, minutoActual, pacientes, eventLog, salas }));
    }, [diaActual, minutoActual, pacientes, eventLog, salas]);

    // ─── Internal helpers that receive current state as arguments ────────────

    const _addLog = (logList, msg, min = minutoActual) => [{ msg, time: min }, ...logList];

    const _determineTipoSala = (nivel) => nivel <= 1 ? 0 : 1;

    const _iniciarAtencion = (sId, pId, pacs, sals, duracion) => {
        sals[sId].actual = pId;
        pacs[pId].estado = 1;
        if (pacs[pId].finAtencion === null || pacs[pId].finAtencion === undefined) {
            pacs[pId].finAtencion = duracion;
        }
    };

    const _ocuparSlot = (pId, sId, pacs, sals) => {
        const slotIdx = sals[sId].slots.findIndex(s => s === null);
        if (slotIdx === -1) return;
        sals[sId].slots[slotIdx] = pId;
        sals[sId].ocupacion++;
        pacs[pId].sala = sId;
        pacs[pId].slot = slotIdx;
        if (sals[sId].actual === null) {
            _iniciarAtencion(sId, pId, pacs, sals, pacs[pId].duracion);
        } else {
            pacs[pId].estado = 0;
        }
    };

    // ─── Avanzar tiempo ──────────────────────────────────────────────────────

    const avanzarTiempo = () => {
        let pacs = pacientes.map(p => ({ ...p }));
        let sals = salas.map(s => ({ ...s, slots: [...s.slots] }));
        let logs = [...eventLog];
        let cupoLiberado = false;
        
        const nuevoMinuto = minutoActual + PASO_TIEMPO_DEFAULT;
        setMinutoActual(nuevoMinuto);

        sals.forEach(sala => {
            if (sala.actual === null) return;
            const pId = sala.actual;
            const p = pacs[pId];

            // Decrease remaining steps
            p.finAtencion = (p.finAtencion ?? p.duracion) - PASO_TIEMPO_DEFAULT;

            if (p.finAtencion <= 0) {
                // Finalizar atención
                const slotAnterior = p.slot;

                if (p.trasladoQuirofano) {
                    logs = _addLog(logs, `Sala ${sala.id + 1}: ${p.nombre} atendido — internado.`);
                    p.estado = 3;
                    p.trasladoQuirofano = false;
                } else {
                    logs = _addLog(logs, `Sala ${sala.id + 1}: ${p.nombre} finalizó atención.`);
                    p.estado = 2;
                }

                // Liberar slot y sala
                sala.slots[slotAnterior] = null;
                sala.ocupacion = Math.max(0, sala.ocupacion - 1);
                p.sala = null;
                p.slot = null;
                sala.actual = null;
                cupoLiberado = true;

                // Promover compañero en espera (solo estado 0 genuino)
                const sigSlotIdx = sala.slots.findIndex(sid => sid !== null && pacs[sid] && pacs[sid].estado === 0 && pacs[sid].sala === sala.id);
                if (sigSlotIdx !== -1) {
                    const siguienteId = sala.slots[sigSlotIdx];
                    const fuePausado = pacs[siguienteId].finAtencion !== null && pacs[siguienteId].finAtencion !== undefined;
                    _iniciarAtencion(sala.id, siguienteId, pacs, sals, pacs[siguienteId].duracion);
                    if (fuePausado) {
                        logs = _addLog(logs, `Sala ${sala.id + 1}: ${pacs[siguienteId].nombre} reanuda su atención (${pacs[siguienteId].finAtencion} min restantes).`);
                    } else {
                        logs = _addLog(logs, `Sala ${sala.id + 1}: ${pacs[siguienteId].nombre} pasa a ser atendido.`);
                    }
                    cupoLiberado = false;
                }
            }
        });

        // Asignar pacientes pendientes si hubo cupo (solo los que están en espera sin sala)
        if (cupoLiberado) {
            for (let nivel = 0; nivel <= 4; nivel++) {
                pacs.forEach(p => {
                    // Guardia estricta: solo estado=0 (espera), sin sala asignada y no trasladados/atendidos
                    if (p.nivel === nivel && p.estado === 0 && p.sala === null && !p.trasladoQuirofano) {
                        const reqTipo = _determineTipoSala(p.nivel);
                        let salaAsignada = sals.find(s => s.ocupacion === 0);
                        if (salaAsignada) {
                            sals[salaAsignada.id].tipo = reqTipo;
                            _ocuparSlot(p.id, salaAsignada.id, pacs, sals);
                            if (pacs[p.id].estado === 1)
                                logs = _addLog(logs, `Sala ${salaAsignada.id + 1}: ${p.nombre} pasa a ser atendido.`);
                        } else {
                            salaAsignada = sals.find(s => s.tipo === reqTipo && s.ocupacion < CAPACIDAD_SALA);
                            if (salaAsignada) {
                                _ocuparSlot(p.id, salaAsignada.id, pacs, sals);
                                if (pacs[p.id].estado === 1)
                                    logs = _addLog(logs, `Sala ${salaAsignada.id + 1}: ${p.nombre} pasa a ser atendido.`);
                            }
                        }
                    }
                });
            }
        }

        setPacientes(pacs);
        setSalas(sals);
        setEventLog(logs);
    };

    // ─── Registrar paciente ──────────────────────────────────────────────────

    const registrarPaciente = (nombre, nhc, nivel) => {
        const pacientesHoy = pacientes.filter(p => p.dia === diaActual);
        if (pacientesHoy.length >= MAX_PACIENTES_POR_DIA) {
            alert(`Límite diario de ${MAX_PACIENTES_POR_DIA} pacientes alcanzado.`);
            return null;
        }

        if (pacientesHoy.some(p => p.nhc.trim() === nhc.trim())) {
            alert(`El NHC "${nhc}" ya fue registrado el día de hoy.`);
            return null;
        }

        if (pacientesHoy.some(p => p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase())) {
            alert(`El paciente "${nombre}" ya fue registrado el día de hoy.`);
            return null;
        }

        const nuevoPaciente = {
            id: pacientes.length,
            nombre,
            nhc,
            nivel,
            dia: diaActual,
            estado: 0,
            sala: null,
            slot: null,
            duracion: nivel === 0 ? 10 : 15 + Math.floor(Math.random() * 45),
            finAtencion: null,
            trasladoQuirofano: nivel === 0,
        };

        let pacs = [...pacientes.map(p => ({ ...p })), { ...nuevoPaciente }];
        let sals = salas.map(s => ({ ...s, slots: [...s.slots] }));
        let logs = [...eventLog];

        if (nivel === 0) {
            let salaElegida = sals.find(s => s.ocupacion === 0 && s.tipo === 0) 
                           || sals.find(s => s.ocupacion < CAPACIDAD_SALA && s.tipo === 0)
                           || sals.find(s => s.tipo === 0)
                           || sals[0];
                           
            salaElegida.tipo = 0;
            const vicId = salaElegida.actual;
            const slotLibre = salaElegida.slots.findIndex(x => x === null);
            
            if (vicId !== null) {
                pacs[vicId].estado = 0;
                logs = _addLog(logs, `Sala ${salaElegida.id + 1}: Atención de ${pacs[vicId].nombre} pausada por Resucitación.`);
            }
            
            let targetSlot = slotLibre;
            
            if (slotLibre === -1) {
                // Sala llena: expulsar al paciente en espera (no el que está siendo atendido)
                const waitingSlotIdx = salaElegida.slots.findIndex(sid => sid !== null && sid !== vicId);
                const expulsadoId = salaElegida.slots[waitingSlotIdx];
                pacs[expulsadoId].sala = null;
                pacs[expulsadoId].slot = null;
                salaElegida.ocupacion--;
                targetSlot = waitingSlotIdx;
                logs = _addLog(logs, `Sala ${salaElegida.id + 1}: ${pacs[expulsadoId].nombre} devuelto a espera general por falta de cupo.`);
            }
            
            // FIX: asignar slot en el array pacs (no en nuevoPaciente que ya fue copiado)
            salaElegida.slots[targetSlot] = nuevoPaciente.id;
            if (slotLibre !== -1) salaElegida.ocupacion++;
            pacs[nuevoPaciente.id].sala = salaElegida.id;
            pacs[nuevoPaciente.id].slot = targetSlot;
            pacs[nuevoPaciente.id].duracion = 5;
            
            _iniciarAtencion(salaElegida.id, nuevoPaciente.id, pacs, sals, 5);
            logs = _addLog(logs, `Sala ${salaElegida.id + 1}: ${nombre} (Resucitación) pasa a atención inmediata.`);
        } else {
            const reqTipo = _determineTipoSala(nivel);
            let salaAsignada = sals.find(s => s.ocupacion === 0);
            if (salaAsignada) {
                sals[salaAsignada.id].tipo = reqTipo;
                _ocuparSlot(nuevoPaciente.id, salaAsignada.id, pacs, sals);
                if (pacs[nuevoPaciente.id].estado === 1)
                    logs = _addLog(logs, `Sala ${salaAsignada.id + 1}: ${nombre} pasa a ser atendido.`);
                else
                    logs = _addLog(logs, `Sala ${salaAsignada.id + 1}: ${nombre} en espera dentro de la sala.`);
            } else {
                salaAsignada = sals.find(s => s.tipo === reqTipo && s.ocupacion < CAPACIDAD_SALA);
                if (salaAsignada) {
                    _ocuparSlot(nuevoPaciente.id, salaAsignada.id, pacs, sals);
                    if (pacs[nuevoPaciente.id].estado === 1)
                        logs = _addLog(logs, `Sala ${salaAsignada.id + 1}: ${nombre} pasa a ser atendido.`);
                    else
                        logs = _addLog(logs, `Sala ${salaAsignada.id + 1}: ${nombre} en espera dentro de la sala.`);
                } else {
                    logs = _addLog(logs, `${nombre} en espera: sin cupo físico disponible.`);
                }
            }
        }

        setPacientes(pacs);
        setSalas(sals);
        setEventLog(logs);
        return nuevoPaciente;
    };

    // ─── Liberar paciente manualmente ────────────────────────────────────────

    const liberarPaciente = (pId) => {
        let pacs = pacientes.map(p => ({ ...p }));
        let sals = salas.map(s => ({ ...s, slots: [...s.slots] }));
        let logs = [...eventLog];
        const p = pacs[pId];
        if (!p) return;

        if (p.estado === 1 || p.estado === 0) {
            const sId = p.sala;
            if (sId !== null && sId !== undefined) {
                const sala = sals[sId];
                sala.slots[p.slot] = null;
                sala.ocupacion = Math.max(0, sala.ocupacion - 1);
                if (sala.actual === pId) sala.actual = null;

                // Promover compañero
                const sigSlotIdx = sala.slots.findIndex(sid => sid !== null && pacs[sid].estado === 0);
                if (sigSlotIdx !== -1) {
                    _iniciarAtencion(sId, sala.slots[sigSlotIdx], pacs, sals, pacs[sala.slots[sigSlotIdx]].duracion);
                    logs = _addLog(logs, `Sala ${sId + 1}: ${pacs[sala.slots[sigSlotIdx]].nombre} pasa a ser atendido.`);
                }
            }
            p.sala = null;
            p.slot = null;
            p.estado = 2;
            logs = _addLog(logs, `${p.nombre} fue liberado manualmente.`);
        } else {
            alert("El paciente ya fue atendido o está internado.");
            return;
        }

        setPacientes(pacs);
        setSalas(sals);
        setEventLog(logs);
    };

    // ─── Finalizar día ───────────────────────────────────────────────────────

    const finalizarDia = () => {
        setEventLog(prev => _addLog(prev, `Día ${diaActual} finalizado.`));
        setDiaActual(prev => prev + 1);
    };

    // ─── Reiniciar simulación ────────────────────────────────────────────────

    const resetSimulacion = () => {
        if (window.confirm("¿Reiniciar toda la simulación? Se perderán todos los datos.")) {
            localStorage.removeItem(STORAGE_KEY);
            setDiaActual(1);
            setMinutoActual(0);
            setPacientes([]);
            setEventLog([]);
            setSalas(defaultSalas.map(s => ({ ...s, slots: [null, null] })));
        }
    };

    return (
        <TriageContext.Provider value={{
            diaActual, setDiaActual, minutoActual,
            pacientes,
            salas,
            eventLog,
            avanzarTiempo,
            registrarPaciente,
            liberarPaciente,
            finalizarDia,
            resetSimulacion,
            PREGUNTAS,
            TIPO_URGENCIA,
            COLOR_NIVEL,
            TIEMPO_TEXTO,
            HEX_COLORES
        }}>
            {children}
        </TriageContext.Provider>
    );
};

export const useTriage = () => useContext(TriageContext);
