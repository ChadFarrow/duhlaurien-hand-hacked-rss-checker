import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RSSItem, AtomEntry } from '../types/feed';
import { chapterService, ChaptersData } from '../services/ChapterService';
import { valueTimeSplitService, ValueTimeSplit } from '../services/ValueTimeSplitService';
import './EpisodeDetailPage.css';

interface EpisodeDetailPageProps {
  episodes: RSSItem[] | AtomEntry[];
  feedType: 'rss' | 'atom';
}

const EpisodeDetailPage: React.FC<EpisodeDetailPageProps> = ({ episodes, feedType }) => {
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<ChaptersData | null>(null);
  const [loadingChapters, setLoadingChapters] = useState(false);

  // Find the episode by ID
  let episode: RSSItem | AtomEntry | undefined;
  
  if (feedType === 'rss') {
    const rssEpisodes = episodes as RSSItem[];
    episode = rssEpisodes.find((ep, index) => {
      // Extract episode number from title like "Homegrown Hits - Episode 95"
      const episodeNumberMatch = ep.title.match(/Episode\s+(\d+)/i);
      const episodeNumber = episodeNumberMatch ? episodeNumberMatch[1] : (index + 1).toString();
      const id = ep.guid?._ || `episode-${episodeNumber}`;
      return id === episodeId;
    });
  } else {
    const atomEpisodes = episodes as AtomEntry[];
    episode = atomEpisodes.find((ep, index) => {
      // Extract episode number from title like "Homegrown Hits - Episode 95"
      const episodeNumberMatch = ep.title.match(/Episode\s+(\d+)/i);
      const episodeNumber = episodeNumberMatch ? episodeNumberMatch[1] : (index + 1).toString();
      const id = ep.id || `episode-${episodeNumber}`;
      return id === episodeId;
    });
  }

  useEffect(() => {
    const fetchChapters = async () => {
      if (feedType === 'rss' && episode) {
        const rssItem = episode as RSSItem;
        const chaptersUrl = (rssItem['podcast:chapters'] as any)?.['@_url'] || rssItem['podcast:chapters']?.$?.url;
        
        if (chaptersUrl) {
          setLoadingChapters(true);
          try {
            const chaptersData = await chapterService.fetchChapters(chaptersUrl);
            setChapters(chaptersData);
          } catch (error) {
            console.error('Failed to fetch chapters:', error);
          } finally {
            setLoadingChapters(false);
          }
        }
      }
    };

    fetchChapters();
  }, [episode, feedType]);

  if (!episode) {
    return (
      <div className="episode-detail-page">
        <div className="episode-not-found">
          <h2>Episode Not Found</h2>
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Episodes
          </button>
        </div>
      </div>
    );
  }

  const getEpisodeData = () => {
    if (feedType === 'rss') {
      const rssItem = episode as RSSItem;
      return {
        title: rssItem.title,
        description: rssItem.description,
        pubDate: rssItem.pubDate,
        duration: rssItem['itunes:duration'],
        author: rssItem.author || rssItem['itunes:author'],
        enclosureUrl: rssItem.enclosure?.url,
        enclosureSize: rssItem.enclosure?.length,
        link: rssItem.link,
        season: rssItem['itunes:season'],
        episodeNumber: rssItem['itunes:episode'],
        chapters: rssItem['podcast:chapters'],
        value: rssItem['podcast:value'] || rssItem['podcast:valueRecipient'],
        transcripts: rssItem['podcast:transcript'],
        soundbites: rssItem['podcast:soundbite']
      };
    } else {
      const atomEntry = episode as AtomEntry;
      return {
        title: atomEntry.title,
        description: atomEntry.summary || atomEntry.content || '',
        pubDate: atomEntry.published || atomEntry.updated,
        author: atomEntry.author?.name,
        link: atomEntry.link?.[0]?.$.href
      };
    }
  };

  const episodeData = getEpisodeData();

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size > 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(size / 1024).toFixed(1)} KB`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (duration?: string): string => {
    if (!duration) return '';
    
    if (duration.includes(':')) {
      return duration;
    }
    
    const seconds = parseInt(duration);
    if (isNaN(seconds)) return duration;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const parseDurationToSeconds = (duration: string): number => {
    if (!duration) return 0;
    
    // If already in seconds
    if (!duration.includes(':')) {
      return parseInt(duration) || 0;
    }
    
    // Parse HH:MM:SS or MM:SS format
    const parts = duration.split(':').map(part => parseInt(part) || 0);
    
    if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    }
    
    return 0;
  };

  return (
    <div className="episode-detail-page">
      <header className="episode-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Episodes
        </button>
        <h1 className="episode-title">{episodeData.title}</h1>
      </header>

      <div className="episode-content">
        <div className="episode-meta">
          {episodeData.pubDate && (
            <div className="meta-item">
              <span className="meta-label">Published:</span>
              <span>{formatDate(episodeData.pubDate)}</span>
            </div>
          )}
          
          {episodeData.duration && (
            <div className="meta-item">
              <span className="meta-label">Duration:</span>
              <span>{formatDuration(episodeData.duration)}</span>
            </div>
          )}

          {(episodeData.season || episodeData.episodeNumber) && (
            <div className="meta-item">
              <span className="meta-label">Episode:</span>
              <span>
                {episodeData.season && `Season ${episodeData.season}`}
                {episodeData.season && episodeData.episodeNumber && ', '}
                {episodeData.episodeNumber && `Episode ${episodeData.episodeNumber}`}
              </span>
            </div>
          )}

          {episodeData.author && (
            <div className="meta-item">
              <span className="meta-label">Author:</span>
              <span>{episodeData.author}</span>
            </div>
          )}
        </div>

        <div className="episode-actions">
          {episodeData.enclosureUrl && (
            <a 
              href={episodeData.enclosureUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="action-button primary"
            >
              🎵 Play/Download Audio
              {episodeData.enclosureSize && (
                <span className="file-size">({formatFileSize(episodeData.enclosureSize)})</span>
              )}
            </a>
          )}
          
          {episodeData.link && (
            <a 
              href={episodeData.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="action-button secondary"
            >
              🔗 Episode Page
            </a>
          )}
        </div>

        <div className="episode-description">
          <h2>Description</h2>
          <div 
            className="description-content"
            dangerouslySetInnerHTML={{ __html: episodeData.description }}
          />
        </div>

        {/* Track Listing with Times */}
        {chapters && chapters.chapters.length > 0 && (
          <div className="episode-section">
            <h2>Track Listing</h2>
            <div className="track-listing">
              {chapters.chapters
                .filter(chapter => {
                  // Filter to music tracks - exclude segments like "Value for Value", "Boostagrams", etc.
                  const title = chapter.title.toLowerCase();
                  return !title.includes('value') && 
                         !title.includes('boostagram') && 
                         !title.includes('hit these') &&
                         !title.includes('what do you desire') &&
                         !title.includes('decentralize') &&
                         !title.includes('new to demu') &&
                         !title.includes('matt the tall') &&
                         !title.includes('frankiepaint') &&
                         !title.includes('buttheart') &&
                         !title.includes('netned') &&
                         !title.includes('(213)') &&
                         !title.includes('episode') &&
                         !title.includes('tiddicate') &&
                         !title.includes('hgh ') &&
                         !title.includes('in the hitter') &&
                         !title.includes('07-24-25') &&
                         !title.includes('live') &&
                         !title.includes('homegrown hits');
                })
                .map((track, index, filteredTracks) => {
                  // Find the next chapter (any type) after this track's start time
                  const nextChapter = chapters.chapters.find(chapter => 
                    chapter.startTime > track.startTime
                  );
                  
                  const startTime = chapterService.formatTime(track.startTime);
                  const endTime = nextChapter ? chapterService.formatTime(nextChapter.startTime) : '';
                  
                  return (
                    <div key={index} className="track-item">
                      <div className="track-info">
                        <div className="track-title">{track.title}</div>
                        <div className="track-time">
                          {startTime}{endTime && ` - ${endTime}`}
                        </div>
                      </div>
                      {track.img && (
                        <img src={track.img} alt={track.title} className="track-image" />
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Chapters Section */}
        {episodeData.chapters && (
          <div className="episode-section">
            <h2>Chapters</h2>
            
            {loadingChapters && (
              <div className="loading-indicator">Loading chapters...</div>
            )}
            
            {chapters && chapters.chapters.length > 0 ? (
              <>
                <div className="chapters-list">
                  {chapters.chapters.map((chapter, index) => {
                  // Find the next chapter to calculate end time
                  const nextChapter = chapters.chapters[index + 1];
                  const startTime = chapterService.formatTime(chapter.startTime);
                  
                  // For the last chapter, use episode duration if available
                  let endTime = '';
                  if (nextChapter) {
                    endTime = chapterService.formatTime(nextChapter.startTime);
                  } else if (episodeData.duration) {
                    // Convert duration to seconds and format
                    const durationSeconds = parseDurationToSeconds(episodeData.duration);
                    if (durationSeconds > 0) {
                      endTime = chapterService.formatTime(durationSeconds);
                    }
                  }
                  
                  // Get value time splits for this chapter if available
                  const valueTimeSplits = feedType === 'rss' ? 
                    valueTimeSplitService.getEpisodeValueTimeSplits(episode as RSSItem) : [];
                  
                  // Find all splits that fall within this chapter's time range
                  const chapterEndTime = index < chapters.chapters.length - 1 ? 
                    chapters.chapters[index + 1].startTime : 
                    chapter.startTime + 300; // 5 minutes default for last chapter
                  
                  const matchingSplits = valueTimeSplits.filter(split => {
                    const splitEndTime = split.startTime + split.duration;
                    return split.startTime < chapterEndTime && splitEndTime > chapter.startTime;
                  });

                  return (
                    <div key={index} className="chapter-item">
                      <div className="chapter-time">
                        {startTime}{endTime && ` - ${endTime}`}
                      </div>
                      <div className="chapter-content">
                        <div className="chapter-title">{chapter.title}</div>
                        {matchingSplits.length > 0 && (
                          <div className="value-time-splits">
                            {matchingSplits.map((split, splitIndex) => (
                              <div key={splitIndex} className="value-time-split">
                                <span className="value-split-icon">⚡</span>
                                <span className="value-split-info">
                                  {valueTimeSplitService.formatValueTimeSplit(split)}
                                </span>
                                <span className="value-split-guid">
                                  Feed: {split.remoteItem.feedGuid.slice(0, 8)}...
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {chapter.url && (
                          <a href={chapter.url} target="_blank" rel="noopener noreferrer" className="chapter-link">
                            🔗 Link
                          </a>
                        )}
                      </div>
                      <div className="chapter-media">
                        {chapter.img && (
                          <img src={chapter.img} alt={chapter.title} className="chapter-image" />
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
                
                {!episodeData.duration && (
                  <div className="duration-notice">
                    📝 Episode duration not provided in RSS feed - last chapter end time unavailable
                  </div>
                )}
              </>
            ) : (
              <div className="chapters-info">
                <p>
                  📚 Chapters available •{' '}
                  <a 
                    href={(episodeData.chapters as any)?.['@_url'] || (episodeData.chapters as any)?.$?.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="raw-link"
                  >
                    View Raw File
                  </a>
                </p>
              </div>
            )}
          </div>
        )}





        {/* Transcripts Section */}
        {episodeData.transcripts && (
          <div className="episode-section">
            <h2>Transcripts</h2>
            <p>📄 Transcripts available for this episode</p>
          </div>
        )}

        {/* Soundbites Section */}
        {episodeData.soundbites && (
          <div className="episode-section">
            <h2>Soundbites</h2>
            <p>
              🎵 {Array.isArray(episodeData.soundbites) 
                ? `${episodeData.soundbites.length} clips`
                : '1 clip'
              } available
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EpisodeDetailPage;