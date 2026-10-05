'use server';

import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

type AdminResult<T = undefined> =
    | { success: true; data: T }
    | { success: false; error: string; code?: string };

async function runAdmin<T>(operation: (client: ReturnType<typeof createSupabaseAdminClient>) => Promise<T>): Promise<AdminResult<T>> {
    if (!await isAdminAuthenticated()) return { success: false, error: 'Não autorizado.' };

    try {
        const data = await operation(createSupabaseAdminClient());
        return { success: true, data };
    } catch (error) {
        console.error('Erro em operação administrativa:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno.',
            ...(error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? { code: error.code } : {})
        };
    }
}

function positiveId(value: number) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Identificador inválido.');
    return value;
}

function record(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Dados inválidos.');
    return value as Record<string, unknown>;
}

function text(value: unknown, name: string, maxLength: number, allowEmpty = false): string {
    if (typeof value !== 'string' || value.length > maxLength || (!allowEmpty && !value.trim())) {
        throw new Error(`${name} inválido.`);
    }
    return value.trim();
}

function numberValue(value: unknown, name: string, min = 0, max = 1_000_000): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
        throw new Error(`${name} inválido.`);
    }
    return value;
}

function booleanValue(value: unknown, name: string): boolean {
    if (typeof value !== 'boolean') throw new Error(`${name} inválido.`);
    return value;
}

