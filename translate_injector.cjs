const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'translations.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const newTranslations = {
    app_connection_error: "Erro de Conexão",
    app_connection_failed: "Não foi possível conectar ao servidor real. As funcionalidades poderão estar limitadas a testes locais.",
    app_connection_failed_dns: "Não foi possível conectar ao servidor de dados. Verifique sua conexão ou configurações de DNS.",
    app_try_again: "Tentar Novamente",
    nav_transparency: "Transparência",
    admin_sales_volume: "Volume Vendas",
    admin_transactions: "Total Transações",
    admin_email_btn: "📧 Enviar",
    admin_pdf_btn: "Gerar PDF",
    admin_email_prompt: "Digite o email do destinatário para enviar o relatório (Simulação):",
    admin_email_success: "Relatório PDF enviado com sucesso para",
    checkout_order_id: "ID do Pedido",
    checkout_subtotal: "Subtotal",
    checkout_commission: "Comissão Agro-Suste",
    checkout_total: "Total a Pagar",
    checkout_mpesa: "M-Pesa",
    checkout_emola: "e-Mola",
    checkout_bank: "Transferência Bancária",
    checkout_confirm_order: "Confirmar Encomenda",
    checkout_pay_with: "Pagar com",
    checkout_back_shop: "Voltar à Loja",
    checkout_receipt: "Recibo",
    public_transparency_title: "Portal de Transparência",
    public_transparency_subtitle: "Dados abertos sobre o impacto da plataforma Agro-Suste Market na economia moçambicana.",
    public_impact_overview: "Visão Geral de Impacto",
    public_active_producers: "Produtores Ativos",
    public_inst_partners: "Parceiros Institucionais",
    public_total_operations: "Operações Realizadas",
    public_platform_commission: "Comissão Estimada",
    public_filter_data: "Filtrar Dados",
    public_all_provinces: "Todas as Províncias",
    public_all_months: "Todos os Meses",
    public_download_pdf: "Descarregar PDF",
    public_pdf_title: "Relatório Público de Impacto Agropecuário",
    public_pdf_desc: "Documento Público gerado automaticamente pelo sistema.",
    home_dry_grain: "Grão seco",
    home_per_unit: "Por"
};

// 1. Add keys to TranslationKey type
const keysString = Object.keys(newTranslations).map(k => `'${k}'`).join(' | ');
const typeRegex = /export type TranslationKey =([\s\S]*?);/;
content = content.replace(typeRegex, (match, p1) => {
    return `export type TranslationKey =${p1}  | ${keysString};`;
});

// 2. Inject into every language block
const langBlockRegex = /([a-z]{2,3}):\s*base\(\{([\s\S]*?)\}\),/g;

content = content.replace(langBlockRegex, (match, langCode, blockContent) => {
    let newData = '';
    for (const [key, value] of Object.entries(newTranslations)) {
        // Escape single quotes in value
        const safeValue = value.replace(/'/g, "\\'");
        newData += `    ${key}: '${safeValue}',\n`;
    }

    // Append new data before the closing brace of the base object
    // Find the last actual code line in blockContent to append safely, or just append at the end
    const updatedBlock = blockContent.replace(/\s*$/, `\n${newData}`);
    return `${langCode}: base({${updatedBlock}}),`;
});

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Translations successfully injected.');
