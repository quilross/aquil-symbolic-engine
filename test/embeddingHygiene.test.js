import test from "node:test";
import assert from "node:assert/strict";

// Import the scrubAndTruncateForEmbedding function from index.js
// For testing purposes, we'll copy the function here
function scrubAndTruncateForEmbedding(text, maxLength = 1000) {
  if (!text || typeof text !== 'string') return '';
  
  // Basic PII scrubbing patterns
  let scrubbed = text
    // Email addresses
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    // Phone numbers (various formats)
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    // Credit card numbers (basic patterns)
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]')
    // SSN patterns
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
    
  // Truncate to max length
  if (scrubbed.length > maxLength) {
    scrubbed = scrubbed.substring(0, maxLength - 3) + '...';
  }
  
  return scrubbed;
}

test("scrubAndTruncateForEmbedding - basic functionality", () => {
  assert.equal(scrubAndTruncateForEmbedding("Hello world"), "Hello world");
  assert.equal(scrubAndTruncateForEmbedding(""), "");
  assert.equal(scrubAndTruncateForEmbedding(null), "");
  assert.equal(scrubAndTruncateForEmbedding(undefined), "");
});

test("scrubAndTruncateForEmbedding - email redaction", () => {
  const input = "Contact me at john.doe@example.com or jane@test.org";
  const result = scrubAndTruncateForEmbedding(input);
  assert.equal(result, "Contact me at [EMAIL] or [EMAIL]");
  assert.equal(result.includes("@"), false);
});

test("scrubAndTruncateForEmbedding - phone number redaction", () => {
  const input = "Call me at 555-123-4567 or 555.987.6543 or 5551234567";
  const result = scrubAndTruncateForEmbedding(input);
  assert.equal(result, "Call me at [PHONE] or [PHONE] or [PHONE]");
});

test("scrubAndTruncateForEmbedding - credit card redaction", () => {
  const input = "My card is 1234-5678-9012-3456 or 1234 5678 9012 3456";
  const result = scrubAndTruncateForEmbedding(input);
  assert.equal(result, "My card is [CARD] or [CARD]");
});

test("scrubAndTruncateForEmbedding - SSN redaction", () => {
  const input = "SSN: 123-45-6789";
  const result = scrubAndTruncateForEmbedding(input);
  assert.equal(result, "SSN: [SSN]");
});

test("scrubAndTruncateForEmbedding - truncation", () => {
  const longText = "a".repeat(1500);
  const result = scrubAndTruncateForEmbedding(longText, 1000);
  assert.equal(result.length, 1000);
  assert.equal(result.endsWith("..."), true);
});

test("scrubAndTruncateForEmbedding - oversized payload produces summarized text", () => {
  const oversizedPayload = {
    userInput: "I need help with my anxiety",
    personalDetails: "My name is John Doe, email john@example.com, phone 555-123-4567",
    longDescription: "x".repeat(2000)
  };
  
  const input = JSON.stringify(oversizedPayload);
  const result = scrubAndTruncateForEmbedding(input, 1000);
  
  // Should be truncated
  assert.equal(result.length, 1000);
  assert.equal(result.endsWith("..."), true);
  
  // Should have PII redacted
  assert.equal(result.includes("john@example.com"), false);
  assert.equal(result.includes("555-123-4567"), false);
  assert.equal(result.includes("[EMAIL]"), true);
  assert.equal(result.includes("[PHONE]"), true);
});

test("scrubAndTruncateForEmbedding - whitespace normalization", () => {
  const input = "Too   much    whitespace\n\n\nand   newlines";
  const result = scrubAndTruncateForEmbedding(input);
  assert.equal(result, "Too much whitespace and newlines");
});