function safeUrl(value: unknown, name: string, optional = false): string | null {
    if (value == null && optional) return null;
    const input = text(value, name, 2048);
    let url: URL;
    try {
        url = new URL(input);
    } catch {
        throw new Error(`${name} inválido.`);
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error(`${name} deve usar HTTP ou HTTPS.`);
    return input;
}

function revalidateProducts() {
    revalidatePath('/', 'layout');
    revalidatePath('/produto', 'layout');
    revalidatePath('/busca', 'page');
    revalidatePath('/admin', 'layout');
}

function revalidateCampaigns() {
    revalidatePath('/', 'layout');
}

export async function getPrivateAdminData(kind: 'coupons' | 'notifications' | 'participants' | 'prizes', id?: number) {
    return runAdmin(async (client) => {
        switch (kind) {
            case 'coupons': {
                const { data, error } = await client.from('cupons').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                return data;
            }
            case 'notifications': {
                const { data, error } = await client.from('notificacoes_push_queue')
                    .select('*').eq('status', 'rascunho').order('created_at', { ascending: false });
                if (error) throw error;
                return data;
            }
            case 'participants': {
                const raffleId = positiveId(id ?? 0);
                const { data, error } = await client.from('participantes_rifa').select('*').eq('rifa_id', raffleId).order('created_at');
                if (error) throw error;
                return data;
            }
            case 'prizes': {
                const raffleId = positiveId(id ?? 0);
                const { data, error } = await client.from('premios').select('*').eq('rifa_id', raffleId).order('ordem');
                if (error) throw error;
                return data;
            }
            default:
                throw new Error('Consulta administrativa inválida.');
        }
    });
}

export async function saveProduct(input: unknown, id?: number) {
    return runAdmin(async (client) => {
        const data = record(input);
        const payload = {
            nome: text(data.nome, 'Nome', 200),
            slug: text(data.slug, 'Slug', 220),
            descricao: text(data.descricao, 'Descrição', 10_000, true),
            preco: numberValue(data.preco, 'Preço'),
            preco_promocional: data.preco_promocional == null ? null : numberValue(data.preco_promocional, 'Preço promocional'),
            preco_pix: data.preco_pix == null ? null : numberValue(data.preco_pix, 'Preço PIX'),
            categoria_id: data.categoria_id == null ? null : positiveId(Number(data.categoria_id)),
            tags: Array.isArray(data.tags) && data.tags.length <= 50 && data.tags.every((tag) => typeof tag === 'string' && tag.length <= 100)
                ? data.tags
                : (() => { throw new Error('Tags inválidas.'); })(),
            em_estoque: booleanValue(data.em_estoque, 'Estoque'),
            media_urls: Array.isArray(data.media_urls) && data.media_urls.length <= 30
                ? data.media_urls.map((url) => safeUrl(url, 'URL da mídia') as string)
                : (() => { throw new Error('Mídias inválidas.'); })(),
            variants: data.variants == null ? null : data.variants
        };
        const query = id
            ? client.from('produtos').update(payload).eq('id', positiveId(id))
            : client.from('produtos').insert(payload);
        const { error } = await query;
        if (error) throw error;
        revalidateProducts();
    });
}

export async function deleteProduct(id: number) {
    return runAdmin(async (client) => {
        const { error } = await client.from('produtos').delete().eq('id', positiveId(id));
        if (error) throw error;
        revalidateProducts();
    });
}

export async function setProductStock(id: number, inStock: boolean) {
    return runAdmin(async (client) => {
        const { error } = await client.from('produtos').update({ em_estoque: booleanValue(inStock, 'Estoque') }).eq('id', positiveId(id));
        if (error) throw error;
        revalidateProducts();
    });
}

export async function saveCategory(name: string) {
    return runAdmin(async (client) => {
        const { error } = await client.from('categorias').insert({ nome: text(name, 'Nome da categoria', 100) });
        if (error) throw error;
        revalidatePath('/', 'layout');
    });
}

export async function deleteCategory(id: number) {
    return runAdmin(async (client) => {
        const { error } = await client.from('categorias').delete().eq('id', positiveId(id));
        if (error) throw error;
        revalidatePath('/', 'layout');
    });
}

export async function saveCampaign(input: unknown, id?: number) {
    return runAdmin(async (client) => {
        const data = record(input);
        const payload = {
            nome_campanha: text(data.nome_campanha, 'Nome da campanha', 200),
            banner_url: safeUrl(data.banner_url, 'Banner', true),
            aviso_deslizante_texto: data.aviso_deslizante_texto == null ? null : text(data.aviso_deslizante_texto, 'Aviso', 1000),
            cor_fundo: text(data.cor_fundo, 'Cor de fundo', 7),
            cor_texto: text(data.cor_texto, 'Cor do texto', 7),
            cor_destaque: text(data.cor_destaque, 'Cor de destaque', 7)
        };
        if (![payload.cor_fundo, payload.cor_texto, payload.cor_destaque].every((color) => /^#[0-9a-f]{6}$/i.test(color))) {
            throw new Error('As cores da campanha devem estar no formato hexadecimal.');
        }
        const query = id
            ? client.from('campanhas').update(payload).eq('id', positiveId(id))
            : client.from('campanhas').insert(payload);
        const { error } = await query;
        if (error) throw error;
        revalidateCampaigns();
    });
}

export async function deleteCampaign(id: number) {
    return runAdmin(async (client) => {
        const { error } = await client.from('campanhas').delete().eq('id', positiveId(id));
        if (error) throw error;
        revalidateCampaigns();
    });
}

export async function setActiveCampaign(id: number | null) {
    return runAdmin(async (client) => {
        if (id !== null) positiveId(id);
        const { error } = await client.from('configuracoes_site').upsert({ id: 1, campanha_ativa_id: id });
        if (error) throw error;
        revalidateCampaigns();
    });
}

export async function saveShopConfig(days: number) {
    return runAdmin(async (client) => {
        if (!Number.isSafeInteger(days) || days < 1 || days > 365) throw new Error('O período deve estar entre 1 e 365 dias.');
        const { error } = await client.from('configuracoes').upsert({ chave: 'dias_novo', valor: String(days) });
        if (error) throw error;
        revalidatePath('/loja', 'page');
    });
}

export async function saveCoupon(input: unknown, id?: number) {
    return runAdmin(async (client) => {
        const data = record(input);
        const code = text(data.codigo, 'Código', 64).toUpperCase();
        if (!/^[\p{L}\p{N}_-]+$/u.test(code)) throw new Error('Código de cupom inválido.');
        const discountType = text(data.tipo_desconto, 'Tipo de desconto', 30);
        if (!['percentual', 'fixo'].includes(discountType)) throw new Error('Tipo de desconto inválido.');
        const application = text(data.tipo_aplicacao, 'Aplicação', 30);
        if (!['geral', 'produto'].includes(application)) throw new Error('Aplicação do cupom inválida.');
        const applicableProducts = data.produtos_aplicaveis;
        if (application === 'produto' && (!Array.isArray(applicableProducts) || applicableProducts.length > 100 || !applicableProducts.every((value) => Number.isSafeInteger(value) && value > 0))) {
            throw new Error('Produtos aplicáveis inválidos.');
        }
        const payload = {
            codigo: code,
            tipo_desconto: discountType,
            valor_desconto: numberValue(data.valor_desconto, 'Valor do desconto', 0, discountType === 'percentual' ? 100 : 1_000_000),
            tipo_aplicacao: application,
            produtos_aplicaveis: application === 'produto' ? applicableProducts : null,
            metodo_pagamento_restrito: data.metodo_pagamento_restrito == null ? null : text(data.metodo_pagamento_restrito, 'Método de pagamento', 30),
            data_validade: data.data_validade == null ? null : text(data.data_validade, 'Validade', 40),
            limite_uso: data.limite_uso == null ? null : numberValue(data.limite_uso, 'Limite de uso', 1, 1_000_000)
        };
        if (payload.metodo_pagamento_restrito !== null && !['pix', 'cartao_credito'].includes(payload.metodo_pagamento_restrito)) {
            throw new Error('Método de pagamento inválido.');
        }
        if (payload.data_validade && !Number.isFinite(Date.parse(payload.data_validade))) {
            throw new Error('Data de validade inválida.');
        }
        const query = id
            ? client.from('cupons').update(payload).eq('id', positiveId(id))
            : client.from('cupons').insert(payload);
        const { error } = await query;
        if (error) throw error;
    });
}

export async function deleteCoupon(id: number) {
    return runAdmin(async (client) => {
        const { error } = await client.from('cupons').delete().eq('id', positiveId(id));
        if (error) throw error;
    });
}

export async function toggleCoupon(id: number, active: boolean) {
    return runAdmin(async (client) => {
        const { error } = await client.from('cupons').update({ ativo: booleanValue(active, 'Status') }).eq('id', positiveId(id));
        if (error) throw error;
    });
}

export async function createPushNotification(title: string, body: string, link: string) {
    return runAdmin(async (client) => {
        const destination = text(link, 'Destino', 2048);
        if (!destination.startsWith('/') || destination.startsWith('//')) safeUrl(destination, 'Destino');
        const { error } = await client.from('notificacoes_push_queue').insert({
            titulo: text(title, 'Título', 120),
            mensagem: text(body, 'Mensagem', 1000),
            link_url: destination,
            status: 'aprovado'
        });
        if (error) throw error;
    });
}

export async function approvePushNotification(id: number) {
    return runAdmin(async (client) => {
        const { error } = await client.from('notificacoes_push_queue')
            .update({ status: 'aprovado' }).eq('id', positiveId(id)).eq('status', 'rascunho');
        if (error) throw error;
    });
}

export async function deletePushNotification(id: number) {
    return runAdmin(async (client) => {
        const { error } = await client.from('notificacoes_push_queue').delete().eq('id', positiveId(id));
        if (error) throw error;
    });
}

export async function saveB2BAsset(input: unknown, id?: string, replaceHero = false) {
    return runAdmin(async (client) => {
        const data = record(input);
        const section = text(data.section, 'Seção', 30);
        if (!['galeria', 'cliente', 'hero', 'projetos'].includes(section)) throw new Error('Seção inválida.');
        const payload = {
            section,
            url: safeUrl(data.url, 'Imagem') as string,
            title: data.title == null ? null : text(data.title, 'Título', 200),
            ...(section === 'projetos' ? { secondary_url: safeUrl(data.secondary_url, 'Imagem secundária') } : {})
        };
        if (replaceHero && section === 'hero' && !id) {
            const { error } = await client.from('b2b_assets').delete().eq('section', 'hero');
            if (error) throw error;
        }
        const query = id
            ? client.from('b2b_assets').update(payload).eq('id', id)
            : client.from('b2b_assets').insert(payload);
        const { error } = await query;
        if (error) throw error;
        revalidatePath('/soldas-especiais', 'page');
    });
}

export async function deleteB2BAsset(id: string) {
    return runAdmin(async (client) => {
        const assetId = text(id, 'Identificador da mídia', 100);
        const { error } = await client.from('b2b_assets').delete().eq('id', assetId);
        if (error) throw error;
        revalidatePath('/soldas-especiais', 'page');
    });
}

export async function updateParticipantStatus(id: number, status: 'pago' | 'cancelado', raffleId: number, numbers: number[]) {
    return runAdmin(async (client) => {
        const participantId = positiveId(id);
        const rifaId = positiveId(raffleId);
        if (status !== 'pago' && status !== 'cancelado') throw new Error('Status de pagamento inválido.');
        if (!Array.isArray(numbers) || numbers.length > 1000 || !numbers.every((value) => Number.isSafeInteger(value) && value >= 0)) {
            throw new Error('Números de reserva inválidos.');
        }
        const { data: participant, error: participantError } = await client.from('participantes_rifa')
            .update({ status_pagamento: status }).eq('id', participantId).eq('rifa_id', rifaId).select('id').maybeSingle();
        if (participantError) throw participantError;
        if (!participant) throw new Error('Participante não encontrado nesta rifa.');

        const { data: raffle, error: raffleError } = await client.from('rifas')
            .select('numeros_vendidos, numeros_reservados').eq('id', rifaId).single();
        if (raffleError) throw raffleError;

        const sold = Array.isArray(raffle.numeros_vendidos) ? raffle.numeros_vendidos : [];
        const reserved = Array.isArray(raffle.numeros_reservados) ? raffle.numeros_reservados : [];
        const nextSold = status === 'pago'
            ? Array.from(new Set([...sold, ...numbers]))
            : sold.filter((number) => !numbers.includes(number));
        const nextReserved = reserved.filter((number) => !numbers.includes(number));
        const { error: updateError } = await client.from('rifas').update({
            numeros_vendidos: nextSold,
            numeros_reservados: nextReserved
        }).eq('id', rifaId);
        if (updateError) throw updateError;
        revalidatePath('/rifa', 'page');
        revalidatePath('/acompanhar-rifa', 'page');
        revalidatePath('/admin', 'layout');
    });
}
