import SwiftUI
import Foundation

// MARK: - 🌐 URLSession Basics
//
// 💡 INTERVIEW TALKING POINTS:
// • Configurations:
//   - .default: Uses persistent disk-based caching and credential storage.
//   - .ephemeral: No persistent storage (like "Incognito Mode" for networking).
//   - .background: Allows transfers to continue even if the app is suspended/terminated.
// • Task Lifecycle: Tasks are created in a suspended state. You MUST call `.resume()` to start them.
//   You can also call `.suspend()` to pause, or `.cancel()` to abort.
// • APIs: Apple provides Delegate-based (for fine-grained control like SSL Pinning),
//   Completion-Handler-based (closures), and modern Async/Await APIs.

// ==========================================
// Example Entity
// ==========================================
struct SessionUser: Codable {
    let id: Int
    let name: String
    let email: String
}

class URLSessionDemonstrator {
    // We use JSONPlaceholder for a real working demonstration in the UI
    let url = URL(string: "https://jsonplaceholder.typicode.com/users/1")!
    
    // ==========================================
    // 1. Traditional Completion Handler
    // ==========================================
    func fetchUserLegacy(completion: @escaping (Result<SessionUser, Error>) -> Void) {
        // Creates the task (starts Suspended)
        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                let error = NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "No data received"])
                completion(.failure(error))
                return
            }
            
            do {
                let user = try JSONDecoder().decode(SessionUser.self, from: data)
                completion(.success(user))
            } catch {
                completion(.failure(error))
            }
        }
        
        // ⚠️ MUST call resume() to start the network request!
        task.resume()
    }
    
    // ==========================================
    // 1b. Download Task (Completion Handler)
    // Returns the temporary file URL provided by the system
    // ==========================================
    func downloadFileLegacy(from url: URL? = nil, completion: @escaping (Result<URL, Error>) -> Void) {
        let downloadURL = url ?? self.url
        let task = URLSession.shared.downloadTask(with: downloadURL) { tempURL, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let tempURL = tempURL else {
                let error = NSError(domain: "", code: -2, userInfo: [NSLocalizedDescriptionKey: "No file URL received"])
                completion(.failure(error))
                return
            }
            completion(.success(tempURL))
        }
        // ⚠️ MUST call resume() to start the download!
        task.resume()
    }

    // ==========================================
    // 2b. Download Task (Async/Await)
    // Returns the temporary file URL provided by the system
    // ==========================================
    func downloadFileModern(from url: URL? = nil) async throws -> URL {
        let downloadURL = url ?? self.url
        let (tempURL, response) = try await URLSession.shared.download(from: downloadURL)
        guard let httpResponse = response as? HTTPURLResponse, (200..<300).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return tempURL
    }

    // ==========================================
    // 2. Modern Async/Await (iOS 15+)
    // ==========================================
    func fetchUserModern() async throws -> SessionUser {
        // No .resume() needed. Execution suspends here without blocking the thread!
        let (data, response) = try await URLSession.shared.data(from: url)
        
        // Basic validation
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode(SessionUser.self, from: data)
    }
}



// ==========================================
// 3. UI Playground
// ==========================================
struct URLSessionPlaygroundView: View {
    let demonstrator = URLSessionDemonstrator()
    
    @State private var resultText = "Tap a button to fetch data"
    @State private var isLoading = false
    
