
import { Category, Product, User, UserRole, EntityType } from './types';

export const ADMIN_EMAIL = 'jaimecebola001@gmail.com';
export const PLATFORM_COMMISSION_RATE = 0.05;


export const MOZ_GEOGRAPHY: Record<string, string[]> = {
  'Niassa': ['Cuamba', 'Lichinga', 'Mandimba', 'Metangula', 'Muembe', 'Lago', 'Marrupa', 'Mavago', 'Mecanhelas', 'Mecula', 'Ngauma', 'Nipepe', 'Sanga', 'Outro'],
  'Cabo Delgado': ['Pemba', 'Montepuez', 'Mocímboa da Praia', 'Chiúre', 'Macomia', 'Meluco', 'Muidumbe', 'Mueda', 'Namuno', 'Nangade', 'Palma', 'Quissanga', 'Ibo', 'Outro'],
  'Nampula': ['Nampula', 'Nacala', 'Angoche', 'Monapo', 'Ribáuè', 'Eráti', 'Lalaua', 'Larde', 'Liupo', 'Malema', 'Meconta', 'Mecubúri', 'Memba', 'Mogincual', 'Mogovolas', 'Moma', 'Mossuril', 'Muecate', 'Murrupula', 'Nacarôa', 'Rapale', 'Outro'],
  'Zambézia': ['Quelimane', 'Mocuba', 'Gurúè', 'Milange', 'Alto Molócuè', 'Chinde', 'Derre', 'Gile', 'Inhassunge', 'Luabo', 'Lugela', 'Maganja da Costa', 'Mopeia', 'Morrumbala', 'Namacurra', 'Namarroi', 'Nicoadala', 'Pebane', 'Outro'],
  'Tete': ['Tete', 'Moatize', 'Angónia', 'Mutarara', 'Cahora-Bassa', 'Changara', 'Chifunde', 'Chiuta', 'Dôa', 'Macanga', 'Magoè', 'Marara', 'Mágoè', 'Tsangano', 'Zumbo', 'Outro'],
  'Manica': ['Chimoio', 'Manica', 'Gondola', 'Mossurize', 'Báruè', 'Guro', 'Macate', 'Machaze', 'Sussundenga', 'Tambara', 'Outro'],
  'Sofala': ['Beira', 'Dondo', 'Nhamatanda', 'Buzi', 'Caia', 'Chemba', 'Cheringoma', 'Chibabava', 'Gorongosa', 'Machanga', 'Maringue', 'Muanza', 'Marromeu', 'Outro'],
  'Inhambane': ['Inhambane', 'Maxixe', 'Vilankulo', 'Massinga', 'Funhalouro', 'Govuro', 'Homoíne', 'Inharrime', 'Jangamo', 'Mabote', 'Morrumbene', 'Panda', 'Zavala', 'Outro'],
  'Gaza': ['Xai-Xai', 'Chókwè', 'Chibuto', 'Bilene', 'Chicualacuala', 'Chigubo', 'Guijá', 'Limpopo', 'Mabalane', 'Mandlakazi', 'Massangena', 'Massingir', 'Outro'],
  'Maputo Província': ['Matola', 'Boane', 'Manhiça', 'Marracuene', 'Magude', 'Matutuíne', 'Moamba', 'Namaacha', 'Outro'],
  'Maputo Cidade': ['KaMpfumo', 'Nlhamankulu', 'KaMaxakeni', 'KaMavota', 'KaMubukwana', 'KaTembe', 'KaNyaka', 'Outro']
};

