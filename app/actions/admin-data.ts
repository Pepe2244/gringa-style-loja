'use server';

import { revalidatePath, revalidateTag, updateTag } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { clearProductServiceCache, isColumnMissingError } from '@/lib/product-service';
import { submitToIndexNow } from '@/lib/indexnow';
import { siteConfig } from '@/lib/site-config';
import { applyProntaEntregaToTags } from '@/utils/productAvailability';
import { getCanonicalProductSlug } from '@/utils/slugify';

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
        let errorMessage = 'Erro interno.';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
            errorMessage = error.message;
        }
        return {
            success: false,
            error: errorMessage,
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
    if (input.startsWith('/') && !input.startsWith('//')) {
        return input;
    }
    let url: URL;
    try {
        url = new URL(input);
    } catch {
        throw new Error(`${name} inválido.`);
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error(`${name} deve usar HTTP ou HTTPS.`);
    return input;
}

function optionalDateIso(value: unknown, name: string): string | null {
    if (value == null) return null;
    if (typeof value !== 'string') throw new Error(`${name} inválida.`);
    const trimmed = value.trim();
    if (!trimmed) return null;
    const timestamp = Date.parse(trimmed);
    if (!Number.isFinite(timestamp)) {
        throw new Error(`${name} inválida.`);
    }
    return new Date(timestamp).toISOString();
}

function revalidateProducts(slug?: string, id?: number) {
    clearProductServiceCache();
    try {
        revalidateTag('produtos', 'max');
        revalidateTag('loja', 'max');
        revalidateTag('categorias', 'max');
        revalidateTag('relacionados', 'max');
        if (typeof updateTag === 'function') {
            updateTag('produtos');
            updateTag('loja');
            updateTag('categorias');
            updateTag('relacionados');
        }

    } catch (err) {
        console.error('Falha ao revalidar tags:', err);
    }
    revalidatePath('/', 'layout');
    revalidatePath('/loja', 'page');
    revalidatePath('/loja', 'layout');
    revalidatePath('/categoria/[id]', 'page');
    revalidatePath('/categoria', 'layout');
    revalidatePath('/produto/[id]', 'page');
    if (slug) {
        revalidatePath(`/produto/${slug}`, 'page');
        revalidatePath(`/produto/${slug}`, 'layout');
        revalidatePath(`/produto/${slug}/opengraph-image`);
    }
    if (id) {
        revalidatePath(`/produto/${id}`, 'page');
        revalidatePath(`/produto/${id}`, 'layout');
    }
    revalidatePath('/busca', 'page');
    revalidatePath('/carrinho', 'page');
    revalidatePath('/api/google-feed');
    revalidatePath('/api/meta-feed');
    revalidatePath('/api/pinterest-feed');
    revalidatePath('/sitemap.xml');
    revalidatePath('/admin', 'layout');

    // Despacho assíncrono para o IndexNow (Bing, Yep/Ahrefs) para indexação instantânea
    const urlsToNotify = [
        `${siteConfig.appUrl}/`,
        `${siteConfig.appUrl}/loja`,
        ...(slug ? [`${siteConfig.appUrl}/produto/${slug}`] : []),
    ];
    submitToIndexNow(urlsToNotify, { isBackground: true }).catch((err) => {
        console.warn('Falha ao despachar URLs para IndexNow:', err);
    });
}

function revalidateCategories() {
    try {
        revalidateTag('categorias', 'max');
        revalidateTag('loja', 'max');
        if (typeof updateTag === 'function') {
            updateTag('categorias');
            updateTag('loja');
        }
    } catch (err) {
        console.error('Falha ao revalidar tags de categoria:', err);
    }
    revalidatePath('/', 'layout');
    revalidatePath('/loja', 'page');
    revalidatePath('/categoria/[id]', 'page');
    revalidatePath('/categoria', 'layout');
    revalidatePath('/admin', 'layout');

    submitToIndexNow([`${siteConfig.appUrl}/loja`], { isBackground: true }).catch(() => {});
}

function revalidateCampaigns() {
    clearProductServiceCache();
    try {
        revalidateTag('campaign', 'max');
        revalidateTag('produtos', 'max');
        revalidateTag('loja', 'max');
        if (typeof updateTag === 'function') {
            updateTag('campaign');
            updateTag('produtos');
            updateTag('loja');
        }
    } catch (err) {
        console.error('Falha ao revalidar tags de campanha:', err);
    }
    revalidatePath('/', 'layout');
    revalidatePath('/loja', 'page');
    revalidatePath('/loja', 'layout');
    revalidatePath('/admin', 'layout');
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
        const mediaList = Array.isArray(data.media_urls) && data.media_urls.length <= 30
            ? data.media_urls.map((url) => safeUrl(url, 'URL da mídia') as string)
            : (() => { throw new Error('Mídias inválidas.'); })();

        const inicioPromocao = optionalDateIso(data.inicio_promocao, 'Data de início da promoção');
        const fimPromocao = optionalDateIso(data.fim_promocao, 'Data de término da promoção');
        if (inicioPromocao && fimPromocao && Date.parse(inicioPromocao) > Date.parse(fimPromocao)) {
            throw new Error('A data de início da promoção não pode ser posterior à data de término.');
        }

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
            media_urls: mediaList,
            imagens: mediaList,
            variants: data.variants == null ? null : data.variants,
            inicio_promocao: inicioPromocao,
            fim_promocao: fimPromocao
        };
        let oldCanonicalSlug: string | undefined;
        let oldRawSlug: string | undefined;
        const targetId = id ? positiveId(id) : undefined;
        if (targetId) {
            const { data: existingProd } = await client
                .from('produtos')
                .select('slug, nome')
                .eq('id', targetId)
                .maybeSingle();
            if (existingProd) {
                oldRawSlug = existingProd.slug || undefined;
                oldCanonicalSlug = getCanonicalProductSlug({ id: targetId, nome: existingProd.nome, slug: existingProd.slug });
            }
        }

        const query = targetId
            ? client.from('produtos').update(payload).eq('id', targetId)
            : client.from('produtos').insert(payload);
        let { error } = await query;
        if (error && isColumnMissingError(error)) {
            const strippedPayload = { ...payload };
            delete (strippedPayload as any).inicio_promocao;
            delete (strippedPayload as any).fim_promocao;
            const fallbackQuery = targetId
                ? client.from('produtos').update(strippedPayload).eq('id', targetId)
                : client.from('produtos').insert(strippedPayload);
            const fallbackRes = await fallbackQuery;
            error = fallbackRes.error;
        }
        if (error) throw error;
        const canonicalSlug = getCanonicalProductSlug({ id: targetId ?? 0, nome: payload.nome, slug: payload.slug });
        revalidateProducts(canonicalSlug, targetId);
        if (oldCanonicalSlug && oldCanonicalSlug !== canonicalSlug) {
            revalidatePath(`/produto/${oldCanonicalSlug}`, 'page');
            revalidatePath(`/produto/${oldCanonicalSlug}`, 'layout');
            revalidatePath(`/produto/${oldCanonicalSlug}/opengraph-image`);
        }
        if (oldRawSlug && oldRawSlug !== canonicalSlug && oldRawSlug !== oldCanonicalSlug) {
            revalidatePath(`/produto/${oldRawSlug}`, 'page');
            revalidatePath(`/produto/${oldRawSlug}`, 'layout');
            revalidatePath(`/produto/${oldRawSlug}/opengraph-image`);
        }
    });
}

