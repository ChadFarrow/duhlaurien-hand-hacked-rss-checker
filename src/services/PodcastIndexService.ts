import axios from 'axios';
import { RSSChannel } from '../types/feed';

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

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

class PodcastIndexService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.podcastindex.org/api/1.0';
  private cache = new Map<string, PodcastInfo>();
  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2
  };
  
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
    ['d6b85f98-6d7a-5eca-b288-dafae4381a1d', 'Street Clones'],
    // Additional fallback names for missing GUIDs
    ['b328828c-9ba0-5b1d-be33-4cce51968ae1', 'Unknown Podcast 1'],
    ['aa1e57df-d8aa-5de0-82d8-4f40fac65d7c', 'Unknown Podcast 2'],
    ['1df430e3-20f6-595e-9af2-8f9d5123c19b', 'Unknown Podcast 3'],
    ['2b6d971f-562e-510e-ad40-272cb3962c8b', 'Unknown Podcast 4'],
    ['bf99e8c3-1f97-558d-bc1d-a4bda04027f7', 'Unknown Podcast 5'],
    ['fc815bcf-3639-5395-ba7d-fa217ec93d32', 'Unknown Podcast 6'],
    ['121c26b0-33f8-5cb9-9e14-d706bd3f5db8', 'Unknown Podcast 7'],
    ['7b7949ca-5019-5814-aa53-d4b14bd15a6d', 'Unknown Podcast 8'],
    ['c39decf9-973e-564f-b741-0ad2985b3b1c', 'Unknown Podcast 9'],
    ['c42a0900-c20e-59a2-a13b-c23b5c04e11f', 'Unknown Podcast 10'],
    ['61676a69-5bab-57a9-8326-7fe68a572649', 'Unknown Podcast 11'],
    ['69c634ad-afea-5826-ad9a-8e1f06d6470b', 'Unknown Podcast 12'],
    ['7869bafd-2334-54a1-a76a-2c8f68f56828', 'Unknown Podcast 13'],
    ['c989830b-49a1-572f-9f0e-0fec994a6d5a', 'Unknown Podcast 14'],
    ['3074902b-b2dc-5877-bfc3-30f5df0fbe6a', 'Unknown Podcast 15']
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

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry<T>(
    url: string, 
    config: any, 
    context: string
  ): Promise<T | null> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        const response = await axios.get(url, config);
        return response.data;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on 401 (auth errors) or 404 (not found)
        if (error.response?.status === 401 || error.response?.status === 404) {
          throw error;
        }
        
        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelay
        );
        
        if (attempt < this.retryConfig.maxAttempts) {
          console.log(`${context}: Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  private extractPodcastInfoFromChannel(channel: RSSChannel | undefined, feedGuid: string): PodcastInfo | null {
    if (!channel) return null;
    
    // Extract podcast info from RSS channel data
    const podcastInfo: PodcastInfo = {
      id: 0, // No ID from RSS feed
      title: channel.title || `Unknown Podcast (${feedGuid.slice(0, 8)}...)`,
      author: channel['itunes:author'] || channel.managingEditor || undefined,
      image: channel.image?.url || channel['itunes:image']?.$?.href || undefined,
      feedGuid: feedGuid
    };
    
    console.log(`Using RSS feed data as fallback for GUID ${feedGuid}: "${podcastInfo.title}"`);
    return podcastInfo;
  }

  async getPodcastByGuid(feedGuid: string, rssChannel?: RSSChannel): Promise<PodcastInfo | null> {
    // Check cache first
    if (this.cache.has(feedGuid)) {
      return this.cache.get(feedGuid)!;
    }

    try {
      const data = await this.fetchWithRetry<any>(
        `${this.baseUrl}/podcasts/byguid`,
        {
          params: { guid: feedGuid },
          headers: await this.getAuthHeaders()
        },
        `Podcast fetch for GUID ${feedGuid}`
      );

      if (data?.status && data?.feed) {
        const feed = data.feed;
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
        if (error.response?.status === 401) {
          console.warn(`Podcast Index API authentication failed for GUID ${feedGuid}. Check your API credentials.`);
        } else {
          console.warn(`Podcast Index API error for GUID ${feedGuid} after ${this.retryConfig.maxAttempts} attempts:`, error.response?.status || error.message);
        }
      }
      
      // Try RSS channel data as first fallback
      if (rssChannel) {
        const rssInfo = this.extractPodcastInfoFromChannel(rssChannel, feedGuid);
        if (rssInfo) {
          this.cache.set(feedGuid, rssInfo);
          return rssInfo;
        }
      }
      
      // If no RSS data, try hardcoded fallback names
      const fallbackName = this.fallbackNames.get(feedGuid);
      if (fallbackName) {
        console.log(`Using hardcoded fallback name "${fallbackName}" for GUID ${feedGuid}`);
        const fallbackInfo: PodcastInfo = {
          id: 0,
          title: fallbackName,
          feedGuid: feedGuid
        };
        this.cache.set(feedGuid, fallbackInfo);
        return fallbackInfo;
      }
      
      // Only warn once per GUID and only for truly unknown GUIDs
      if (!this.cache.has(feedGuid)) {
        console.warn(`No fallback available for GUID: ${feedGuid}`);
        // Create a generic fallback to prevent repeated errors
        const genericInfo: PodcastInfo = {
          id: 0,
          title: `Unknown Podcast (${feedGuid.slice(0, 8)}...)`,
          feedGuid: feedGuid
        };
        this.cache.set(feedGuid, genericInfo);
        return genericInfo;
      }
    }

    return null;
  }

  async getEpisodeByGuid(feedGuid: string, itemGuid: string): Promise<EpisodeInfo | null> {
    try {
      const data = await this.fetchWithRetry<any>(
        `${this.baseUrl}/episodes/byguid`,
        {
          params: { 
            guid: itemGuid,
            feedguid: feedGuid 
          },
          headers: await this.getAuthHeaders()
        },
        `Episode fetch for item GUID ${itemGuid}`
      );

      if (data?.status && data?.episode) {
        const episode = data.episode;
        return {
          id: episode.id,
          title: episode.title,
          guid: itemGuid,
          feedGuid: feedGuid
        };
      }
    } catch (error: any) {
      console.warn(`Episode fetch error for item GUID ${itemGuid} after ${this.retryConfig.maxAttempts} attempts:`, error.response?.status || error.message);
    }

    return null;
  }

  // Batch fetch multiple podcasts to reduce API calls
  async getPodcastsByGuids(feedGuids: string[], rssChannels?: Map<string, RSSChannel>): Promise<Map<string, PodcastInfo>> {
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
        const rssChannel = rssChannels?.get(guid);
        const info = await this.getPodcastByGuid(guid, rssChannel);
        if (info) {
          results.set(guid, info);
        }
      })
    );

    return results;
  }
}

export const podcastIndexService = new PodcastIndexService();