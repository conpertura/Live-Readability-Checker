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
            const htmlContent = editor.getContent({ format: 'html' }) || '';
            const container = editor.dom.create('div');

            container.innerHTML = htmlContent;

            removeExistingReadabilitySpans(container);
            wrapTextNodes(container);
            ensureTrailingMarker(container);

            editor.setContent(container.innerHTML);

            if (bookmark) {
                editor.selection.moveToBookmark(bookmark);
            }

            isUpdating = false;
        }

        /* Removes previously generated readability spans so the content can be rebuilt
         * from the raw text nodes. */
        function removeExistingReadabilitySpans(root) {
            const spans = root.querySelectorAll('span[id], span[data-words]');
            spans.forEach(function(span) {
                if (span.id === 'lastSpan' || /^\d+$/.test(span.id)) {
                    const textNode = span.ownerDocument.createTextNode(span.textContent);
                    span.parentNode.replaceChild(textNode, span);
                }
            });
        }

        /* Walks all text nodes and wraps individual sentences into spans with IDs and
         * word counts. */
        function wrapTextNodes(root) {
            const walker = root.ownerDocument.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        if (!node.parentNode) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (node.parentNode.nodeName === 'SCRIPT' || node.parentNode.nodeName === 'STYLE') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    }
                }
            );

            const textNodes = [];
            var currentNode = walker.nextNode();
            while (currentNode) {
                textNodes.push(currentNode);
                currentNode = walker.nextNode();
            }

            lastId = 1;

            textNodes.forEach(function(node) {
                const sentences = splitSentences(node.textContent);
                const fragment = node.ownerDocument.createDocumentFragment();

                sentences.forEach(function(sentence) {
                    const trimmed = sentence.trim();
                    if (!trimmed) {
                        return;
                    }

                    const span = node.ownerDocument.createElement('span');
                    const words = countWords(trimmed);

                    span.id = String(lastId);
                    span.setAttribute('data-words', words);
                    span.textContent = trimmed;

                    if (words > maxWordsSentence) {
                        span.classList.add('sentence-tl');
                    }

                    fragment.appendChild(span);
                    fragment.appendChild(node.ownerDocument.createTextNode(' '));

                    lastId += 1;
                });

                node.parentNode.replaceChild(fragment, node);
            });
        }

        /* Ensures the trailing marker span exists for navigation compatibility with the
         * previous implementation. */
        function ensureTrailingMarker(root) {
            const marker = root.ownerDocument.createElement('span');
            marker.id = 'lastSpan';
            root.appendChild(marker);
        }

        /* Splits a text string into sentences, keeping trailing punctuation. */
        function splitSentences(text) {
            return text.match(/[^.!?]+[.!?]?/g) || [];
        }

        /* Counts the number of words in a sentence. */
        function countWords(sentence) {
            const words = sentence.match(/\S+/g);
            return words ? words.length : 0;
        }
    });
})();
