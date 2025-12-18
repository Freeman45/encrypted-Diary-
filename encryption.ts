import CryptoJS from 'crypto-js';

/**
 * Encryption utility functions for the encrypted diary app
 * Uses AES-256 encryption with a user-derived key
 */

// Generate a deterministic encryption key from the user's wallet address
export function generateEncryptionKey(walletAddress: string): string {
  // Hash the wallet address to create a consistent encryption key
  return CryptoJS.SHA256(walletAddress).toString();
}

// Encrypt diary entry text
export function encryptDiaryEntry(plaintext: string, encryptionKey: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(plaintext, encryptionKey).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt diary entry');
  }
}

// Decrypt diary entry text
export function decryptDiaryEntry(ciphertext: string, encryptionKey: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(ciphertext, encryptionKey).toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt diary entry');
  }
}

// Generate a random salt for additional security
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

// Hash a diary entry for integrity verification
export function hashDiaryEntry(plaintext: string): string {
  return CryptoJS.SHA256(plaintext).toString();
}

// Verify the integrity of a decrypted entry
export function verifyEntryIntegrity(plaintext: string, hash: string): boolean {
  return hashDiaryEntry(plaintext) === hash;
}

/**
 * Zama fhEVM Integration
 * Note: Full fhEVM integration requires backend relayer service
 * For now, we use client-side encryption as a placeholder
 */

export interface EncryptedDiaryEntry {
  ciphertext: string;
  timestamp: number;
  hash: string;
  walletAddress: string;
}

// Create an encrypted diary entry object
export function createEncryptedEntry(
  plaintext: string,
  walletAddress: string,
  encryptionKey: string
): EncryptedDiaryEntry {
  const ciphertext = encryptDiaryEntry(plaintext, encryptionKey);
  const hash = hashDiaryEntry(plaintext);

  return {
    ciphertext,
    timestamp: Date.now(),
    hash,
    walletAddress,
  };
}

// Serialize encrypted entry for blockchain storage
export function serializeEncryptedEntry(entry: EncryptedDiaryEntry): string {
  return JSON.stringify(entry);
}

// Deserialize encrypted entry from blockchain storage
export function deserializeEncryptedEntry(serialized: string): EncryptedDiaryEntry {
  return JSON.parse(serialized);
}

// Decrypt and verify an entry
export function decryptAndVerifyEntry(
  entry: EncryptedDiaryEntry,
  encryptionKey: string
): { plaintext: string; isValid: boolean } {
  try {
    const plaintext = decryptDiaryEntry(entry.ciphertext, encryptionKey);
    const isValid = verifyEntryIntegrity(plaintext, entry.hash);
    return { plaintext, isValid };
  } catch (error) {
    console.error('Error decrypting and verifying entry:', error);
    return { plaintext: '', isValid: false };
  }
}

// Format timestamp for display
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
