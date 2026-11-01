/**
 * Utilitários de validação e formatação para formulários da loja Gringa Style.
 */

/**
 * Remove qualquer caractere não numérico da string.
 */
export function cleanDigits(value: string | null | undefined): string {
    return (value || '').replace(/\D/g, '');
}

/**
 * Formata um CPF brasileiro no padrão 000.000.000-00.
 */
export function formatCpf(value: string | null | undefined): string {
    const digits = cleanDigits(value).slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Valida se um CPF é matematicamente válido segundo o algoritmo oficial da Receita Federal.
 */
export function isValidCpf(cpf: string | null | undefined): boolean {
    const clean = cleanDigits(cpf);
    if (clean.length !== 11) return false;
    // Descarta sequências com todos os dígitos repetidos (ex: 00000000000, 11111111111, etc.)
    if (/^(\d)\1{10}$/.test(clean)) return false;

    // 1º Dígito Verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(clean.charAt(9), 10)) return false;

    // 2º Dígito Verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(clean.charAt(i), 10) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(clean.charAt(10), 10)) return false;

    return true;
}

