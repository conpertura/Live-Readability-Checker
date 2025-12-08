(function() {

    tinymce.PluginManager.add('tinymce-live-readability-checker', function(editor) {

var textvar; // Contains text already present in editor
var lastId; // Stores the smallest unused id number to count from
var cursorNode; // Catches the current element where the cursor is placed
var textpos; // Catches the current position of the cursor within node or element
const htags = "h1, h2, h3, h4, h5, h6";
const maxWordsSentence = 20;
const maxWordsSection = 150;

editor.on('LoadContent', function() {
textvar = editor.getBody();
refreshReadability();
});

editor.on('keyup', function() {
textvar = editor.getBody();
refreshReadability();
});

editor.on('PastePostProcess', function() {
textvar = editor.getBody();
refreshReadability();
});

        /* Rebuilds sentence spans from the current editor content. Captures and restores
         * the cursor position so setContent does not move the caret unexpectedly. */
        function rebuildFromEditorContent() {
            if (isUpdating) {
                return;
            }

            isUpdating = true;

function refreshReadability() {
    var text = editor.getContent({format: 'text'});
    rebuildSentences(text);
    updateTooLongClasses();
}

function rebuildSentences(text) {
    if (!textvar) {
        textvar = editor.getBody();
    }
    lastId = 1;
    textvar.innerHTML = '';
    findSentences(text);
}

/* Parses the whole text and wraps each sentence in a span with a unique id
 * Only runs once when user inputs a whole new text */
function findSentences(text) {
    if (!text) {
        return;
    }
    var sentences = text.match(/[^.!?]+[.!?]?/g) || [];
    var i = 1;
    sentences.forEach(function(sentence) {
        var cleanSentence = sentence.trim();
        if (cleanSentence.length === 0) {
            return;
        }
        var span = makeSpan(i, cleanSentence, true);
        findTooLong(span.id);
        i++;
    });
    lastId = i;
}

            editor.setContent(html);

/* Helper function to create a span element with specific content */
function makeSpan(id, content, insertAsChild) {
    var span = document.createElement("span");
        span.setAttribute("id", id);
        span.innerHTML = content + " ";
        if (insertAsChild) {
        textvar.appendChild(span);    
        }
        if (id === lastId) {
            lastId++;
        }
        return span;
}
    
/* Finds sentences longer than 20 words (condition wordcount > 20) and assigns a CSS class.
 * Precondition: findSentences to obtain ids.
 */
function findTooLong(id) {
        var sentence = document.getElementById(id);
        if (!sentence) {
            return false;
        }
        var words = sentence.innerText.trim().split(/\s+/).filter(Boolean);
        var wordcount = words.length;
        var tooLong = wordcount > maxWordsSentence;
        sentence.classList.toggle("sentence-tl", tooLong);
        sentence.setAttribute("data-words", wordcount);
        return tooLong;
}

function updateTooLongClasses() {
    var spans = textvar ? textvar.querySelectorAll("span") : [];
    spans.forEach(function(span) {
        findTooLong(span.id);
    });
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

/* Deletes next node and joins its contents with given node
 * node = window.getSelection().anchorNode.parentElement
 */
function joinSentence(node) {
    var nextNode = node.nextElementSibling;
    var join = node.innerText + nextNode.innerText;
    node.innerText = join;
    nextNode.remove();
    findTooLong(node.id);
}

/* Helper function to set cursor to a specified position. Arguments explained:
 * node = domnode, pos = 1 for end of domnode,
 * node = textnode (domnode.firstChild),
 * pos = any number for offset within textnode */
function setCursor(node, pos) {
   editor.setContent(textvar)
// Creates range object
    var setpos = document.createRange();
// Creates object for selection
    var set = window.getSelection();
// Set start and end position of range
        setpos.setStart(node, pos);
// Collapse range within its boundary points
// Returns boolean
    setpos.collapse(true);
// Remove all ranges set
    set.removeAllRanges();
// Add range with respect to range object.
    set.addRange(setpos);
// Set cursor on focus
    tinymce.activeEditor.focus();
}

/* Helper function to provide text headings for section assignment */
function wrapHeading() {
    // make range from mouse selection
    var towrap = window.getSelection().getRangeAt(0);
// get current span
// remove span tags
    // wrap range in h4 tags
    var atag = document.createElement("h4");
    towrap.surroundContents(atag);
// make three ranges, one before selection, selection, and one after selection
// every range that has over 0 characters ( = signify letters or words), wrap in new span tag, so text format is preserved.
// then run findSections over whole text to include new heading into section formation
}

var nodeListener = function(event) {
    if (event.target.nodeName === "H4") {
        console.log("Heading altered! ", event.target);
        updateSections(textvar);
    }
};

        /* Counts the number of words in a sentence. */
        function countWords(sentence) {
            const words = sentence.match(/\S+/g);
            return words ? words.length : 0;
        }
    });
})();
