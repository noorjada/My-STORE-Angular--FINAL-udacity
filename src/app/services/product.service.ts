import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Product } from '../models/product';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private apiUrl = 'assets/data.json';
    private localAddedProducts: Product[] = [];
    private localUpdatedProducts: Map<number, Product> = new Map();
    private localDeletedProducts: Set<number> = new Set();

    constructor(private http: HttpClient) { }

    getProducts(): Observable<Product[]> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => {
                const products = Array.isArray(response) ? response : (response.products || []);
                // Apply tracked updates and deletes
                let currentProducts = products
                    .filter((p: Product) => !this.localDeletedProducts.has(p.id))
                    .map((p: Product) => this.localUpdatedProducts.has(p.id) ? this.localUpdatedProducts.get(p.id)! : p);

                // Merge JSON products with any locally added mock products
                const allProducts = [...currentProducts, ...this.localAddedProducts];
                // removing duplicates by ID just in case
                const uniqueIds = new Set();
                return allProducts.filter((p: Product) => {
                    if (uniqueIds.has(p.id)) return false;
                    uniqueIds.add(p.id);
                    return true;
                });
            }),
            catchError(error => {
                console.error('Error fetching from data.json:', error);
                return of(this.localAddedProducts);
            })
        );
    }

    getProduct(id: number): Observable<Product | undefined> {
        return this.getProducts().pipe(
            map(products => products.find(p => p.id === id))
        );
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('auth_token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    addProduct(productData: any): Observable<Product> {
        const newProduct: Product = { ...productData, id: Math.floor(Math.random() * 1000) };
        this.localAddedProducts.push(newProduct);
        return of(newProduct);
    }

    updateProduct(id: number, productData: any): Observable<Product> {
        const updatedProduct: Product = { ...productData, id };
        const addedIndex = this.localAddedProducts.findIndex(p => p.id === id);
        if (addedIndex !== -1) {
            this.localAddedProducts[addedIndex] = updatedProduct;
        } else {
            this.localUpdatedProducts.set(id, updatedProduct);
        }
        return of(updatedProduct);
    }

    deleteProduct(id: number): Observable<any> {
        this.localAddedProducts = this.localAddedProducts.filter(p => p.id !== id);
        this.localDeletedProducts.add(id);
        return of({});
    }
}
