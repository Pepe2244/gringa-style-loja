import { siteConfig } from '@/lib/site-config';

export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '46493a965afd428fb54c0ca253bfa4eb';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

// Endpoints oficiais da rede IndexNow (todos compartilham as submissões entre si, incluindo Bing e Yep/Ahrefs)
export const INDEXNOW_ENDPOINTS = [
  'https://www.bing.com/indexnow',
  'https://indexnow.yep.com/indexnow',
  'https://api.indexnow.org/indexnow',
  'https://yandex.com/indexnow',
];

export interface IndexNowResult {
  success: boolean;
  status: number;
  endpoint?: string;
  message: string;
  submittedUrls: string[];
}

// Cooldown em memória para chamadas automáticas em background (evita 429 ao salvar vários produtos seguidos)
let lastBackgroundSubmitAt = 0;
const BACKGROUND_COOLDOWN_MS = 60_000;
const pendingBackgroundUrls = new Set<string>();
let backgroundFlushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Submete URLs ao IndexNow (Bing, Yep/Ahrefs, Yandex, etc.) para indexação e atualização instantânea.
 * Possui fallback automático entre os endpoints oficiais caso o endpoint principal retorne 429 (rate limit de IP compartilhado Cloudflare).
 */
export async function submitToIndexNow(
  urls?: string[],
  options?: { isBackground?: boolean }
): Promise<IndexNowResult> {
  const host = new URL(siteConfig.appUrl).hostname;
  const keyLocation = `${siteConfig.appUrl}/${INDEXNOW_KEY}.txt`;

  const defaultUrls = [
    `${siteConfig.appUrl}/`,
    `${siteConfig.appUrl}/loja`,
    `${siteConfig.appUrl}/rifa`,
    `${siteConfig.appUrl}/historico`,
    `${siteConfig.appUrl}/categoria/4`,
    `${siteConfig.appUrl}/categoria/5`,
    `${siteConfig.appUrl}/categoria/6`,
    `${siteConfig.appUrl}/categoria/7`,
    `${siteConfig.appUrl}/categoria/8`,
    `${siteConfig.appUrl}/categoria/9`,
    `${siteConfig.appUrl}/sobre`,
    `${siteConfig.appUrl}/gs-servicos-industriais`,
    `${siteConfig.appUrl}/devolucao-e-reembolso`,
    `${siteConfig.appUrl}/privacidade`,
  ];

  const sourceUrls = urls === undefined
    ? defaultUrls
    : (urls.length > 0 ? urls : (pendingBackgroundUrls.size > 0 ? [] : defaultUrls));

  const targetUrls = Array.from(
    new Set(
      sourceUrls.map((url) => {
        if (url.startsWith('http')) return url;
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${siteConfig.appUrl}${cleanPath}`;
      })
    )
  );

  if (options?.isBackground) {
    const now = Date.now();
    const elapsed = now - lastBackgroundSubmitAt;
    if (elapsed < BACKGROUND_COOLDOWN_MS) {
      for (const u of targetUrls) {
        pendingBackgroundUrls.add(u);
      }
      if (backgroundFlushTimer) {
        clearTimeout(backgroundFlushTimer);
      }
      const remainingMs = Math.max(100, BACKGROUND_COOLDOWN_MS - elapsed);
      backgroundFlushTimer = setTimeout(() => {
        backgroundFlushTimer = null;
        if (pendingBackgroundUrls.size > 0) {
          lastBackgroundSubmitAt = Date.now();
          void submitToIndexNow([], { isBackground: false }).catch((err) => {
            console.warn('[IndexNow] Falha ao descarregar fila pendente:', err);
          });
        }
      }, remainingMs);

      return {
        success: true,
        status: 200,
        message: 'Submissão em segundo plano enfileirada durante cooldown para evitar HTTP 429.',
        submittedUrls: targetUrls,
      };
    }
    lastBackgroundSubmitAt = now;
  }

  const mergedUrls = pendingBackgroundUrls.size > 0
    ? Array.from(new Set([...pendingBackgroundUrls, ...targetUrls]))
    : targetUrls;

  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation,
    urlList: mergedUrls,
  };

  let lastStatus = 500;
  let lastMessage = 'Falha desconhecida ao contactar IndexNow.';
  let lastEndpoint = INDEXNOW_ENDPOINT;

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    lastEndpoint = endpoint;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': `GringaStyleSEO/1.0 (+${siteConfig.appUrl})`,
        },
        body: JSON.stringify(payload),
      });

      lastStatus = response.status;
      const isSuccess = response.status === 200 || response.status === 202;

      if (isSuccess) {
        for (const u of mergedUrls) {
          pendingBackgroundUrls.delete(u);
        }
        if (pendingBackgroundUrls.size === 0 && backgroundFlushTimer) {
          clearTimeout(backgroundFlushTimer);
          backgroundFlushTimer = null;
        }
        return {
          success: true,
          status: response.status,
          endpoint,
          message: `IndexNow (${new URL(endpoint).hostname}) aceitou com sucesso ${mergedUrls.length} URLs para indexação instantânea.`,
          submittedUrls: mergedUrls,
        };
      }

      const responseText = await response.text().catch(() => '');

      if (response.status === 429) {
        lastMessage =
          'Limite de frequência temporário do IndexNow atingido (muitas solicitações em curto intervalo). Aguarde cerca de 10 a 15 minutos para enviar novamente.';
        // Tenta o próximo endpoint oficial da malha IndexNow
        continue;
      }

      if (response.status >= 500) {
        lastMessage = `Servidor IndexNow (${new URL(endpoint).hostname}) respondeu com ${response.status}.`;
        continue;
      }

      if (response.status === 403) {
        lastMessage = 'Chave do IndexNow não autorizada ou arquivo de validação inacessível.';
        break;
      }

      if (response.status === 422) {
        lastMessage = 'URLs inválidas ou não pertencentes ao host registrado.';
        break;
      }

      lastMessage = `IndexNow respondeu com status ${response.status}: ${responseText}`;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      lastMessage = `Falha na requisição ao endpoint ${endpoint}: ${errorMsg}`;
      continue;
    }
  }

  return {
    success: false,
    status: lastStatus,
    endpoint: lastEndpoint,
    message: lastMessage,
    submittedUrls: mergedUrls,
  };
}
