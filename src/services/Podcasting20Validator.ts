import { RSSFeed, RSSChannel, RSSItem } from '../types/feed';
import { ValidationRule, ValidationResult, ValidationSummary } from '../types/validation';

export class Podcasting20Validator {
  private rules: ValidationRule[] = [];

  constructor() {
    this.initializeRules();
  }

  /**
   * Initialize all validation rules
   */
  private initializeRules(): void {
    // RSS Core Rules
    this.rules.push(
      {
        id: 'rss-001',
        name: 'RSS Channel Title',
        description: 'RSS channel must have a title',
        severity: 'error',
        category: 'required',
        namespace: 'rss',
        check: (feed: RSSFeed) => this.checkChannelTitle(feed)
      },
      {
        id: 'rss-002',
        name: 'RSS Channel Link',
        description: 'RSS channel must have a link',
        severity: 'error',
        category: 'required',
        namespace: 'rss',
        check: (feed: RSSFeed) => this.checkChannelLink(feed)
      },
      {
        id: 'rss-003',
        name: 'RSS Channel Description',
        description: 'RSS channel must have a description',
        severity: 'error',
        category: 'required',
        namespace: 'rss',
        check: (feed: RSSFeed) => this.checkChannelDescription(feed)
      },
      {
        id: 'rss-004',
        name: 'RSS Items Present',
        description: 'RSS channel must have at least one item',
        severity: 'error',
        category: 'required',
        namespace: 'rss',
        check: (feed: RSSFeed) => this.checkChannelItems(feed)
      }
    );

    // iTunes Rules
    this.rules.push(
      {
        id: 'itunes-001',
        name: 'iTunes Author',
        description: 'iTunes author is recommended for podcast feeds',
        severity: 'warning',
        category: 'recommended',
        namespace: 'itunes',
        check: (feed: RSSFeed) => this.checkITunesAuthor(feed)
      },
      {
        id: 'itunes-002',
        name: 'iTunes Category',
        description: 'iTunes category is recommended for podcast feeds',
        severity: 'warning',
        category: 'recommended',
        namespace: 'itunes',
        check: (feed: RSSFeed) => this.checkITunesCategory(feed)
      },
      {
        id: 'itunes-003',
        name: 'iTunes Image',
        description: 'iTunes image is recommended for podcast feeds',
        severity: 'warning',
        category: 'recommended',
        namespace: 'itunes',
        check: (feed: RSSFeed) => this.checkITunesImage(feed)
      },
      {
        id: 'itunes-004',
        name: 'iTunes Explicit',
        description: 'iTunes explicit tag should be specified',
        severity: 'info',
        category: 'recommended',
        namespace: 'itunes',
        check: (feed: RSSFeed) => this.checkITunesExplicit(feed)
      }
    );

    // Podcasting 2.0 Rules
    this.rules.push(
      {
        id: 'podcast-001',
        name: 'Podcasting 2.0 Namespace',
        description: 'Podcasting 2.0 namespace should be declared',
        severity: 'info',
        category: 'recommended',
        namespace: 'podcast',
        check: (feed: RSSFeed) => this.checkPodcasting20Namespace(feed)
      },
      {
        id: 'podcast-002',
        name: 'Podcast GUID',
        description: 'Podcast GUID is recommended for unique identification',
        severity: 'warning',
        category: 'recommended',
        namespace: 'podcast',
        check: (feed: RSSFeed) => this.checkPodcastGuid(feed)
      },
      {
        id: 'podcast-003',
        name: 'Podcast Medium',
        description: 'Podcast medium helps categorize the content type',
        severity: 'info',
        category: 'optional',
        namespace: 'podcast',
        check: (feed: RSSFeed) => this.checkPodcastMedium(feed)
      },
      {
        id: 'podcast-004',
        name: 'Podcast Funding',
        description: 'Podcast funding information is optional but valuable',
        severity: 'info',
        category: 'optional',
        namespace: 'podcast',
        check: (feed: RSSFeed) => this.checkPodcastFunding(feed)
      },
      {
        id: 'podcast-005',
        name: 'Podcast License',
        description: 'Podcast license information is optional',
        severity: 'info',
        category: 'optional',
        namespace: 'podcast',
        check: (feed: RSSFeed) => this.checkPodcastLicense(feed)
      }
    );

    // Episode-level Rules
    this.rules.push(
      {
        id: 'episode-001',
        name: 'Episode GUID',
        description: 'Each episode should have a unique GUID',
        severity: 'warning',
        category: 'recommended',
        namespace: 'rss',
        check: (feed: RSSFeed) => this.checkEpisodeGuids(feed)
      },
      {
        id: 'episode-002',
        name: 'Episode Enclosure',
        description: 'Each episode should have an audio enclosure',
        severity: 'error',
        category: 'required',
        namespace: 'rss',
        check: (feed: RSSFeed) => this.checkEpisodeEnclosures(feed)
      },
      {
        id: 'episode-003',
        name: 'Episode Duration',
        description: 'Episode duration is recommended for better user experience',
        severity: 'warning',
        category: 'recommended',
        namespace: 'itunes',
        check: (feed: RSSFeed) => this.checkEpisodeDurations(feed)
      },
      {
        id: 'episode-004',
        name: 'Episode Transcripts',
        description: 'Episode transcripts improve accessibility',
        severity: 'info',
        category: 'optional',
        namespace: 'podcast',
        check: (feed: RSSFeed) => this.checkEpisodeTranscripts(feed)
      },
      {
        id: 'episode-005',
        name: 'Episode Chapters',
        description: 'Episode chapters improve navigation',
        severity: 'info',
        category: 'optional',
        namespace: 'podcast',
        check: (feed: RSSFeed) => this.checkEpisodeChapters(feed)
      },
      {
        id: 'podcast-006',
        name: 'Value Recipients',
        description: 'Value recipients enable modern podcast monetization',
        severity: 'info',
        category: 'optional',
        namespace: 'podcast',
        check: (feed: RSSFeed) => this.checkValueRecipients(feed)
      },
      {
        id: 'podcast-007',
        name: 'Music Medium Detection',
        description: 'Detect if this is a music podcast vs speech',
        severity: 'info',
        category: 'optional',
        namespace: 'podcast',
        check: (feed: RSSFeed) => this.checkMusicMedium(feed)
      }
    );
  }

