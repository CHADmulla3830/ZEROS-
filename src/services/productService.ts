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
import { Product, Order, Review, PromoCode } from '../types';
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
      // Remove undefined fields to prevent Firestore errors
      const cleanData = Object.fromEntries(
        Object.entries(orderData).filter(([_, v]) => v !== undefined)
      );
      
      const docRef = await addDoc(collection(db, 'orders'), {
        ...cleanData,
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

  async getPromoCodes(): Promise<PromoCode[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'promoCodes'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoCode));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'promoCodes');
      return [];
    }
  },

  async addPromoCode(data: Omit<PromoCode, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'promoCodes'), data);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'promoCodes');
      return '';
    }
  },

  async updatePromoCode(id: string, data: Partial<PromoCode>): Promise<void> {
    try {
      const docRef = doc(db, 'promoCodes', id);
      await updateDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `promoCodes/${id}`);
    }
  },

  async deletePromoCode(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'promoCodes', id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `promoCodes/${id}`);
    }
  },

  async validatePromoCode(code: string): Promise<PromoCode | null> {
    try {
      const q = query(collection(db, 'promoCodes'), where('code', '==', code), where('active', '==', true));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      const promo = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as PromoCode;
      
      // Check expiry
      if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) return null;
      
      return promo;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'promoCodes/validate');
      return null;
    }
  },

  async addProduct(data: Omit<Product, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...data,
        rating: 0,
        reviewsCount: 0
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
      return '';
    }
  },

  async getReviews(productId: string): Promise<Review[]> {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
      return [];
    }
  },

  async addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<void> {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'reviews'), {
        ...review,
        createdAt: now
      });

      // Update product rating
      const productRef = doc(db, 'products', review.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const productData = productSnap.data() as Product;
        const currentCount = productData.reviewsCount || 0;
        const currentRating = productData.rating || 0;
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + review.rating) / newCount;
        
        await updateDoc(productRef, {
          rating: Number(newRating.toFixed(1)),
          reviewsCount: newCount
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    }
  },

  async deleteReview(reviewId: string, productId: string): Promise<void> {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const reviewSnap = await getDoc(reviewRef);
      if (!reviewSnap.exists()) return;
      const reviewData = reviewSnap.data() as Review;

      await deleteDoc(reviewRef);

      // Update product rating
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const productData = productSnap.data() as Product;
        const currentCount = productData.reviewsCount || 0;
        const currentRating = productData.rating || 0;
        
        if (currentCount > 1) {
          const newCount = currentCount - 1;
          const newRating = ((currentRating * currentCount) - reviewData.rating) / newCount;
          await updateDoc(productRef, {
            rating: Number(newRating.toFixed(1)),
            reviewsCount: newCount
          });
        } else {
          await updateDoc(productRef, {
            rating: 0,
            reviewsCount: 0
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reviews/${reviewId}`);
    }
  },

  async getSiteContent(): Promise<any> {
    try {
      const docRef = doc(db, 'settings', 'siteContent');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        const defaultContent = {
          contactUs: "Contact us at support@zeros.com",
          refundPolicy: "No refunds for digital products once the key is revealed.",
          privacyPolicy: "We value your privacy...",
          termsOfService: "By using our site, you agree...",
          faq: "Frequently Asked Questions..."
        };
        try {
          await setDoc(docRef, defaultContent);
        } catch (e) {
          console.log("Failed to set default site content (likely permissions):", e);
        }
        return defaultContent;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'settings/siteContent');
      return {
        contactUs: "Contact us at support@zeros.com",
        refundPolicy: "No refunds for digital products once the key is revealed.",
        privacyPolicy: "We value your privacy...",
        termsOfService: "By using our site, you agree...",
        faq: "Frequently Asked Questions..."
      };
    }
  },

  async updateSiteContent(content: any): Promise<void> {
    try {
      const docRef = doc(db, 'settings', 'siteContent');
      await setDoc(docRef, content, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/siteContent');
    }
  },

  async seedProducts() {
    try {
      const products = [
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
          featured: true
        },
        {
          name: "Steam Wallet Card ($10)",
          description: "Global Steam Wallet Gift Card.",
          price: 1250,
          category: "PC Games",
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
          name: "Cyberpunk 2077",
          description: "Night City changes everyone. Experience the future of open-world RPG.",
          price: 3500,
          category: "PC Games",
          genre: "RPG",
          platform: "PC",
          publisher: "CD Projekt Red",
          releaseDate: "2020-12-10",
          popularity: 88,
          imageUrl: "https://picsum.photos/seed/cyberpunk/400/300",
          stock: 100,
          featured: false
        },
        {
          name: "Minecraft Java Edition",
          description: "Build, explore, and survive in the ultimate sandbox game.",
          price: 2200,
          category: "PC Games",
          genre: "Sandbox",
          platform: "PC",
          publisher: "Mojang",
          releaseDate: "2011-11-18",
          popularity: 99,
          imageUrl: "https://picsum.photos/seed/minecraft/400/300",
          stock: 200,
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
