const fs = require('fs');
const path = require('path');
const targetFile = path.join(__dirname, 'translations.ts');
let content = fs.readFileSync(targetFile, 'utf8');
const newTranslations = {
    profile_bank_local: 'Banco Local',
    profile_name_as_id: 'Nome como no BI',
    profile_ex_product: 'Ex: Milho de Cuamba',
    profile_ex_price: '1500',
    profile_ex_unit: 'Saco 50kg',
    profile_ex_stock: '100',
    profile_ex_phone: '84 000 0000',
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
console.log('Profile placeholder translations injected.');
