
/**
 * PaysGator Integration Service - Gateway de Pagamentos para Moçambique
 * 
 * NOTA PARA O UTILIZADOR: Para receber o pedido REAL no seu telemóvel:
 * 1. Crie a sua conta em https://paysgator.com/dashboard
 * 2. Obtenha a sua chave (API Key) no painel.
 * 3. Preencha PAYSGATOR_API_KEY abaixo.
 * 4. O sistema enviará o STK Push / pedido real para M-Pesa, e-Mola ou Mkesh.
 * 
 * Documentação: https://docs.paysgator.com
 */

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// EM PRODUÇÃO, A CHAVE FICA ESCONDIDA DENTRO DO paysgator-proxy.php PARA SEGURANÇA MÁXIMA
const PAYSGATOR_API_KEY = isLocal ? 'mk_test_39226af9_08c7386dae020f4e3d6589e0c46c624c123d7722dbe4a03b34426f199fab2579' : '';

const getProxyUrl = (op: string, id?: string) => {
  if (isLocal) {
    const endpoint = op === 'create' ? '/payment/create' : (op === 'confirm' ? '/payment/confirm' : `/transactions/${id}`);
    return `/api/paysgator${endpoint}`;
  }
  return `/paysgator-proxy.php?op=${op}${id ? `&id=${id}` : ''}`;
};
export interface PaysGatorPaymentRequest {
  method: 'mpesa' | 'emola' | 'mkesh' | 'bank_local';
  amount: number;
  phoneNumber: string;
  reference: string;
}

export interface PaysGatorResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  status: 'pending' | 'completed' | 'failed';
}

export const PaysGatorService = {
  /**
   * Dispara o PUSH STK (O pedido que faz o celular vibrar e pedir PIN)
   * Em produção, faz POST para https://api.paysgator.com/v1/payments
   */
  async initiateTransaction(data: PaysGatorPaymentRequest): Promise<PaysGatorResponse> {
    console.log(`[PAYSGATOR GATEWAY] Iniciando processo de pagamento para +258 ${data.phoneNumber}`);
    
    // Configurar Timeout de 15 segundos para evitar que o ecrã bloqueie infinitamente
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // ─── MODO PRODUÇÃO ───
    try {
      // PASSO 1: Criar o link de pagamento
      const url = getProxyUrl('create');
      console.log('[PAYSGATOR] Fetching URL:', url);
      const createResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        redirect: 'follow',        body: JSON.stringify({
          op: 'create', // Parâmetro de backup para o proxy PHP
          amount: data.amount,
          currency: 'MZN',
          externalTransactionId: data.reference,
          payment_methods: [data.method.toUpperCase()],
          description: `Compra AgroSuste - Ref: ${data.reference}`
        })
      });

      const createText = await createResponse.text();
      
      let createResult;
      try {
        createResult = JSON.parse(createText);
      } catch (e) {
        console.error('[PAYSGATOR CREATE RAW RESPONSE]', createText);
        return { 
          success: false, 
          message: `Erro Status ${createResponse.status}: ${createText.substring(0, 60)}${createText.length > 60 ? '...' : ''}`, 
          status: 'failed' 
        };
      }
      
      if (!createResponse.ok || !createResult.success) {
        let msg = createResult.message || 'Erro ao criar sessão de pagamento.';
        if (createResult.debug) {
            msg += ` (Debug: ${JSON.stringify(createResult.debug)})`;
        }
        return { 
          success: false, 
          message: msg, 
          status: 'failed' 
        };
      }

      const paymentLinkId = createResult.data.paymentlinkId;

      // PASSO 2: Confirmar (Trigger STK Push)
      const confirmResponse = await fetch(getProxyUrl('confirm'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          op: 'confirm', // Parâmetro de backup
          paymentLinkId: paymentLinkId,
          paymentMethod: data.method.toUpperCase(),
          payment_fields: {
            phoneNumber: data.phoneNumber // Em Moçambique, a API costuma aceitar os 9 dígitos se o prefixo já estiver configurado ou for implícito
          }
        })
      });

      const confirmText = await confirmResponse.text();
      let confirmResult;
      try {
        confirmResult = JSON.parse(confirmText);
      } catch (e) {
        return { 
          success: false, 
          message: `Erro ao confirmar pagamento (Status: ${confirmResponse.status}). Resposta: ${confirmText.substring(0, 50)}...`, 
          status: 'failed' 
        };
      }
      
      clearTimeout(timeoutId); // Limpar o timeout se o fluxo for concluído a tempo

      return {
        success: confirmResponse.ok && confirmResult.success,
        transactionId: confirmResult.data?.transactionId || createResult.data?.transactionId,
        message: confirmResult.message || 'Pedido de PIN enviado com sucesso.',
        status: confirmResult.success ? 'pending' : 'failed'
      };

    } catch (err: any) {
      clearTimeout(timeoutId); // Limpar em caso de erro
      console.error('[PAYSGATOR ERROR]', err);
      
      const isTimeout = err.name === 'AbortError';
      return { 
        success: false, 
        message: isTimeout 
            ? 'Tempo de ligação esgotado. O gateway da operadora está muito lento. Tente novamente.' 
            : `Erro de ligação: ${err.message || 'Verifique a internet'}. Saiba mais na Consola (F12).`, 
        status: 'failed' 
      };
    }

    // ─── MODO SIMULAÇÃO (Comentado) ───
    // return new Promise((resolve) => {
    //   setTimeout(() => {
    //     resolve({
    //       success: true,
    //       status: 'pending',
    //       message: "Handshake concluído via PaysGator. Pedido de PIN enviado ao telemóvel."
    //     });
    //   }, 1500);
    // });
  },

  /**
   * Verifica se o utilizador já digitou o PIN no telemóvel (Polling)
   * Em produção, faz GET para https://api.paysgator.com/v1/payments/{reference}/status
   */
  async getTransactionStatus(transactionId: string): Promise<PaysGatorResponse> {
    try {
      const response = await fetch(getProxyUrl('status', transactionId), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      // Mapeamento de estados do PaysGator para o nosso sistema
      const statusMap: Record<string, 'pending' | 'completed' | 'failed'> = {
        'pending': 'pending',
        'processing': 'pending',
        'completed': 'completed',
        'success': 'completed',
        'failed': 'failed',
        'canceled': 'failed'
      };

      return {
        success: response.ok,
        status: statusMap[result.status] || 'pending',
        message: result.message || (result.status === 'completed' ? 'Pagamento confirmado!' : 'Aguardando confirmação...')
      };
    } catch (err) {
      console.error('[PAYSGATOR STATUS ERROR]', err);
      console.warn('CORS Warning: If this is a network error, ensure your frontend domain is whitelisted in PaysGator dashboard or check for CORS issues.');
      return { success: false, message: 'Não foi possível verificar o estado do pagamento.', status: 'pending' };
    }
  }
};
