# Security Decision Table

An interviewer will often give you a scenario and ask you to pick the right security mechanism. Knowing the exact boundary of each tool is what separates Seniors from Juniors.

| Mechanism | What it protects against... | When to use it |
|---|---|---|
| **Certificate Pinning** (Data in Transit) | Protects against Man-In-The-Middle (MITM) attacks caused by compromised Root Certificate Authorities or corporate proxies. | Use when communicating with highly sensitive backend APIs (e.g., Banking, Healthcare) where standard HTTPS is not considered enough. |
| **Secure Enclave** (Hardware Security) | Protects private keys from being extracted from the device's memory, even if the OS is fully jailbroken. | Use when generating cryptographic keys that represent the user's identity (e.g., a key to sign a transaction), gated behind Face ID. |
| **Data Encryption** (Data at Rest) | Protects raw data (Confidentiality) and proves it hasn't been altered (Integrity). | Use when storing sensitive offline data (e.g. chat history, health logs) in a local database, where the DB itself isn't fully encrypted. |

## 🏆 Quick Rule of Thumb for Interviews:
> "Security requires defense in depth. I use Data Encryption (AES) to protect local databases, I secure the AES key inside the Keychain, and if the app handles extreme financial operations, I'd generate an identity key inside the Secure Enclave and use Certificate Pinning for the network layer."
