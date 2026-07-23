import React, { createContext, useContext, useState, useEffect } from 'react';

const TriageContext = createContext();

// Constants
const MAX_PACIENTES_POR_DIA = 12;
const CANTIDAD_SALAS = 5;
const CAPACIDAD_SALA = 2;
const PASO_TIEMPO_DEFAULT = 5;
const STORAGE_KEY = 'triage_digital_state_v2';

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

export const TriageProvider = ({ children }) => {
    // Helper to get initial state from localStorage
    const getInitialState = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Error loading state from localStorage", e);
        }
        return null;
    };

    const savedState = getInitialState();

    const [tiempoAbsoluto, setTiempoAbsoluto] = useState(savedState?.tiempoAbsoluto ?? 0);
    const [contadorGlobal, setContadorGlobal] = useState(savedState?.contadorGlobal ?? 0);
    const [diaActual, setDiaActual] = useState(savedState?.diaActual ?? 1);
    const [pacientes, setPacientes] = useState(savedState?.pacientes ?? []);
    const [eventLog, setEventLog] = useState(savedState?.eventLog ?? []);
    const [salas, setSalas] = useState(savedState?.salas ?? defaultSalas);

    // Persist to localStorage whenever state changes
    useEffect(() => {
        const stateToSave = {
            tiempoAbsoluto,
            contadorGlobal,
            diaActual,
            pacientes,
            eventLog,
            salas
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [tiempoAbsoluto, contadorGlobal, diaActual, pacientes, eventLog, salas]);

    const addLog = (msg) => {
        setEventLog(prev => [{ time: tiempoAbsoluto, msg }, ...prev]);
    };

    const resetSimulacion = () => {
        if (window.confirm("¿Seguro que deseas reiniciar toda la simulación? Se borrarán los datos de pacientes y tiempo.")) {
            localStorage.removeItem(STORAGE_KEY);
            setTiempoAbsoluto(0);
            setContadorGlobal(0);
            setDiaActual(1);
            setPacientes([]);
            setEventLog([]);
            setSalas(defaultSalas);
        }
    };

    const determineTipoSalaRequerido = (nivel) => (nivel <= 1 ? 0 : 1);

    const registrarPaciente = (nombre, nivel) => {
        const pacientesHoy = pacientes.filter(p => p.dia === diaActual);
        if (pacientesHoy.length >= MAX_PACIENTES_POR_DIA) {
            alert(`Límite diario de ${MAX_PACIENTES_POR_DIA} pacientes alcanzado.`);
            return null;
        }

        const nuevoPaciente = {
            id: pacientes.length,
            nombre,
            nivel,
            dia: diaActual,
            tiempoRegistro: tiempoAbsoluto,
            estado: 0,
            sala: null,
            slot: null,
            duracion: nivel === 0 ? 5 : 15 + Math.floor(Math.random() * 45),
            inicioAtencion: null,
            finAtencion: null,
            trasladoQuirofano: nivel === 0,
        };

        let updatedPacientes = [...pacientes, nuevoPaciente];
        let updatedSalas = [...salas];
        
        if (nivel === 0) {
            let salaAsignada = updatedSalas.find(s => s.tipo === 0 && s.ocupacion < CAPACIDAD_SALA) || updatedSalas.find(s => s.ocupacion === 0);
            
            if (salaAsignada) {
                const sIdx = salaAsignada.id;
                updatedSalas[sIdx].tipo = 0;
                ocuparSlot(nuevoPaciente.id, sIdx, updatedPacientes, updatedSalas);
            } else {
                let salaPreemp = updatedSalas.find(s => s.actual !== null && s.tipo === 0) || updatedSalas.find(s => s.actual !== null);
                if (salaPreemp) {
                    const victimaId = salaPreemp.actual;
                    updatedPacientes[victimaId].estado = 0;
                    addLog(`${updatedPacientes[victimaId].nombre} desplazado a espera por ${nombre} (Resucitación).`);
                    
                    const slotV = updatedPacientes[victimaId].slot;
                    updatedSalas[salaPreemp.id].slots[slotV] = null;
                    updatedSalas[salaPreemp.id].ocupacion--;
                    updatedPacientes[victimaId].sala = null;
                    updatedPacientes[victimaId].slot = null;
                    updatedSalas[salaPreemp.id].actual = null;
                    
                    updatedSalas[salaPreemp.id].tipo = 0;
                    ocuparSlot(nuevoPaciente.id, salaPreemp.id, updatedPacientes, updatedSalas);
                } else {
                    addLog(`${nombre} (Resucitación) en espera (sin cupo).`);
                }
            }
        } else {
            const reqTipo = determineTipoSalaRequerido(nivel);
            let salaAsignada = updatedSalas.find(s => s.ocupacion === 0);
            if (salaAsignada) {
                updatedSalas[salaAsignada.id].tipo = reqTipo;
            } else {
                salaAsignada = updatedSalas.find(s => s.tipo === reqTipo && s.ocupacion < CAPACIDAD_SALA);
            }
            
            if (salaAsignada) {
                ocuparSlot(nuevoPaciente.id, salaAsignada.id, updatedPacientes, updatedSalas);
            }
        }

        setPacientes(updatedPacientes);
        setSalas(updatedSalas);
        return nuevoPaciente;
    };

    const ocuparSlot = (pId, sId, currentPacientes, currentSalas) => {
        const slotIdx = currentSalas[sId].slots.findIndex(s => s === null);
        if (slotIdx !== -1) {
            currentSalas[sId].slots[slotIdx] = pId;
            currentSalas[sId].ocupacion++;
            currentPacientes[pId].sala = sId;
            currentPacientes[pId].slot = slotIdx;
            
            if (currentSalas[sId].actual === null) {
                iniciarAtencion(sId, pId, currentPacientes, currentSalas);
            } else {
                currentPacientes[pId].estado = 0;
            }
        }
    };

    const iniciarAtencion = (sId, pId, currentPacientes, currentSalas) => {
        currentSalas[sId].actual = pId;
        currentPacientes[pId].estado = 1;
        currentPacientes[pId].inicioAtencion = tiempoAbsoluto;
        currentPacientes[pId].finAtencion = tiempoAbsoluto + currentPacientes[pId].duracion;
        addLog(`En sala ${sId + 1}, ${currentPacientes[pId].nombre} pasa a ser atendido.`);
    };

    const avanzarTiempo = () => {
        const nuevoTiempo = tiempoAbsoluto + PASO_TIEMPO_DEFAULT;
        const nuevoContadorDia = contadorGlobal + PASO_TIEMPO_DEFAULT;

        let updatedPacientes = [...pacientes];
        let updatedSalas = [...salas];
        let cupoLiberado = false;

        updatedSalas.forEach(sala => {
            if (sala.actual !== null) {
                const pId = sala.actual;
                if (nuevoTiempo >= updatedPacientes[pId].finAtencion) {
                    const p = updatedPacientes[pId];
                    const espera = Math.max(0, p.inicioAtencion - p.tiempoRegistro);
                    addLog(`En sala ${sala.id + 1}, ${p.nombre} fue atendido (${espera}m espera, ${p.duracion}m atención).`);
                    
                    if (p.trasladoQuirofano) {
                        addLog(`${p.nombre} trasladado a quirófano.`);
                        p.estado = 3;
                        p.trasladoQuirofano = false;
                    } else {
                        p.estado = 2;
                    }
                    
                    sala.slots[p.slot] = null;
                    sala.ocupacion--;
                    p.sala = null;
                    p.slot = null;
                    sala.actual = null;
                    cupoLiberado = true;

                    const sigSlot = sala.slots.findIndex(sid => sid !== null && updatedPacientes[sid].estado === 0);
                    if (sigSlot !== -1) {
                        iniciarAtencion(sala.id, sala.slots[sigSlot], updatedPacientes, updatedSalas);
                        cupoLiberado = false;
                    }
                }
            }
        });

        if (cupoLiberado) {
            for (let nivelBuscado = 0; nivelBuscado <= 4; nivelBuscado++) {
                updatedPacientes.forEach(p => {
                    if (p.nivel === nivelBuscado && p.estado === 0 && p.sala === null) {
                        const reqTipo = determineTipoSalaRequerido(p.nivel);
                        let salaAsignada = updatedSalas.find(s => s.ocupacion === 0);
                        if (salaAsignada) {
                            updatedSalas[salaAsignada.id].tipo = reqTipo;
                            ocuparSlot(p.id, salaAsignada.id, updatedPacientes, updatedSalas);
                        } else {
                            salaAsignada = updatedSalas.find(s => s.tipo === reqTipo && s.ocupacion < CAPACIDAD_SALA);
                            if (salaAsignada) ocuparSlot(p.id, salaAsignada.id, updatedPacientes, updatedSalas);
                        }
                    }
                });
            }
        }

        setPacientes(updatedPacientes);
        setSalas(updatedSalas);
        setTiempoAbsoluto(nuevoTiempo);
        setContadorGlobal(nuevoContadorDia);
    };

    const [isRunning, setIsRunning] = useState(false);
    const [speed, setSpeed] = useState(2000); // 2s per 5 min step

    // Auto timer effect
    useEffect(() => {
        let interval = null;
        if (isRunning) {
            interval = setInterval(() => {
                avanzarTiempo();
            }, speed);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, speed, tiempoAbsoluto, pacientes, salas]);

    const toggleRunning = () => setIsRunning(prev => !prev);

    const liberarPaciente = (pId) => {
        let updatedPacientes = [...pacientes];
        let updatedSalas = [...salas];
        const p = updatedPacientes[pId];

        if (!p) return;

        if (p.estado === 1) { // Being attended
            const sId = p.sala;
            if (sId !== null && sId !== undefined) {
                const sala = updatedSalas[sId];
                sala.slots[p.slot] = null;
                sala.ocupacion = Math.max(0, sala.ocupacion - 1);
                if (sala.actual === pId) sala.actual = null;
                p.sala = null;
                p.slot = null;
                p.estado = 2; // Atendido
                addLog(`Paciente ${p.nombre} fue liberado manualmente de la Sala ${sId + 1}.`);

                // Promote waiting
                const sigSlot = sala.slots.findIndex(sid => sid !== null && updatedPacientes[sid].estado === 0);
                if (sigSlot !== -1) {
                    iniciarAtencion(sId, sala.slots[sigSlot], updatedPacientes, updatedSalas);
                }
            }
        } else if (p.estado === 0) { // Waiting
            if (p.sala !== null && p.sala !== undefined) {
                const sId = p.sala;
                const sala = updatedSalas[sId];
                sala.slots[p.slot] = null;
                sala.ocupacion = Math.max(0, sala.ocupacion - 1);
                p.sala = null;
                p.slot = null;
            }
            p.estado = 2; // Atendido (liberación administrativa)
            addLog(`Paciente ${p.nombre} fue liberado manualmente (excepción administrativa).`);
        } else {
            alert("El paciente no se encuentra en estado de espera ni de atención.");
            return;
        }

        setPacientes(updatedPacientes);
        setSalas(updatedSalas);
    };

    const finalizarDia = () => {
        addLog(`Día ${diaActual} finalizado. Reloj del día reiniciado a 0 min.`);
        setDiaActual(prev => prev + 1);
        setContadorGlobal(0);
    };

    return (
        <TriageContext.Provider value={{
            tiempoAbsoluto,
            contadorGlobal,
            diaActual,
            pacientes,
            salas,
            eventLog,
            isRunning,
            toggleRunning,
            speed,
            setSpeed,
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
