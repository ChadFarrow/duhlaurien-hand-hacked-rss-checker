# Task 6: Add Hand-Editing Features for Podcasters

## Priority: High
## Estimated Time: 8-10 hours
## Dependencies: 1, 2

## Description
Implement comprehensive features specifically designed for podcasters who hand-edit their RSS feeds, including XML syntax validation, real-time feedback, and common mistake detection.

## Requirements

### Core Features
- **XML Syntax Validation**: Real-time feedback with line numbers and error highlighting
- **RSS Structure Validation**: Required elements and hierarchy checking
- **Podcasting 2.0 Validation**: Namespace and element validation
- **Common Mistake Detection**: URL formats, date formats, malformed GUIDs
- **Side-by-Side Editor**: XML editor with live validation view
- **Real-Time Feedback**: Instant validation as users type
- **Copy-Paste Validation**: Quick checks for pasted content
- **Export Corrected XML**: Generate corrected RSS feed

## Implementation Details

### 1. XML Editor Component
- Create `src/components/XMLEditor.tsx`
- Implement syntax highlighting for RSS/XML
- Add line numbers and error indicators
- Support real-time validation
- Include copy-paste functionality

### 2. Enhanced Validation System
- Extend `Podcasting20Validator.ts` with hand-editing specific rules
- Add XML syntax validation rules
- Implement common mistake detection
- Create detailed error messages with line numbers

### 3. Real-Time Feedback System
- Implement debounced validation
- Show validation status in real-time
- Highlight errors and warnings in the editor
- Provide inline suggestions and fixes

### 4. Common Mistake Detection
- **URL Format Validation**: Check enclosure URLs, image URLs, links
- **Date Format Validation**: RFC 822 format checking
- **GUID Validation**: Format and uniqueness checking
- **Namespace Validation**: Proper xmlns declarations
- **Element Hierarchy**: Proper RSS structure validation

### 5. Export and Correction Features
- Generate corrected XML with fixes applied
- Export validation report with line-by-line details
- Provide diff view showing changes needed
- Support for common RSS feed formats

## Acceptance Criteria
1. Users can paste RSS content and get immediate validation feedback
2. XML syntax errors are highlighted with line numbers
3. Common hand-editing mistakes are detected and explained
4. Real-time validation works as users type
5. Export functionality generates corrected RSS feeds
6. Interface is intuitive for non-technical podcasters

## Technical Notes
- Use a code editor library like Monaco Editor or CodeMirror
- Implement XML parsing with proper error handling
- Create comprehensive validation rules for common mistakes
- Ensure performance with large RSS feeds
- Provide clear, actionable error messages

## Files to Create/Modify
- `src/components/XMLEditor.tsx` (new)
- `src/components/HandEditingView.tsx` (new)
- `src/services/HandEditingValidator.ts` (new)
- `src/services/Podcasting20Validator.ts` (modify)
- `src/types/validation.ts` (modify)
- `src/components/RSSFeedChecker.tsx` (modify)

## User Experience Goals
- Make it easy for non-technical podcasters to spot and fix common RSS editing mistakes
- Provide clear, actionable feedback that explains what's wrong and how to fix it
- Support both URL-based and direct XML editing workflows
- Enable quick validation of copied RSS content from other sources 