    var body: some View {
        VStack(spacing: 24) {
            Text("URLSession Basics")
                .font(.title2).bold()
            
            GroupBox {
                if isLoading {
                    ProgressView()
                } else {
                    Text(resultText)
                        .multilineTextAlignment(.center)
                        .padding()
                }
            }
            .frame(height: 120)
            
            VStack(spacing: 16) {
                Button {
                    isLoading = true
                    // Calling the legacy completion handler method
                    demonstrator.fetchUserLegacy { result in
                        // ⚠️ INTERVIEW TRAP: Completion handlers return on a background thread.
                        // You MUST dispatch to the Main Thread before updating the UI!
                        DispatchQueue.main.async {
                            isLoading = false
                            switch result {
                            case .success(let user):
                                resultText = "Legacy Success:\n\(user.name)\n(\(user.email))"
                            case .failure(let error):
                                resultText = "Legacy Error: \(error.localizedDescription)"
                            }
                        }
                    }
                } label: {
                    Text("Fetch (Legacy Completion)")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                
                Button {
                    isLoading = true
                    // Calling the modern Async/Await method inside a Task
                    Task {
                        do {
                            let user = try await demonstrator.fetchUserModern()
                            // No manual DispatchQueue.main needed if inside a MainActor or standard Task tied to the View
                            resultText = "Modern Success:\n\(user.name)\n(\(user.email))"
                        } catch {
                            resultText = "Modern Error: \(error.localizedDescription)"
                        }
                        isLoading = false
                    }
                } label: {
                    Text("Fetch (Modern Async/Await)")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                
                Button {
                    isLoading = true
                    // Download using legacy completion handler
                    demonstrator.downloadFileLegacy { result in
                        DispatchQueue.main.async {
                            isLoading = false
                            switch result {
                            case .success(let tempURL):
                                resultText = "Legacy Downloaded to:\n\(tempURL.path)"
                            case .failure(let error):
                                resultText = "Legacy Download Error: \(error.localizedDescription)"
                            }
                        }
                    }
                } label: {
                    Text("Download (Legacy)")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)

                Button {
                    isLoading = true
                    // Download using modern async/await
                    Task {
                        do {
                            let tempURL = try await demonstrator.downloadFileModern()
                            resultText = "Modern Downloaded to:\n\(tempURL.path)"
                        } catch {
                            resultText = "Modern Download Error: \(error.localizedDescription)"
                        }
                        isLoading = false
                    }
                } label: {
                    Text("Download (Modern Async/Await)")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
            .padding(.horizontal)
            
            Spacer()
        }
        .padding()
    }
}

#Preview {
    URLSessionPlaygroundView()
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why do you have to call `.resume()` on a dataTask?
//   A: Because tasks are initialized in a suspended state, allowing you to configure them before execution begins.
// • Q: How does a Background Configuration differ from Default?
//   A: Background configurations hand off the download/upload to an out-of-process system daemon, so it continues even if the app crashes or is killed by the OS.
// • Q: Which thread do URLSession completion handlers execute on by default?
//   A: A background thread (specifically the session's delegate queue). You must explicitly dispatch to the Main thread before updating the UI!

// ==========================================
// 🚀 URLSession.shared — All Common Syntax Forms
// ==========================================
//
// 1. data(from:) — async/await, simple GET
// let (data, response) = try await URLSession.shared.data(from: url)
// 💡 One-liner: Fetch data from a URL directly, no custom request needed — modern async way.
//
// 2. data(for:) — async/await, with custom request
// let (data, response) = try await URLSession.shared.data(for: request)
// 💡 One-liner: Same as above, but lets you use a full URLRequest (headers, method, body).
//
// 3. dataTask(with:completionHandler:) — closure-based, URL only
// URLSession.shared.dataTask(with: url) { data, response, error in
//     // handle result
// }.resume()
// 💡 One-liner: Classic closure-based GET call — must call .resume() or it never starts.
//
// 4. dataTask(with:completionHandler:) — closure-based, with request
// URLSession.shared.dataTask(with: request) { data, response, error in
//     // handle result
// }.resume()
// 💡 One-liner: Same as above, but with a custom URLRequest for POST/headers/body.
//
// 5. download(from:) — async/await download
// let (fileURL, response) = try await URLSession.shared.download(from: url)
// 💡 One-liner: Downloads a file and saves it to a temporary location on disk, returns the local file URL.
//
// 6. downloadTask(with:completionHandler:) — closure-based download
// URLSession.shared.downloadTask(with: url) { localURL, response, error in
//     // move file from localURL to permanent location
// }.resume()
// 💡 One-liner: Same download, old closure style — good for large files without loading everything into memory.
//
// 7. upload(for:from:) — async/await upload
// let (data, response) = try await URLSession.shared.upload(for: request, from: fileData)
// 💡 One-liner: Uploads raw Data (like an image) to the server using a POST/PUT request.
//
// 8. uploadTask(with:from:completionHandler:) — closure-based upload
// URLSession.shared.uploadTask(with: request, from: fileData) { data, response, error in
//     // handle result
// }.resume()
// 💡 One-liner: Same upload, closure style.
//
// 9. uploadTask(with:fromFile:completionHandler:) — upload directly from a file on disk
// URLSession.shared.uploadTask(with: request, fromFile: fileURL) { data, response, error in
//     // handle result
// }.resume()
// 💡 One-liner: Uploads a file straight from disk instead of loading it into memory first — better for big files.
//
// 10. webSocketTask(with:) — WebSocket connection
// let task = URLSession.shared.webSocketTask(with: url)
// task.resume()
// 💡 One-liner: Opens a real-time WebSocket connection (good for chat, live updates — relevant to your VoIP background).
//
// 11. bytes(from:) — async streaming bytes
// let (byteStream, response) = try await URLSession.shared.bytes(from: url)
// for try await byte in byteStream {
//     // process incrementally, without waiting for full download
// }
// 💡 One-liner: Streams data as it arrives, useful for very large responses you want to process incrementally.
