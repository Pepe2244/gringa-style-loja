/**
 * Normaliza e gera slugs URL-friendly em português
 * Remove acentos (diacríticos) via NFD antes de remover caracteres especiais.
 * Exemplo: "Óculos Steelflex Proteção" -> "oculos-steelflex-protecao"
 */
export function slugify(text: string | null | undefined): string {
    if (!text) return '';

    return text
        .toString()
        .normalize('NFD') // Decompõe caracteres acentuados (ex: "ó" -> "o" + acento)
        .replace(/[\u0300-\u036f]/g, '') // Remove todos os acentos
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-') // Substitui qualquer caractere não-alfanumérico por traço
        .replace(/^-+|-+$/g, ''); // Remove traços no início e no fim
}
