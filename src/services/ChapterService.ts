export interface Chapter {
  startTime: number; // in seconds
  title: string;
  img?: string;
  url?: string;
  valueTimeSplit?: {
    startTime: number;
    remotePercentage: number;
    duration: number;
    remoteItem: {
      feedGuid: string;
      itemGuid?: string;
    };
  };
}

export interface ChaptersData {
  version: string;
  chapters: Chapter[];
}

class ChapterService {
  // CORS proxy services for external chapter files
  private corsProxies = [
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://proxy.cors.sh/',
    'https://thingproxy.freeboard.io/fetch/',
    'https://api.allorigins.win/get?url='
  ];

  async fetchChapters(chaptersUrl: string): Promise<ChaptersData | null> {
    try {
      // Try direct fetch first
      let response: Response;
      let responseText: string = '';
      
      try {
        response = await fetch(chaptersUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        responseText = await response.text();
        
        return await this.parseChapterContent(responseText, contentType);
      } catch (directError) {
        console.log('Direct chapter fetch failed, trying CORS proxies...', directError);
      }
      
      // If direct fetch fails, try CORS proxies
      for (let i = 0; i < this.corsProxies.length; i++) {
        const proxyBase = this.corsProxies[i];
        console.log(`Trying chapter proxy ${i + 1}/${this.corsProxies.length}...`);
        
        try {
          let proxyUrl: string;
          if (proxyBase.includes('allorigins.win')) {
            proxyUrl = `${proxyBase}${encodeURIComponent(chaptersUrl)}`;
          } else if (proxyBase.includes('codetabs.com')) {
            proxyUrl = `${proxyBase}${encodeURIComponent(chaptersUrl)}`;
          } else if (proxyBase.includes('corsproxy.io')) {
            proxyUrl = `${proxyBase}${encodeURIComponent(chaptersUrl)}`;
          } else if (proxyBase.includes('cors.sh')) {
            proxyUrl = `${proxyBase}${chaptersUrl}`;
          } else if (proxyBase.includes('thingproxy.freeboard.io')) {
            proxyUrl = `${proxyBase}${chaptersUrl}`;
          } else {
            proxyUrl = `${proxyBase}${chaptersUrl}`;
          }
          
          response = await fetch(proxyUrl, { timeout: 10000 } as any);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          // Parse response based on proxy service format
          if (proxyBase.includes('allorigins.win')) {
            const data = await response.json();
            responseText = data.contents;
          } else {
            responseText = await response.text();
          }
          
          console.log(`Successfully fetched chapters via proxy ${i + 1}`);
          return await this.parseChapterContent(responseText, '');
          
        } catch (proxyError) {
          console.log(`Chapter proxy ${i + 1} failed:`, proxyError);
          if (i === this.corsProxies.length - 1) {
            throw new Error('All chapter proxy attempts failed');
          }
        }
      }
      
      throw new Error('Failed to fetch chapters from any source');
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return null;
    }
  }

  private async parseChapterContent(content: string, contentType: string): Promise<ChaptersData | null> {
    try {
      if (contentType.includes('application/json')) {
        return await this.parseJsonChapters(JSON.parse(content));
      } else if (contentType.includes('text/vtt')) {
        return await this.parseVttChapters(content);
      } else {
        // Try to parse as JSON first, then VTT
        try {
          const json = JSON.parse(content);
          return await this.parseJsonChapters(json);
        } catch {
          return await this.parseVttChapters(content);
        }
      }
    } catch (error) {
      console.error('Error parsing chapter content:', error);
      return null;
    }
  }

  private async parseJsonChapters(data: any): Promise<ChaptersData> {
    // PSC (Podcast Standard Chapters) format
    if (data.version && data.chapters) {
      return {
        version: data.version,
        chapters: data.chapters.map((chapter: any) => ({
          startTime: chapter.startTime || 0,
          title: chapter.title || 'Untitled Chapter',
          img: chapter.img,
          url: chapter.url
        }))
      };
    }
    
    // Simple array format
    if (Array.isArray(data)) {
      return {
        version: '1.0',
        chapters: data.map((chapter: any) => ({
          startTime: chapter.startTime || chapter.start || 0,
          title: chapter.title || chapter.name || 'Untitled Chapter',
          img: chapter.img || chapter.image,
          url: chapter.url || chapter.link
        }))
      };
    }

    throw new Error('Unrecognized JSON chapter format');
  }

  private async parseVttChapters(vttText: string): Promise<ChaptersData> {
    const chapters: Chapter[] = [];
    const lines = vttText.split('\n');
    
    let currentChapter: Partial<Chapter> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip WEBVTT header and empty lines
      if (line === 'WEBVTT' || line === '') continue;
      
      // Time range line (e.g., "00:00:00.000 --> 00:02:30.000")
      if (line.includes('-->')) {
        const timeMatch = line.match(/^(\d{2}:\d{2}:\d{2}(?:\.\d{3})?)/);
        if (timeMatch) {
          currentChapter.startTime = this.parseTimeToSeconds(timeMatch[1]);
        }
        continue;
      }
      
      // Chapter title (next non-empty line after time)
      if (currentChapter.startTime !== undefined && !currentChapter.title) {
        currentChapter.title = line;
        chapters.push({
          startTime: currentChapter.startTime,
          title: currentChapter.title
        });
        currentChapter = {};
      }
    }
    
    return {
      version: '1.0',
      chapters
    };
  }

  private parseTimeToSeconds(timeString: string): number {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

export const chapterService = new ChapterService();