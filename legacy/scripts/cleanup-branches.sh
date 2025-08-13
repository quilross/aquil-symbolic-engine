#!/bin/bash

# Repository Branch Cleanup Script
# This script provides commands to complete the repository cleanup
# by deleting all remote branches except 'main' and 'Root'

echo "=== Repository Branch Cleanup Script ==="
echo "This script will help complete the cleanup of the aquil-symbolic-engine repository"
echo ""

echo "Branches to keep: main, Root"
echo "Current local branches:"
git branch
echo ""

echo "=== Remote Branch Deletion Commands ==="
echo "Run these commands to delete remote branches (requires push access):"
echo ""

# List of branches to delete
branches_to_delete=(
    "copilot/fix-0b3e6930-e238-4eb9-9d23-c291c724516e"
    "copilot/fix-25bbd860-e231-402d-9d8a-8aa382f973db"
    "copilot/fix-28c56956-1f00-4575-b5a0-c6470fc15358"
    "copilot/fix-2e995cf0-425e-40cf-92b5-364da5b2cda9"
    "copilot/fix-4454f47a-5a86-4ddd-812f-b29c1902ddcd"
    "copilot/fix-6a741f13-e6ff-4adb-92db-91e32cdfb6bb"
    "copilot/fix-74"
    "copilot/fix-78"
    "copilot/fix-82"
    "copilot/fix-8c943afd-41ac-4a91-a285-7d889ef027b4"
    "copilot/fix-a1acf377-6ef1-473c-bd9d-1c8088b9a0af"
    "copilot/fix-d56cd35a-1a21-4296-87ac-24e299aca764"
    "copilot/fix-e91836d4-dcca-44f4-a623-29ec52ac7aee"
    "copilot/fix-eae98533-9f59-41e1-a9a3-b856a992e225"
    "copilot/fix-fbe590e5-16bf-489b-ac2b-4cbdc44fc62a"
    "codex/add-probe_identity-to-handlers"
    "p65f0y-codex/add-probe_identity-to-handlers"
    "qiexuy-codex/add-probe_identity-to-handlers"
    "xt05pd-codex/add-probe_identity-to-handlers"
    "codespaces-compatibility"
    "dependabot/npm_and_yarn/multi-d99d385e57"
)

# Generate delete commands
for branch in "${branches_to_delete[@]}"; do
    echo "git push origin --delete \"$branch\""
done

echo ""
echo "=== Alternative: Delete all at once ==="
echo "To delete all branches in one command:"
echo -n "git push origin --delete"
for branch in "${branches_to_delete[@]}"; do
    echo -n " \"$branch\""
done
echo ""
echo ""

echo "=== Verification ==="
echo "After running the delete commands, verify with:"
echo "git ls-remote --heads origin"
echo ""
echo "Expected result: Only 'main' and 'Root' branches should remain"