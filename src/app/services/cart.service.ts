import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { CartItem } from '../models/cart-item';
import { Product } from '../models/product';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private apiUrl = 'http://localhost:3000/orders';
    private items: CartItem[] = [];
    private cartSubject = new BehaviorSubject<CartItem[]>([]);

    cart$ = this.cartSubject.asObservable();

    constructor(private http: HttpClient, private authService: AuthService) { }

    getCart(): CartItem[] {
        return this.items;
    }

    getItemCount(): number {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    getTotal(): number {
        return this.items.reduce(
            (total, item) => total + item.product.price * item.quantity,
            0
        );
    }

    addToCart(product: Product, quantity: number): void {
        const existing = this.items.find(i => i.product.id === product.id);
        if (existing) {
            existing.quantity += quantity;
        } else {
            this.items.push({ product, quantity });
        }
        this.cartSubject.next([...this.items]);
    }

    removeFromCart(productId: number): void {
        this.items = this.items.filter(i => i.product.id !== productId);
        this.cartSubject.next([...this.items]);
    }

    updateQuantity(productId: number, quantity: number): void {
        const item = this.items.find(i => i.product.id === productId);
        if (item) {
            item.quantity = quantity;
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                this.cartSubject.next([...this.items]);
            }
        }
    }

    clearCart(): void {
        this.items = [];
        this.cartSubject.next([]);
    }

    // Submit order to mock backend
    submitOrder(): Observable<any> {
        const token = this.authService.getToken();
        const currentUser = this.authService.getCurrentUser();

        if (!token || !currentUser) {
            throw new Error('User must be authenticated');
        }

        // Create order payload mockup
        const order = {
            id: Math.floor(Math.random() * 1000).toString(),
            userId: currentUser.id,
            status: 'active',
            items: [...this.items],
            total: this.getTotal(),
            createdAt: new Date()
        };

        console.log('Order submitted (mock):', order);
        this.clearCart();
        return of(order);
    }
}
