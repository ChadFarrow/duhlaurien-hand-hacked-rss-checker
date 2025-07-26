import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RSSItem, AtomEntry } from '../types/feed';
import { chapterService, ChaptersData } from '../services/ChapterService';
import { valueTimeSplitService } from '../services/ValueTimeSplitService';
import { valueRecipientService, ValueBlock } from '../services/ValueRecipientService';
import { podcastIndexService } from '../services/PodcastIndexService';
import { remoteFeedService } from '../services/RemoteFeedService';
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
  const [podcastNames, setPodcastNames] = useState<Map<string, string>>(new Map());
  const [remoteValueRecipients, setRemoteValueRecipients] = useState<Map<string, ValueBlock | null>>(new Map());

  // Find the episode by ID
  let episode: RSSItem | AtomEntry | undefined;
  
  if (feedType === 'rss') {
    const rssEpisodes = episodes as RSSItem[];
    episode = rssEpisodes.find((ep, index) => {
      // Extract episode number from title like "Homegrown Hits - Episode 95"
      const episodeNumberMatch = ep.title.match(/Episode\s+(\d+)/i);
      const episodeNumber = episodeNumberMatch ? episodeNumberMatch[1] : (index + 1).toString();
      // Create a unique ID that includes both episode number and index to prevent duplicates
      const uniqueId = ep.guid?._ || `episode-${episodeNumber}-${index}`;
      return uniqueId === episodeId;
    });
  } else {
    const atomEpisodes = episodes as AtomEntry[];
    episode = atomEpisodes.find((ep, index) => {
      // Extract episode number from title like "Homegrown Hits - Episode 95"
      const episodeNumberMatch = ep.title.match(/Episode\s+(\d+)/i);
      const episodeNumber = episodeNumberMatch ? episodeNumberMatch[1] : (index + 1).toString();
      // Create a unique ID that includes both episode number and index to prevent duplicates
      const uniqueId = ep.id || `episode-${episodeNumber}-${index}`;
      return uniqueId === episodeId;
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

  // Fetch podcast and episode info for value time splits
  useEffect(() => {
    const fetchRemoteInfo = async () => {
      if (feedType === 'rss' && episode) {
        const rssItem = episode as RSSItem;
        const valueTimeSplits = valueTimeSplitService.getEpisodeValueTimeSplits(rssItem);
        
        // Get unique feed GUIDs for podcast names
        const feedGuids = Array.from(new Set(
          valueTimeSplits
            .filter(split => split.remoteItem?.feedGuid)
            .map(split => split.remoteItem!.feedGuid)
        ));

        // Get unique remote items for episode info (currently unused)
        // const remoteItems = valueTimeSplits
        //   .filter(split => split.remoteItem?.feedGuid && split.remoteItem?.itemGuid)
        //   .map(split => ({
        //     feedGuid: split.remoteItem!.feedGuid,
        //     itemGuid: split.remoteItem!.itemGuid!,
        //     key: `${split.remoteItem!.feedGuid}:${split.remoteItem!.itemGuid}`
        //   }));

        try {
          // Fetch podcast names
          if (feedGuids.length > 0) {
            const podcastInfoMap = await podcastIndexService.getPodcastsByGuids(feedGuids);
            const nameMap = new Map<string, string>();
            
            podcastInfoMap.forEach((info, guid) => {
              nameMap.set(guid, info.title);
            });
            
            setPodcastNames(nameMap);
          }

          // Skip episode information fetching while API is unavailable
          // This will be re-enabled once the Podcast Index API is stable

          // Fetch remote feed value recipients
          if (feedGuids.length > 0) {
            const remoteValueMap = await remoteFeedService.getMultipleRemoteFeedValueRecipients(feedGuids);
            setRemoteValueRecipients(remoteValueMap);
          }
        } catch (error) {
          console.error('Error fetching remote info:', error);
        }
      }
    };

    fetchRemoteInfo();
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

        {/* Value Recipients Section */}
        {feedType === 'rss' && valueRecipientService.hasValueRecipients(episode as RSSItem) && (
          <div className="episode-section">
            <h2>Value Recipients</h2>
            {(() => {
              const valueBlock = valueRecipientService.extractValueRecipients(episode as RSSItem);
              if (!valueBlock || valueBlock.recipients.length === 0) return null;
              
              return (
                <div className="value-recipients-list">
                  <div className="value-block-info">
                    <span className="value-type">💰 {valueBlock.type} via {valueBlock.method}</span>
                    {valueBlock.suggested && (
                      <span className="suggested-amount">Suggested: {valueBlock.suggested} sats</span>
                    )}
                  </div>
                  <div className="recipients-grid">
                    {valueBlock.recipients
                      .sort((a, b) => b.split - a.split) // Sort largest to smallest
                      .map((recipient, index) => (
                      <a 
                        key={index} 
                        className="recipient-item recipient-link"
                        href={`https://amboss.space/node/${recipient.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="recipient-name">{recipient.name}</div>
                        <div className="recipient-split">{recipient.split}%</div>
                        <div className="recipient-address" title={recipient.address}>
                          {recipient.address.slice(0, 8)}...{recipient.address.slice(-8)}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

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
                .map((track, index) => {
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
                    Infinity; // For last chapter, include all remaining splits
                  
                  const matchingSplits = valueTimeSplits.filter(split => {
                    // Check if split starts within this chapter's range
                    return split.startTime >= chapter.startTime && split.startTime < chapterEndTime;
                  });

                  return (
                    <div key={index} className="chapter-item">
                      <div className="chapter-header-section">
                        <h1 className="chapter-title-main">{chapter.title}</h1>
                        <div className="chapter-meta-info">
                          {chapter.url && (
                            <a href={chapter.url} target="_blank" rel="noopener noreferrer" className="link">
                              🔗 Link
                            </a>
                          )}
                          <span className="chapter-time-range">
                            {startTime}{endTime && ` - ${endTime}`}
                          </span>
                          {matchingSplits.length > 0 && matchingSplits.map((split, splitIndex) => (
                            <span key={splitIndex} className="chapter-remote-badge">
                              ⚡ {valueTimeSplitService.formatValueTimeSplit(split)}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="chapter-content">
                        <div className="chapter-artwork-container">
                          {chapter.img ? (
                            <img 
                              src={chapter.img} 
                              alt={chapter.title} 
                              className="chapter-artwork"
                              onError={(e) => {
                                // Hide broken images and show fallback
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div 
                            className={`chapter-artwork ${chapter.img ? 'hidden' : ''}`} 
                            style={{background: '#8B0000'}}
                          ></div>
                        </div>
                        
                        <div className="chapter-payment-splits">
                          {matchingSplits.length > 0 ? (
                            matchingSplits.map((split, splitIndex) => {
                              // Get the episode's main value recipients
                              const mainValueBlock = valueRecipientService.extractValueRecipients(episode as RSSItem);
                              const hostPercentage = 100 - split.remotePercentage;
                              const remoteValueBlock = remoteValueRecipients.get(split.remoteItem?.feedGuid || '');
                              const podcastTitle = podcastNames.get(split.remoteItem?.feedGuid || '') || 'Remote Podcast';
                              
                              return (
                                <div key={splitIndex}>
                                  {/* Remote Recipients Section */}
                                  {split.remoteItem && remoteValueBlock && remoteValueBlock.recipients.length > 0 && (
                                    <div className="splits-section">
                                      <h2 className="section-title">
                                        {podcastTitle}
                                        <span className="percentage-badge">{split.remotePercentage}%</span>
                                      </h2>
                                      {remoteValueBlock.recipients
                                        .sort((a, b) => b.split - a.split)
                                        .map((recipient, idx) => (
                                          <a
                                            key={idx}
                                            className="split-item"
                                            href={`https://amboss.space/node/${recipient.address}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{textDecoration: 'none', color: 'inherit'}}
                                          >
                                            <span className="split-name">{recipient.name}:</span>
                                            <div className="split-percentage">
                                              <span className="main-percentage">
                                                {(split.remotePercentage * recipient.split / 100).toFixed(2)}%
                                              </span>
                                              <span className="sub-percentage">
                                                ({recipient.split}% of {split.remotePercentage}%)
                                              </span>
                                            </div>
                                          </a>
                                        ))}
                                    </div>
                                  )}
                                  
                                  {/* Hosts Section */}
                                  {mainValueBlock && mainValueBlock.recipients.length > 0 && (
                                    <div className="splits-section hosts-section">
                                      <h2 className="section-title">
                                        Hosts
                                        <span className="percentage-badge">{hostPercentage}%</span>
                                      </h2>
                                      {mainValueBlock.recipients
                                        .sort((a, b) => b.split - a.split)
                                        .map((recipient, idx) => (
                                          <a
                                            key={idx}
                                            className="split-item"
                                            href={`https://amboss.space/node/${recipient.address}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{textDecoration: 'none', color: 'inherit'}}
                                          >
                                            <span className="split-name">{recipient.name}:</span>
                                            <div className="split-percentage">
                                              <span className="main-percentage">
                                                {(hostPercentage * recipient.split / 100).toFixed(2)}%
                                              </span>
                                              <span className="sub-percentage">
                                                ({recipient.split}% of {hostPercentage}%)
                                              </span>
                                            </div>
                                          </a>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            // Show default hosts for chapters without value time splits
                            (() => {
                              const mainValueBlock = valueRecipientService.extractValueRecipients(episode as RSSItem);
                              return mainValueBlock && mainValueBlock.recipients.length > 0 ? (
                                <div className="splits-section hosts-section">
                                  <h2 className="section-title">
                                    Hosts
                                    <span className="percentage-badge">100%</span>
                                  </h2>
                                  {mainValueBlock.recipients
                                    .sort((a, b) => b.split - a.split)
                                    .map((recipient, idx) => (
                                      <a
                                        key={idx}
                                        className="split-item"
                                        href={`https://amboss.space/node/${recipient.address}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{textDecoration: 'none', color: 'inherit'}}
                                      >
                                        <span className="split-name">{recipient.name}:</span>
                                        <div className="split-percentage">
                                          <span className="main-percentage">
                                            {recipient.split.toFixed(2)}%
                                          </span>
                                        </div>
                                      </a>
                                    ))}
                                </div>
                              ) : null;
                            })()
                          )}
                        </div>
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