  /**
   * Validate a feed against all Podcasting 2.0 rules
   */
  validateFeed(feed: RSSFeed): ValidationSummary {
    const results: ValidationResult[] = [];
    
    // Run all validation rules
    this.rules.forEach(rule => {
      try {
        const result = rule.check(feed);
        results.push(result);
      } catch (error) {
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: 'error',
          category: rule.category,
          namespace: rule.namespace,
          passed: false,
          message: `Validation rule failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: 'Rule execution threw an exception'
        });
      }
    });

    // Calculate summary
    const totalRules = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = totalRules - passed;
    const errors = results.filter(r => r.severity === 'error' && !r.passed).length;
    const warnings = results.filter(r => r.severity === 'warning' && !r.passed).length;
    const info = results.filter(r => r.severity === 'info' && !r.passed).length;
    
    // Calculate compliance score (0-100)
    const complianceScore = totalRules > 0 ? Math.round((passed / totalRules) * 100) : 0;

    return {
      totalRules,
      passed,
      failed,
      errors,
      warnings,
      info,
      complianceScore,
      results
    };
  }

  /**
   * Get validation rules by category
   */
  getRulesByCategory(category: 'required' | 'recommended' | 'optional'): ValidationRule[] {
    return this.rules.filter(rule => rule.category === category);
  }

  /**
   * Get validation rules by namespace
   */
  getRulesByNamespace(namespace: 'rss' | 'itunes' | 'podcast' | 'googleplay'): ValidationRule[] {
    return this.rules.filter(rule => rule.namespace === namespace);
  }

  // RSS Core Validation Methods
  private checkChannelTitle(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const hasTitle = Boolean(channel && channel.title && channel.title.trim().length > 0);
    
    return {
      ruleId: 'rss-001',
      ruleName: 'RSS Channel Title',
      severity: 'error',
      category: 'required',
      namespace: 'rss',
      passed: hasTitle,
      message: hasTitle ? 'Channel title is present' : 'Channel title is missing',
      element: 'channel.title',
      value: channel?.title,
      suggestion: hasTitle ? undefined : 'Add a descriptive title to your RSS channel'
    };
  }

  private checkChannelLink(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const hasLink = Boolean(channel && channel.link && channel.link.trim().length > 0);
    
    return {
      ruleId: 'rss-002',
      ruleName: 'RSS Channel Link',
      severity: 'error',
      category: 'required',
      namespace: 'rss',
      passed: hasLink,
      message: hasLink ? 'Channel link is present' : 'Channel link is missing',
      element: 'channel.link',
      value: channel?.link,
      suggestion: hasLink ? undefined : 'Add a link to your podcast website'
    };
  }

  private checkChannelDescription(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const hasDescription = Boolean(channel && channel.description && channel.description.trim().length > 0);
    
    return {
      ruleId: 'rss-003',
      ruleName: 'RSS Channel Description',
      severity: 'error',
      category: 'required',
      namespace: 'rss',
      passed: hasDescription,
      message: hasDescription ? 'Channel description is present' : 'Channel description is missing',
      element: 'channel.description',
      value: channel?.description,
      suggestion: hasDescription ? undefined : 'Add a description of your podcast'
    };
  }

  private checkChannelItems(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const items = channel?.item;
    const hasItems = Boolean(items && (Array.isArray(items) ? items.length > 0 : true));
    
    return {
      ruleId: 'rss-004',
      ruleName: 'RSS Items Present',
      severity: 'error',
      category: 'required',
      namespace: 'rss',
      passed: hasItems,
      message: hasItems ? 'Channel has items' : 'Channel has no items',
      element: 'channel.item',
      suggestion: hasItems ? undefined : 'Add at least one episode to your feed'
    };
  }

  // iTunes Validation Methods
  private checkITunesAuthor(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const hasAuthor = Boolean(channel && channel['itunes:author'] && channel['itunes:author'].trim().length > 0);
    
    return {
      ruleId: 'itunes-001',
      ruleName: 'iTunes Author',
      severity: 'warning',
      category: 'recommended',
      namespace: 'itunes',
      passed: hasAuthor,
      message: hasAuthor ? 'iTunes author is present' : 'iTunes author is missing',
      element: 'itunes:author',
      value: channel?.['itunes:author'],
      suggestion: hasAuthor ? undefined : 'Add an iTunes author tag for better podcast directory integration'
    };
  }

  private checkITunesCategory(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const hasCategory = Boolean(channel && channel['itunes:category']);
    
    return {
      ruleId: 'itunes-002',
      ruleName: 'iTunes Category',
      severity: 'warning',
      category: 'recommended',
      namespace: 'itunes',
      passed: hasCategory,
      message: hasCategory ? 'iTunes category is present' : 'iTunes category is missing',
      element: 'itunes:category',
      suggestion: hasCategory ? undefined : 'Add an iTunes category to help users find your podcast'
    };
  }

  private checkITunesImage(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const hasImage = Boolean(channel && channel['itunes:image']);
    
    return {
      ruleId: 'itunes-003',
      ruleName: 'iTunes Image',
      severity: 'warning',
      category: 'recommended',
      namespace: 'itunes',
      passed: hasImage,
      message: hasImage ? 'iTunes image is present' : 'iTunes image is missing',
      element: 'itunes:image',
      suggestion: hasImage ? undefined : 'Add an iTunes image for better visual presentation'
    };
  }

  private checkITunesExplicit(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const hasExplicit = Boolean(channel && channel['itunes:explicit'] !== undefined);
    
    return {
      ruleId: 'itunes-004',
      ruleName: 'iTunes Explicit',
      severity: 'info',
      category: 'recommended',
      namespace: 'itunes',
      passed: hasExplicit,
      message: hasExplicit ? 'iTunes explicit tag is present' : 'iTunes explicit tag is not specified',
      element: 'itunes:explicit',
      value: channel?.['itunes:explicit'],
      suggestion: hasExplicit ? undefined : 'Consider adding an explicit tag to indicate content appropriateness'
    };
  }

  // Podcasting 2.0 Validation Methods
  private checkPodcasting20Namespace(feed: RSSFeed): ValidationResult {
    const hasNamespace = Boolean(feed.rss && feed.rss.$ && feed.rss.$['xmlns:podcast']);
    
    return {
      ruleId: 'podcast-001',
      ruleName: 'Podcasting 2.0 Namespace',
      severity: 'info',
      category: 'recommended',
      namespace: 'podcast',
      passed: hasNamespace,
      message: hasNamespace ? 'Podcasting 2.0 namespace is declared' : 'Podcasting 2.0 namespace is not declared',
      element: 'xmlns:podcast',
      value: feed.rss?.$?.['xmlns:podcast'],
      suggestion: hasNamespace ? undefined : 'Add xmlns:podcast="https://github.com/Podcastindex-org/podcast-namespace" to enable Podcasting 2.0 features'
    };
  }

  private checkPodcastGuid(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const hasGuid = Boolean(channel && channel['podcast:guid'] && channel['podcast:guid'].trim().length > 0);
    
    return {
      ruleId: 'podcast-002',
      ruleName: 'Podcast GUID',
      severity: 'warning',
      category: 'recommended',
      namespace: 'podcast',
      passed: hasGuid,
      message: hasGuid ? 'Podcast GUID is present' : 'Podcast GUID is missing',
      element: 'podcast:guid',
      value: channel?.['podcast:guid'],
      suggestion: hasGuid ? undefined : 'Add a unique GUID to help identify your podcast across platforms'
    };
  }

  private checkPodcastMedium(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const hasMedium = Boolean(channel && channel['podcast:medium']);
    
    return {
      ruleId: 'podcast-003',
      ruleName: 'Podcast Medium',
      severity: 'info',
      category: 'optional',
      namespace: 'podcast',
      passed: hasMedium,
      message: hasMedium ? 'Podcast medium is specified' : 'Podcast medium is not specified',
      element: 'podcast:medium',
      value: channel?.['podcast:medium'],
      suggestion: hasMedium ? undefined : 'Consider adding a medium tag to categorize your content type'
    };
  }

  private checkPodcastFunding(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const hasFunding = Boolean(channel && channel['podcast:funding']);
    
    return {
      ruleId: 'podcast-004',
      ruleName: 'Podcast Funding',
      severity: 'info',
      category: 'optional',
      namespace: 'podcast',
      passed: hasFunding,
      message: hasFunding ? 'Podcast funding information is present' : 'Podcast funding information is not present',
      element: 'podcast:funding',
      suggestion: hasFunding ? undefined : 'Consider adding funding information to help support your podcast'
    };
  }

  private checkPodcastLicense(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const hasLicense = Boolean(channel && channel['podcast:license']);
    
    return {
      ruleId: 'podcast-005',
      ruleName: 'Podcast License',
      severity: 'info',
      category: 'optional',
      namespace: 'podcast',
      passed: hasLicense,
      message: hasLicense ? 'Podcast license is specified' : 'Podcast license is not specified',
      element: 'podcast:license',
      suggestion: hasLicense ? undefined : 'Consider adding license information to clarify usage rights'
    };
  }

  // Episode-level Validation Methods
  private checkEpisodeGuids(feed: RSSFeed): ValidationResult {
    const items = this.getItems(feed);
    const itemsWithGuid = items.filter(item => item.guid && item.guid._ && item.guid._.trim().length > 0);
    const allHaveGuid = items.length > 0 && itemsWithGuid.length === items.length;
    
    return {
      ruleId: 'episode-001',
      ruleName: 'Episode GUID',
      severity: 'warning',
      category: 'recommended',
      namespace: 'rss',
      passed: allHaveGuid,
      message: allHaveGuid ? 'All episodes have GUIDs' : `${itemsWithGuid.length}/${items.length} episodes have GUIDs`,
      element: 'item.guid',
      suggestion: allHaveGuid ? undefined : 'Add unique GUIDs to all episodes for better tracking'
    };
  }

  private checkEpisodeEnclosures(feed: RSSFeed): ValidationResult {
    const items = this.getItems(feed);
    const itemsWithEnclosure = items.filter(item => item.enclosure && item.enclosure.url);
    const allHaveEnclosure = items.length > 0 && itemsWithEnclosure.length === items.length;
    
    return {
      ruleId: 'episode-002',
      ruleName: 'Episode Enclosure',
      severity: 'error',
      category: 'required',
      namespace: 'rss',
      passed: allHaveEnclosure,
      message: allHaveEnclosure ? 'All episodes have enclosures' : `${itemsWithEnclosure.length}/${items.length} episodes have enclosures`,
      element: 'item.enclosure',
      suggestion: allHaveEnclosure ? undefined : 'Add audio enclosures to all episodes'
    };
  }

  private checkEpisodeDurations(feed: RSSFeed): ValidationResult {
    const items = this.getItems(feed);
    const itemsWithDuration = items.filter(item => item['itunes:duration']);
    const allHaveDuration = items.length > 0 && itemsWithDuration.length === items.length;
    
    return {
      ruleId: 'episode-003',
      ruleName: 'Episode Duration',
      severity: 'warning',
      category: 'recommended',
      namespace: 'itunes',
      passed: allHaveDuration,
      message: allHaveDuration ? 'All episodes have duration' : `${itemsWithDuration.length}/${items.length} episodes have duration`,
      element: 'itunes:duration',
      suggestion: allHaveDuration ? undefined : 'Add duration information to all episodes for better user experience'
    };
  }

  private checkEpisodeTranscripts(feed: RSSFeed): ValidationResult {
    const items = this.getItems(feed);
    const itemsWithTranscript = items.filter(item => (item as any)['podcast:transcript']);
    const hasTranscripts = itemsWithTranscript.length > 0;
    
    return {
      ruleId: 'episode-004',
      ruleName: 'Episode Transcripts',
      severity: 'info',
      category: 'optional',
      namespace: 'podcast',
      passed: hasTranscripts,
      message: hasTranscripts ? `${itemsWithTranscript.length}/${items.length} episodes have transcripts` : 'No episodes have transcripts',
      element: 'podcast:transcript',
      suggestion: hasTranscripts ? undefined : 'Consider adding transcripts to improve accessibility'
    };
  }

  private checkEpisodeChapters(feed: RSSFeed): ValidationResult {
    const items = this.getItems(feed);
    const itemsWithChapters = items.filter(item => (item as any)['podcast:chapters']);
    const hasChapters = itemsWithChapters.length > 0;
    
    // Check chapter file formats
    const chapterDetails: string[] = [];
    itemsWithChapters.forEach((item, index) => {
      const chapters = (item as any)['podcast:chapters'];
      if (chapters) {
        const url = chapters.$ ? chapters.$.url : chapters.url;
        const type = chapters.$ ? chapters.$.type : chapters.type;
        chapterDetails.push(`Episode ${index + 1}: ${type || 'unknown format'} (${url ? 'valid URL' : 'missing URL'})`);
      }
    });
    
    return {
      ruleId: 'episode-005',
      ruleName: 'Episode Chapters',
      severity: 'info',
      category: 'optional',
      namespace: 'podcast',
      passed: hasChapters,
      message: hasChapters ? 
        `${itemsWithChapters.length}/${items.length} episodes have chapters. Formats: ${chapterDetails.slice(0, 3).join('; ')}${chapterDetails.length > 3 ? '...' : ''}` : 
        'No episodes have chapters',
      element: 'podcast:chapters',
      details: hasChapters ? `Chapter details: ${chapterDetails.join('; ')}` : undefined,
      suggestion: hasChapters ? undefined : 'Consider adding chapters (JSON or PSC format) to improve episode navigation'
    };
  }

  private checkValueRecipients(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const items = this.getItems(feed);
    
    // Check channel-level value recipients
    const channelValue = channel?.['podcast:value'];
    const channelRecipients = channel?.['podcast:valueRecipient'] || [];
    
    // Check episode-level value recipients
    const episodeRecipients: any[] = [];
    items.forEach(item => {
      const episodeValue = (item as any)['podcast:value'];
      const episodeValueRecipients = (item as any)['podcast:valueRecipient'];
      if (episodeValue || episodeValueRecipients) {
        episodeRecipients.push({ episode: item.title, value: episodeValue, recipients: episodeValueRecipients });
      }
    });
    
    const hasValue = Boolean(channelValue) || channelRecipients.length > 0 || episodeRecipients.length > 0;
    
    // Analyze recipient details
    const recipientSummary: string[] = [];
    if (Array.isArray(channelRecipients) && channelRecipients.length > 0) {
      recipientSummary.push(`Channel: ${channelRecipients.length} recipients`);
    }
    if (episodeRecipients.length > 0) {
      recipientSummary.push(`Episodes: ${episodeRecipients.length} have custom recipients`);
    }
    
    // Check for Bitcoin Lightning addresses
    const allRecipients = [...(Array.isArray(channelRecipients) ? channelRecipients : [])];
    episodeRecipients.forEach(ep => {
      if (Array.isArray(ep.recipients)) {
        allRecipients.push(...ep.recipients);
      }
    });
    
    const lightningRecipients = allRecipients.filter(r => 
      r?.$ && (r.$.type === 'node' || r.$.address?.includes('@'))
    );
    
    return {
      ruleId: 'podcast-006',
      ruleName: 'Value Recipients',
      severity: 'info',
      category: 'optional',
      namespace: 'podcast',
      passed: hasValue,
      message: hasValue ? 
        `Value 4 Value enabled. ${recipientSummary.join(', ')}. ${lightningRecipients.length} Lightning recipients found.` : 
        'No value recipients configured',
      element: 'podcast:value, podcast:valueRecipient',
      details: hasValue ? `Total recipients: ${allRecipients.length}, Lightning: ${lightningRecipients.length}` : undefined,
      suggestion: hasValue ? undefined : 'Consider adding Value 4 Value recipients to enable modern podcast monetization'
    };
  }

  private checkMusicMedium(feed: RSSFeed): ValidationResult {
    const channel = this.getChannel(feed);
    const medium = channel?.['podcast:medium'];
    const items = this.getItems(feed);
    
    // Check if explicitly set as music
    const isMusicMedium = medium === 'music';
    
    // Look for music-related indicators
    const musicIndicators: string[] = [];
    
    // Check titles and descriptions for music keywords
    const musicKeywords = ['music', 'song', 'album', 'track', 'artist', 'band', 'single', 'EP', 'LP'];
    const title = channel?.title?.toLowerCase() || '';
    const description = channel?.description?.toLowerCase() || '';
    
    musicKeywords.forEach(keyword => {
      if (title.includes(keyword) || description.includes(keyword)) {
        musicIndicators.push(`"${keyword}" in ${title.includes(keyword) ? 'title' : 'description'}`);
      }
    });
    
    // Check iTunes categories for music
    const itunesCategory = channel?.['itunes:category'];
    if (itunesCategory) {
      const categoryText = Array.isArray(itunesCategory) ? 
        itunesCategory.map(c => (c as any).$.text).join(' ') : 
        (itunesCategory as any).$.text;
      if (categoryText?.toLowerCase().includes('music')) {
        musicIndicators.push('iTunes music category');
      }
    }
    
    // Check episode durations (music typically shorter)
    const durationsInSeconds = items
      .map(item => item['itunes:duration'])
      .filter(duration => duration)
      .map(duration => this.parseDurationToSeconds(duration as string))
      .filter(seconds => seconds > 0);
    
    const avgDuration = durationsInSeconds.length > 0 ? 
      durationsInSeconds.reduce((a, b) => a + b, 0) / durationsInSeconds.length : 0;
    
    if (avgDuration > 0 && avgDuration < 600) { // Less than 10 minutes suggests music
      musicIndicators.push(`short episodes (avg ${Math.round(avgDuration/60)}min)`);
    }
    
    const seemsLikeMusic = musicIndicators.length >= 2 || isMusicMedium;
    
    return {
      ruleId: 'podcast-007',
      ruleName: 'Music Medium Detection',
      severity: 'info',
      category: 'optional',
      namespace: 'podcast',
      passed: isMusicMedium || musicIndicators.length === 0, // Pass if explicitly set or no indicators
      message: isMusicMedium ? 
        'Explicitly set as music medium' : 
        (seemsLikeMusic ? 
          `Appears to be music content: ${musicIndicators.join(', ')}` : 
          'Appears to be speech/podcast content'),
      element: 'podcast:medium',
      value: medium,
      details: musicIndicators.length > 0 ? `Music indicators: ${musicIndicators.join(', ')}` : undefined,
      suggestion: seemsLikeMusic && !isMusicMedium ? 
        'Consider adding <podcast:medium>music</podcast:medium> to properly categorize your content' : 
        undefined
    };
  }

  private parseDurationToSeconds(duration: string): number {
    const parts = duration.split(':').reverse();
    let seconds = 0;
    
    if (parts.length >= 1) seconds += parseInt(parts[0]) || 0;
    if (parts.length >= 2) seconds += (parseInt(parts[1]) || 0) * 60;
    if (parts.length >= 3) seconds += (parseInt(parts[2]) || 0) * 3600;
    
    return seconds;
  }

  // Helper Methods
  private getChannel(feed: RSSFeed): RSSChannel | undefined {
    return feed.rss?.channel;
  }

  private getItems(feed: RSSFeed): RSSItem[] {
    const channel = this.getChannel(feed);
    if (!channel?.item) return [];
    
    return Array.isArray(channel.item) ? channel.item : [channel.item];
  }
}

// Export singleton instance
export const podcasting20Validator = new Podcasting20Validator(); 