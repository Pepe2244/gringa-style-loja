"use client";

import { useState, useEffect } from "react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Verifica a rolagem da página para mostrar ou esconder o botão
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Função para voltar ao topo suavemente
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cor-destaque)] text-[var(--cor-fundo)] shadow-lg transition-all duration-300 hover:brightness-110 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--cor-destaque)] focus:ring-offset-2 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    </button>
  );
}