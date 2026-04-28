import { z } from 'zod';

// Esquemas de validação para diferentes tipos de dados

// Validação de usuário
export const userSchema = z.object({
    nome: z.string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),

    email: z.string()
        .email('E-mail inválido')
        .max(255, 'E-mail muito longo')
        .transform(email => email.toLowerCase().trim()),

    telefone: z.string()
        .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
        .optional(),

    senha: z.string()
        .min(8, 'Senha deve ter pelo menos 8 caracteres')
        .max(128, 'Senha muito longa')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'Senha deve conter maiúscula, minúscula, número e caractere especial'),

    confirmarSenha: z.string()
}).refine((data) => data.senha === data.confirmarSenha, {
    message: 'Senhas não coincidem',
    path: ['confirmarSenha']
});

// Validação de endereço
export const addressSchema = z.object({
    rua: z.string()
        .min(3, 'Rua deve ter pelo menos 3 caracteres')
        .max(255, 'Rua muito longa'),

    numero: z.string()
        .min(1, 'Número é obrigatório')
        .max(20, 'Número muito longo'),

    complemento: z.string()
        .max(100, 'Complemento muito longo')
        .optional(),

    bairro: z.string()
        .min(2, 'Bairro deve ter pelo menos 2 caracteres')
        .max(100, 'Bairro muito longo'),

    cidade: z.string()
        .min(2, 'Cidade deve ter pelo menos 2 caracteres')
        .max(100, 'Cidade muito longa'),

    estado: z.string()
        .length(2, 'Estado deve ter 2 caracteres')
        .regex(/^[A-Z]{2}$/, 'Estado deve conter apenas letras maiúsculas'),

    cep: z.string()
        .regex(/^\d{5}-\d{3}$/, 'CEP deve estar no formato XXXXX-XXX'),

    pais: z.string()
        .default('Brasil')
});

// Validação de produto
export const productSchema = z.object({
    nome: z.string()
        .min(3, 'Nome do produto deve ter pelo menos 3 caracteres')
        .max(255, 'Nome do produto muito longo'),

    descricao: z.string()
        .min(10, 'Descrição deve ter pelo menos 10 caracteres')
        .max(5000, 'Descrição muito longa'),

    preco: z.number()
        .positive('Preço deve ser positivo')
        .max(999999.99, 'Preço muito alto'),

    preco_original: z.number()
        .positive('Preço original deve ser positivo')
        .optional(),

    categoria: z.string()
        .min(2, 'Categoria deve ter pelo menos 2 caracteres')
        .max(100, 'Categoria muito longa'),

    marca: z.string()
        .max(100, 'Marca muito longa')
        .optional(),

    sku: z.string()
        .regex(/^[A-Z0-9-]+$/, 'SKU deve conter apenas letras maiúsculas, números e hífens')
        .max(50, 'SKU muito longo'),

    quantidade_estoque: z.number()
        .int('Quantidade deve ser um número inteiro')
        .min(0, 'Quantidade não pode ser negativa')
        .max(99999, 'Quantidade muito alta'),

    peso: z.number()
        .positive('Peso deve ser positivo')
        .max(50, 'Peso muito alto (kg)')
        .optional(),

    dimensoes: z.object({
        comprimento: z.number().positive().max(200),
        largura: z.number().positive().max(200),
        altura: z.number().positive().max(200)
    }).optional(),

    tags: z.array(z.string().max(50)).max(20, 'Máximo de 20 tags').optional(),

    imagens: z.array(z.string().url()).min(1, 'Pelo menos uma imagem é necessária').max(10, 'Máximo de 10 imagens'),

    ativo: z.boolean().default(true)
}).refine((data) => {
    if (data.preco_original && data.preco_original <= data.preco) {
        return false;
    }
    return true;
}, {
    message: 'Preço original deve ser maior que o preço atual',
    path: ['preco_original']
});

