# Deprecated Files

This directory contains backup copies of deprecated component files.

## Files in this directory:

### 2025-11-07 - Tool Consolidation

1. **sequence-translation.tsx.bak**
   - Original simple sequence translation tool
   - Replaced by: `sequence-translation-orf.tsx`
   - Reason: Merged with ORF finder for better UX

2. **orf-finder.tsx.bak**
   - Original ORF finder tool
   - Replaced by: `sequence-translation-orf.tsx`
   - Reason: Merged with sequence translation for better UX

3. **protein-analysis-tool-updated.tsx.bak**
   - Temporary file created during protein analysis tool enhancement
   - Replaced by: updated `protein-analysis-tool.tsx`
   - Reason: Cleanup of temporary development files

## Recovery

If you need to recover any of these files:
1. Copy the .bak file
2. Remove the .bak extension
3. Move it back to the parent directory
4. Update the tool configuration in `lib/config/tools.ts`

## Safe to Delete

These files are safe to delete after confirming the new merged tool works correctly in production.
