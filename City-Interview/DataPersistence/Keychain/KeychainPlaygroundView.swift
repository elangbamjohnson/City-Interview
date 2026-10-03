//
//  KeychainPlaygroundView.swift
//  City-Interview
//
//  Created for Senior iOS Interview Preparation
//

import SwiftUI
import Security

// =========================================================================
// 🗝️ SENIOR INTERVIEW ARCHITECTURE: Keychain Storage Playground
// =========================================================================
//
// 💡 INTERVIEW TALKING POINTS (Staff/Senior Level):
// • Hardware-backed Security: Keychain data is managed by the 'securityd' system
//   daemon and encrypted using AES-256 with keys derived from the user's passcode
//   and hardware UID embedded in the Secure Enclave.
// • Lifecycle & Persistence: Unlike UserDefaults, Keychain items survive when an
//   app is deleted and reinstalled, unless explicitly wiped.
// • CRUD via C-APIs:
//   - Create: SecItemAdd (always paired with SecItemDelete to avoid errSecDuplicateItem)
//   - Read: SecItemCopyMatching with kSecReturnData and kSecMatchLimitOne
//   - Update: SecItemUpdate with kSecValueData changes
//   - Delete: SecItemDelete
// • Accessibility Policies:
//   - kSecAttrAccessibleWhenUnlocked: Accessible only when device is unlocked (best for interactive secrets)
//   - kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly: Accessible after initial boot unlock (ideal for background fetch)

public struct KeychainLiveDemoView: View {
    @State private var demonstrator = KeychainDemonstrator()
    @State private var tokenInput: String = "citi_secure_jwt_token_sample_88f9a2"
    @State private var storedToken: String? = nil
    @State private var statusMessage: String = "Ready to test Keychain methods."
    @State private var lastOperation: String = "None"
    @State private var isSuccess: Bool? = nil
    
    // Sample presets for quick testing
    private let sampleTokens = [
        "citi_auth_jwt_sample_88f9a2",
        "citi_auth_jwt_updated_99bc34",
        "refresh_token_exp_2026_x7a11"
    ]
    
    public init() {}
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Header Info
            HStack {
                Label("Keychain Storage Demo", systemImage: "key.fill")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.yellow)
                Spacer()
                Text("kSecClassGenericPassword")
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.yellow.opacity(0.15))
                    .foregroundColor(.yellow)
                    .cornerRadius(6)
            }
            
            Text("Interact with **KeychainExample.swift** using `saveToken`, `readToken`, `updateToken`, and `deleteToken`.")
                .font(.system(size: 13))
                .foregroundColor(.secondary)
            
            // Token Input Field
            VStack(alignment: .leading, spacing: 6) {
                Text("Sample Token Payload:")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.secondary)
                
                HStack {
                    TextField("Enter token string…", text: $tokenInput)
                        .textFieldStyle(.roundedBorder)
                        .font(.system(size: 13, design: .monospaced))
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                    
                    if !tokenInput.isEmpty {
                        Button {
                            tokenInput = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                // Presets
                HStack(spacing: 6) {
                    Text("Presets:")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                    
                    Button("Token A") {
                        tokenInput = sampleTokens[0]
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.mini)
                    
                    Button("Token B (Updated)") {
                        tokenInput = sampleTokens[1]
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.mini)
                    
                    Button("Refresh Token") {
                        tokenInput = sampleTokens[2]
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.mini)
                }
            }
            
            Divider()
            
            // CRUD Action Buttons
            VStack(spacing: 8) {
                HStack(spacing: 10) {
                    // 1. SAVE
                    Button {
                        performSave()
                    } label: {
                        HStack {
                            Image(systemName: "square.and.arrow.down.fill")
                            Text("Save")
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                        .font(.system(size: 14, weight: .semibold))
                    }
                    .buttonStyle(.plain)
                    
                    // 2. READ
                    Button {
                        performRead()
                    } label: {
                        HStack {
                            Image(systemName: "doc.text.magnifyingglass")
                            Text("Read")
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                        .font(.system(size: 14, weight: .semibold))
                    }
                    .buttonStyle(.plain)
                }
                
                HStack(spacing: 10) {
                    // 3. UPDATE
                    Button {
                        performUpdate()
                    } label: {
                        HStack {
                            Image(systemName: "arrow.triangle.2.circlepath")
                            Text("Update")
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                        .font(.system(size: 14, weight: .semibold))
                    }
                    .buttonStyle(.plain)
                    
                    // 4. DELETE
                    Button {
                        performDelete()
                    } label: {
                        HStack {
                            Image(systemName: "trash.fill")
                            Text("Delete")
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.red)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                        .font(.system(size: 14, weight: .semibold))
                    }
                    .buttonStyle(.plain)
                }
            }
            
            // Live Status & Retrieved Value Card
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: isSuccess == true ? "checkmark.circle.fill" : (isSuccess == false ? "exclamationmark.triangle.fill" : "info.circle.fill"))
                        .foregroundColor(isSuccess == true ? .green : (isSuccess == false ? .red : .blue))
                    
                    Text("Last Operation: **\(lastOperation)**")
                        .font(.system(size: 13))
                    
                    Spacer()
                }
                
                Text(statusMessage)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                
                Divider()
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Decrypted Value currently in Keychain:")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.secondary)
                    
                    if let stored = storedToken {
                        Text(stored)
                            .font(.system(size: 12, weight: .semibold, design: .monospaced))
                            .foregroundColor(.green)
                            .padding(6)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.green.opacity(0.1))
                            .cornerRadius(6)
                    } else {
                        Text("(nil — no token found in Keychain)")
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundColor(.secondary)
                            .padding(6)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(6)
                    }
                }
            }
            .padding(12)
            .background(Color(UIColor.secondarySystemBackground))
            .cornerRadius(10)
        }
        .padding(14)
        .background(Color(UIColor.tertiarySystemBackground))
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.yellow.opacity(0.35), lineWidth: 1)
        )
        .onAppear {
            // Initial read to populate state if an item already exists
            storedToken = demonstrator.readToken()
        }
    }
    
    // MARK: - Actions calling KeychainDemonstrator methods
    
    private func performSave() {
        guard !tokenInput.isEmpty else {
            statusMessage = "Please enter a token value before saving."
            isSuccess = false
            return
        }
        
        let success = demonstrator.saveToken(tokenInput)
        lastOperation = "saveToken(_:)"
        isSuccess = success
        
        if success {
            statusMessage = "SecItemAdd: Token saved securely under account 'NoteAuthToken'."
            storedToken = demonstrator.readToken()
        } else {
            statusMessage = "SecItemAdd failed to save token."
        }
    }
    
    private func performRead() {
        let result = demonstrator.readToken()
        lastOperation = "readToken()"
        storedToken = result
        
        if let token = result {
            statusMessage = "SecItemCopyMatching: Retrieved decrypted token (\(token.count) characters)."
            isSuccess = true
        } else {
            statusMessage = "SecItemCopyMatching returned errSecItemNotFound (no token stored)."
            isSuccess = false
        }
    }
    
    private func performUpdate() {
        guard !tokenInput.isEmpty else {
            statusMessage = "Please enter a new token value to update."
            isSuccess = false
            return
        }
        
        let success = demonstrator.updateToken(tokenInput)
        lastOperation = "updateToken(_:)"
        isSuccess = success
        
        if success {
            statusMessage = "SecItemUpdate: Token updated in-place in Keychain."
            storedToken = demonstrator.readToken()
        } else {
            statusMessage = "SecItemUpdate failed (item may not exist yet, try Save first)."
        }
    }
    
    private func performDelete() {
        let success = demonstrator.deleteToken()
        lastOperation = "deleteToken()"
        isSuccess = success
        storedToken = demonstrator.readToken()
        
        if success {
            statusMessage = "SecItemDelete: Token removed from Keychain."
        } else {
            statusMessage = "SecItemDelete: Item not found or already deleted."
        }
    }
}

