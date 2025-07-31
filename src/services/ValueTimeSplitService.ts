import { RSSItem } from '../types/feed';

export interface ValueTimeSplit {
  startTime: number;
  remotePercentage: number;
  duration: number;
  remoteItem?: {
    feedGuid: string;
    itemGuid?: string;
  };
  valueRecipients?: Array<{
    name: string;
    type: string;
    address: string;
    split: number;
    fee?: boolean;
    customKey?: string;
    customValue?: string;
  }>;
}

export interface ChapterWithValue {
  startTime: number;
  title: string;
  img?: string;
  url?: string;
  valueTimeSplits: ValueTimeSplit[];
}

class ValueTimeSplitService {
  /**
   * Extract value time splits from an RSS item
   */
  extractValueTimeSplits(item: RSSItem): ValueTimeSplit[] {
    
    const value = item['podcast:value'];
    if (!value || !value['podcast:valueTimeSplit']) {
      return [];
    }

    // Debug: Log the structure to understand what we're working with

    const timeSplits = Array.isArray(value['podcast:valueTimeSplit']) 
      ? value['podcast:valueTimeSplit'] 
      : [value['podcast:valueTimeSplit']];

    
    const results = timeSplits
      .map((split: any, index: number): ValueTimeSplit | null => {
        
        if (!split) {
          return null;
        }
        
        try {
          const result: ValueTimeSplit = {
            startTime: parseFloat(split['@_startTime'] || '0'),
            remotePercentage: parseFloat(split['@_remotePercentage'] || '0'),
            duration: parseFloat(split['@_duration'] || '0')
          };
          
          // Handle remoteItem if present
          if (split['podcast:remoteItem']) {
            result.remoteItem = {
              feedGuid: split['podcast:remoteItem']['@_feedGuid'] || '',
              itemGuid: split['podcast:remoteItem']['@_itemGuid']
            };
          }
          
          // Handle direct value recipients if present
          if (split['podcast:valueRecipient']) {
            const recipients = Array.isArray(split['podcast:valueRecipient']) 
              ? split['podcast:valueRecipient'] 
              : [split['podcast:valueRecipient']];
              
            result.valueRecipients = recipients.map((recipient: any) => ({
              name: recipient['@_name'] || recipient.$?.name || '',
              type: recipient['@_type'] || recipient.$?.type || 'node',
              address: recipient['@_address'] || recipient.$?.address || '',
              split: parseFloat(recipient['@_split'] || recipient.$?.split || '0'),
              fee: recipient['@_fee'] === 'true' || recipient.$?.fee === 'true',
              customKey: recipient['@_customKey'] || recipient.$?.customKey,
              customValue: recipient['@_customValue'] || recipient.$?.customValue
            }));
          }
          
          return result;
        } catch (error) {
          console.warn('Error parsing value time split:', error, split);
          return null;
        }
      })
      .filter((split): split is ValueTimeSplit => split !== null);
    
    return results;
  }

  /**
   * Match value time splits with chapters based on timing
   */
  matchValueTimeSplitsWithChapters(
    chapters: { startTime: number; title: string; img?: string; url?: string }[],
    valueTimeSplits: ValueTimeSplit[]
  ): ChapterWithValue[] {
    return chapters.map((chapter, index) => {
      // Find the next chapter to determine this chapter's end time
      const nextChapter = chapters[index + 1];
      const chapterEndTime = nextChapter ? nextChapter.startTime : Infinity;
      
      // Find all value time splits that overlap with this chapter's time range
      const matchingSplits = valueTimeSplits.filter(split => {
        const splitEndTime = split.startTime + split.duration;
        
        // A split matches if it overlaps with the chapter in any way:
        // 1. Split starts within the chapter
        // 2. Split ends within the chapter
        // 3. Split encompasses the entire chapter
        // 4. For splits without duration, check if they start within the chapter
        if (split.duration === 0) {
          // For splits without duration, match if they start within the chapter
          return split.startTime >= chapter.startTime && split.startTime < chapterEndTime;
        }
        
        return (
          // Split starts within chapter
          (split.startTime >= chapter.startTime && split.startTime < chapterEndTime) ||
          // Split ends within chapter
          (splitEndTime > chapter.startTime && splitEndTime <= chapterEndTime) ||
          // Split encompasses chapter
          (split.startTime <= chapter.startTime && splitEndTime >= chapterEndTime)
        );
      });

      return {
        ...chapter,
        valueTimeSplits: matchingSplits
      };
    });
  }

  /**
   * Format value time split information for display
   */
  formatValueTimeSplit(split: ValueTimeSplit): string {
    const startTime = this.formatTime(split.startTime);
    const endTime = this.formatTime(split.startTime + split.duration);
    const percentage = split.remotePercentage;
    
    if (split.valueRecipients && split.valueRecipients.length > 0) {
      const recipientNames = split.valueRecipients.map(r => r.name).join(', ');
      return `${startTime} - ${endTime} (${percentage}% to ${recipientNames})`;
    }
    
    return `${startTime} - ${endTime} (${percentage}% remote)`;
  }

  /**
   * Format time in MM:SS or HH:MM:SS format
   */
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get value time splits for a specific episode
   */
  getEpisodeValueTimeSplits(episode: RSSItem): ValueTimeSplit[] {
    return this.extractValueTimeSplits(episode);
  }

  /**
   * Check if an episode has value time splits
   */
  hasValueTimeSplits(episode: RSSItem): boolean {
    const splits = this.extractValueTimeSplits(episode);
    return splits.length > 0;
  }

  /**
   * Get value time splits that apply to a specific time range
   * This is useful for finding splits that apply to a specific chapter/track
   */
  getSplitsForTimeRange(
    splits: ValueTimeSplit[],
    startTime: number,
    endTime: number
  ): ValueTimeSplit[] {
    return splits.filter(split => {
      if (split.duration === 0) {
        // For splits without duration, check if they start within the range
        return split.startTime >= startTime && split.startTime < endTime;
      }
      
      const splitEndTime = split.startTime + split.duration;
      return (
        // Split starts within range
        (split.startTime >= startTime && split.startTime < endTime) ||
        // Split ends within range
        (splitEndTime > startTime && splitEndTime <= endTime) ||
        // Split encompasses range
        (split.startTime <= startTime && splitEndTime >= endTime)
      );
    });
  }

  /**
   * Validate that all chapters have associated payment splits
   * Returns an object with validation results
   */
  validateChapterPaymentCoverage(
    chapters: { startTime: number; title: string }[],
    valueTimeSplits: ValueTimeSplit[]
  ): {
    totalChapters: number;
    chaptersWithPayment: number;
    chaptersWithoutPayment: string[];
    coveragePercentage: number;
  } {
    const chaptersWithoutPayment: string[] = [];
    let chaptersWithPayment = 0;

    chapters.forEach((chapter, index) => {
      const nextChapter = chapters[index + 1];
      const chapterEndTime = nextChapter ? nextChapter.startTime : Infinity;
      
      const matchingSplits = this.getSplitsForTimeRange(
        valueTimeSplits,
        chapter.startTime,
        chapterEndTime
      );

      if (matchingSplits.length > 0) {
        chaptersWithPayment++;
      } else {
        chaptersWithoutPayment.push(chapter.title);
      }
    });

    return {
      totalChapters: chapters.length,
      chaptersWithPayment,
      chaptersWithoutPayment,
      coveragePercentage: chapters.length > 0 
        ? Math.round((chaptersWithPayment / chapters.length) * 100) 
        : 0
    };
  }
}

export const valueTimeSplitService = new ValueTimeSplitService(); 