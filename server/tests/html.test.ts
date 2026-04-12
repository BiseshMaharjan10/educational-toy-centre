import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../src/utils/html';

describe('escapeHtml', () => {
  it('escapes html-sensitive characters', () => {
    expect(escapeHtml('<script>alert("x") & more</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;) &amp; more&lt;/script&gt;'
    );
  });

  it('stringifies non-string values safely', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(null)).toBe('');
  });
});