// =========================================================================
// Full Screen Keychain Playground View (Dedicated Screen)
// =========================================================================
public struct KeychainPlaygroundView: View {
    public init() {}
    
    public var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Interactive Demo Card
                KeychainLiveDemoView()
                    .padding(.horizontal)
                
                // Deep Dive Architecture & Interview Explanations
                VStack(alignment: .leading, spacing: 14) {
                    Text("Senior Interview Talking Points")
                        .font(.system(size: 20, weight: .bold))
                    
                    VStack(alignment: .leading, spacing: 10) {
                        interviewPoint(
                            title: "Why Keychain instead of UserDefaults?",
                            description: "UserDefaults writes plain XML plists on disk. Anyone with physical access or an iTunes backup can extract tokens. Keychain data is encrypted with hardware AES keys via 'securityd'."
                        )
                        
                        interviewPoint(
                            title: "Upsert Pattern (Delete + Add)",
                            description: "SecItemAdd returns 'errSecDuplicateItem (-25299)' if an item with the same primary key already exists. Professional iOS apps always call SecItemDelete before SecItemAdd."
                        )
                        
                        interviewPoint(
                            title: "kSecAttrAccessible Choices",
                            description: "• 'WhenUnlocked': Highest security, unreadable when device is locked.\n• 'AfterFirstUnlockThisDeviceOnly': Recommended for banking tokens needing background URLSession or push refresh, while preventing iCloud/iTunes migration."
                        )
                        
                        interviewPoint(
                            title: "Persistence Across App Delete",
                            description: "Keychain records persist even when the user deletes the app. Production apps check a UserDefaults 'hasRunBefore' flag on cold launch and wipe stale tokens if clean onboarding is required."
                        )
                    }
                }
                .padding()
                .background(Color(UIColor.secondarySystemBackground))
                .cornerRadius(14)
                .padding(.horizontal)
            }
            .padding(.vertical)
        }
        .navigationTitle("Keychain Playground")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func interviewPoint(title: String, description: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("💡 " + title)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.primary)
            Text(description)
                .font(.system(size: 13))
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 2)
    }
}

#Preview {
    NavigationView {
        KeychainPlaygroundView()
    }
}