export const WORLD_COUNTRIES = [
  "Afeganistão", "África do Sul", "Albânia", "Alemanha", "Andorra", "Angola", "Antígua e Barbuda", "Arábia Saudita", "Argélia", "Argentina", "Arménia", "Austrália", "Áustria", "Azerbaijão", "Bahamas", "Bangladexe", "Barbados", "Barém", "Bélgica", "Belize", "Benim", "Bielorrússia", "Bolívia", "Bósnia e Herzegovina", "Botsuana", "Brasil", "Brunei", "Bulgária", "Burquina Faso", "Burundi", "Butão", "Cabo Verde", "Camarões", "Camboja", "Canadá", "Catar", "Cazaquistão", "Chade", "Chéquia", "Chile", "China", "Chipre", "Colômbia", "Comores", "Congo-Brazzaville", "Coreia do Norte", "Coreia do Sul", "Costa do Marfim", "Costa Rica", "Croácia", "Cuba", "Dinamarca", "Djibuti", "Dominica", "Egito", "El Salvador", "Emirados Árabes Unidos", "Equador", "Eritreia", "Eslováquia", "Eslovénia", "Espanha", "Essuatíni", "Estados Unidos", "Estónia", "Etiópia", "Fiji", "Filipinas", "Finlândia", "França", "Gabão", "Gâmbia", "Gana", "Geórgia", "Granada", "Grécia", "Guatemala", "Guiana", "Guiné", "Guiné Equatorial", "Guiné-Bissau", "Haiti", "Honduras", "Hungria", "Iémen", "Ilhas Marechal", "Índia", "Indonésia", "Irão", "Iraque", "Irlanda", "Islândia", "Israel", "Itália", "Jamaica", "Japão", "Jordânia", "Laus", "Lesoto", "Letónia", "Líbano", "Libéria", "Líbia", "Listenstaine", "Lituânia", "Luxemburgo", "Macedónia do Norte", "Madagascar", "Malásia", "Maláui", "Maldivas", "Mali", "Malta", "Marrocos", "Maurícia", "Mauritânia", "México", "Mianmar", "Micronésia", "Moçambique", "Moldávia", "Mónaco", "Mongólia", "Montenegro", "Namíbia", "Nauru", "Nepal", "Nicarágua", "Níger", "Nigéria", "Noruega", "Nova Zelândia", "Omã", "Países Baixos", "Palau", "Panamá", "Papua Nova Guiné", "Paquistão", "Paraguai", "Peru", "Polónia", "Portugal", "Quénia", "Quirguistão", "Quiribáti", "Reino Unido", "República Centro-Africana", "República Dominicana", "Roménia", "Ruanda", "Rússia", "Salomão", "Samoa", "Santa Lúcia", "São Cristóvão e Neves", "São Marinho", "São Tomé e Príncipe", "São Vicente e Granadinas", "Seicheles", "Senegal", "Serra Leoa", "Sérvia", "Singapura", "Síria", "Somália", "Sri Lanca", "Sudão", "Sudão do Sul", "Suécia", "Suíça", "Suriname", "Tailândia", "Taiuã", "Tajiquistão", "Tanzânia", "Timor-Leste", "Togo", "Tonga", "Trindade e Tobago", "Tunísia", "Turquemenistão", "Turquia", "Tuvalu", "Ucrânia", "Uganda", "Uruguai", "Usbequistão", "Vanuatu", "Vaticano", "Venezuela", "Vietname", "Zâmbia", "Zimbabué"
];

export const WORLD_LANGUAGES = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'ru', name: 'Русский (Russian)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'jv', name: 'Basa Jawa (Javanese)' },
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'vi', name: 'Tiếng Việt (Vietnamese)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ur', name: 'اردو (Urdu)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'my', name: 'မြန်မာ (Burmese)' },
  { code: 'am', name: 'አማርኛ (Amharic)' },
  { code: 'fa', name: 'فارسی (Persian)' },
  { code: 'ha', name: 'Hausa' },
  { code: 'yo', name: 'Yorùbá' },
  { code: 'ig', name: 'Igbo' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'zu', name: 'isiZulu' },
  { code: 'ny', name: 'Chichewa' },
  { code: 'sn', name: 'ChiShona' },
  { code: 'st', name: 'Sesotho' },
  { code: 'xh', name: 'isiXhosa' },
  { code: 'af', name: 'Afrikaans' }
];

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Cereais', icon: '🌾', is_active: true },
  { id: '2', name: 'Leguminosas', icon: '🫘', is_active: true },
  { id: '3', name: 'Hortícolas', icon: '🥬', is_active: true },
  { id: '4', name: 'Frutas', icon: '🍎', is_active: true },
  { id: '5', name: 'Raízes', icon: '🥔', is_active: true },
  { id: '6', name: 'Insumos', icon: '🚜', is_active: true },
];

