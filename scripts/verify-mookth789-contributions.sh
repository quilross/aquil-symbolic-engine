#!/bin/bash

# Mookth789 Contribution Verification Script
# This script performs automated checks to verify user contributions

echo "🔍 Mookth789 Contribution Analysis"
echo "=================================="
echo

# Check 1: Git commit history
echo "📝 Checking Git commit history..."
COMMITS_BY_AUTHOR=$(git log --all --author="Mookth789" --oneline | wc -l)
COMMITS_BY_COMMITTER=$(git log --all --committer="Mookth789" --oneline | wc -l)
CO_AUTHORED=$(git log --all --grep="Co-authored-by.*Mookth789" --oneline | wc -l)

echo "   Commits authored: $COMMITS_BY_AUTHOR"
echo "   Commits committed: $COMMITS_BY_COMMITTER"
echo "   Co-authored commits: $CO_AUTHORED"
echo

# Check 2: File content search (excluding this investigation)
echo "📁 Searching file contents..."
MENTIONS=$(grep -r "Mookth789" . --exclude-dir=.git --exclude="*MOOKTH789*" --exclude="*mookth789*" 2>/dev/null | wc -l)
echo "   File mentions (excluding investigation files): $MENTIONS"
echo

# Check 3: Current contributors
echo "👥 Current repository contributors:"
git log --format='%aN' | sort -u | while read -r author; do
    commit_count=$(git log --author="$author" --oneline | wc -l)
    echo "   $author: $commit_count commits"
done
echo

# Check 4: Repository statistics
echo "📊 Repository statistics:"
TOTAL_COMMITS=$(git rev-list --all --count)
TOTAL_AUTHORS=$(git log --format='%aN' | sort -u | wc -l)
echo "   Total commits: $TOTAL_COMMITS"
echo "   Total authors: $TOTAL_AUTHORS"
echo

# Summary
echo "📋 SUMMARY:"
if [ $COMMITS_BY_AUTHOR -eq 0 ] && [ $COMMITS_BY_COMMITTER -eq 0 ] && [ $CO_AUTHORED -eq 0 ] && [ $MENTIONS -eq 0 ]; then
    echo "   ❌ NO CONTRIBUTIONS FOUND"
    echo "   Mookth789 has not contributed to this repository"
else
    echo "   ✅ CONTRIBUTIONS DETECTED"
    echo "   See details above"
fi

echo
echo "🔗 For full analysis, see: MOOKTH789_CONTRIBUTION_ANALYSIS.md"