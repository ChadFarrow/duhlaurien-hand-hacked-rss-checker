export interface Chapter {
  startTime: number; // in seconds
  title: string;
  img?: string;
  url?: string;
}

export interface ChaptersData {
  version: string;
  chapters: Chapter[];
}

class ChapterService {
  async fetchChapters(chaptersUrl: string): Promise<ChaptersData | null> {
    try {
      const response = await fetch(chaptersUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch chapters: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        return await this.parseJsonChapters(await response.json());
      } else if (contentType.includes('text/vtt')) {
        return await this.parseVttChapters(await response.text());
      } else {
        // Try to parse as JSON first, then VTT
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          return await this.parseJsonChapters(json);
        } catch {
          return await this.parseVttChapters(text);
        }
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
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