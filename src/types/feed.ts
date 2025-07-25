// RSS Feed Data Types
export interface RSSFeed {
  rss?: RSSRoot;
  feed?: AtomRoot; // For Atom feeds
}

export interface RSSRoot {
  channel: RSSChannel;
  $?: {
    version?: string;
    'xmlns:itunes'?: string;
    'xmlns:podcast'?: string;
    'xmlns:googleplay'?: string;
    'xmlns:content'?: string;
  };
}

export interface AtomRoot {
  id: string;
  title: string;
  subtitle?: string;
  updated: string;
  author?: AtomAuthor;
  link: AtomLink[];
  entry: AtomEntry[];
}

export interface RSSChannel {
  title: string;
  link: string;
  description: string;
  language?: string;
  copyright?: string;
  managingEditor?: string;
  webMaster?: string;
  pubDate?: string;
  lastBuildDate?: string;
  category?: string | string[];
  generator?: string;
  docs?: string;
  cloud?: RSSCloud;
  ttl?: string;
  image?: RSSImage;
  rating?: string;
  textInput?: RSSTextInput;
  skipHours?: RSSSkipHours;
  skipDays?: RSSSkipDays;
  item: RSSItem[];
  // iTunes namespace
  'itunes:author'?: string;
  'itunes:category'?: iTunesCategory[];
  'itunes:explicit'?: string;
  'itunes:image'?: iTunesImage;
  'itunes:keywords'?: string;
  'itunes:new-feed-url'?: string;
  'itunes:owner'?: iTunesOwner;
  'itunes:subtitle'?: string;
  'itunes:summary'?: string;
  'itunes:type'?: string;
  // Podcasting 2.0 namespace
  'podcast:funding'?: PodcastFunding[];
  'podcast:locked'?: PodcastLocked;
  'podcast:guid'?: string;
  'podcast:medium'?: string;
  'podcast:trailer'?: PodcastTrailer[];
  'podcast:license'?: PodcastLicense;
  'podcast:location'?: PodcastLocation;
  'podcast:person'?: PodcastPerson[];
  'podcast:block'?: PodcastBlock;
  'podcast:complete'?: PodcastComplete;
  'podcast:value'?: PodcastValue;
  'podcast:valueRecipient'?: PodcastValueRecipient[];
}

export interface RSSItem {
  title: string;
  link: string;
  description: string;
  author?: string;
  category?: string | string[];
  comments?: string;
  enclosure?: RSSEnclosure;
  guid: RSSGuid;
  pubDate?: string;
  source?: RSSSource;
  // iTunes namespace
  'itunes:author'?: string;
  'itunes:block'?: string;
  'itunes:duration'?: string;
  'itunes:episode'?: string;
  'itunes:episodeType'?: string;
  'itunes:explicit'?: string;
  'itunes:image'?: iTunesImage;
  'itunes:isClosedCaptioned'?: string;
  'itunes:order'?: string;
  'itunes:season'?: string;
  'itunes:subtitle'?: string;
  'itunes:summary'?: string;
  'itunes:title'?: string;
  // Podcasting 2.0 namespace
  'podcast:alternateEnclosure'?: PodcastAlternateEnclosure[];
  'podcast:chapters'?: PodcastChapters;
  'podcast:contentLink'?: PodcastContentLink[];
  'podcast:episode'?: PodcastEpisode;
  'podcast:funding'?: PodcastFunding[];
  'podcast:guid'?: string;
  'podcast:images'?: PodcastImages;
  'podcast:license'?: PodcastLicense;
  'podcast:liveItem'?: PodcastLiveItem;
  'podcast:location'?: PodcastLocation;
  'podcast:person'?: PodcastPerson[];
  'podcast:season'?: PodcastSeason;
  'podcast:soundbite'?: PodcastSoundbite[];
  'podcast:transcript'?: PodcastTranscript[];
  'podcast:value'?: PodcastValue;
  'podcast:valueRecipient'?: PodcastValueRecipient[];
}

// RSS Core Types
export interface RSSCloud {
  domain: string;
  port: string;
  path: string;
  registerProcedure: string;
  protocol: string;
}

export interface RSSImage {
  url: string;
  title: string;
  link: string;
  width?: string;
  height?: string;
  description?: string;
}

