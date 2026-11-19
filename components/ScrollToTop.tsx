"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();
  const isServices =
    pathname?.startsWith("/gs-servicos-industriais") ||
    pathname?.startsWith("/soldas-especiais");

  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Verifica a rolagem da página para mostrar/esconder o botão e calcular progresso
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 300);

      if (isServices) {
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress =
          docHeight > 0 ? Math.min(100, Math.max(0, (scrollY / docHeight) * 100)) : 0;
        setScrollProgress(progress);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isServices]);

  // Função para voltar ao topo suavemente
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  if (isServices) {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset =
      circumference - (scrollProgress / 100) * circumference;

    return (
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Voltar ao topo da página"
        title="Voltar ao topo"
        className={`group fixed bottom-6 left-6 z-[998] flex items-center gap-2.5 rounded-full bg-[#0F172A]/95 backdrop-blur-md p-1.5 sm:pr-4 text-white border border-[#D95B16]/55 shadow-[0_10px_28px_rgba(15,23,42,0.32)] transition-all duration-300 hover:border-[#D95B16] hover:bg-[#0F172A] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(217,91,22,0.28)] focus:outline-none focus:ring-2 focus:ring-[#D95B16] focus:ring-offset-2 cursor-pointer ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        <span className="relative flex h-10 w-10 items-center justify-center">
          {/* Anel de progresso de leitura industrial */}
          <svg
            className="absolute inset-0 h-10 w-10 -rotate-90"
            viewBox="0 0 40 40"
            aria-hidden="true"
          >
            <circle
              cx="20"
              cy="20"
              r={radius}
              fill="none"
              stroke="rgba(148, 163, 184, 0.22)"
              strokeWidth="2.5"
            />
            <circle
              cx="20"
              cy="20"
              r={radius}
              fill="none"
              stroke="#D95B16"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-[stroke-dashoffset] duration-150 ease-out"
            />
          </svg>

          {/* Seta para cima */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-4 w-4 text-white transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:text-[#D95B16]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 15.75l7.5-7.5 7.5 7.5"
            />
          </svg>
        </span>

        <span className="hidden sm:flex flex-col items-start leading-none">
          <span className="text-[11px] font-extrabold tracking-[0.12em] uppercase text-white group-hover:text-[#D95B16] transition-colors">
            Topo
          </span>
          <span className="text-[10px] font-semibold text-slate-400 mt-0.5 tabular-nums">
            {Math.round(scrollProgress)}%
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cor-destaque)] text-[var(--cor-fundo)] shadow-lg transition-all duration-300 hover:brightness-110 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--cor-destaque)] focus:ring-offset-2 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-10 pointer-events-none"
      }`}
    >
      {/* Ícone de seta para cima em SVG puro para não depender de bibliotecas externas */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
        className="h-7 w-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 15.75l7.5-7.5 7.5 7.5"
        />
      </svg>
    </button>
  );
}