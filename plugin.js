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

function saveSelectionState() {
    return {
        rng: editor.selection.getRng(),
        bookmark: editor.selection.getBookmark(2, true)
    };
}

function restoreSelectionState(state) {
    if (!state) {
        return;
    }

    if (state.bookmark) {
        editor.selection.moveToBookmark(state.bookmark);
    } else if (state.rng) {
        editor.selection.setRng(state.rng);
    }
}

// Don't access container, access content directly:
// 2. Store in variable textvar and add HTML tags
// 3. Reinsert with tinymce.activeEditor.setContent()
// No need for cursor reset? Just setContent and write on?

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

/* Finds a section tag and counts its total words.
* Precondition: findSentences, findTooLong, and findSections to obtain ids and "data-words" attribute
*/
function findLongSection(id) {
    var section = document.getElementById(id);
    var wordcount = 0;
    var k;
    var spans = section.querySelectorAll("span");
    for (k of spans) {
    wordcount += parseInt(k.getAttribute("data-words"));
    }
    section.setAttribute("data-words", wordcount);
    if (wordcount > maxWordsSection) {
       section.classList.add("section-tl"); 
    }
    else {
       section.classList.remove("section-tl");  
    }
}

/* Removes all existing sections, and checks the document for new or altered sections */
function updateSections(where) {
        var selectionState = saveSelectionState();
        var allsections = where.querySelectorAll("section");
        var j;
        for (j of allsections) {
            var html = j.innerHTML;
            j.insertAdjacentHTML("beforebegin", html);
            where.removeChild(j);
        }
        findSections(where);
        restoreSelectionState(selectionState);
}

/* Closes node at first . and inserts rest of content into new following node
* node = window.getSelection().anchorNode.parentElement
* pos = window.getSelection().focusOffset
*/
function splitSentence(node) {
    var text = node.innerText;
    // Get position of first occurring .
    var firstper = text.search(/\./);
    // If first . is not at end of span
    if (firstper < (text.length - 1)) {
        var toend = text.slice(firstper + 2);
        var idmem = lastId;
        var span = makeSpan(lastId, toend, false);
        node.parentElement.insertBefore(span, node.nextElementSibling);
        findTooLong(idmem);
        // Shorten previous node and put in correct format
        node.innerText = text.slice(0, firstper + 1).trim() + " ";
    }
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
    var doc = editor.getDoc();
    var setpos = doc.createRange();
    var selection = editor.selection;
    var targetNode = node.firstChild || node;
    var startOffset = targetNode.nodeType === Node.TEXT_NODE ? Math.min(pos, targetNode.length) : Math.min(pos, targetNode.childNodes.length);
    setpos.setStart(targetNode, startOffset);
    setpos.collapse(true);
    selection.setRng(setpos);
    editor.focus();
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