export interface RSSEnclosure {
  url: string;
  length: string;
  type: string;
}

export interface RSSGuid {
  _: string;
  $?: {
    isPermaLink?: string;
  };
}

export interface RSSSource {
  _: string;
  $?: {
    url?: string;
  };
}

export interface RSSTextInput {
  title: string;
  description: string;
  name: string;
  link: string;
}

export interface RSSSkipHours {
  hour: string[];
}

export interface RSSSkipDays {
  day: string[];
}

// Atom Types
export interface AtomAuthor {
  name: string;
  email?: string;
  uri?: string;
}

export interface AtomLink {
  $: {
    href: string;
    rel?: string;
    type?: string;
    title?: string;
  };
}

export interface AtomEntry {
  id: string;
  title: string;
  updated: string;
  author?: AtomAuthor;
  content?: string;
  link: AtomLink[];
  summary?: string;
  category?: AtomCategory[];
  contributor?: AtomAuthor[];
  published?: string;
  rights?: string;
  source?: string;
}

export interface AtomCategory {
  $: {
    term: string;
    scheme?: string;
    label?: string;
  };
}

// iTunes Namespace Types
export interface iTunesCategory {
  $: {
    text: string;
  };
  'itunes:category'?: iTunesCategory[];
}

export interface iTunesImage {
  $: {
    href: string;
  };
}

export interface iTunesOwner {
  'itunes:name': string;
  'itunes:email': string;
}

// Podcasting 2.0 Namespace Types
export interface PodcastFunding {
  $: {
    url: string;
  };
  _: string;
}

export interface PodcastLocked {
  $: {
    owner: string;
  };
  _: string;
}

export interface PodcastTrailer {
  $: {
    pubdate: string;
    url: string;
    length: string;
    type: string;
    season?: string;
  };
  _: string;
}

export interface PodcastLicense {
  $: {
    url: string;
  };
  _: string;
}

export interface PodcastLocation {
  $: {
    geo: string;
    osm: string;
  };
  _: string;
}

export interface PodcastPerson {
  $: {
    img: string;
    href: string;
    role: string;
    group: string;
  };
  _: string;
}

export interface PodcastBlock {
  $: {
    id: string;
  };
  _: string;
}

export interface PodcastComplete {
  _: string;
}

export interface PodcastValue {
  $: {
    type: string;
    method: string;
    suggested?: string;
  };
  'podcast:valueRecipient': PodcastValueRecipient[];
}

export interface PodcastValueRecipient {
  $: {
    name: string;
    type: string;
    address: string;
    split: string;
    fee?: string;
    customKey?: string;
    customValue?: string;
  };
}

export interface PodcastAlternateEnclosure {
  $: {
    type: string;
    length: string;
    bitrate?: string;
    height?: string;
    lang?: string;
    title?: string;
    rel?: string;
    codecs?: string;
    default?: string;
    source?: string;
  };
  'podcast:source'?: PodcastSource[];
  'podcast:integrity'?: PodcastIntegrity[];
}

export interface PodcastSource {
  $: {
    uri: string;
    contentType?: string;
  };
}

export interface PodcastIntegrity {
  $: {
    type: string;
    value: string;
  };
}

export interface PodcastChapters {
  $: {
    url: string;
    type: string;
  };
}

export interface PodcastContentLink {
  $: {
    href: string;
    title?: string;
    rel?: string;
    mimeType?: string;
  };
}

export interface PodcastEpisode {
  $: {
    display: string;
  };
  _: string;
}

export interface PodcastImages {
  srcset: string;
}

export interface PodcastLiveItem {
  $: {
    status: string;
    start: string;
    end: string;
    info?: string;
  };
}

export interface PodcastSeason {
  $: {
    display: string;
  };
  _: string;
}

export interface PodcastSoundbite {
  $: {
    startTime: string;
    duration: string;
    clipId?: string;
  };
  _: string;
}

export interface PodcastTranscript {
  $: {
    url: string;
    type: string;
    language?: string;
    rel?: string;
  };
}

// Feed Parser Result Types
export interface FeedParseResult {
  success: boolean;
  feed?: RSSFeed;
  error?: string;
  feedType: 'rss' | 'atom' | 'unknown';
  namespaces: string[];
  metadata: any; // Moved to validation.ts
} 