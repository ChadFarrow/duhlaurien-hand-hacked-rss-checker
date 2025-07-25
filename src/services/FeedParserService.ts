import { XMLParser } from 'fast-xml-parser';
import { 
  RSSFeed, 
  RSSRoot, 
  AtomRoot 
} from '../types/feed';
import { FeedMetadata } from '../types/validation';

export interface FeedParseResult {
  success: boolean;
  feed?: RSSFeed;
  error?: string;
  feedType: 'rss' | 'atom' | 'unknown';
  namespaces: string[];
  metadata: FeedMetadata;
}

export class FeedParserService {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
      tagValueProcessor: (tagName: string, tagValue: string) => {
        // Convert boolean strings to actual booleans
        if (tagValue === 'true') return true;
        if (tagValue === 'false') return false;
        return tagValue;
      }
    });
  }

  /**
   * Parse RSS/XML feed content
   */
  async parseFeed(xmlContent: string): Promise<FeedParseResult> {
    try {
      // Parse the XML content
      const result = this.parser.parse(xmlContent);
      
      // Determine feed type and extract metadata
      const feedType = this.determineFeedType(result);
      const namespaces = this.extractNamespaces(result);
      const metadata = this.extractMetadata(result, feedType);

      // Validate and structure the feed data
      const feed = this.structureFeedData(result, feedType);

      return {
        success: true,
        feed,
        feedType,
        namespaces,
        metadata
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        feedType: 'unknown',
        namespaces: [],
        metadata: this.createEmptyMetadata()
      };
    }
  }

  /**
   * Determine the type of feed (RSS or Atom)
   */
  private determineFeedType(result: any): 'rss' | 'atom' | 'unknown' {
    if (result.rss) {
      return 'rss';
    } else if (result.feed) {
      return 'atom';
    } else {
      // Check for root element names
      const rootKeys = Object.keys(result);
      if (rootKeys.includes('rss')) {
        return 'rss';
      } else if (rootKeys.includes('feed')) {
        return 'atom';
      }
    }
    return 'unknown';
  }

  /**
   * Extract namespaces from the feed
   */
  private extractNamespaces(result: any): string[] {
    const namespaces: string[] = [];
    
    // Check RSS root attributes
    if (result.rss && result.rss['@_xmlns:podcast']) {
      namespaces.push('podcast');
    }
    if (result.rss && result.rss['@_xmlns:itunes']) {
      namespaces.push('itunes');
    }
    if (result.rss && result.rss['@_xmlns:googleplay']) {
      namespaces.push('googleplay');
    }

    // Check Atom feed attributes
    if (result.feed && result.feed['@_xmlns:podcast']) {
      namespaces.push('podcast');
    }
    if (result.feed && result.feed['@_xmlns:itunes']) {
      namespaces.push('itunes');
    }
    if (result.feed && result.feed['@_xmlns:googleplay']) {
      namespaces.push('googleplay');
    }

    return namespaces;
  }

  /**
   * Extract metadata from the feed
   */
  private extractMetadata(result: any, feedType: 'rss' | 'atom' | 'unknown'): FeedMetadata {
    const metadata: FeedMetadata = {
      itemCount: 0,
      hasPodcasting20: false,
      hasITunes: false,
      hasGooglePlay: false
    };

    if (feedType === 'rss' && result.rss?.channel) {
      const channel = result.rss.channel;
      
      metadata.title = channel.title;
      metadata.description = channel.description;
      metadata.link = channel.link;
      metadata.language = channel.language;
      metadata.lastUpdated = channel.lastBuildDate || channel.pubDate;
      metadata.itemCount = Array.isArray(channel.item) ? channel.item.length : 
                          (channel.item ? 1 : 0);

      // Check for namespaces
      metadata.hasPodcasting20 = this.hasNamespace(result, 'podcast');
      metadata.hasITunes = this.hasNamespace(result, 'itunes');
      metadata.hasGooglePlay = this.hasNamespace(result, 'googleplay');

    } else if (feedType === 'atom' && result.feed) {
      const feed = result.feed;
      
      metadata.title = feed.title;
      metadata.description = feed.subtitle;
      metadata.link = this.extractAtomLink(feed.link);
      metadata.lastUpdated = feed.updated;
      metadata.itemCount = Array.isArray(feed.entry) ? feed.entry.length : 
                          (feed.entry ? 1 : 0);
    }

    return metadata;
  }

  /**
   * Check if a namespace is present in the feed
   */
  private hasNamespace(result: any, namespace: string): boolean {
    if (result.rss && result.rss[`@_xmlns:${namespace}`]) {
      return true;
    }
    if (result.feed && result.feed[`@_xmlns:${namespace}`]) {
      return true;
    }
    return false;
  }

  /**
   * Extract link from Atom feed
   */
  private extractAtomLink(links: any): string {
    if (!links) return '';
    
    if (Array.isArray(links)) {
      const selfLink = links.find((link: any) => link.rel === 'self' || !link.rel);
      return selfLink?.href || '';
    }
    
    return links.href || '';
  }

  /**
   * Structure the feed data based on type
   */
  private structureFeedData(result: any, feedType: 'rss' | 'atom' | 'unknown'): RSSFeed | undefined {
    if (feedType === 'rss') {
      return {
        rss: result.rss
      };
    } else if (feedType === 'atom') {
      return {
        feed: result.feed
      };
    }
    return undefined;
  }

  /**
   * Create empty metadata for error cases
   */
  private createEmptyMetadata(): FeedMetadata {
    return {
      itemCount: 0,
      hasPodcasting20: false,
      hasITunes: false,
      hasGooglePlay: false
    };
  }

  /**
   * Validate feed structure
   */
  validateFeedStructure(feed: RSSFeed): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (feed.rss) {
      // Validate RSS feed
      if (!feed.rss.channel) {
        errors.push('RSS feed missing channel element');
      } else {
        const channel = feed.rss.channel;
        if (!channel.title) errors.push('RSS channel missing title');
        if (!channel.link) errors.push('RSS channel missing link');
        if (!channel.description) errors.push('RSS channel missing description');
        if (!channel.item || !Array.isArray(channel.item) || channel.item.length === 0) {
          errors.push('RSS channel missing items');
        }
      }
    } else if (feed.feed) {
      // Validate Atom feed
      const atomFeed = feed.feed;
      if (!atomFeed.id) errors.push('Atom feed missing id');
      if (!atomFeed.title) errors.push('Atom feed missing title');
      if (!atomFeed.updated) errors.push('Atom feed missing updated date');
      if (!atomFeed.entry || !Array.isArray(atomFeed.entry) || atomFeed.entry.length === 0) {
        errors.push('Atom feed missing entries');
      }
    } else {
      errors.push('Feed is neither RSS nor Atom format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get feed statistics
   */
  getFeedStatistics(feed: RSSFeed): {
    totalItems: number;
    totalDuration: number;
    averageDuration: number;
    hasEnclosures: number;
    hasTranscripts: number;
    hasChapters: number;
    hasValue: number;
  } {
    let totalItems = 0;
    let totalDuration = 0;
    let hasEnclosures = 0;
    let hasTranscripts = 0;
    let hasChapters = 0;
    let hasValue = 0;

    if (feed.rss?.channel?.item) {
      const items = Array.isArray(feed.rss.channel.item) ? 
                   feed.rss.channel.item : [feed.rss.channel.item];
      const channel = feed.rss.channel;
      
      totalItems = items.length;
      
      // Check for Value 4 Value at channel level OR episode level
      const channelHasValue = Boolean(channel['podcast:value'] || channel['podcast:valueRecipient']);
      
      items.forEach(item => {
        // Count enclosures
        if (item.enclosure) hasEnclosures++;
        
        // Count transcripts
        if (item['podcast:transcript']) hasTranscripts++;
        
        // Count chapters
        if (item['podcast:chapters']) hasChapters++;
        
        // Count Value 4 Value: either channel-level applies to all OR episode has its own
        if (channelHasValue || item['podcast:value'] || item['podcast:valueRecipient']) {
          hasValue++;
        }
        
        // Calculate duration
        if (item['itunes:duration']) {
          const duration = this.parseDuration(item['itunes:duration']);
          totalDuration += duration;
        }
      });
    } else if (feed.feed?.entry) {
      const entries = Array.isArray(feed.feed.entry) ? 
                     feed.feed.entry : [feed.feed.entry];
      
      totalItems = entries.length;
      
      entries.forEach(entry => {
        // Count transcripts
        if ((entry as any)['podcast:transcript']) hasTranscripts++;
        
        // Count chapters
        if ((entry as any)['podcast:chapters']) hasChapters++;
      });
    }

    return {
      totalItems,
      totalDuration,
      averageDuration: totalItems > 0 ? totalDuration / totalItems : 0,
      hasEnclosures,
      hasTranscripts,
      hasChapters,
      hasValue
    };
  }

  /**
   * Parse duration string to seconds
   */
  private parseDuration(duration: string): number {
    if (!duration) return 0;
    
    const parts = duration.split(':').reverse();
    let seconds = 0;
    
    if (parts.length >= 1) seconds += parseInt(parts[0]) || 0;
    if (parts.length >= 2) seconds += (parseInt(parts[1]) || 0) * 60;
    if (parts.length >= 3) seconds += (parseInt(parts[2]) || 0) * 3600;
    
    return seconds;
  }
}

// Export singleton instance
export const feedParserService = new FeedParserService(); 