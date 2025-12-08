(function() {

    tinymce.PluginManager.add('tinymce-live-readability-checker', function(editor) {

        var lastId;
        var isUpdating = false;
        const maxWordsSentence = 20;

        editor.on('loadContent', rebuildFromEditorContent);
        editor.on('keyup', rebuildFromEditorContent);

        /* Rebuilds sentence spans from the current editor content. Captures and restores
         * the cursor position so setContent does not move the caret unexpectedly. */
        function rebuildFromEditorContent() {
            if (isUpdating) {
                return;
            }

            isUpdating = true;

            const bookmark = editor.selection.getBookmark(2, true);
            const textContent = editor.getContent({ format: 'text' }) || '';
            const htmlContent = editor.getContent({ format: 'html' }) || '';
            const sentences = parseSentences(textContent);
            const html = wrapSentencesAsHtml(sentences, htmlContent);

            editor.setContent(html);

            if (bookmark) {
                editor.selection.moveToBookmark(bookmark);
            }

            isUpdating = false;
        }

        /* Splits the provided text into sentences, preserving trailing periods and
         * assigning sequential IDs. */
        function parseSentences(text) {
            const matches = text.match(/[^.]+\.|[^.]+$/g) || [];
            lastId = 1;
            return matches.map(sentence => {
                const trimmed = sentence.trim();
                const words = countWords(trimmed);
                const data = {
                    id: lastId,
                    text: trimmed,
                    words: words,
                    isTooLong: words > maxWordsSentence
                };
                lastId += 1;
                return data;
            });
        }

        /* Builds the HTML string for the current set of sentences and appends a trailing
         * marker span to mirror the previous implementation. */
        function wrapSentencesAsHtml(sentences, existingHtml) {
            const wrapperMatch = existingHtml.match(/<([a-z0-9]+)[^>]*>/i);
            const wrapper = wrapperMatch ? wrapperMatch[1] : 'p';
            const spans = sentences.map(sentence => {
                const classes = sentence.isTooLong ? ' class="sentence-tl"' : '';
                return `<span id="${sentence.id}" data-words="${sentence.words}"${classes}>${sentence.text} </span>`;
            }).join('');

            return `<${wrapper}>${spans}<span id="lastSpan"></span></${wrapper}>`;
        }

        /* Counts the number of words in a sentence. */
        function countWords(sentence) {
            const words = sentence.match(/\S+/g);
            return words ? words.length : 0;
        }
    });
})();
