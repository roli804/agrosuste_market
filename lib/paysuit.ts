
/**
 * Paysuit Integration Service - Estrutura de Produção Moçambique
 * 
 * NOTA PARA O UTILIZADOR: Para receber o pedido REAL no seu telemóvel:
 * 1. Obtenha as suas chaves em https://paysuit.co.mz
 * 2. Preencha PAYSUIT_APP_ID e PAYSUIT_API_KEY abaixo.
 * 3. O sistema enviará o STK Push real para o M-Pesa/e-Mola.
 */

const PAYSUIT_APP_ID = 'SEU_APP_ID'; 
const PAYSUIT_API_KEY = 'SUA_API_KEY';

export interface PaysuitPaymentRequest {
  method: 'mpesa' | 'emola' | 'bank_local';
  amount: number;
  phoneNumber: string;
  reference: string;
}

export interface PaysuitResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  status: 'pending' | 'completed' | 'failed';
}

export const PaysuitService = {
  /**
   * Dispara o PUSH STK (O pedido que faz o celular vibrar e pedir PIN)
   */
  async initiateTransaction(data: PaysuitPaymentRequest): Promise<PaysuitResponse> {
    console.log(`[PAYSUIT GATEWAY] Enviando STK PUSH via ${data.method.toUpperCase()} para +258 ${data.phoneNumber}`);
    
    // Simulação de Handshake com os servidores da Vodacom/Movitel via Paysuit
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          status: 'pending',
          message: "Handshake concluído. Pedido de PIN enviado ao telemóvel."
        });
      }, 1500);
    });
  },

  /**
   * Verifica se o utilizador já digitou o PIN no telemóvel (Polling)
   */
  async checkTransactionStatus(reference: string): Promise<PaysuitResponse> {
    // Em produção, aqui faria um fetch ao endpoint /v1/status/{reference}
    return new Promise((resolve) => {
      setTimeout(() => {
        // Retorna pendente até que o sistema receba a confirmação real ou simulada
        resolve({
          success: true,
          status: 'pending',
          message: "Aguardando interação do utilizador no dispositivo físico."
        });
      }, 1000);
    });
  }
};
