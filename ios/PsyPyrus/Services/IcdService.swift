import Foundation

#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

public class IcdService {
    public static let shared = IcdService()
    private init() {}
    
    private let TAG = "IcdService" // Swift uses normal variables
    private let tokenUrl = "https://icdaccessmanagement.who.int/connect/token"
    private let searchUrl = "https://id.who.int/icd/entity/search"
    
    public var customClientId: String = ""
    public var customClientSecret: String = ""
    
    private var cachedToken: String = ""
    private var tokenExpiryTime: Double = 0
    
    private func getAccessToken() async -> String? {
        guard !customClientId.isEmpty && !customClientSecret.isEmpty else {
            return nil
        }
        
        let currentTime = Date().timeIntervalSince1970 * 1000
        if !cachedToken.isEmpty && currentTime < tokenExpiryTime {
            return cachedToken
        }
        
        guard let url = URL(string: tokenUrl) else {
            return nil
        }
        
        let credentials = "\(customClientId):\(customClientSecret)"
        guard let credentialData = credentials.data(using: .utf8) else {
            return nil
        }
        let base64Credentials = credentialData.base64EncodedString()
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Basic \(base64Credentials)", forHTTPHeaderField: "Authorization")
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        
        var components = URLComponents()
        components.queryItems = [
            URLQueryItem(name: "grant_type", value: "client_credentials"),
            URLQueryItem(name: "scope", value: "icdapi_access")
        ]
        request.httpBody = components.query?.data(using: .utf8)
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                return nil
            }
            
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let token = json["access_token"] as? String,
               let expiresIn = json["expires_in"] as? Double {
                self.cachedToken = token
                self.tokenExpiryTime = (Date().timeIntervalSince1970 * 1000) + (expiresIn - 60) * 1000
                return token
            }
            return nil
        } catch {
            print("Error getting access token in Swift: \(error.localizedDescription)")
            return nil
        }
    }
    
    public func searchIcd11(query: String) async -> [IcdSearchResult] {
        guard let token = await getAccessToken() else {
            print("Using local fallback ICD-11 search for query: \(query)")
            return getLocalFallbackResults(query: query)
        }
        
        guard let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "\(searchUrl)?q=\(encodedQuery)") else {
            return getLocalFallbackResults(query: query)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("v2", forHTTPHeaderField: "API-Version")
        request.setValue("en", forHTTPHeaderField: "Accept-Language")
        request.timeoutInterval = 15
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                print("Search request failed. Falling back to local data.")
                return getLocalFallbackResults(query: query)
            }
            
            var results: [IcdSearchResult] = []
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let destinationEntities = json["destinationEntities"] as? [[String: Any]] {
                for entity in destinationEntities {
                    let titleRaw = entity["title"] as? String ?? ""
                    // Strip HTML tags using simple regex
                    let title = titleRaw.replacingOccurrences(of: "<[^>]*>", with: "", options: .regularExpression)
                    let code = entity["theCode"] as? String ?? "N/A"
                    let uri = entity["id"] as? String ?? ""
                    results.append(IcdSearchResult(code: code, title: title, uri: uri))
                }
            }
            return results;
        } catch {
            print("Error in ICD-11 search in Swift, falling back: \(error.localizedDescription)")
            return getLocalFallbackResults(query: query)
        }
    }
    
    private func getLocalFallbackResults(query: String) -> [IcdSearchResult] {
        let lower = query.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let allLocalData = [
            IcdSearchResult(code: "6A70", title: "Single episode depressive disorder", uri: "https://id.who.int/icd/entity/1410143890"),
            IcdSearchResult(code: "6A71", title: "Recurrent depressive disorder", uri: "https://id.who.int/icd/entity/281313880"),
            IcdSearchResult(code: "6A72", title: "Dysthymic disorder", uri: "https://id.who.int/icd/entity/46387063"),
            IcdSearchResult(code: "6B00", title: "Generalized anxiety disorder", uri: "https://id.who.int/icd/entity/1511210815"),
            IcdSearchResult(code: "6B01", title: "Panic disorder", uri: "https://id.who.int/icd/entity/1297593674"),
            IcdSearchResult(code: "6B02", title: "Specific phobia", uri: "https://id.who.int/icd/entity/1429994640"),
            IcdSearchResult(code: "6B03", title: "Social anxiety disorder", uri: "https://id.who.int/icd/entity/1897368560"),
            IcdSearchResult(code: "6B05", title: "Agoraphobia", uri: "https://id.who.int/icd/entity/240578619"),
            IcdSearchResult(code: "6B40", title: "Post-traumatic stress disorder (PTSD)", uri: "https://id.who.int/icd/entity/2070316417"),
            IcdSearchResult(code: "6B41", title: "Complex post-traumatic stress disorder (Complex PTSD)", uri: "https://id.who.int/icd/entity/585833559"),
            IcdSearchResult(code: "6B42", title: "Adjustment disorder", uri: "https://id.who.int/icd/entity/155985011"),
            IcdSearchResult(code: "6A05", title: "Attention deficit hyperactivity disorder (ADHD)", uri: "https://id.who.int/icd/entity/374567562"),
            IcdSearchResult(code: "6A02", title: "Autism spectrum disorder", uri: "https://id.who.int/icd/entity/1244592887"),
            IcdSearchResult(code: "6A60", title: "Bipolar I disorder", uri: "https://id.who.int/icd/entity/1930263630"),
            IcdSearchResult(code: "6A61", title: "Bipolar II disorder", uri: "https://id.who.int/icd/entity/877409240"),
            IcdSearchResult(code: "6A62", title: "Cyclothymic disorder", uri: "https://id.who.int/icd/entity/2130767228"),
            IcdSearchResult(code: "6D10", title: "Personality disorder", uri: "https://id.who.int/icd/entity/1922987179"),
            IcdSearchResult(code: "6D11.5", title: "Borderline pattern personality specifier", uri: "https://id.who.int/icd/entity/713337965"),
            IcdSearchResult(code: "6B20", title: "Obsessive-compulsive disorder (OCD)", uri: "https://id.who.int/icd/entity/1018318894"),
            IcdSearchResult(code: "6B21", title: "Body dysmorphic disorder", uri: "https://id.who.int/icd/entity/1769854497"),
            IcdSearchResult(code: "6B80", title: "Anorexia nervosa", uri: "https://id.who.int/icd/entity/263852482"),
            IcdSearchResult(code: "6B81", title: "Bulimia nervosa", uri: "https://id.who.int/icd/entity/1120014902"),
            IcdSearchResult(code: "6B82", title: "Binge eating disorder", uri: "https://id.who.int/icd/entity/1959728221")
        ]
        
        if lower.isEmpty {
            return allLocalData
        }
        
        return allLocalData.filter {
            $0.title.lowercased().contains(lower) || $0.code.lowercased().contains(lower)
        }
    }
}
