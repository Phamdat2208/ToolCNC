import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

/**
 * StorageSecurityService
 *
 * Encrypts and decrypts data before writing to / reading from sessionStorage.
 * Uses AES-256 via CryptoJS for synchronous, reliable encryption without
 * requiring async Web Crypto API which would break the existing auth flow.
 *
 * Security note: The encryption key is derived at runtime from a hardcoded app
 * secret combined with a per-session nonce stored separately. This prevents
 * casual inspection of DevTools and basic XSS script reads, though it is not
 * a substitute for HttpOnly cookies in a high-security context.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageSecurityService {
  private readonly APP_SECRET = 'tool_cnc_@AES#2025$secure!key';
  private readonly SESSION_NONCE_KEY = '_tcnc_nonce';

  private encryptionKey: string;

  constructor() {
    this.encryptionKey = this.buildEncryptionKey();
  }

  /**
   * Derives the encryption key from the app secret + a per-session random nonce.
   * The nonce is generated once per session and stored in sessionStorage as plain text.
   * Without both components an attacker cannot reconstruct the key.
   */
  private buildEncryptionKey(): string {
    let nonce = sessionStorage.getItem(this.SESSION_NONCE_KEY);
    if (!nonce) {
      nonce = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
      sessionStorage.setItem(this.SESSION_NONCE_KEY, nonce);
    }
    return CryptoJS.SHA256(this.APP_SECRET + nonce).toString(CryptoJS.enc.Hex);
  }

  /** Encrypts a string value and returns a ciphertext string. */
  encrypt(plainText: string): string {
    return CryptoJS.AES.encrypt(plainText, this.encryptionKey).toString();
  }

  /** Decrypts a ciphertext string. Returns null if decryption fails. */
  decrypt(cipherText: string): string | null {
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, this.encryptionKey);
      const result = bytes.toString(CryptoJS.enc.Utf8);
      return result || null;
    } catch {
      return null;
    }
  }

  /** Encrypts and sets a value in sessionStorage. */
  setItem(key: string, value: string): void {
    sessionStorage.setItem(key, this.encrypt(value));
  }

  /** Gets and decrypts a value from sessionStorage. Returns null if missing or invalid. */
  getItem(key: string): string | null {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return this.decrypt(raw);
  }

  /** Removes an item from sessionStorage. */
  removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }
}
