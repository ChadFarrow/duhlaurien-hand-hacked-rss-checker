import { RSSItem, PodcastValueTimeSplit } from '../types/feed';

export interface ValueTimeSplit {
  startTime: number;
  remotePercentage: number;
  duration: number;
  remoteItem: {
    feedGuid: string;
    itemGuid?: string;
  };
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
    console.log('Extracting value time splits from item:', item.title);
    console.log('Item podcast:value:', item['podcast:value']);
    
    const value = item['podcast:value'];
    if (!value || !value['podcast:valueTimeSplit']) {
      console.log('No value time splits found');
      return [];
    }

    // Debug: Log the structure to understand what we're working with
    console.log('Value time splits raw data:', value['podcast:valueTimeSplit']);

    const timeSplits = Array.isArray(value['podcast:valueTimeSplit']) 
      ? value['podcast:valueTimeSplit'] 
      : [value['podcast:valueTimeSplit']];

    console.log('Processing time splits:', timeSplits.length);
    
    const results = timeSplits
      .map((split: any, index: number): ValueTimeSplit | null => {
        console.log(`Processing split ${index}:`, split);
        console.log(`Split has @_startTime:`, !!split['@_startTime']);
        console.log(`Split has podcast:remoteItem:`, !!split['podcast:remoteItem']);
        
        if (!split || !split['podcast:remoteItem']) {
          console.log(`Split ${index} filtered out - missing required properties`);
          return null;
        }
        
        try {
          const result: ValueTimeSplit = {
            startTime: parseFloat(split['@_startTime'] || '0'),
            remotePercentage: parseFloat(split['@_remotePercentage'] || '0'),
            duration: parseFloat(split['@_duration'] || '0'),
            remoteItem: {
              feedGuid: split['podcast:remoteItem']['@_feedGuid'] || '',
              itemGuid: split['podcast:remoteItem']['@_itemGuid']
            }
          };
          console.log(`Successfully parsed split ${index}:`, result);
          return result;
        } catch (error) {
          console.warn('Error parsing value time split:', error, split);
          return null;
        }
      })
      .filter((split): split is ValueTimeSplit => split !== null);
    
    console.log('Final results:', results);
    return results;
  }

  /**
   * Match value time splits with chapters based on timing
   */
  matchValueTimeSplitsWithChapters(
    chapters: { startTime: number; title: string; img?: string; url?: string }[],
    valueTimeSplits: ValueTimeSplit[]
  ): ChapterWithValue[] {
    return chapters.map(chapter => {
      // Find all value time splits that fall within this chapter's time range
      // For now, we'll assume each chapter extends to the next chapter's start time
      // or use a reasonable duration if it's the last chapter
      const chapterEndTime = chapter.startTime + 300; // 5 minutes default duration
      
      const matchingSplits = valueTimeSplits.filter(split => {
        const splitEndTime = split.startTime + split.duration;
        // Check if the split overlaps with the chapter time range
        return split.startTime < chapterEndTime && splitEndTime > chapter.startTime;
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
    
    return `${startTime} - ${endTime} (${percentage}% remote)`;
  }

  /**
   * Format time in MM:SS or HH:MM:SS format
   */
  private formatTime(seconds: number): string {
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
}

export const valueTimeSplitService = new ValueTimeSplitService(); 