// Added missing status, commercialPhone, and linkedAccounts properties to each mock user to satisfy User interface requirements
export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'comprador1@gmail.com', fullName: 'Carlos Macuácua', phone: '841234567', commercialPhone: '841234567', country: 'Moçambique', role: UserRole.BUYER, isApproved: true, status: 'active', linkedAccounts: [] },
  { id: 'u2', email: 'vendedor1@gmail.com', fullName: 'Cooperativa Cuamba A', phone: '829876543', commercialPhone: '829876543', country: 'Moçambique', role: UserRole.SELLER, isApproved: true, status: 'active', linkedAccounts: [], categories: ['1', '2'] },
  { id: 'u3', email: 'china_agro@export.com', fullName: 'Zhang Wei', phone: '+86 138 0000', commercialPhone: '+86 138 0000', country: 'China', role: UserRole.BUYER, isApproved: true, status: 'active', linkedAccounts: [] },
  { id: 'p1', email: 'parceiro1@ong.org', fullName: 'ONG Ajuda Mútua', phone: '840000001', commercialPhone: '840000001', country: 'Moçambique', role: UserRole.STRATEGIC_PARTNER, isApproved: true, status: 'active', linkedAccounts: [], entityType: EntityType.NGO_INTL, entityName: 'Ajuda Mútua', logo: 'https://images.unsplash.com/photo-1599305090598-fe179d501c27?auto=format&fit=crop&q=80&w=200' },
  { id: 'p2', email: 'parceiro2@agro.com', fullName: 'Agro Invest', phone: '840000002', commercialPhone: '840000002', country: 'Moçambique', role: UserRole.STRATEGIC_PARTNER, isApproved: true, status: 'active', linkedAccounts: [], entityType: EntityType.COMPANY, entityName: 'Agro Invest', logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200' },
  { id: 'p3', email: 'parceiro3@banco.mz', fullName: 'Banco de Fomento', phone: '840000003', commercialPhone: '840000003', country: 'Moçambique', role: UserRole.STRATEGIC_PARTNER, isApproved: true, status: 'active', linkedAccounts: [], entityType: EntityType.COMPANY, entityName: 'Banco de Fomento', logo: 'https://images.unsplash.com/photo-1541873676947-9c6196bc97f3?auto=format&fit=crop&q=80&w=200' },
  { id: 'p4', email: 'parceiro4@logistica.mz', fullName: 'Logística Nacional', phone: '840000004', commercialPhone: '840000004', country: 'Moçambique', role: UserRole.STRATEGIC_PARTNER, isApproved: true, status: 'active', linkedAccounts: [], entityType: EntityType.COMPANY, entityName: 'Logística Nacional', logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=200' }
];

export const MOCK_PRODUCTS: Product[] = [
  // CEREAIS (cat 1)
  { id: 'p1', producerId: 's1', categoryId: '1', name: 'Milho Branco de Cuamba', description: 'Milho branco seco de alta qualidade, peneirado e pronto para moagem.', price: 1550, unit: 'Saco 50kg', stock: 120, images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=800'], isDried: true },
  { id: 'p2', producerId: 's1', categoryId: '1', name: 'Arroz Carolino da Zambézia', description: 'Arroz branco de grão longo, colheita recente. Ideal para exportação.', price: 2200, unit: 'Saco 50kg', stock: 80, images: ['https://images.unsplash.com/photo-1536304993881-ff86e0c9f27a?auto=format&fit=crop&q=80&w=800'], isDried: true },
  { id: 'p3', producerId: 's2', categoryId: '1', name: 'Sorgo Vermelho de Angónia', description: 'Sorgo de alta resistência à seca, excelente para ração animal e consumo humano.', price: 950, unit: 'Saco 50kg', stock: 200, images: ['https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?auto=format&fit=crop&q=80&w=800'], isDried: true },
  { id: 'p4', producerId: 's2', categoryId: '1', name: 'Mapira de Nampula', description: 'Mapira tradicional moçambicana. Usada para a preparação de uji e cerveja tradicional.', price: 800, unit: 'Saco 50kg', stock: 300, images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6962c3?auto=format&fit=crop&q=80&w=800'], isDried: false },
  // LEGUMINOSAS (cat 2)
  { id: 'p5', producerId: 's1', categoryId: '2', name: 'Feijão Nhemba de Chimoio', description: 'Feijão nhemba seco de primeira qualidade, rico em proteínas. Muito procurado no mercado regional.', price: 1800, unit: 'Saco 50kg', stock: 90, images: ['https://images.unsplash.com/photo-1612257999756-4f6792c7a1b7?auto=format&fit=crop&q=80&w=800'], isDried: true },
  { id: 'p6', producerId: 's2', categoryId: '2', name: 'Amendoim Descascado Gurùè', description: 'Amendoim descascado e seco ao sol, pronto para consumo ou produção de óleo artesanal.', price: 2500, unit: 'Saco 25kg', stock: 60, images: ['https://images.unsplash.com/photo-1567892737950-30c4db37cd89?auto=format&fit=crop&q=80&w=800'], isDried: true },
  { id: 'p7', producerId: 's3', categoryId: '2', name: 'Soja Orgânica de Tete', description: 'Soja produzida sem pesticidas. Certificada pela cooperativa regional de Tete.', price: 2100, unit: 'Saco 50kg', stock: 150, images: ['https://images.unsplash.com/photo-1601593768799-76e90e9e5b19?auto=format&fit=crop&q=80&w=800'], isDried: false },
  { id: 'p8', producerId: 's3', categoryId: '2', name: 'Ervilha Seca da Gaza', description: 'Ervilha seca cultivada no distrito de Chókwè. Excelente para sopas e guisados.', price: 1600, unit: 'Saco 50kg', stock: 70, images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800'], isDried: true },
  // HORTÍCOLAS (cat 3)
  { id: 'p9', producerId: 's4', categoryId: '3', name: 'Tomate Fresco de Inhambane', description: 'Tomate redondo fresco recém-colhido. Tratamento natural sem químicos.', price: 350, unit: 'Crate 20kg', stock: 500, images: ['https://images.unsplash.com/photo-1524593166156-312f362cada0?auto=format&fit=crop&q=80&w=800'], isDried: false },
  { id: 'p10', producerId: 's4', categoryId: '3', name: 'Couve Repolho de Manica', description: 'Repolho verde fresco. Cultivado nas planícies irrigadas de Chimoio.', price: 250, unit: 'Unidade (3–4kg)', stock: 300, images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=800'], isDried: false },
  { id: 'p11', producerId: 's4', categoryId: '3', name: 'Cebola Roxa de Nampula', description: 'Cebola roxa de sabor intenso, ideal para condimentos e conservas.', price: 480, unit: 'Saco 20kg', stock: 180, images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=800'], isDried: false },
  { id: 'p12', producerId: 's5', categoryId: '3', name: 'Alho Seco de Angónia', description: 'Alho seco e curado em condições ideais. Mínimo de 6 meses de conservação.', price: 1200, unit: 'Saco 10kg', stock: 90, images: ['https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&q=80&w=800'], isDried: true },
  // FRUTAS (cat 4)
  { id: 'p13', producerId: 's5', categoryId: '4', name: 'Manga Espada de Quelimane', description: 'Manga doce e suculenta da variedade espada. Colheita de verão.', price: 150, unit: 'Caixa 15kg', stock: 400, images: ['https://images.unsplash.com/photo-1605027990121-cbae9e0642e9?auto=format&fit=crop&q=80&w=800'], isDried: false },
  { id: 'p14', producerId: 's5', categoryId: '4', name: 'Cajú Natural de Inhambane', description: 'Cajú maduro e doce, apanhado manualmente. Produto de comércio justo certificado.', price: 600, unit: 'Saco 20kg', stock: 250, images: ['https://images.unsplash.com/photo-1598512752271-33f913a5af13?auto=format&fit=crop&q=80&w=800'], isDried: false },
  { id: 'p15', producerId: 's5', categoryId: '4', name: 'Banana Prata de Nampula', description: 'Banana da terra (prata) madura. Rica em potássio e energia.', price: 200, unit: 'Cacho (10–15kg)', stock: 600, images: ['https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&q=80&w=800'], isDried: false },
  { id: 'p16', producerId: 's6', categoryId: '4', name: 'Papaia Formosa de Cabo Delgado', description: 'Papaia grande e madura. Polpa laranja brilhante, sabor tropical intenso.', price: 280, unit: 'Unidade (2–3kg)', stock: 350, images: ['https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&q=80&w=800'], isDried: false },
  // RAÍZES / TUBÉRCULOS (cat 5)
  { id: 'p17', producerId: 's6', categoryId: '5', name: 'Mandioca Doce de Sofala', description: 'Mandioca de variedade doce, cultivada em solos argilosos do litoral de Sofala.', price: 450, unit: 'Saco 50kg', stock: 220, images: ['https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&q=80&w=800'], isDried: false },
  { id: 'p18', producerId: 's6', categoryId: '5', name: 'Batata-Doce Roxa de Manica', description: 'Batata-doce de polpa roxa, rica em antioxidantes. Colheita de época de chuvas.', price: 550, unit: 'Saco 30kg', stock: 180, images: ['https://images.unsplash.com/photo-1592649043059-7e3afd96a19e?auto=format&fit=crop&q=80&w=800'], isDried: false },
  // INSUMOS (cat 6)
  { id: 'p19', producerId: 's7', categoryId: '6', name: 'Adubo Orgânico Composto', description: 'Composto orgânico produzido a partir de resíduos vegetais. Melhora a fertilidade do solo por 6 meses.', price: 1200, unit: 'Saco 25kg', stock: 500, images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=800'], isDried: false },
  { id: 'p20', producerId: 's7', categoryId: '6', name: 'Sementes Certificadas de Milho', description: 'Sementes híbridas certificadas pelo IIAM. Alta taxa de germinação (95%). Resistentes à seca.', price: 890, unit: 'Pacote 5kg', stock: 300, images: ['https://images.unsplash.com/photo-1591405351990-4726e331f141?auto=format&fit=crop&q=80&w=800'], isDried: false },
  { id: 'p21', producerId: 's7', categoryId: '6', name: 'Kit Irrigação de Pequena Escala', description: 'Kit de irrigação por gotejamento para 500m². Inclui mangueiras, emissores e filtro.', price: 4500, unit: 'Kit Completo', stock: 40, images: ['https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=800'], isDried: false },
];