export async function deleteProduct(id: number) {
    return runAdmin(async (client) => {
        const prodId = positiveId(id);
        const { data: prod } = await client.from('produtos').select('slug, nome').eq('id', prodId).maybeSingle();
        const { error } = await client.from('produtos').delete().eq('id', prodId);
        if (error) throw error;
        const canonicalSlug = prod ? getCanonicalProductSlug({ id: prodId, nome: prod.nome, slug: prod.slug }) : undefined;
        revalidateProducts(canonicalSlug, prodId);
    });
}

export async function setProductStock(id: number, inStock: boolean) {
    return runAdmin(async (client) => {
        const stockStatus = booleanValue(inStock, 'Estoque');
        const prodId = positiveId(id);
        const { data: prod, error: fetchError } = await client
            .from('produtos')
            .select('slug, nome')
            .eq('id', prodId)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!prod) throw new Error('Produto não encontrado.');

        const { error } = await client.from('produtos').update({
            em_estoque: stockStatus
        }).eq('id', prodId);
        if (error) throw error;

        const canonicalSlug = getCanonicalProductSlug({ id: prodId, nome: prod.nome, slug: prod.slug });
        revalidateProducts(canonicalSlug, prodId);
    });
}

export async function setProductProntaEntrega(id: number, prontaEntrega: boolean) {
    return runAdmin(async (client) => {
        const isReady = booleanValue(prontaEntrega, 'Pronta Entrega');
        const prodId = positiveId(id);
        const { data: prod, error: fetchError } = await client
            .from('produtos')
            .select('slug, nome, tags')
            .eq('id', prodId)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!prod) throw new Error('Produto não encontrado.');

        const updatedTags = applyProntaEntregaToTags(Array.isArray(prod.tags) ? prod.tags : [], isReady);
        const { error } = await client
            .from('produtos')
            .update({ tags: updatedTags })
            .eq('id', prodId);
        if (error) throw error;

        const canonicalSlug = getCanonicalProductSlug({ id: prodId, nome: prod.nome, slug: prod.slug });
        revalidateProducts(canonicalSlug, prodId);
    });
}

