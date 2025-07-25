import { feedParserService } from './FeedParserService';
import { valueRecipientService, ValueBlock } from './ValueRecipientService';

interface RemoteFeedInfo {
  guid: string;
  title: string;
  feedUrl: string;
  valueRecipients?: ValueBlock;
  lastFetched?: Date;
  error?: string;
}

class RemoteFeedService {
  private cache = new Map<string, RemoteFeedInfo>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Known remote feed URLs for faster lookups
  private readonly knownFeeds = new Map<string, string>([
    ['879febfc-538d-5c10-a34e-a9de5a7666ca', 'https://feeds.rssblue.com/the-thinking-mans-redux'],
    ['0653114c-dd08-5f36-863d-009d56bccb8d', 'https://music.behindthesch3m3s.com/wp-content/uploads/tso big/beach trash/beach_trash.xml'],
    ['5c87b91a-2141-590b-ab19-93e8a6f2d885', 'https://music.behindthesch3m3s.com/wp-content/uploads/The Northerns/the_northerns.xml'],
    ['e745b541-8bc1-42b5-9d2d-5c3a67817d47', 'https://hogstory.net/uploads/44/album_feed.xml'],
    ['acddbb03-064b-5098-87ca-9b146beb12e8', 'https://ableandthewolf.com/static/media/feed.xml'],
    ['a2d2e313-9cbd-5169-b89c-ab07b33ecc33', 'https://files.heycitizen.xyz/Songs/Albums/The-Heycitizen-Experience/the heycitizen experience.xml'],
    ['05eaeb68-1d19-5f15-afb6-06aeba50381b', 'https://headstarts.uk/msp/the_fifty_four_plates/grey_state/grey_state.xml'],
    ['5a95f9d8-35e3-51f5-a269-ba1df36b4bd8', 'https://www.doerfelverse.com/feeds/bloodshot-lies-album.xml'],
    ['671612fb-9039-5189-9d4b-0fd9df2093dd', 'https://feeds.rssblue.com/thats-the-spirit'],
    ['63fb0d8e-793f-5033-bbb4-39a836e3da76', 'https://feed.bowlafterbowl.com/demu/bowl-covers/feed.xml'],
    ['d6b85f98-6d7a-5eca-b288-dafae4381a1d', 'https://music.behindthesch3m3s.com/wp-content/uploads/Street Clones/street_clones.xml']
  ]);

