# Task 4: Add Episode Playback and Value Block Validation

## Priority: High
## Estimated Time: 6-8 hours
## Dependencies: 1

## Description
Add functionality to view what was played on each episode and validate Value Blocks for Podcasting 2.0 value4value features.

## Requirements

### Core Features
- **Episode Playback Information**: Display audio content details for each episode
- **Value Block Validation**: Validate Podcasting 2.0 value4value features
- **Value Block Structure**: Check for valid Value Block structure and content
- **Playback Statistics**: Display episode-specific playback statistics
- **Value Block Recipients**: Validate Value Block recipients and amounts
- **Episode Details**: Show episode duration and content type information
- **Compliance Checking**: Verify proper Value Block formatting and Podcasting 2.0 spec compliance

## Implementation Details

### 1. Episode Playback Component
- Create `src/components/EpisodePlayback.tsx`
- Display episode audio content details
- Show episode duration and format information
- List episode enclosures and alternate enclosures
- Display episode-specific metadata

### 2. Value Block Validator
- Create `src/services/ValueBlockValidator.ts`
- Validate Value Block structure and format
- Check Value Block recipients and amounts
- Verify Value Block compliance with Podcasting 2.0 spec
- Validate Value Block signatures and encryption

### 3. Enhanced Feed Parser
- Extend `FeedParserService.ts` to parse Value Blocks
- Extract episode playback information
- Parse Value Block recipients and amounts
- Handle Value Block encryption and signatures

### 4. Episode List Component
- Create `src/components/EpisodeList.tsx`
- Display list of episodes with playback info
- Show Value Block status for each episode
- Provide episode-specific validation results
- Allow drilling down into episode details

### 5. Value Block Display
- Create `src/components/ValueBlockDisplay.tsx`
- Show Value Block structure and content
- Display recipient information and amounts
- Validate Value Block formatting
- Show compliance status and recommendations

## Acceptance Criteria
1. Users can view detailed playback information for each episode
2. Value Blocks are properly validated and displayed
3. Episode-specific statistics are shown
4. Value Block recipients and amounts are validated
5. Compliance with Podcasting 2.0 spec is verified
6. Clear error messages for invalid Value Blocks

## Technical Notes
- Implement Value Block parsing according to Podcasting 2.0 specification
- Handle Value Block encryption and signature validation
- Support multiple Value Block formats and recipients
- Ensure proper error handling for malformed Value Blocks
- Provide clear feedback on Value Block compliance

## Files to Create/Modify
- `src/components/EpisodePlayback.tsx` (new)
- `src/components/EpisodeList.tsx` (new)
- `src/components/ValueBlockDisplay.tsx` (new)
- `src/services/ValueBlockValidator.ts` (new)
- `src/services/FeedParserService.ts` (modify)
- `src/services/Podcasting20Validator.ts` (modify)
- `src/types/feed.ts` (modify)
- `src/types/validation.ts` (modify)
- `src/components/RSSFeedChecker.tsx` (modify)

## User Experience Goals
- Help podcasters verify their Value Blocks are correctly implemented for value4value payments
- Provide clear visualization of episode playback information
- Show detailed Value Block validation results with actionable feedback
- Enable podcasters to understand their value4value implementation status 