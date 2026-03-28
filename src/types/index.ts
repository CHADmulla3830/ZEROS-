export type UserRole = 'user' | 'admin' | 'product_manager' | 'manager' | 'editor' | 'super_admin' | 'content_manager' | 'sales_manager';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  wishlist?: string[];
  recentlyViewed?: string[];
  createdAt: string;
  promoUsage?: { [promoId: string]: number }; // Track usage per user
}

export interface ProductVersion {
  name: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Default or base price
  priceRange?: { min: number; max: number };
  category: string;
  genre: string;
  platform: string;
  publisher: string;
  releaseDate: string;
  popularity: number; // 0-100
  imageUrl: string;
  stock: number; // Total stock
  featured?: boolean;
  rating?: number;
  reviewsCount?: number;
  discountPrice?: number;
  warranty?: string; // Optional warranty info
  versions?: ProductVersion[]; // e.g., Special Edition, Active Account
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  expiryDate?: string;
  active: boolean;
  usageLimitPerUser?: number;
}

export interface OrderStatusLog {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'cancellation_requested' | 'cancellation_approved' | 'cancellation_rejected';
  timestamp: string;
}

export interface Order {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    version?: string;
  }[];
  totalAmount: number;
  discountAmount?: number;
  promoCode?: string;
  paymentMethod: 'bkash' | 'nagad';
  paymentNumber: string;
  transactionId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'cancellation_requested' | 'cancellation_approved' | 'cancellation_rejected';
  statusLog: OrderStatusLog[];
  createdAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  cancellationReason?: string;
  cancellationRejectionReason?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  rating: number;
  comment: string;
  createdAt: string;
}
