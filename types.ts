
export enum UserRole {
  BUYER = 'comprador',
  SELLER = 'produtor',
  TRANSPORTER = 'transportador',
  EXTENSIONIST = 'extensionista',
  ADMIN = 'administrador',
  STRATEGIC_PARTNER = 'parceiro_estrategico',
  OTHER = 'outro'
}

export enum EntityType {
  INDIVIDUAL = 'individual',
  ASSOCIATION = 'associacao',
  COOPERATIVE = 'cooperativa',
  COMPANY = 'empresa',
  NGO_INTL = 'ong_internacional',
  OTHER = 'outro'
}

export enum PaymentMethod {
  MPESA = 'mpesa',
  EMOLA = 'emola',
  BANK_LOCAL = 'bank_local',
  CARD = 'card',
  BANK_INTL = 'bank_intl'
}

export interface PaymentAccount {
  id: string;
  type: 'wallet' | 'bank';
  method: PaymentMethod;
  provider: string; // Ex: Vodacom, Standard Bank
  accountNumber: string;
  holderName: string;
  isVerified: boolean;
  linkedAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  commercialPhone: string;
  country: string;
  province?: string;
  district?: string;
  // Added missing operational fields
  entityType?: EntityType;
  entityName?: string;
  posto?: string;
  localidade?: string;
  role: UserRole;
  entityId?: string;
  isApproved: boolean;
  balance?: number;
  status: 'active' | 'inactive' | 'blocked';
  linkedAccounts: PaymentAccount[];
  // Novos campos solicitados
  categories?: string[]; // Categorias de produtos que vende
  documents?: {
    nuit?: string;
    alvara?: string;
    estatuto?: string;
    boletim?: string;
  };
  logo?: string; // Logotipo para parceiros/ONGs
  location?: string; // Localização para parceiros
}

export interface Vehicle {
  id: string;
  type: string;
  plate: string;
  capacity: string;
  licenseValidity: string;
  insuranceValidity: string;
  status: 'regular' | 'expired' | 'maintenance';
}

export interface AssistanceVisit {
  id: string;
  extensionistId: string;
  producerEntityId: string;
  date: string;
  type: string;
  notes: string;
  district: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  producerId: string;
  producerName?: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  images: string[];
  isDried: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export enum OrderStatus {
  PENDING = 'pendente',
  PAID = 'pago',
  DELIVERED = 'entregue',
  CANCELLED = 'cancelado'
}

export interface Order {
  id: string;
  buyerId?: string;
  buyerName: string;
  buyerPhone: string;
  items: CartItem[];
  subtotal: number;
  commission: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  province?: string;
  district?: string;
  createdAt: string;
}

export enum LogType {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  PURCHASE = 'COMPRA',
  PRODUCT_ADD = 'ADD_PRODUTO',
  PRODUCT_DEL = 'DEL_PRODUTO',
  SYSTEM = 'SISTEMA'
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  type: LogType;
  description: string;
  timestamp: string;
  details?: any;
}