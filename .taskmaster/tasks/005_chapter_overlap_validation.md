# Task 5: Add Chapter Overlap Validation

## Priority: Medium
## Estimated Time: 4-6 hours
## Dependencies: 1

## Description
Add functionality to check that podcast chapters don't overlap and are properly timed.

## Requirements

### Core Features
- **Chapter Timestamp Validation**: Parse and validate podcast chapter timestamps
- **Overlap Detection**: Check for overlapping chapter time ranges
- **Time Range Validation**: Validate chapter start and end times
- **Gap Detection**: Detect gaps between chapters
- **Format Compliance**: Verify chapter time format compliance
- **Timeline Visualization**: Show chapter timeline visualization
- **Warning System**: Provide warnings for overlapping or malformed chapters
- **Content Validation**: Validate chapter titles and descriptions

## Implementation Details

### 1. Chapter Parser Service
- Create `src/services/ChapterParser.ts`
- Parse podcast chapter timestamps in various formats (HH:MM:SS, MM:SS, etc.)
- Extract chapter start times and end times
- Handle different chapter formats (JSON, XML, etc.)
- Validate timestamp format compliance

### 2. Chapter Overlap Validator
- Create `src/services/ChapterOverlapValidator.ts`
- Check for overlapping chapter time ranges
- Detect gaps between consecutive chapters
- Validate chapter sequence and timing
- Calculate chapter durations and intervals

### 3. Chapter Timeline Component
- Create `src/components/ChapterTimeline.tsx`
- Visualize chapter timeline with start/end times
- Highlight overlapping chapters
- Show gaps between chapters
- Display chapter durations and intervals

### 4. Chapter Validation Display
- Create `src/components/ChapterValidation.tsx`
- Show chapter validation results
- Display overlapping chapter warnings
- List chapter timing issues
- Provide recommendations for fixes

### 5. Enhanced Feed Parser
- Extend `FeedParserService.ts` to parse chapter data
- Extract chapter information from RSS feeds
- Handle different chapter formats and namespaces
- Validate chapter structure and content

## Acceptance Criteria
1. Users can see chapter timeline with start/end times
2. Overlapping chapters are clearly identified and highlighted
3. Gaps between chapters are detected and reported
4. Chapter timestamp format validation works correctly
5. Clear warnings for malformed or overlapping chapters
6. Chapter titles and descriptions are validated
7. Timeline visualization is intuitive and informative

## Technical Notes
- Support multiple timestamp formats (HH:MM:SS, MM:SS, seconds)
- Handle different chapter formats (JSON, XML, plain text)
- Implement efficient overlap detection algorithms
- Provide clear error messages for timing issues
- Support both episode-level and feed-level chapter validation

## Files to Create/Modify
- `src/services/ChapterParser.ts` (new)
- `src/services/ChapterOverlapValidator.ts` (new)
- `src/components/ChapterTimeline.tsx` (new)
- `src/components/ChapterValidation.tsx` (new)
- `src/services/FeedParserService.ts` (modify)
- `src/services/Podcasting20Validator.ts` (modify)
- `src/types/feed.ts` (modify)
- `src/types/validation.ts` (modify)
- `src/components/RSSFeedChecker.tsx` (modify)

## User Experience Goals
- Help podcasters ensure their chapter markers are properly timed and don't conflict with each other
- Provide clear visualization of chapter timeline with potential issues highlighted
- Show detailed validation results with actionable recommendations
- Enable podcasters to quickly identify and fix chapter timing problems 