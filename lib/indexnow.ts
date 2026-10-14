import { siteConfig } from '@/lib/site-config';

export const INDEXNOW_KEY = '46493a965afd428fb54c0ca253bfa4eb';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export interface IndexNowResult {
  success: boolean;
  status: number;
  message: string;
  submittedUrls: string[];
}

/**
 * Submete URLs ao IndexNow (Bing, Yandex, etc.) para indexação e atualização instantânea.
 */
export async function submitToIndexNow(urls?: string[]): Promise<IndexNowResult> {
  const host = new URL(siteConfig.appUrl).hostname;
  const keyLocation = `${siteConfig.appUrl}/${INDEXNOW_KEY}.txt`;

  const defaultUrls = [
    `${siteConfig.appUrl}/`,
    `${siteConfig.appUrl}/loja`,
    `${siteConfig.appUrl}/rifa`,
    `${siteConfig.appUrl}/sobre`,
    `${siteConfig.appUrl}/gs-servicos-industriais`,
    `${siteConfig.appUrl}/devolucao-e-reembolso`,
    `${siteConfig.appUrl}/privacidade`,
  ];

  const targetUrls = Array.from(new Set(
    (urls && urls.length > 0 ? urls : defaultUrls)
      .map((url) => {
        if (url.startsWith('http')) return url;
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${siteConfig.appUrl}${cleanPath}`;
      })
  ));

  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation,
    urlList: targetUrls,
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    // 200 = OK, 202 = Accepted
    const isSuccess = response.status === 200 || response.status === 202;
    const responseText = await response.text().catch(() => '');

    return {
      success: isSuccess,
      status: response.status,
      message: isSuccess
        ? `IndexNow aceitou com sucesso ${targetUrls.length} URLs.`
        : `IndexNow respondeu com status ${response.status}: ${responseText}`,
      submittedUrls: targetUrls,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[IndexNow] Erro ao submeter URLs:', errorMsg);
    return {
      success: false,
      status: 500,
      message: `Falha na requisição ao IndexNow: ${errorMsg}`,
      submittedUrls: targetUrls,
    };
  }
}
