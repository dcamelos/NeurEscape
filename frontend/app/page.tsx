"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

const LEVELS = [
  {
    id: "level_01",
    title: "El caso de la memoria perdida",
    subtitle: "Sala de Urgencias – Síndrome Neurológico Desconocido",
    tag: "Introductorio",
    tagColor: "text-emerald-400 bg-emerald-950/30 border-emerald-800/60",
    regions: 5,
    symptoms: 8,
    duration: "10 min",
    available: true,
  },
  {
    id: "level_02",
    title: "Neurotransmisores y función",
    subtitle: "Laboratorio de Neurociencia Molecular",
    tag: "Intermedio",
    tagColor: "text-amber-400 bg-amber-950/30 border-amber-800/60",
    regions: 6,
    symptoms: 10,
    duration: "12 min",
    available: false,
  },
  {
    id: "level_03",
    title: "Rutas neuronales",
    subtitle: "Simulador de Procesamiento Neural",
    tag: "Avanzado",
    tagColor: "text-rose-400 bg-rose-950/30 border-rose-800/60",
    regions: 7,
    symptoms: 12,
    duration: "15 min",
    available: false,
  },
];

export default function Home() {
  const [glitchTitle, setGlitchTitle] = useState("NeurEscape");
  const casesSectionRef = useRef<HTMLDivElement>(null);

  // Efecto de Glitch sutil en el título de la terminal
  useEffect(() => {
    const chars = "NEURESCAPEX01_";
    const interval = setInterval(() => {
      setGlitchTitle((prev) =>
        prev
          .split("")
          .map((char, index) => {
            if (Math.random() < 0.04) {
              return chars[Math.floor(Math.random() * chars.length)];
            }
            return "NeurEscape"[index];
          })
          .join("")
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const scrollToCases = () => {
    casesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="relative min-h-screen bg-[#05080c] text-slate-200 font-sans overflow-x-hidden snap-y snap-mandatory select-none">
      
      {/* CAPA GLOBAL: EFECTO LÍNEAS DE BARRIDO CRT & REJILLA */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0.003)_50%,rgba(0,0,0,0.08)_50%)] bg-[length:100%_4px] z-50" />
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] bg-[linear-gradient(to_right,#1e3a5f_1px,transparent_1px),linear-gradient(to_bottom,#1e3a5f_1px,transparent_1px)] bg-[length:40px_40px] z-50" />

      {/* ========================================================================= */}
      {/* SECTION 1: PANTALLA DE BIENVENIDA (HERO)                                  */}
      {/* ========================================================================= */}
      <section className="h-screen w-full flex flex-col justify-center items-center relative p-6 snap-start">
        {/* Iluminación de fondo ambiental */}
        <div className="absolute w-[600px] h-[250px] bg-blue-500/10 blur-[140px] rounded-full top-1/3 left-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="text-center z-10 max-w-2xl flex flex-col items-center">
          {/* Tag de estado del sistema */}
          <div className="mb-4 text-[10px] font-mono tracking-[0.3em] text-blue-400 bg-blue-950/30 border border-blue-900/50 px-3 py-1 rounded-full animate-pulse">
            SYSTEM STATUS: READY FOR DIAGNOSTIC
          </div>

          {/* TÍTULO GRANDE */}
          <h1 className="text-7xl md:text-8xl font-mono tracking-widest font-extrabold drop-shadow-[0_0_35px_rgba(59,130,246,0.2)]">
            <span className="text-slate-100">{glitchTitle.slice(0, 4)}</span>
            <span className="text-blue-500 text-shadow-glow">{glitchTitle.slice(4)}</span>
          </h1>

          {/* Subtítulo explicativo */}
          <p className="mt-6 text-sm md:text-base text-slate-400 font-mono max-w-lg leading-relaxed">
            Escape room digital para la comprensión de procesos neurocientíficos. 
            Diagnostica el caso clínico antes de que falle el sistema.
          </p>

          {/* BOTÓN COMENZAR */}
          <button
            onClick={scrollToCases}
            className="mt-12 group relative bg-transparent border border-blue-500/60 text-blue-400 hover:text-white px-10 py-4 font-mono text-sm tracking-[0.2em] uppercase rounded-lg transition-all duration-300 overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:shadow-[0_0_35px_rgba(59,130,246,0.35)]"
          >
            {/* Efecto de llenado de fondo en Hover */}
            <span className="absolute inset-0 w-full h-full bg-blue-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0" />
            
            <span className="relative z-10 flex items-center gap-3">
              Comenzar
              <span className="transform group-hover:translate-x-1 transition-transform duration-200">↓</span>
            </span>
          </button>
        </div>

        {/* Indicador visual inferior para hacer scroll */}
        <div className="absolute bottom-8 font-mono text-[10px] text-slate-600 animate-bounce cursor-pointer" onClick={scrollToCases}>
          DESPLAZAR PARA VER CASOS CLÍNICOS
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: CASOS Y SELECCIÓN DE NIVEL (HORIZONTAL GRID)                   */}
      {/* ========================================================================= */}
      <section 
        ref={casesSectionRef}
        className="h-screen w-full flex flex-col justify-between items-center relative p-6 md:p-12 snap-start border-t border-slate-900 bg-[#06090e]"
      >
        {/* Luces sutiles en las esquinas */}
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-900/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-slate-900/40 blur-[120px] rounded-full pointer-events-none" />

        {/* Cabecera corta de la sección */}
        <div className="text-center mt-4 z-10 select-none">
          <h2 className="text-xs uppercase font-mono tracking-[0.4em] text-slate-500">
            Módulos de simulación disponibles
          </h2>
          <p className="text-[10px] font-mono text-blue-500/70 mt-1 uppercase tracking-wider">
            Examine y despliegue los casos clínicos activos
          </p>
          <div className="w-12 h-[1px] bg-blue-500/30 mx-auto mt-2" />
        </div>

        {/* CONTENEDOR ESTILO ACORDEÓN EXPANSIVO CON TEXTO HORIZONTAL */}
        <div className="w-full max-w-6xl h-[450px] my-auto z-10 flex gap-4 items-stretch px-4 md:px-8 overflow-hidden">
          {LEVELS.map((level, index) => (
            <div
              key={level.id}
              className={`relative flex flex-col justify-between p-6 rounded-xl border transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden h-full ${
                level.available
                  ? "border-slate-800/80 bg-[#0a0e16]/90 hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.12)] flex-[1] hover:flex-[3.5]"
                  : "border-slate-900/60 bg-[#080b11]/50 opacity-40 cursor-not-allowed flex-[0.7]"
              } group`}
            >
              {/* Línea decorativa superior brillante en hover */}
              {level.available && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center rounded-t-xl" />
              )}

              {/* CONTENIDO SUPERIOR (Siempre horizontal y alineado) */}
              <div className="w-full">
                {/* 1. Indicador de Nivel e ID */}
                <div className="flex justify-between items-center w-full mb-3 font-mono text-[10px]">
                  <span className={`tracking-wider uppercase font-bold px-2 py-0.5 rounded border transition-colors duration-300 ${level.tagColor}`}>
                    {level.tag}
                  </span>
                  <span className="text-slate-600 group-hover:text-blue-500/70 transition-colors">
                    ID-0{index + 1}
                  </span>
                </div>

                {/* 2. Título Horizontal (Se adapta al tamaño de la tarjeta) */}
                <h3 className="text-lg md:text-xl font-bold tracking-tight text-slate-200 transition-all duration-300 group-hover:text-white group-hover:text-2xl truncate whitespace-nowrap">
                  {level.title}
                </h3>

                {/* 3. Subtítulo Clínico (Oculto cuando está colapsado, entra suave al expandirse) */}
                <p className="text-xs text-slate-400 font-mono mt-3 leading-relaxed max-w-md opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-[80px] transition-all duration-300 delay-100 overflow-hidden">
                  {level.subtitle}
                </p>
              </div>

              {/* CONTENIDO INFERIOR (Métricas y Botón - Se revelan en Hover) */}
              <div className="w-full flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 overflow-hidden">
                <div className="pt-4 border-t border-slate-900/80">
                  {/* Datos métricos resumidos */}
                  <div className="flex items-center gap-6 font-mono text-[11px] text-slate-500 mb-4 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      🧠 <strong className="text-slate-300">{level.regions}</strong> Reg.
                    </span>
                    <span className="flex items-center gap-1">
                      🔬 <strong className="text-slate-300">{level.symptoms}</strong> Sín.
                    </span>
                    <span className="flex items-center gap-1">
                      ⏱ {level.duration}
                    </span>
                  </div>

                  {/* Botón CTA */}
                  {level.available ? (
                    <Link
                      href={`/game/${level.id}`}
                      className="w-full max-w-xs bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold font-mono tracking-wider py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.15)] group-hover:shadow-[0_4px_20px_rgba(37,99,235,0.35)] whitespace-nowrap"
                    >
                      Iniciar diagnóstico 
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full max-w-xs bg-slate-950 text-slate-600 text-xs font-semibold font-mono tracking-wider py-2.5 px-4 rounded-lg cursor-not-allowed border border-slate-900/80"
                    >
                      Próximamente
                    </button>
                  )}
                </div>
              </div>

              {/* Indicador visual inferior discreto cuando está colapsado */}
              <div className="absolute bottom-4 left-6 right-6 h-1 bg-slate-900 rounded-full overflow-hidden group-hover:opacity-0 transition-opacity duration-200">
                <div className={`h-full w-1/3 rounded-full ${index === 0 ? 'bg-emerald-500/50' : index === 1 ? 'bg-amber-500/50' : 'bg-rose-500/50'}`} />
              </div>

            </div>
          ))}
        </div>

        {/* FOOTER ACADÉMICO */}
        <footer className="text-center font-mono text-[10px] text-slate-600 z-10 mb-2 max-w-xl leading-relaxed">
          <p>Proyecto académico • Proyecto e Investigación en Videojuegos Digitales · 2026</p>
          <p className="text-slate-700 mt-0.5">Sesiones anónimas — no se recopilan datos personales</p>
        </footer>
      </section>

    </main>
  );
}
