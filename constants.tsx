
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
  { code: 'pt', name: 'Português (PT)' }
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
  { id: 'u1', email: 'jaimecebola001@gmail.com', fullName: 'Jaime Cebola', phone: '840000000', commercialPhone: '840000000', country: 'Moçambique', role: UserRole.ADMIN, isApproved: true, status: 'active', linkedAccounts: [], province: 'Maputo Cidade', district: 'KaMpfumo' },
  { id: 'p1', email: 'parceiro1@ong.org', fullName: 'ONG Ajuda Mútua', phone: '840000001', commercialPhone: '840000001', country: 'Moçambique', role: UserRole.STRATEGIC_PARTNER, isApproved: true, status: 'active', linkedAccounts: [], entityType: EntityType.NGO_INTL, entityName: 'Ajuda Mútua', province: 'Maputo Cidade', district: 'KaMpfumo', logo: 'https://images.unsplash.com/photo-1599305090598-fe179d501c27?auto=format&fit=crop&q=80&w=200' },
  { id: 'p2', email: 'parceiro2@agro.com', fullName: 'Agro Invest', phone: '840000002', commercialPhone: '840000002', country: 'Moçambique', role: UserRole.STRATEGIC_PARTNER, isApproved: true, status: 'active', linkedAccounts: [], entityType: EntityType.COMPANY, entityName: 'Agro Invest', province: 'Maputo Província', district: 'Matola', logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200' }
];

export const MOCK_PRODUCTS: Product[] = [
  // CEREAIS (cat 1)
  { id: 'p1', producerId: 's1', categoryId: '1', name: 'Milho Branco de Cuamba', description: 'Milho branco seco de alta qualidade, peneirado e pronto para moagem.', price: 1550, unit: 'Saco 50kg', stock: 120, images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=800'], isDried: true },
  { id: 'p2', producerId: 's1', categoryId: '1', name: 'Arroz Carolino da Zambézia', description: 'Arroz branco de grão longo, colheita recente. Ideal para exportação.', price: 2200, unit: 'Saco 50kg', stock: 80, images: ['https://images.unsplash.com/photo-1536304993881-ff86e0c9f27a?auto=format&fit=crop&q=80&w=800'], isDried: true },
  // LEGUMINOSAS (cat 2)
  { id: 'p5', producerId: 's1', categoryId: '2', name: 'Feijão Nhemba de Chimoio', description: 'Feijão nhemba seco de primeira qualidade, rico em proteínas. Muito procurado no mercado regional.', price: 1800, unit: 'Saco 50kg', stock: 90, images: ['https://images.unsplash.com/photo-1612257999756-4f6792c7a1b7?auto=format&fit=crop&q=80&w=800'], isDried: true }
];