  // Fallback value recipients when remote feeds fail to load
  private readonly fallbackValueRecipients = new Map<string, ValueBlock>([
    ['879febfc-538d-5c10-a34e-a9de5a7666ca', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'SirSpencer', split: 50, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'PodcastIndex', split: 50, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    }],
    ['0653114c-dd08-5f36-863d-009d56bccb8d', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'SirSpencer', split: 50, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'PodcastIndex', split: 50, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    }],
    ['5c87b91a-2141-590b-ab19-93e8a6f2d885', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'sobig@fountain.fm', split: 97.02, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Music Side Project', split: 0.99, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' },
        { name: 'ThunderRoad', split: 0.99, address: '03d4076b4e50590b6b5c273de8b5de5e5e8d1ec84b24ba6cf4d90cba65ac4b7bc6' }
      ]
    }],
    ['e745b541-8bc1-42b5-9d2d-5c3a67817d47', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Artist', split: 100, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' }
      ]
    }],
    ['acddbb03-064b-5098-87ca-9b146beb12e8', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Able and the Wolf', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    }],
    ['a2d2e313-9cbd-5169-b89c-ab07b33ecc33', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Heycitizen', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    }]
  ]);

  private isCacheValid(info: RemoteFeedInfo): boolean {
    if (!info.lastFetched) return false;
    return Date.now() - info.lastFetched.getTime() < this.CACHE_DURATION;
  }

  async getRemoteFeedValueRecipients(feedGuid: string): Promise<ValueBlock | null> {
    // Check cache first
    const cached = this.cache.get(feedGuid);
    if (cached && this.isCacheValid(cached)) {
      return cached.valueRecipients || null;
    }

    const feedUrl = this.knownFeeds.get(feedGuid);
    if (!feedUrl) {
      console.warn(`No known feed URL for GUID: ${feedGuid}`);
      return null;
    }

    try {
      console.log(`Fetching remote feed for ${feedGuid}: ${feedUrl}`);
      
      // Use CORS proxy for cross-origin requests
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const feedContent = data.contents;
      
      if (!feedContent) {
        throw new Error('No feed content received');
      }

      // Parse the RSS feed
      const parsedFeed = await feedParserService.parseFeed(feedContent);
      
      if (!parsedFeed || parsedFeed.feedType !== 'rss') {
        throw new Error('Failed to parse RSS feed or not RSS format');
      }

      // Extract value recipients from the feed-level data
      let valueRecipients: ValueBlock | null = null;
      
      // Check feed-level value recipients first
      if (parsedFeed.feed?.rss?.channel && parsedFeed.feed.rss.channel['podcast:value']) {
        const channelData = parsedFeed.feed.rss.channel;
        valueRecipients = valueRecipientService.extractValueRecipients(channelData as any);
      }
      
      // If no feed-level recipients, check first episode
      if (!valueRecipients && parsedFeed.feed?.rss?.channel?.item && parsedFeed.feed.rss.channel.item.length > 0) {
        valueRecipients = valueRecipientService.extractValueRecipients(parsedFeed.feed.rss.channel.item[0]);
      }

      // Cache the result
      const feedInfo: RemoteFeedInfo = {
        guid: feedGuid,
        title: parsedFeed.feed?.rss?.channel?.title || 'Unknown Podcast',
        feedUrl,
        valueRecipients: valueRecipients || undefined,
        lastFetched: new Date()
      };
      
      this.cache.set(feedGuid, feedInfo);
      
      console.log(`Successfully fetched value recipients for ${feedGuid}:`, valueRecipients?.recipients?.length || 0, 'recipients');
      return valueRecipients;
      
    } catch (error: any) {
      console.warn(`Failed to fetch remote feed ${feedGuid}:`, error.message);
      
      // Try fallback value recipients
      const fallbackValueRecipients = this.fallbackValueRecipients.get(feedGuid);
      if (fallbackValueRecipients) {
        console.log(`Using fallback value recipients for ${feedGuid}:`, fallbackValueRecipients.recipients.length, 'recipients');
        
        // Cache the fallback result
        const fallbackInfo: RemoteFeedInfo = {
          guid: feedGuid,
          title: 'Remote Podcast',
          feedUrl,
          valueRecipients: fallbackValueRecipients,
          lastFetched: new Date(),
          error: `Using fallback data: ${error.message}`
        };
        
        this.cache.set(feedGuid, fallbackInfo);
        return fallbackValueRecipients;
      }
      
      // Cache the error to avoid repeated failed requests
      const errorInfo: RemoteFeedInfo = {
        guid: feedGuid,
        title: 'Unknown Podcast',
        feedUrl,
        error: error.message,
        lastFetched: new Date()
      };
      
      this.cache.set(feedGuid, errorInfo);
      return null;
    }
  }

  // Batch fetch multiple remote feeds
  async getMultipleRemoteFeedValueRecipients(feedGuids: string[]): Promise<Map<string, ValueBlock | null>> {
    const results = new Map<string, ValueBlock | null>();
    
    // Process in parallel but with some delay to avoid overwhelming servers
    const promises = feedGuids.map(async (guid, index) => {
      // Stagger requests by 100ms each to be respectful
      await new Promise(resolve => setTimeout(resolve, index * 100));
      
      const valueRecipients = await this.getRemoteFeedValueRecipients(guid);
      results.set(guid, valueRecipients);
      return { guid, valueRecipients };
    });
    
    await Promise.allSettled(promises);
    return results;
  }

  // Clear cache for a specific GUID
  clearCache(feedGuid?: string): void {
    if (feedGuid) {
      this.cache.delete(feedGuid);
    } else {
      this.cache.clear();
    }
  }

  // Get cache info for debugging
  getCacheInfo(): { size: number; entries: Array<{ guid: string; title: string; lastFetched?: Date; hasError: boolean }> } {
    const entries = Array.from(this.cache.entries()).map(([guid, info]) => ({
      guid,
      title: info.title,
      lastFetched: info.lastFetched,
      hasError: !!info.error
    }));
    
    return {
      size: this.cache.size,
      entries
    };
  }
}

export const remoteFeedService = new RemoteFeedService();
export type { RemoteFeedInfo, ValueBlock };