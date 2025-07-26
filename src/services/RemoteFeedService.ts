import { feedParserService } from './FeedParserService';
import { valueRecipientService, ValueBlock } from './ValueRecipientService';
import { loadingStateService } from './LoadingStateService';
import { podcastIndexService } from './PodcastIndexService';

interface RemoteFeedInfo {
  guid: string;
  title: string;
  feedUrl: string;
  valueRecipients?: ValueBlock;
  lastFetched?: Date;
  error?: string;
  feedData?: any; // Cached parsed feed data
}

class RemoteFeedService {
  private cache = new Map<string, RemoteFeedInfo>();
  private missingGuidLog = new Set<string>(); // Track logged missing GUIDs to reduce spam
  // Short cache duration for feed validation - ensures fresh data for checking
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for feed validation

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
    ['d6b85f98-6d7a-5eca-b288-dafae4381a1d', 'https://music.behindthesch3m3s.com/wp-content/uploads/Street Clones/street_clones.xml'],
    // Additional feed URLs for missing GUIDs
    ['262a48c2-502d-5c09-add4-76a86056876d', 'https://music.behindthesch3m3s.com/wp-content/uploads/Rubber Factory Records/rubber_factory_records.xml'],
    ['d8ffdade-d979-5c12-a0dc-96d0bba96a9d', 'https://music.behindthesch3m3s.com/wp-content/uploads/Longy/longy.xml'],
    ['93e3c7fe-a851-5c4c-8955-6a04f0f44edc', 'https://music.behindthesch3m3s.com/wp-content/uploads/Abel James/abel_james.xml'],
    ['8c8f0146-5ed0-5c41-978c-ddc7478de179', 'https://music.behindthesch3m3s.com/wp-content/uploads/Marina Osk/marina_osk.xml'],
    ['20e98a05-7d72-5623-9882-6cf5a5aa0b19', 'https://music.behindthesch3m3s.com/wp-content/uploads/ABBESSE/abbesse.xml'],
    ['38970258-bbe2-5f5f-8827-1641a256fe54', 'https://music.behindthesch3m3s.com/wp-content/uploads/CityBeach/citybeach.xml'],
    ['1e7ed1fa-0456-5860-9b34-825d1335d8f8', 'https://music.behindthesch3m3s.com/wp-content/uploads/Rebel Hero/rebel_hero.xml'],
    ['2514d117-8a84-5345-82e8-8ed7b940cf1f', 'https://music.behindthesch3m3s.com/wp-content/uploads/RO Shapiro/ro_shapiro.xml'],
    ['4a156167-aea1-5bc3-9e7d-504477127f79', 'https://music.behindthesch3m3s.com/wp-content/uploads/The%20Greensands/the_greensands.xml'],
    ['de032037-63e0-5c6b-820d-13d4319a2b19', 'https://music.behindthesch3m3s.com/wp-content/uploads/FM Rodeo/fm_rodeo.xml']
  ]);

  // Alternative CORS proxy services for better reliability
  private readonly corsProxies = [
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://proxy.cors.sh/',
    'https://thingproxy.freeboard.io/fetch/',
    'https://api.allorigins.win/get?url='
  ];

  // Fallback value recipients when remote feeds fail to load
  private readonly fallbackValueRecipients: Map<string, ValueBlock>;

  constructor() {
    this.fallbackValueRecipients = new Map<string, ValueBlock>();
    
    // Initialize fallback data
    this.fallbackValueRecipients.set('879febfc-538d-5c10-a34e-a9de5a7666ca', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'SirSpencer', type: 'node', split: 50, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'PodcastIndex', type: 'node', split: 50, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
    
    this.fallbackValueRecipients.set('0653114c-dd08-5f36-863d-009d56bccb8d', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'SirSpencer', type: 'node', split: 50, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'PodcastIndex', type: 'node', split: 50, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
    
    this.fallbackValueRecipients.set('5c87b91a-2141-590b-ab19-93e8a6f2d885', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'sobig@fountain.fm', type: 'node', split: 97.02, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Music Side Project', type: 'node', split: 0.99, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' },
        { name: 'ThunderRoad', type: 'node', split: 0.99, address: '03d4076b4e50590b6b5c273de8b5de5e5e8d1ec84b24ba6cf4d90cba65ac4b7bc6' }
      ]
    });
    
    this.fallbackValueRecipients.set('e745b541-8bc1-42b5-9d2d-5c3a67817d47', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Artist', type: 'node', split: 100, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' }
      ]
    });
    
    this.fallbackValueRecipients.set('acddbb03-064b-5098-87ca-9b146beb12e8', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Able and the Wolf', type: 'node', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', type: 'node', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
    
    this.fallbackValueRecipients.set('a2d2e313-9cbd-5169-b89c-ab07b33ecc33', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Heycitizen', type: 'node', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', type: 'node', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
    
    // Add fallback value recipients for new GUIDs
    this.fallbackValueRecipients.set('262a48c2-502d-5c09-add4-76a86056876d', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Rubber Factory Records', type: 'node', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', type: 'node', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
    
    this.fallbackValueRecipients.set('d8ffdade-d979-5c12-a0dc-96d0bba96a9d', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Longy', type: 'node', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', type: 'node', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
    
    this.fallbackValueRecipients.set('93e3c7fe-a851-5c4c-8955-6a04f0f44edc', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Abel James', type: 'node', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', type: 'node', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
    
    this.fallbackValueRecipients.set('8c8f0146-5ed0-5c41-978c-ddc7478de179', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Marina Osk', type: 'node', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', type: 'node', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
    
    this.fallbackValueRecipients.set('20e98a05-7d72-5623-9882-6cf5a5aa0b19', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'ABBESSE', type: 'node', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', type: 'node', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
    
    this.fallbackValueRecipients.set('38970258-bbe2-5f5f-8827-1641a256fe54', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'CityBeach', type: 'node', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', type: 'node', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
    
    this.fallbackValueRecipients.set('1e7ed1fa-0456-5860-9b34-825d1335d8f8', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Rebel Hero', type: 'node', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', type: 'node', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
    
    this.fallbackValueRecipients.set('2514d117-8a84-5345-82e8-8ed7b940cf1f', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'R.O. Shapiro', type: 'node', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', type: 'node', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
    
    this.fallbackValueRecipients.set('4a156167-aea1-5bc3-9e7d-504477127f79', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'The Greensands', type: 'node', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', type: 'node', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
    
    this.fallbackValueRecipients.set('de032037-63e0-5c6b-820d-13d4319a2b19', {
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'FM Rodeo', type: 'node', split: 90, address: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' },
        { name: 'Support', type: 'node', split: 10, address: '02ad010bfc1297b2a6129a71c2e86a3aaa7e29b6ebc0ba113cf5c2ee7114b5b44e' }
      ]
    });
  }

  private isCacheValid(info: RemoteFeedInfo): boolean {
    if (!info.lastFetched) return false;
    return Date.now() - info.lastFetched.getTime() < this.CACHE_DURATION;
  }

  private async lookupFeedUrlByGuid(feedGuid: string): Promise<string | null> {
    try {
      const podcastInfo = await podcastIndexService.getPodcastByGuid(feedGuid);
      
      if (podcastInfo && podcastInfo.feedUrl) {
        console.log(`✅ Found feed URL for ${feedGuid}: ${podcastInfo.feedUrl}`);
        // Cache the discovered feed URL for future use
        this.knownFeeds.set(feedGuid, podcastInfo.feedUrl);
        return podcastInfo.feedUrl;
      }
      
      // Only log once per session for missing GUIDs to reduce spam
      if (!this.missingGuidLog.has(feedGuid)) {
        console.log(`ℹ️  GUID ${feedGuid} not found in Podcast Index database`);
        this.missingGuidLog.add(feedGuid);
      }
      return null;
    } catch (error) {
      console.warn(`❌ Failed to lookup feed URL for GUID ${feedGuid}:`, error);
      return null;
    }
  }

  async getRemoteFeedValueRecipients(feedGuid: string): Promise<ValueBlock | null> {
    const loadingKey = `remote-feed-${feedGuid}`;
    
    // Check cache first
    const cached = this.cache.get(feedGuid);
    if (cached && this.isCacheValid(cached)) {
      return cached.valueRecipients || null;
    }

    let feedUrl = this.knownFeeds.get(feedGuid);
    
    // If no known feed URL, try to lookup via Podcast Index API
    if (!feedUrl) {
      const apiFeedUrl = await this.lookupFeedUrlByGuid(feedGuid);
      if (apiFeedUrl) {
        feedUrl = apiFeedUrl;
      }
    }
    
    if (!feedUrl) {
      // Only log once per GUID to reduce spam
      if (!this.cache.has(feedGuid)) {
        console.log(`ℹ️  No feed URL available for GUID: ${feedGuid} (using fallback data)`);
        // Cache a null result to prevent repeated warnings
        this.cache.set(feedGuid, {
          guid: feedGuid,
          title: 'Unknown Feed',
          feedUrl: '',
          error: 'No known feed URL'
        });
      }
      loadingStateService.setError(loadingKey, 'No known feed URL');
      return null;
    }

    // Start loading state
    loadingStateService.startLoading(loadingKey, 'Fetching remote feed...');

    // Try multiple CORS proxies with retry logic
    const maxRetries = 1; // Reduced retries to avoid overwhelming servers
    const baseDelay = 2000; // Increased delay to be more respectful
    const totalAttempts = this.corsProxies.length * maxRetries;
    let currentAttempt = 0;

    for (let proxyIndex = 0; proxyIndex < this.corsProxies.length; proxyIndex++) {
      const proxyBase = this.corsProxies[proxyIndex];
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        currentAttempt++;
        const progress = (currentAttempt / totalAttempts) * 90; // Reserve 10% for parsing
        
        try {
          console.log(`Fetching remote feed for ${feedGuid} using proxy ${proxyIndex + 1}/${this.corsProxies.length}: ${feedUrl} (attempt ${attempt}/${maxRetries})`);
          
          loadingStateService.updateProgress(
            loadingKey, 
            progress, 
            `Trying proxy ${proxyIndex + 1}/${this.corsProxies.length} (attempt ${attempt}/${maxRetries})...`
          );
          
          // Build proxy URL based on proxy service format
          let proxyUrl: string;
          if (proxyBase.includes('allorigins.win')) {
            proxyUrl = `${proxyBase}${encodeURIComponent(feedUrl)}`;
          } else if (proxyBase.includes('codetabs.com')) {
            proxyUrl = `${proxyBase}${encodeURIComponent(feedUrl)}`;
          } else if (proxyBase.includes('corsproxy.io')) {
            proxyUrl = `${proxyBase}${encodeURIComponent(feedUrl)}`;
          } else if (proxyBase.includes('cors.sh')) {
            proxyUrl = `${proxyBase}${feedUrl}`;
          } else if (proxyBase.includes('thingproxy.freeboard.io')) {
            proxyUrl = `${proxyBase}${feedUrl}`;
          } else {
            proxyUrl = `${proxyBase}${feedUrl}`;
          }
          
          // Add timeout to prevent hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(proxyUrl, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
        
        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 429) {
            // Rate limiting - skip to next proxy immediately
            console.log(`Rate limited (429), skipping to next proxy...`);
            break; // Skip to next proxy immediately
          } else if (response.status === 403) {
            // Forbidden - this proxy doesn't work for this URL
            console.log(`Proxy ${proxyIndex + 1} forbidden (403) for ${feedGuid}, trying next proxy...`);
            break; // Skip to next proxy immediately
          } else if (response.status === 500) {
            // Server error - retry with same proxy
            if (attempt < maxRetries) {
              const delay = baseDelay * Math.pow(2, attempt - 1);
              console.log(`Server error (500), retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Parse response based on proxy service format
        let feedContent: string;
        if (proxyBase.includes('allorigins.win')) {
          const data = await response.json();
          feedContent = data.contents;
        } else if (proxyBase.includes('codetabs.com')) {
          const data = await response.json();
          feedContent = data.data;
        } else {
          // Other proxies return content directly
          feedContent = await response.text();
        }
        
        if (!feedContent) {
          throw new Error('No feed content received');
        }

        // Update progress for parsing
        loadingStateService.updateProgress(loadingKey, 95, 'Parsing feed content...');
        
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
        
        // Complete loading successfully
        loadingStateService.completeLoading(loadingKey, 'Successfully loaded remote feed');
        
        console.log(`Successfully fetched value recipients for ${feedGuid}:`, valueRecipients?.recipients?.length || 0, 'recipients');
        return valueRecipients;
        
      } catch (error: any) {
        console.warn(`Proxy ${proxyIndex + 1} attempt ${attempt} failed for ${feedGuid}:`, error.message);
        
        // Handle specific error types
        if (error.name === 'AbortError') {
          console.log(`Request timeout for ${feedGuid}, trying next proxy...`);
          break; // Skip to next proxy for timeouts
        }
        
        // If this is the last attempt with this proxy, try next proxy
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before next retry (except for 429 which is handled above)
        if (error.message.includes('429')) {
          continue; // 429 already handled above
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying with same proxy in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Try next proxy
    console.log(`All attempts failed with proxy ${proxyIndex + 1}, trying next proxy...`);
  }

    // All retries failed, try fallback
    console.warn(`All retry attempts failed for ${feedGuid}, using fallback`);
    
    // Try fallback value recipients
    const fallbackValueRecipients = this.fallbackValueRecipients.get(feedGuid);
    if (fallbackValueRecipients) {
      console.log(`Using fallback value recipients for ${feedGuid}:`, fallbackValueRecipients.recipients.length, 'recipients');
      
      // Complete loading with fallback
      loadingStateService.completeLoading(loadingKey, 'Using fallback data');
      
      // Cache the fallback result
      const fallbackInfo: RemoteFeedInfo = {
        guid: feedGuid,
        title: 'Remote Podcast',
        feedUrl,
        valueRecipients: fallbackValueRecipients,
        lastFetched: new Date(),
        error: 'Using fallback data due to CORS errors'
      };
      
      this.cache.set(feedGuid, fallbackInfo);
      return fallbackValueRecipients;
    }
    
    // No fallback available, set error state
    loadingStateService.setError(loadingKey, 'Failed to fetch remote feed and no fallback available');
    
    // Cache the error to avoid repeated failed requests
    const errorInfo: RemoteFeedInfo = {
      guid: feedGuid,
      title: 'Unknown Podcast',
      feedUrl,
      error: 'All fetch attempts and fallback failed',
      lastFetched: new Date()
    };
    
    this.cache.set(feedGuid, errorInfo);
    return null;
  }

  // Batch fetch multiple remote feeds
  async getMultipleRemoteFeedValueRecipients(feedGuids: string[]): Promise<Map<string, ValueBlock | null>> {
    const results = new Map<string, ValueBlock | null>();
    
    // Process in parallel but with some delay to avoid overwhelming servers
    const promises = feedGuids.map(async (guid, index) => {
      // Stagger requests by 500ms each to be more respectful
      await new Promise(resolve => setTimeout(resolve, index * 500));
      
      const valueRecipients = await this.getRemoteFeedValueRecipients(guid);
      results.set(guid, valueRecipients);
      return { guid, valueRecipients };
    });
    
    await Promise.allSettled(promises);
    return results;
  }

  async getMultipleRemoteFeedData(feedGuids: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    // Process in parallel but with some delay to avoid overwhelming servers
    const promises = feedGuids.map(async (guid, index) => {
      // Check cache first
      const cached = this.cache.get(guid);
      if (cached && cached.feedData && this.isCacheValid(cached)) {
        console.log(`Using cached feed data for ${guid} (age: ${cached.lastFetched ? Math.round((Date.now() - cached.lastFetched.getTime()) / 1000) : 0}s)`);
        results.set(guid, cached.feedData);
        return { guid, feedData: cached.feedData };
      }
      
      // Get the feed URL
      const feedUrl = this.knownFeeds.get(guid);
      if (!feedUrl) {
        results.set(guid, null);
        return { guid, feedData: null };
      }
      
      // Stagger requests by 500ms each to be more respectful
      await new Promise(resolve => setTimeout(resolve, index * 500));
      
      try {
        // Try to fetch and parse the feed using the first proxy
        const proxyBase = this.corsProxies[0];
        let proxyUrl: string;
        if (proxyBase.includes('allorigins.win')) {
          proxyUrl = `${proxyBase}${encodeURIComponent(feedUrl)}`;
        } else if (proxyBase.includes('codetabs.com')) {
          proxyUrl = `${proxyBase}${encodeURIComponent(feedUrl)}`;
        } else if (proxyBase.includes('corsproxy.io')) {
          proxyUrl = `${proxyBase}${encodeURIComponent(feedUrl)}`;
        } else if (proxyBase.includes('cors.sh')) {
          proxyUrl = `${proxyBase}${feedUrl}`;
        } else if (proxyBase.includes('thingproxy.freeboard.io')) {
          proxyUrl = `${proxyBase}${feedUrl}`;
        } else {
          proxyUrl = `${proxyBase}${feedUrl}`;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(proxyUrl, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          let feedContent: string;
          
          // Parse response based on proxy service format
          if (proxyBase.includes('allorigins.win')) {
            const data = await response.json();
            feedContent = data.contents;
          } else {
            feedContent = await response.text();
          }
          
          const parseResult = await feedParserService.parseFeed(feedContent);
          if (parseResult.success && parseResult.feed) {
            results.set(guid, parseResult.feed);
            // Update cache with feed data
            const existingCache = this.cache.get(guid);
            if (existingCache) {
              existingCache.feedData = parseResult.feed;
              existingCache.lastFetched = new Date();
            } else {
              // Create new cache entry if it doesn't exist
              this.cache.set(guid, {
                guid,
                title: parseResult.feed?.rss?.channel?.title || 'Remote Podcast',
                feedUrl,
                feedData: parseResult.feed,
                lastFetched: new Date()
              });
            }
            return { guid, feedData: parseResult.feed };
          }
        }
      } catch (error) {
        console.log(`Failed to fetch feed data for ${guid}, will use fallback`);
      }
      
      results.set(guid, null);
      return { guid, feedData: null };
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

  // Force refresh for feed validation - bypass cache
  async getRemoteFeedValueRecipientsFresh(feedGuid: string): Promise<ValueBlock | null> {
    // Clear any existing cache for this GUID to force fresh fetch
    this.cache.delete(feedGuid);
    return this.getRemoteFeedValueRecipients(feedGuid);
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