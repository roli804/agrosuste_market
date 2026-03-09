const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'translations.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const newTranslations = {
    admin_cumulative_commission: 'Comissão Acumulada (Total)',
    admin_identity_status: 'IDENTIDADE',
    admin_invalid_email: 'Por favor, introduza um endereço de email válido.',
    admin_entity_individual: 'INDIVIDUAL',
    admin_entity_strategic: 'ESTRATÉGICO',
    admin_historical_total: 'Total Histórico',
    public_total_historical: 'Total Histórico',
    checkout_subtotal_label: 'Subtotal',
    checkout_commission_label: 'Comissão da Plataforma (5%)',
    checkout_total_label: 'Total a Pagar',
    checkout_seller_receives: 'Valor para o Vendedor',
};

const keysString = Object.keys(newTranslations).map(k => `'${k}'`).join(' | ');
const typeRegex = /export type TranslationKey =([\s\S]*?);/;
content = content.replace(typeRegex, (match, p1) => {
    return `export type TranslationKey =${p1}  | ${keysString};`;
});

const langBlockRegex = /([a-z]{2,3}):\s*base\(\{([\s\S]*?)\}\),/g;
content = content.replace(langBlockRegex, (match, langCode, blockContent) => {
    let newData = '';
    for (const [key, value] of Object.entries(newTranslations)) {
        const safeValue = value.replace(/'/g, "\\'");
        newData += `    ${key}: '${safeValue}',\n`;
    }
    const updatedBlock = blockContent.replace(/\s*$/, `\n${newData}`);
    return `${langCode}: base({${updatedBlock}}),`;
});

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Translations part 3 successfully injected.');
