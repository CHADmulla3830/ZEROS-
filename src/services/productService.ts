import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  query, 
  where, 
  setDoc,
  deleteDoc,
  orderBy,
  arrayUnion,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Order } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';

export const ProductService = {
  async getAllProducts(): Promise<Product[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'products');
      return [];
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Product) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `products/${id}`);
      return null;
    }
  },

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'statusLog'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        createdAt: now,
        status: 'pending',
        statusLog: [{ status: 'pending', timestamp: now }]
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      return '';
    }
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      return [];
    }
  },

  async getAllOrders(): Promise<Order[]> {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      return [];
    }
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      const docRef = doc(db, 'orders', orderId);
      const now = new Date().toISOString();
      await updateDoc(docRef, { 
        status,
        statusLog: arrayUnion({ status, timestamp: now })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    try {
      const docRef = doc(db, 'products', id);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'products', id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  },

  async deleteOrder(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'orders', id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
    }
  },

  async addProduct(data: Omit<Product, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'products'), data);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
      return '';
    }
  },

  async seedProducts() {
    try {
      const products = [
        {
          name: "PUBG Mobile UC",
          description: "Unknown Cash for PUBG Mobile. Instant delivery.",
          price: 85,
          category: "Mobile Games",
          genre: "Battle Royale",
          platform: "Mobile",
          publisher: "Tencent",
          releaseDate: "2018-03-19",
          popularity: 95,
          imageUrl: "https://picsum.photos/seed/pubg/400/300",
          stock: 1000,
          featured: true
        },
        {
          name: "Free Fire Diamonds",
          description: "Top up diamonds for Garena Free Fire.",
          price: 75,
          category: "Mobile Games",
          genre: "Battle Royale",
          platform: "Mobile",
          publisher: "Garena",
          releaseDate: "2017-09-30",
          popularity: 98,
          imageUrl: "https://picsum.photos/seed/freefire/400/300",
          stock: 1000,
          featured: true
        },
        {
          name: "Steam Wallet Card ($10)",
          description: "Global Steam Wallet Gift Card.",
          price: 1250,
          category: "Gift Cards",
          genre: "Currency",
          platform: "PC",
          publisher: "Valve",
          releaseDate: "2012-05-01",
          popularity: 90,
          imageUrl: "https://picsum.photos/seed/steam/400/300",
          stock: 50,
          featured: true
        },
        {
          name: "Valorant Points (VP)",
          description: "Riot Points for Valorant. Bangladesh Region.",
          price: 450,
          category: "PC Games",
          genre: "FPS",
          platform: "PC",
          publisher: "Riot Games",
          releaseDate: "2020-06-02",
          popularity: 92,
          imageUrl: "https://picsum.photos/seed/valorant/400/300",
          stock: 500,
          featured: false
        }
      ];

      const snapshot = await getDocs(collection(db, 'products'));
      if (snapshot.empty) {
        for (const p of products) {
          await addDoc(collection(db, 'products'), p);
        }
      }
    } catch (error) {
      console.log("Seeding skipped or failed (likely due to permissions):", error);
    }
  }
};
