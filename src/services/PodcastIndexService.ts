import axios from 'axios';

interface PodcastInfo {
  id: number;
  title: string;
  author?: string;
  image?: string;
  feedGuid?: string;
}

interface EpisodeInfo {
  id: number;
  title: string;
  guid: string;
  feedGuid: string;
}

class PodcastIndexService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.podcastindex.org/api/1.0';
  private cache = new Map<string, PodcastInfo>();
  
  // Fallback podcast names for common GUIDs when API is unavailable
  private fallbackNames = new Map<string, string>([
    ['879febfc-538d-5c10-a34e-a9de5a7666ca', 'The Thinking Man\'s Redux'],
    ['0653114c-dd08-5f36-863d-009d56bccb8d', 'Beach Trash'],
    ['5c87b91a-2141-590b-ab19-93e8a6f2d885', 'The Northerns'],
    ['e745b541-8bc1-42b5-9d2d-5c3a67817d47', '44'],
    ['acddbb03-064b-5098-87ca-9b146beb12e8', 'Stay Awhile'],
    ['a2d2e313-9cbd-5169-b89c-ab07b33ecc33', 'The Heycitizen Experience'],
    ['05eaeb68-1d19-5f15-afb6-06aeba50381b', 'Grey State'],
    ['5a95f9d8-35e3-51f5-a269-ba1df36b4bd8', 'Bloodshot Lies - The Album'],
    ['671612fb-9039-5189-9d4b-0fd9df2093dd', 'That\'s The Spirit!'],
    ['63fb0d8e-793f-5033-bbb4-39a836e3da76', 'Bowl Covers'],
    ['d6b85f98-6d7a-5eca-b288-dafae4381a1d', 'Street Clones']
  ]);

  constructor() {
    this.apiKey = process.env.REACT_APP_PODCAST_INDEX_API_KEY || '';
    this.apiSecret = process.env.REACT_APP_PODCAST_INDEX_API_SECRET || '';
    
    // Provide clear instructions if credentials are missing
    if (!this.apiKey || !this.apiSecret) {
      console.warn('Podcast Index API credentials not found. To fix this:');
      console.warn('1. Go to https://podcastindex.org/developer to get API credentials');
      console.warn('2. Create a .env.local file in the project root');
      console.warn('3. Add these lines to .env.local:');
      console.warn('   REACT_APP_PODCAST_INDEX_API_KEY=your_api_key_here');
      console.warn('   REACT_APP_PODCAST_INDEX_API_SECRET=your_api_secret_here');
      console.warn('4. Restart the development server');
      console.warn('The app will continue to work with fallback names for known podcasts.');
    }
  }

  private async sha1(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const apiHeaderTime = Math.floor(Date.now() / 1000);
    const dataToHash = this.apiKey + this.apiSecret + apiHeaderTime;
    const sha1Hash = await this.sha1(dataToHash);


    return {
      'X-Auth-Date': apiHeaderTime.toString(),
      'X-Auth-Key': this.apiKey,
      'Authorization': sha1Hash,
      'User-Agent': 'DuhLaurien RSS Checker/1.0'
    };
  }

  async getPodcastByGuid(feedGuid: string): Promise<PodcastInfo | null> {
    // Check cache first
    if (this.cache.has(feedGuid)) {
      return this.cache.get(feedGuid)!;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/podcasts/byguid`, {
        params: { guid: feedGuid },
        headers: await this.getAuthHeaders()
      });

      if (response.data.status && response.data.feed) {
        const feed = response.data.feed;
        const podcastInfo: PodcastInfo = {
          id: feed.id,
          title: feed.title,
          author: feed.author,
          image: feed.image,
          feedGuid: feedGuid
        };
        
        // Cache the result
        this.cache.set(feedGuid, podcastInfo);
        return podcastInfo;
      }
    } catch (error: any) {
      // Only log the first error for each GUID to reduce spam
      if (!this.cache.has(feedGuid)) {
        console.warn(`Podcast Index API error for GUID ${feedGuid}:`, error.response?.status || error.message);
      }
      
      // If API is unavailable, try fallback names
      const fallbackName = this.fallbackNames.get(feedGuid);
      if (fallbackName) {
        console.log(`Using fallback name "${fallbackName}" for GUID ${feedGuid}`);
        const fallbackInfo: PodcastInfo = {
          id: 0,
          title: fallbackName,
          feedGuid: feedGuid
        };
        this.cache.set(feedGuid, fallbackInfo);
        return fallbackInfo;
      }
      // Only warn once per GUID
      if (!this.cache.has(feedGuid)) {
        console.warn('API unavailable and no fallback for GUID:', feedGuid);
      }
    }

    return null;
  }

  async getEpisodeByGuid(feedGuid: string, itemGuid: string): Promise<EpisodeInfo | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/episodes/byguid`, {
        params: { 
          guid: itemGuid,
          feedguid: feedGuid 
        },
        headers: await this.getAuthHeaders()
      });

      if (response.data.status && response.data.episode) {
        const episode = response.data.episode;
        return {
          id: episode.id,
          title: episode.title,
          guid: itemGuid,
          feedGuid: feedGuid
        };
      }
    } catch (error: any) {
      console.warn(`Episode fetch error for item GUID ${itemGuid}:`, error.response?.status || error.message);
    }

    return null;
  }

  // Batch fetch multiple podcasts to reduce API calls
  async getPodcastsByGuids(feedGuids: string[]): Promise<Map<string, PodcastInfo>> {
    const results = new Map<string, PodcastInfo>();
    
    // Get cached results first
    const uncachedGuids = feedGuids.filter(guid => {
      if (this.cache.has(guid)) {
        results.set(guid, this.cache.get(guid)!);
        return false;
      }
      return true;
    });

    // Fetch uncached podcasts
    await Promise.all(
      uncachedGuids.map(async (guid) => {
        const info = await this.getPodcastByGuid(guid);
        if (info) {
          results.set(guid, info);
        }
      })
    );

    return results;
  }
}

export const podcastIndexService = new PodcastIndexService();