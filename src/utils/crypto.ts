/**
 * src/utils/crypto.ts
 * Mocks cryptographic and secure token utilities, emphasizing BlockDAG, NIST, and ISO compliance concepts.
 */

// Mock User's Wallet ID for simulating ownership (Your Private Key is implicitly the master key)
export const MOCK_OWNER_PUBLIC_KEY = "BD-WALLET-0x1A2B3C4D5E6F7G8H"; 

/**
 * Mocks a secure cryptographic hash, simulating data integrity on the BlockDAG.
 * In a real BlockDAG, this hash would be part of the transaction ID.
 */
export function generateSecureBlockDAGHash(data: string | File): string {
    const dataString = typeof data === 'string' 
        ? data 
        : `${data.name}:${data.size}:${data.type}`;
    
    // Simulate a complex, collision-resistant hash (e.g., NIST-compliant SHA-3)
    const mockHash = `TX-BD-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${dataString.length}`;
    return mockHash;
}

/**
 * Simulates a secure, on-chain data encryption. 
 * Access is granted ONLY by the private key corresponding to the recipient key.
 */
export function mockBlockDAGEncryption(payload: string, recipientKey: string): { transactionId: string, encryptedData: string } {
    // Generate a unique transaction ID (the hash of the data)
    const transactionId = generateSecureBlockDAGHash(payload);
    
    // Mocking AES-256 encryption using recipient key as context
    const encryptedData = `ENCRYPTED_BD::KEY:${recipientKey.slice(0, 8)}::PAYLOAD:${btoa(payload).slice(0, 32)}...`;
    
    return { transactionId, encryptedData };
}

/**
 * Simulates generating a non-transferable verification token linked to a specific document hash.
 * This is the core concept of the "Instant Verify" QR code.
 */
export function generateVerificationToken(docHash: string): string {
    // Token is tied to the document hash and the owner's key for verification purposes
    return `QR-VERIFY-${MOCK_OWNER_PUBLIC_KEY.slice(-6)}-${docHash.slice(3, 10)}`;
}
