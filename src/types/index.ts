export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'user' | 'admin';
  wishlist?: string[];
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  genre: string;
  platform: string;
  publisher: string;
  releaseDate: string;
  popularity: number; // 0-100
  imageUrl: string;
  stock: number;
  featured?: boolean;
}

export interface OrderStatusLog {
  status: 'pending' | 'completed' | 'cancelled';
  timestamp: string;
}

export interface Order {
  id: string;
  userId: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  paymentMethod: 'bkash' | 'nagad';
  paymentNumber: string;
  transactionId: string;
  status: 'pending' | 'completed' | 'cancelled';
  statusLog: OrderStatusLog[];
  createdAt: string;
}
