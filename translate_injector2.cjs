const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'translations.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const newTranslations = {
    public_transparency_desc: "Consulte os dados públicos e anónimos sobre o impacto no setor agropecuário em Moçambique através da nossa plataforma.",
    public_prov_region: "Província / Região",
    public_analysis_period: "Período de Análise",
    public_users: "Utilizadores",
    public_vol_mzn: "Volume de Negócios MZN",
    public_prod_market: "Produtores no Mercado",
    public_strategic_info: "Informações Estratégicas",
    public_national: "Nacional",
    public_privacy_notice: "Nesta visão pública, os dados de identificação pessoal e os montantes exatos por indivíduo não são divulgados, garantindo a privacidade dos participantes da rede Agro-Suste.",
    public_impact_notice: "Os números apresentados refletem o impacto agregado do escoamento e transação de produtos nas províncias selecionadas.",
    public_interventions_record: "Registo de Intervenientes",
    public_buyers_registered: "Compradores Registados",
    public_transporters: "Transportadores",
    public_extensionists: "Extensionistas/Apoio",
    public_transaction_metrics: "Métricas de Transação",
    public_saved_operations: "Total de Operações Guardadas",
    public_platform_comm_generated: "Comissão da Plataforma Gerada",
    public_each_transaction: "Cada transação contribui para o escoamento de produtos e fortalecimento da economia agrícola do nosso país."
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
console.log('Translations part 2 successfully injected.');
