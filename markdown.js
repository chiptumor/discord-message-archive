/* I had this written by AI. I deeply apologize.
 * If you feel like using this, feel free; don't
 * worry about credits or anything. Delete as you
 * like, configure as you like, fuck around as you
 * like. No license because I didn't write it.
 *
 * However, please do consider using another human-
 * written markdown parser or writing your own! I
 * would hate for people to become reliant on
 * something I had an environmentally- and socially-
 * destructive robot make for me.
 *
 * Credits regardless, so that if someone has copied
 * this file and forgot to remove this message,
 * inspectors know it wasn't written by the copier:
 * https://github.com/chiptumor/discord-message-archive
 */

class DiscordMarkdownParser {
	constructor() {
		// Define regex patterns for all markdown elements
		this.patterns = {
			escaped: /\\([*_~`|#>\\])/g,	// Matches escaped special characters
			lineBreak: /\n/g,
			italic: [/\*([^*]+)\*/g, /_([^_]+)_/g],
			bold: [/\*\*([^*]+)\*\*/g],
			underline: [/__([^_]+)__/g],
			strikethrough: [/~~([^~]+)~~/g],
			spoiler: [/\|\|([^|]+)\|\|/g],
			monospace: [/`([^`]+)`/g],
			headers: [/^#\s(.+)/gm, /^##\s(.+)/gm, /^###\s(.+)/gm, /^-#\s(.+)/gm],
			quote: [/^>\s(.+)/gm],
			unorderedList: [/^[*+-]\s(.+)/gm],
			orderedList: [/^\d+\.\s(.+)/gm],
			codeBlock: [/```(\w*)\n([\s\S]+?)\n```/g]
		};
	}

	parse(text) {
		// Process escapes first (before any other parsing)
		text = this.parseEscapes(text);

		// Process code blocks (they may contain other markdown)
		text = this.parseCodeBlocks(text);

		// Process block elements
		text = this.parseBlockElements(text);

		// Process inline elements
		text = this.parseInlineElements(text);

		// Process line breaks last
		text = this.parseLineBreaks(text);

		return text;
	}

	parseEscapes(text) {
		// Replace escaped characters with their literal versions
		return text.replace(this.patterns.escaped, '$1');
	}

	parseLineBreaks(text) {
		// Replace line breaks with <br/> except in specific contexts
		// Don't replace in code blocks, lists, or between list items
		const lines = text.split('\n');
		let inCodeBlock = false;
		let inList = false;

		return lines.map((line, i) => {
			// Skip processing for code blocks
			if (line.startsWith('<pre') || line.startsWith('</pre')) {
				inCodeBlock = !inCodeBlock;
				return line;
			}
			if (inCodeBlock) return line;

			// Skip processing between list items
			if (line.match(/^<(ul|ol)>/) || line.match(/^<li>/)) {
				inList = true;
				return line;
			}
			if (line.match(/<\/(ul|ol)>/)) {
				inList = false;
				return line;
			}
			if (inList && line.trim() === '') return '';

			// Add line break if not last line and line isn't empty
			if (i < lines.length - 1 && line.trim() !== '') {
				return line + '<br/>';
			}
			return line;
		}).join('\n');
	}

	parseInlineElements(text) {
		// Italic
		this.patterns.italic.forEach(pattern => {
			text = text.replace(pattern, '<i>$1</i>');
		});

		// Bold
		this.patterns.bold.forEach(pattern => {
			text = text.replace(pattern, '<b>$1</b>');
		});

		// Underline
		this.patterns.underline.forEach(pattern => {
			text = text.replace(pattern, '<u>$1</u>');
		});

		// Strikethrough
		this.patterns.strikethrough.forEach(pattern => {
			text = text.replace(pattern, '<s>$1</s>');
		});

		// Spoiler
		this.patterns.spoiler.forEach(pattern => {
			text = text.replace(pattern, '<span class="message-spoiler">$1</span>');
		});

		// Monospace
		this.patterns.monospace.forEach(pattern => {
			text = text.replace(pattern, '<code>$1</code>');
		});

		return text;
	}

	parseBlockElements(text) {
		// Headers
		text = text.replace(this.patterns.headers[0], '<h1>$1</h1>');
		text = text.replace(this.patterns.headers[1], '<h2>$1</h2>');
		text = text.replace(this.patterns.headers[2], '<h3>$1</h3>');
		text = text.replace(this.patterns.headers[3], '<h4>$1</h4>');

		// Quotes
		text = text.replace(this.patterns.quote[0], '<blockquote>$1</blockquote>');

		// Unordered lists
		text = text.replace(/^([*+-]\s.+(\n[*+-]\s.+)*)/gm, match => {
			const items = match.split('\n').map(item =>
				`<li>${item.replace(/^[*+-]\s/, '').trim()}</li>`
			).join('');
			return `<ul>${items}</ul>`;
		});

		// Ordered lists (both 1. and 1. formats)
		text = text.replace(/^(\d+\.\s.+(\n\d+\.\s.+)*)/gm, match => {
			const items = match.split('\n').map(item =>
				`<li>${item.replace(/^\d+\.\s/, '').trim()}</li>`
			).join('');
			return `<ol>${items}</ol>`;
		});

		return text;
	}

	parseCodeBlocks(text) {
		return text.replace(this.patterns.codeBlock[0], (match, lang, code) => {
			lang = lang.trim();
			const escapedCode = code
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;');
			return `<pre data-lang="${lang}">${escapedCode}</pre>`;
		});
	}
}

const dcmd = new DiscordMarkdownParser();
