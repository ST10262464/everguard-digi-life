import { mockBlockDAGEncryption, generateSecureBlockDAGHash } from "@/utils/crypto";

interface Authority {
    id: string;
    publicKey: string;
    name: string;
}

export const AUTHORITIES: Authority[] = [
    { id: "police", publicKey: "POLICE-0x123F1G4K", name: "Local Police" },
    { id: "ngo", publicKey: "NGO-0x456H7J9L", name: "GBV Support NGO" },
    { id: "lawyer", publicKey: "LAWYER-0x789N1P3R", name: "Personal Legal Counsel" },
];

interface SubmitReportPayload {
    incidentLog: string; 
    authorityId: string;
    snapshot: string;
}

interface PanicAlertPayload {
    latitude: number;
    longitude: number;
    capsuleSnapshot: string;
    emergencyContactKey: string;
}

/**
 * Simulates getting the user's current GPS location.
 */
export function getMockGeolocation(): { latitude: number, longitude: number } {
    return {
        latitude: 34.0522 + Math.random() * 0.01,
        longitude: -118.2437 + Math.random() * 0.01,
    };
}

/**
 * Simulates submitting an encrypted GBV incident report on the BlockDAG.
 * The report is encrypted using the authority's public key (mocked).
 */
export async function submitEncryptedReport(payload: SubmitReportPayload): Promise<{ transactionId: string }> {
    const authority = AUTHORITIES.find(a => a.id === payload.authorityId) || AUTHORITIES[1];
    
    // 1. Encrypt payload using authority's key (MVP Mock)
    const { transactionId, encryptedData } = mockBlockDAGEncryption(
        payload.incidentLog, 
        authority.publicKey
    );

    console.log(`%c[Service] Encrypting for ${authority.name} (Key: ${authority.publicKey.slice(-8)}) and submitting to BlockDAG...`, "color: #22c55e; font-weight: bold;");
    console.log(`%c[Service] Transaction ID (Data Integrity Hash): ${transactionId}`, "color: #22c55e;");
    
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 2. Mock On-Chain Record confirmation
    console.log(`%c[Service] Report recorded on BlockDAG. Access is restricted to Owner Key and Authority Key only (NIST/ISO).`, "color: #10b981; font-weight: bold;");
    
    return { transactionId };
}

/**
 * Simulates triggering the panic alert, recording the GPS location on-chain, 
 * and sending the encrypted capsule snapshot to the emergency contact.
 */
export async function triggerPanicAlert(payload: PanicAlertPayload): Promise<void> {
    const locationRecord = `GPS: ${payload.latitude}, ${payload.longitude} @ ${new Date().toISOString()}`;
    const transactionId = generateSecureBlockDAGHash(locationRecord);
    
    console.log(`%c[Service] Initiating PANIC ALERT. GPS recorded on-chain (${transactionId}).`, "color: #ef4444; font-weight: bold;");
    console.log(`%c[Service] Encrypted snapshot sharing with contact key ${payload.emergencyContactKey.slice(-8)}...`, "color: #ef4444;");
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    console.log(`%c[Service] ALERT SUCCESSFUL. Notification sent to emergency contact with secure, key-restricted link.`, "color: #ef4444; font-weight: bold;");
}
