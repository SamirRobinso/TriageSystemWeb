import { createContext, useContext, useState, useEffect } from 'react';

const TriageContext = createContext();

// Constants
const MAX_PACIENTES_POR_DIA = 12;
const CAPACIDAD_SALA = 2;
const PASO_TIEMPO_DEFAULT = 5;
const STORAGE_KEY = 'triage_digital_state_v3';

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
    const [pacientes, setPacientes] = useState(savedState?.pacientes ?? []);
    const [eventLog, setEventLog] = useState(savedState?.eventLog ?? []);
    const [salas, setSalas] = useState(savedState?.salas ?? defaultSalas);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ diaActual, pacientes, eventLog, salas }));
    }, [diaActual, pacientes, eventLog, salas]);

    // ─── Internal helpers that receive current state as arguments ────────────

    const _addLog = (logList, msg) => [{ msg }, ...logList];

    const _determineTipoSala = (nivel) => nivel <= 1 ? 0 : 1;

    const _iniciarAtencion = (sId, pId, pacs, sals, duracion) => {
        sals[sId].actual = pId;
        pacs[pId].estado = 1;
        pacs[pId].finAtencion = duracion;   // steps remaining
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

        sals.forEach(sala => {
            if (sala.actual === null) return;
            const pId = sala.actual;
            const p = pacs[pId];

            // Decrease remaining steps
            p.finAtencion = (p.finAtencion ?? p.duracion) - PASO_TIEMPO_DEFAULT;

            if (p.finAtencion <= 0) {
                // Finalizar atención
                logs = _addLog(logs, `Sala ${sala.id + 1}: ${p.nombre} finalizó atención.`);

                if (p.trasladoQuirofano) {
                    logs = _addLog(logs, `${p.nombre} trasladado a quirófano.`);
                    p.estado = 3;
                    p.trasladoQuirofano = false;
                } else {
                    p.estado = 2;
                }

                sala.slots[p.slot] = null;
                sala.ocupacion = Math.max(0, sala.ocupacion - 1);
                p.sala = null;
                p.slot = null;
                sala.actual = null;
                cupoLiberado = true;

                // Promover compañero en espera
                const sigSlotIdx = sala.slots.findIndex(sid => sid !== null && pacs[sid].estado === 0);
                if (sigSlotIdx !== -1) {
                    _iniciarAtencion(sala.id, sala.slots[sigSlotIdx], pacs, sals, pacs[sala.slots[sigSlotIdx]].duracion);
                    logs = _addLog(logs, `Sala ${sala.id + 1}: ${pacs[sala.slots[sigSlotIdx]].nombre} pasa a ser atendido.`);
                    cupoLiberado = false;
                }
            }
        });

        // Asignar pacientes pendientes si hubo cupo
        if (cupoLiberado) {
            for (let nivel = 0; nivel <= 4; nivel++) {
                pacs.forEach(p => {
                    if (p.nivel === nivel && p.estado === 0 && p.sala === null) {
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

    const registrarPaciente = (nombre, nivel) => {
        const pacientesHoy = pacientes.filter(p => p.dia === diaActual);
        if (pacientesHoy.length >= MAX_PACIENTES_POR_DIA) {
            alert(`Límite diario de ${MAX_PACIENTES_POR_DIA} pacientes alcanzado.`);
            return null;
        }

        if (pacientesHoy.some(p => p.nombre.toLowerCase().trim() === nombre.toLowerCase().trim())) {
            alert(`El paciente "${nombre}" ya fue registrado el día de hoy.`);
            return null;
        }

        const nuevoPaciente = {
            id: pacientes.length,
            nombre,
            nivel,
            dia: diaActual,
            estado: 0,
            sala: null,
            slot: null,
            duracion: nivel === 0 ? 5 : 15 + Math.floor(Math.random() * 45),
            finAtencion: null,
            trasladoQuirofano: nivel === 0,
        };

        let pacs = [...pacientes.map(p => ({ ...p })), { ...nuevoPaciente }];
        let sals = salas.map(s => ({ ...s, slots: [...s.slots] }));
        let logs = [...eventLog];

        if (nivel === 0) {
            // Resucitación: buscar sala de emergencia con cupo, o libre, o preempcionar
            let salaAsignada = sals.find(s => s.tipo === 0 && s.ocupacion < CAPACIDAD_SALA)
                || sals.find(s => s.ocupacion === 0);
            if (salaAsignada) {
                sals[salaAsignada.id].tipo = 0;
                _ocuparSlot(nuevoPaciente.id, salaAsignada.id, pacs, sals);
                logs = _addLog(logs, `Sala ${salaAsignada.id + 1}: ${nombre} (Resucitación) pasa a atención inmediata.`);
            } else {
                // Preempcionar
                let salaPreemp = sals.find(s => s.actual !== null && s.tipo === 0) || sals.find(s => s.actual !== null);
                if (salaPreemp) {
                    const vicId = salaPreemp.actual;
                    logs = _addLog(logs, `Sala ${salaPreemp.id + 1}: ${pacs[vicId].nombre} desplazado por ${nombre} (Resucitación).`);
                    pacs[vicId].estado = 0;
                    sals[salaPreemp.id].slots[pacs[vicId].slot] = null;
                    sals[salaPreemp.id].ocupacion--;
                    pacs[vicId].sala = null;
                    pacs[vicId].slot = null;
                    sals[salaPreemp.id].actual = null;
                    sals[salaPreemp.id].tipo = 0;
                    _ocuparSlot(nuevoPaciente.id, salaPreemp.id, pacs, sals);
                    logs = _addLog(logs, `Sala ${salaPreemp.id + 1}: ${nombre} (Resucitación) pasa a atención inmediata.`);
                } else {
                    logs = _addLog(logs, `${nombre} (Resucitación) en espera: sin cupo disponible.`);
                }
            }
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
            alert("El paciente ya fue atendido o trasladado.");
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
            setPacientes([]);
            setEventLog([]);
            setSalas(defaultSalas.map(s => ({ ...s, slots: [null, null] })));
        }
    };

    return (
        <TriageContext.Provider value={{
            diaActual,
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
