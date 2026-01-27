import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

/**
 * Decorator to sanitize HTML input
 * Removes all HTML tags by default, preventing XSS attacks
 *
 * Usage:
 * @SanitizeHtml()
 * description: string;
 *
 * For allowing specific tags:
 * @SanitizeHtml({ allowedTags: ['b', 'i', 'em', 'strong'] })
 * description: string;
 */
export function SanitizeHtml(options?: sanitizeHtml.IOptions) {
  const defaultOptions: sanitizeHtml.IOptions = {
    allowedTags: [], // Remove all tags by default
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  };

  const finalOptions = options || defaultOptions;

  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }
    return sanitizeHtml(value, finalOptions).trim();
  });
}

/**
 * Decorator to sanitize HTML but allow basic formatting tags
 * Allows: <b>, <i>, <em>, <strong>, <p>, <br>
 *
 * Usage:
 * @SanitizeHtmlBasic()
 * description: string;
 */
export function SanitizeHtmlBasic() {
  return SanitizeHtml({
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}
