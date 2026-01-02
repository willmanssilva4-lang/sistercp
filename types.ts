
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  STOCKIST = 'STOCKIST'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Optional for creation
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  paymentTerms?: string; // Ex: "30 dias", "À vista"
  notes?: string;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit: number;
  debtBalance: number;
}

export interface Product {
  id: string;
  code: string; // Barcode
  name: string;
  category: string;
  subcategory?: string; // New field
  brand?: string; // New field
  supplier?: string; // New field
  unit: 'UN' | 'KG' | 'L' | 'CX' | 'PCT';
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQty: number; // Qty to trigger wholesale price
  stock: number;
  minStock: number;
  expiryDate?: string;
}

export interface CartItem extends Product {
  cartItemId: string; // Unique ID for the cart row (allows duplicate products as separate lines)
  qty: number;
  appliedPrice: number; // The actual price used (retail vs wholesale)
  subtotal: number;
}

export interface Sale {
  id: string;
  timestamp: string;
  cashierId: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'CASH' | 'CREDIT' | 'DEBIT' | 'PIX' | 'FIADO' | 'MULTIPLE';
  payments?: { method: string; amount: number }[];
  status: 'COMPLETED' | 'PENDING' | 'CANCELED';
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  date: string; // Date of occurrence
  dueDate?: string; // For accounts payable/receivable
  description: string;
  status: 'PAID' | 'PENDING';
  items?: { name: string; code: string; qty: number; costPrice: number }[]; // Items bought (if Purchase)
}

export interface Promotion {
  id: string;
  name: string;
  type: 'SIMPLE_DISCOUNT'; // Future: BUY_X_GET_Y
  productCode: string; // Link to product
  promotionalPrice: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface ProductKit {
  id: string;
  name: string;
  code: string; // Virtual barcode for the kit
  price: number;
  unit?: string;
  items: { productCode: string; qty: number }[];
  active: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'ENTRY' | 'EXIT';
  qty: number;
  date: string;
  reason: string;
}

export interface StockBatch {
  id: string;
  productId: string;
  transactionId?: string;
  qtyOriginal: number;
  qtyRemaining: number;
  costPrice: number;
  purchaseDate: string;
  expiryDate?: string;
}

export interface AppState {
  user: User | null;
  products: Product[];
  sales: Sale[];
  transactions: Transaction[];
  cart: CartItem[];
  promotions: Promotion[];
  kits: ProductKit[];
  customers: Customer[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
}