export async function saveCategory(name: string) {
    return runAdmin(async (client) => {
        const { error } = await client.from('categorias').insert({ nome: text(name, 'Nome da categoria', 100) });
        if (error) throw error;
        revalidateCategories();
    });
}

export async function deleteCategory(id: number) {
    return runAdmin(async (client) => {
        const { error } = await client.from('categorias').delete().eq('id', positiveId(id));
        if (error) throw error;
        revalidateCategories();
    });
}

export async function saveCampaign(input: unknown, id?: number) {
    return runAdmin(async (client) => {
        const data = record(input);

        const dataInicio = optionalDateIso(data.data_inicio, 'Data de início');
        const dataFim = optionalDateIso(data.data_fim, 'Data de término');
        if (dataInicio && dataFim && Date.parse(dataInicio) > Date.parse(dataFim)) {
            throw new Error('A data de início da campanha não pode ser posterior à data de término.');
        }

        let tipoDesconto: 'percentual' | 'fixo' | null = null;
        if (data.tipo_desconto && data.tipo_desconto !== 'nenhum') {
            if (data.tipo_desconto !== 'percentual' && data.tipo_desconto !== 'fixo') {
                throw new Error('Tipo de desconto inválido.');
            }
            tipoDesconto = data.tipo_desconto;
        }

        let valorDesconto: number | null = null;
        if (tipoDesconto) {
            valorDesconto = numberValue(
                data.valor_desconto,
                'Valor do desconto',
                0.01,
                tipoDesconto === 'percentual' ? 100 : 1_000_000
            );
        }

        const aplicarEmTodos = typeof data.aplicar_em_todos === 'boolean' ? data.aplicar_em_todos : false;

        let produtosAplicaveis: number[] | null = null;
        if (Array.isArray(data.produtos_aplicaveis)) {
            if (!data.produtos_aplicaveis.every((item) => Number.isSafeInteger(item) && item > 0)) {
                throw new Error('Lista de produtos aplicáveis inválida.');
            }
            produtosAplicaveis = Array.from(new Set(data.produtos_aplicaveis.map(Number)));
        } else if (data.produtos_aplicaveis === null || data.produtos_aplicaveis === undefined) {
            produtosAplicaveis = null;
        } else {
            throw new Error('Lista de produtos aplicáveis inválida.');
        }

        let produtosDescontos: Array<{ produto_id: number; tipo: 'percentual' | 'fixo' | 'preco_fixo'; valor: number }> = [];
        if (Array.isArray(data.produtos_descontos)) {
            for (const item of data.produtos_descontos) {
                if (!item || typeof item !== 'object') continue;
                const pId = Number((item as any).produto_id);
                const tipo = String((item as any).tipo);
                const valor = Number((item as any).valor);
                if (!Number.isSafeInteger(pId) || pId <= 0) continue;
                if (!['percentual', 'fixo', 'preco_fixo'].includes(tipo)) continue;
                if (!Number.isFinite(valor) || valor <= 0) continue;
                if (tipo === 'percentual' && valor > 100) continue;
                produtosDescontos.push({
                    produto_id: pId,
                    tipo: tipo as 'percentual' | 'fixo' | 'preco_fixo',
                    valor: Math.round(valor * 100) / 100,
                });
            }
        }

        if (produtosDescontos.length > 0) {
            const ruleIds = produtosDescontos.map((d) => d.produto_id);
            produtosAplicaveis = Array.from(new Set([...(produtosAplicaveis || []), ...ruleIds]));
        }

        const payload = {
            nome_campanha: text(data.nome_campanha, 'Nome da campanha', 200),
            banner_url: safeUrl(data.banner_url, 'Banner', true),
            aviso_deslizante_texto: data.aviso_deslizante_texto == null ? null : text(data.aviso_deslizante_texto, 'Aviso', 1000),
            cor_fundo: text(data.cor_fundo, 'Cor de fundo', 7),
            cor_texto: text(data.cor_texto, 'Cor do texto', 7),
            cor_destaque: text(data.cor_destaque, 'Cor de destaque', 7),
            data_inicio: dataInicio,
            data_fim: dataFim,
            tipo_desconto: tipoDesconto,
            valor_desconto: valorDesconto,
            produtos_aplicaveis: produtosAplicaveis,
            aplicar_em_todos: aplicarEmTodos,
            produtos_descontos: produtosDescontos
        };
        if (![payload.cor_fundo, payload.cor_texto, payload.cor_destaque].every((color) => /^#[0-9a-f]{6}$/i.test(color))) {
            throw new Error('As cores da campanha devem estar no formato hexadecimal.');
        }
        const query = id
            ? client.from('campanhas').update(payload).eq('id', positiveId(id))
            : client.from('campanhas').insert(payload);
        let { error } = await query;
        if (error && isColumnMissingError(error)) {
            const stripped = {
                nome_campanha: payload.nome_campanha,
                banner_url: payload.banner_url,
                aviso_deslizante_texto: payload.aviso_deslizante_texto,
                cor_fundo: payload.cor_fundo,
                cor_texto: payload.cor_texto,
                cor_destaque: payload.cor_destaque,
            };
            const fallbackQuery = id
                ? client.from('campanhas').update(stripped).eq('id', positiveId(id))
                : client.from('campanhas').insert(stripped);
            const fallbackRes = await fallbackQuery;
            error = fallbackRes.error;
        }
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
        const { error } = await client.from('configuracoes').upsert(
            { chave: 'dias_novo', valor: String(days) },
            { onConflict: 'chave' }
        );
        if (error) throw error;
        try {
            revalidateTag('configuracoes', 'max');
            revalidateTag('loja', 'max');
            if (typeof updateTag === 'function') {
                updateTag('configuracoes');
                updateTag('loja');
            }
        } catch {}
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
        const parsedLimit = data.limite_uso == null ? null : numberValue(data.limite_uso, 'Limite de uso', 1, 1_000_000);
        const payload: Record<string, unknown> = {
            codigo: code,
            tipo_desconto: discountType,
            valor_desconto: numberValue(data.valor_desconto, 'Valor do desconto', 0, discountType === 'percentual' ? 100 : 1_000_000),
            tipo_aplicacao: application,
            produtos_aplicaveis: application === 'produto' ? applicableProducts : null,
            metodo_pagamento_restrito: data.metodo_pagamento_restrito == null ? null : text(data.metodo_pagamento_restrito, 'Método de pagamento', 30),
            data_validade: data.data_validade == null ? null : text(data.data_validade, 'Validade', 40),
            limite_uso: parsedLimit,
            limite_usos: parsedLimit,
        };
        if (payload.metodo_pagamento_restrito !== null && !['pix', 'cartao_credito'].includes(payload.metodo_pagamento_restrito as string)) {
            throw new Error('Método de pagamento inválido.');
        }
        if (payload.data_validade && !Number.isFinite(Date.parse(payload.data_validade as string))) {
            throw new Error('Data de validade inválida.');
        }
        const query = id
            ? client.from('cupons').update(payload).eq('id', positiveId(id))
            : client.from('cupons').insert(payload);
        let { error } = await query;

        // Fallback gracioso caso colunas estendidas não existam no Supabase
        if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
            const legacyPayload: Record<string, unknown> = {
                codigo: code,
                tipo_desconto: discountType,
                valor_desconto: payload.valor_desconto,
                data_validade: payload.data_validade,
                limite_usos: parsedLimit,
            };
            const fallbackQuery = id
                ? client.from('cupons').update(legacyPayload).eq('id', positiveId(id))
                : client.from('cupons').insert(legacyPayload);
            const fallbackRes = await fallbackQuery;
            error = fallbackRes.error;
        }

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
        const payload: Record<string, unknown> = {
            section,
            url: safeUrl(data.url, 'Imagem') as string,
            title: data.title == null ? null : text(data.title, 'Título', 200),
            ...(section === 'projetos' ? { secondary_url: safeUrl(data.secondary_url, 'Imagem secundária') } : {})
        };
        if (replaceHero && section === 'hero' && !id) {
            const { error } = await client.from('b2b_assets').delete().eq('section', 'hero');
            if (error) console.warn('Erro ao substituir hero:', error.message);
        }
        const cleanId = id ? String(id).trim() : undefined;
        const isPureInteger = cleanId ? /^\d+$/.test(cleanId) : false;
        const targetId = cleanId ? (isPureInteger ? parseInt(cleanId, 10) : cleanId) : undefined;
        const query = targetId !== undefined
            ? client.from('b2b_assets').update(payload).eq('id', targetId as any)
            : client.from('b2b_assets').insert(payload);
        let { error } = await query;

        // Fallback gracioso caso colunas do Supabase usem o schema alternativo (tipo, titulo, url, descricao)
        if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
            const legacyPayload: Record<string, unknown> = {
                tipo: section,
                url: payload.url,
                titulo: payload.title || 'Mídia B2B',
                descricao: payload.secondary_url || null,
            };
            const fallbackQuery = targetId !== undefined
                ? client.from('b2b_assets').update(legacyPayload).eq('id', targetId as any)
                : client.from('b2b_assets').insert(legacyPayload);
            const fallbackRes = await fallbackQuery;
            error = fallbackRes.error;
        }

        if (error) throw error;
        revalidatePath('/gs-servicos-industriais', 'page');
    });
}

export async function deleteB2BAsset(id: string | number) {
    return runAdmin(async (client) => {
        const strId = String(id).trim();
        if (!strId) throw new Error('ID da mídia B2B não informado.');
        const isPureInteger = /^\d+$/.test(strId);
        const query = isPureInteger
            ? client.from('b2b_assets').delete().eq('id', parseInt(strId, 10) as any)
            : client.from('b2b_assets').delete().eq('id', strId as any);
        const { error } = await query;
        if (error) throw error;
        revalidatePath('/gs-servicos-industriais', 'page');
    });
}

export async function updateParticipantStatus(id: number, status: 'pago' | 'cancelado', raffleId: number) {
    return runAdmin(async (client) => {
        const participantId = positiveId(id);
        const rifaId = positiveId(raffleId);
        if (status !== 'pago' && status !== 'cancelado') throw new Error('Status de pagamento inválido.');
        const { error } = await client.rpc('admin_update_participant_status', {
            p_participante_id: participantId,
            p_rifa_id: rifaId,
            p_status: status
        });
        if (error) throw error;
        revalidatePath('/rifa', 'page');
        revalidatePath('/acompanhar-rifa', 'page');
        revalidatePath('/admin', 'layout');
    });
}