// Validação de pedido
export const orderSchema = z.object({
    itens: z.array(z.object({
        produto_id: z.string().uuid('ID do produto inválido'),
        quantidade: z.number().int().positive().max(99, 'Quantidade máxima por item é 99'),
        preco_unitario: z.number().positive(),
        variacoes: z.record(z.string()).optional()
    })).min(1, 'Pedido deve ter pelo menos um item').max(50, 'Máximo de 50 itens por pedido'),

    endereco_entrega: addressSchema,

    metodo_pagamento: z.enum(['cartao_credito', 'cartao_debito', 'boleto', 'pix', 'paypal'], {
        errorMap: () => ({ message: 'Método de pagamento inválido' })
    }),

    dados_pagamento: z.discriminatedUnion('tipo', [
        z.object({
            tipo: z.literal('cartao_credito'),
            numero_cartao: z.string().regex(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/, 'Número do cartão inválido'),
            nome_titular: z.string().min(2).max(100),
            data_expiracao: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Data de expiração inválida'),
            cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido'),
            parcelas: z.number().int().min(1).max(12).default(1)
        }),
        z.object({
            tipo: z.literal('cartao_debito'),
            numero_cartao: z.string().regex(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/, 'Número do cartão inválido'),
            nome_titular: z.string().min(2).max(100),
            data_expiracao: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Data de expiração inválida'),
            cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido')
        }),
        z.object({
            tipo: z.literal('boleto'),
            cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
        }),
        z.object({
            tipo: z.literal('pix'),
            chave_pix: z.string().min(1).max(255)
        }),
        z.object({
            tipo: z.literal('paypal'),
            email_paypal: z.string().email()
        })
    ]),

    cupom: z.string().max(50).optional(),

    observacoes: z.string().max(500).optional()
});

// Validação de cupom
export const couponSchema = z.object({
    codigo: z.string()
        .min(3, 'Código deve ter pelo menos 3 caracteres')
        .max(20, 'Código muito longo')
        .regex(/^[A-Z0-9_-]+$/, 'Código deve conter apenas letras maiúsculas, números, underscore e hífen'),

    tipo: z.enum(['percentual', 'valor_fixo'], {
        errorMap: () => ({ message: 'Tipo de desconto inválido' })
    }),

    valor: z.number()
        .positive('Valor deve ser positivo')
        .max(100, 'Valor muito alto'),

    valor_minimo: z.number()
        .positive('Valor mínimo deve ser positivo')
        .optional(),

    categorias_aplicaveis: z.array(z.string()).optional(),

    produtos_aplicaveis: z.array(z.string().uuid()).optional(),

    data_expiracao: z.date().optional(),

    uso_maximo: z.number().int().positive().optional(),

    uso_atual: z.number().int().min(0).default(0),

    ativo: z.boolean().default(true)
}).refine((data) => {
    if (data.tipo === 'percentual' && data.valor > 100) {
        return false;
    }
    return true;
}, {
    message: 'Desconto percentual não pode ser maior que 100%',
    path: ['valor']
});

// Validação de contato
export const contactSchema = z.object({
    nome: z.string().min(2).max(100),
    email: z.string().email(),
    telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/).optional(),
    assunto: z.string().min(5).max(200),
    mensagem: z.string().min(10).max(2000)
});

// Validação de newsletter
export const newsletterSchema = z.object({
    email: z.string().email('E-mail inválido'),
    nome: z.string().min(2).max(100).optional()
});

// Funções de validação utilitárias
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: z.ZodError['errors'];
} {
    try {
        const validData = schema.parse(data);
        return { success: true, data: validData };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, errors: error.errors };
        }
        return { success: false, errors: [{ message: 'Erro de validação desconhecido' }] };
    }
}

export function sanitizeInput(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remover tags HTML básicas
        .slice(0, 10000); // Limitar tamanho
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
}

export function validatePhone(phone: string): boolean {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return phoneRegex.test(phone);
}

export function validateCPF(cpf: string): boolean {
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(cpf)) return false;

    // Remover formatação
    const numbers = cpf.replace(/\D/g, '');

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) return false;

    // Calcular dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(numbers[i]) * (10 - i);
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(numbers[i]) * (11 - i);
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;

    return parseInt(numbers[9]) === digit1 && parseInt(numbers[10]) === digit2;
}

export function validateCNPJ(cnpj: string): boolean {
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    if (!cnpjRegex.test(cnpj)) return false;

    const numbers = cnpj.replace(/\D/g, '');

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) return false;

    // Pesos para CNPJ
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    // Calcular primeiro dígito
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(numbers[i]) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;

    // Calcular segundo dígito
    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(numbers[i]) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;

    return parseInt(numbers[12]) === digit1 && parseInt(numbers[13]) === digit2;
}

export function validateCreditCard(number: string): boolean {
    // Remover espaços e traços
    const cleanNumber = number.replace(/\s|-/g, '');

    // Verificar se contém apenas dígitos
    if (!/^\d+$/.test(cleanNumber)) return false;

    // Verificar comprimento
    if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;

    // Algoritmo de Luhn
    let sum = 0;
    let shouldDouble = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber[i]);

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
}

export function validateCEP(cep: string): boolean {
    const cepRegex = /^\d{5}-\d{3}$/;
    return cepRegex.test(cep);
}

// Hook personalizado para validação em tempo real
export function useValidation<T>(schema: z.ZodSchema<T>) {
    return {
        validate: (data: unknown) => validateData(schema, data),
        sanitize: sanitizeInput
    };
}