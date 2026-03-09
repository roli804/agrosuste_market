const fs = require('fs');
const path = require('path');
const targetFile = path.join(__dirname, 'translations.ts');
let content = fs.readFileSync(targetFile, 'utf8');
const newTranslations = {
    product_not_found: 'Produto não encontrado.',
    product_back_market: 'Voltar ao mercado',
    product_dried_badge: 'MILHO/FEIJÃO SECO',
    product_add_cart: 'Adicionar ao Carrinho',
    product_price_per: 'Preço por',
    product_in_stock: 'Em stock',
    product_local_logistics: 'Logística Local',
    product_available_for: 'Disponível para Cuamba',
    product_verified: 'Verificado',
    product_quality_label: 'Qualidade Agro-Suste',
    product_category_label: 'Categoria ID',
};
const keysString = Object.keys(newTranslations).map(k => `'${k}'`).join(' | ');
const typeRegex = /export type TranslationKey =([\s\S]*?);/;
content = content.replace(typeRegex, (match, p1) => `export type TranslationKey =${p1}  | ${keysString};`);
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
console.log('ProductDetail translations injected.');
