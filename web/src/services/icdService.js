/**
 * PsyPyrus ICD-11 Service
 * Handles OAuth2 authentication and live searches via the official WHO ICD-11 Search API,
 * with a high-fidelity local fallback for offline/unconfigured settings.
 */

const TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token";
const SEARCH_URL = "https://id.who.int/icd/entity/search";

let cachedToken = "";
let tokenExpiryTime = 0;

export class IcdService {
    /**
     * Retrieves credentials from localStorage.
     */
    static getCredentials() {
        const clientId = localStorage.getItem('psypyrus_icd_client_id') || '';
        const clientSecret = localStorage.getItem('psypyrus_icd_client_secret') || '';
        return { clientId, clientSecret };
    }

    /**
     * Obtains an OAuth2 access token from the WHO registry.
     */
    static async getAccessToken(clientId, clientSecret) {
        if (!clientId || !clientSecret) {
            return null;
        }

        const currentTime = Date.now();
        if (cachedToken && currentTime < tokenExpiryTime) {
            return cachedToken;
        }

        try {
            const authHeader = "Basic " + btoa(`${clientId}:${clientSecret}`);
            
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('scope', 'icdapi_access');

            const response = await fetch(TOKEN_URL, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });

            if (!response.ok) {
                console.error("WHO token retrieval failed:", response.status);
                return null;
            }

            const data = await response.json();
            cachedToken = data.access_token;
            // Cache token with a 60-second buffer
            tokenExpiryTime = Date.now() + (data.expires_in - 60) * 1000;
            return cachedToken;
        } catch (e) {
            console.error("Exception fetching WHO token:", e);
            return null;
        }
    }

    /**
     * Queries the ICD-11 Official Search Registry or triggers the local fallback list.
     * @param {string} query 
     * @returns {Promise<Array<{code: string, title: string, uri: string}>>}
     */
    static async searchIcd11(query) {
        const { clientId, clientSecret } = this.getCredentials();
        const token = await this.getAccessToken(clientId, clientSecret);

        if (!token) {
            console.info("Using local fallback ICD-11 search for query:", query);
            return this.getLocalFallbackResults(query);
        }

        try {
            const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'API-Version': 'v2',
                    'Accept-Language': 'en'
                }
            });

            if (!response.ok) {
                console.warn("WHO search failed with status:", response.status, "Falling back.");
                return this.getLocalFallbackResults(query);
            }

            const data = await response.json();
            const results = [];
            
            if (data.destinationEntities) {
                for (const entity of data.destinationEntities) {
                    const titleRaw = entity.title || "";
                    // Strip HTML tags from WHO search titles
                    const title = titleRaw.replace(/<[^>]*>/g, "");
                    const code = entity.theCode || "N/A";
                    const uri = entity.id || "";
                    results.push({ code, title, uri });
                }
            }
            return results;
        } catch (e) {
            console.error("Exception in ICD-11 search, falling back.", e);
            return this.getLocalFallbackResults(query);
        }
    }

    /**
     * Local mock search fallback representing the 23 standard psychiatric classifications.
     */
    static getLocalFallbackResults(query) {
        const lower = (query || "").toLowerCase().trim();
        const allLocalData = [
            { code: "6A70", title: "Single episode depressive disorder", uri: "https://id.who.int/icd/entity/1410143890" },
            { code: "6A71", title: "Recurrent depressive disorder", uri: "https://id.who.int/icd/entity/281313880" },
            { code: "6A72", title: "Dysthymic disorder", uri: "https://id.who.int/icd/entity/46387063" },
            { code: "6B00", title: "Generalized anxiety disorder", uri: "https://id.who.int/icd/entity/1511210815" },
            { code: "6B01", title: "Panic disorder", uri: "https://id.who.int/icd/entity/1297593674" },
            { code: "6B02", title: "Specific phobia", uri: "https://id.who.int/icd/entity/1429994640" },
            { code: "6B03", title: "Social anxiety disorder", uri: "https://id.who.int/icd/entity/1897368560" },
            { code: "6B05", title: "Agoraphobia", uri: "https://id.who.int/icd/entity/240578619" },
            { code: "6B40", title: "Post-traumatic stress disorder (PTSD)", uri: "https://id.who.int/icd/entity/2070316417" },
            { code: "6B41", title: "Complex post-traumatic stress disorder (Complex PTSD)", uri: "https://id.who.int/icd/entity/585833559" },
            { code: "6B42", title: "Adjustment disorder", uri: "https://id.who.int/icd/entity/155985011" },
            { code: "6A05", title: "Attention deficit hyperactivity disorder (ADHD)", uri: "https://id.who.int/icd/entity/374567562" },
            { code: "6A02", title: "Autism spectrum disorder", uri: "https://id.who.int/icd/entity/1244592887" },
            { code: "6A60", title: "Bipolar I disorder", uri: "https://id.who.int/icd/entity/1930263630" },
            { code: "6A61", title: "Bipolar II disorder", uri: "https://id.who.int/icd/entity/877409240" },
            { code: "6A62", title: "Cyclothymic disorder", uri: "https://id.who.int/icd/entity/2130767228" },
            { code: "6D10", title: "Personality disorder", uri: "https://id.who.int/icd/entity/1922987179" },
            { code: "6D11.5", title: "Borderline pattern personality specifier", uri: "https://id.who.int/icd/entity/713337965" },
            { code: "6B20", title: "Obsessive-compulsive disorder (OCD)", uri: "https://id.who.int/icd/entity/1018318894" },
            { code: "6B21", title: "Body dysmorphic disorder", uri: "https://id.who.int/icd/entity/1769854497" },
            { code: "6B80", title: "Anorexia nervosa", uri: "https://id.who.int/icd/entity/263852482" },
            { code: "6B81", title: "Bulimia nervosa", uri: "https://id.who.int/icd/entity/1120014902" },
            { code: "6B82", title: "Binge eating disorder", uri: "https://id.who.int/icd/entity/1959728221" }
        ];

        if (!lower) return allLocalData;

        return allLocalData.filter(item => 
            item.title.toLowerCase().includes(lower) || 
            item.code.toLowerCase().includes(lower)
        );
    }
}
