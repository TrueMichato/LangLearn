import remarkGfm from 'remark-gfm';
import remarkCjkFriendly from 'remark-cjk-friendly';

/**
 * The remark plugins every lesson renderer must use.
 *
 * `remark-cjk-friendly` exists because CommonMark decides whether `**` may open
 * emphasis using "flanking" rules that assume space-delimited writing. Japanese
 * has no spaces, and CJK punctuation (、。（）「」・〜) counts as Unicode
 * punctuation, so ordinary correct-looking Japanese silently renders a literal
 * `**` instead of bold text. The plugin implements the CommonMark revision
 * candidate for this (spec issue #650) and is ported across several parsers.
 *
 * Exported as a single list so the lesson view and the tests that assert on its
 * output cannot drift apart.
 */
export const LESSON_REMARK_PLUGINS = [remarkGfm, remarkCjkFriendly];
