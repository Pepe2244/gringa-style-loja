const VAPID_PUBLIC_KEY = 'BBADPd_a1fbfvFIxY2ZlJfO9CQZ1OO_11Zn-2uu_2WvWN-nLG_ZaVk0PJJrRJ8WnCLSRw-8oMjx8FnhUxExgidw';

document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.register('sw.js')
            .then(swReg => {
                console.log('Service Worker registrado:', swReg);
                inicializarBotaoPush(swReg);
            })
            .catch(error => {
                console.error('Erro ao registrar SW:', error);
            });
    } else {
        console.warn('Push messaging não é suportado neste navegador.');
        const containerPush = document.getElementById('push-subscribe-container');
        if(containerPush) containerPush.style.display = 'none';
    }

    carregarCampanhaAtiva();
});

async function inicializarBotaoPush(swRegistration) {
    const botaoPush = document.getElementById('push-subscribe-button');
    const containerPush = document.getElementById('push-subscribe-container');

    if (!botaoPush || !containerPush) return;

    if (Notification.permission === 'denied') {
        containerPush.style.display = 'none';
        return;
    }

    try {
        const subscription = await swRegistration.pushManager.getSubscription();
        if (subscription) {
            atualizarVisualBotao(true);
        } else {
            atualizarVisualBotao(false);
        }
    } catch (error) {
        console.error('Erro ao obter inscrição:', error);
        atualizarVisualBotao(false);
    }

    botaoPush.addEventListener('click', async () => {
        if (botaoPush.classList.contains('inscrito')) {
            return; 
        }

        try {
            const novaInscricao = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            await salvarInscricaoNoSupabase(novaInscricao);
            atualizarVisualBotao(true);

        } catch (error) {
            console.error('Falha ao inscrever:', error);
            if (Notification.permission === 'denied') {
                console.warn('O usuário negou a permissão para notificações.');
            }
        }
    });
}

function atualizarVisualBotao(inscrito) {
    const botaoPush = document.getElementById('push-subscribe-button');
    if (!botaoPush) return;

    const textoSpan = botaoPush.querySelector('span');
    const icone = botaoPush.querySelector('i');

    if (inscrito) {
        botaoPush.classList.add('inscrito');
        if (icone) icone.className = 'fas fa-check';
        if (textoSpan) textoSpan.textContent = 'Notificações Ativas';
        botaoPush.disabled = true;
        botaoPush.style.cursor = 'default';
    } else {
        botaoPush.classList.remove('inscrito');
        if (icone) icone.className = 'fas fa-bell';
        if (textoSpan) textoSpan.textContent = 'Ativar Notificações';
        botaoPush.disabled = false;
        botaoPush.style.cursor = 'pointer';
    }
}

async function salvarInscricaoNoSupabase(subscription) {
    if (!window.supabase) {
        console.error('Supabase client não encontrado.');
        return;
    }

    const subscriptionJson = subscription.toJSON();

    const { error } = await window.supabase
        .from('push_subscriptions')
        .upsert({
            endpoint: subscriptionJson.endpoint,
            keys: subscriptionJson.keys,
            user_agent: navigator.userAgent
        }, { onConflict: 'endpoint' });

    if (error) {
        console.error('Erro ao salvar inscrição no Supabase:', error);
        throw error;
    }

    console.log('Inscrição salva no Supabase com sucesso.');
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+') 
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function carregarCampanhaAtiva() {
    if (!window.supabase) {
        console.error('Supabase client não encontrado.');
        return;
    }

    try {
        const { data: config, error: configError } = await window.supabase
            .from('configuracoes_site')
            .select('campanha_ativa_id')
            .limit(1)
            .single();

        if (configError || !config || !config.campanha_ativa_id) {
            if (configError && configError.code !== 'PGRST116') console.error('Erro ao buscar config:', configError);
            return;
        }

        const { data: campanha, error: campanhaError } = await window.supabase
            .from('campanhas')
            .select('*')
            .eq('id', config.campanha_ativa_id)
            .single();

        if (campanhaError || !campanha) {
            if (campanhaError) console.error('Erro ao buscar campanha:', campanhaError);
            return;
        }

        aplicarCampanha(campanha);

    } catch (error) {
        console.error('Erro ao carregar campanha:', error);
    }
}

function aplicarCampanha(campanha) {
    if (campanha.banner_url) {
        const containerBanner = document.getElementById('top-banner-container');
        if (containerBanner) {
            containerBanner.innerHTML = `<img src="${campanha.banner_url}" alt="${campanha.nome_campanha}">`;
            containerBanner.style.display = 'block';

            if (campanha.cor_fundo) {
                containerBanner.style.backgroundColor = campanha.cor_fundo;
            }
        }
    }

    if (campanha.aviso_deslizante_texto) {
        let containerAviso = document.getElementById('aviso-deslizante-container');

        if (!containerAviso) {
            containerAviso = document.createElement('div');
            containerAviso.id = 'aviso-deslizante-container';
            const header = document.querySelector('header.cabecalho'); 
            if (header) {
                header.parentNode.insertBefore(containerAviso, header.nextSibling);
            } else {
                document.body.prepend(containerAviso);
            }
        }

        containerAviso.innerHTML = `<div class="aviso-texto">${campanha.aviso_deslizante_texto}</div>`;
        containerAviso.style.display = 'block';

        if (campanha.cor_destaque) {
            containerAviso.style.backgroundColor = campanha.cor_destaque;
        }
        if (campanha.cor_texto) {
            containerAviso.style.color = campanha.cor_texto;
        }
    }
}