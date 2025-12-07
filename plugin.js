(function() {

    tinymce.PluginManager.add( 'tinymce-live-readability-checker', function( editor ) {

var textvar; // Contains text already present in editor
var keyCodes = [32, 8, 46]; // Contains the keyCodes for space, del, and del.
var lastId; // Stores the smallest unused id number to count from
var cursorNode; // Catches the current element where the cursor is placed
var textpos; // Catches the current position of the cursor within node or element
const htags = "h1, h2, h3, h4, h5, h6";
const maxWordsSentence = 20;
const maxWordsSection = 150;
var headingObserver;

function getEditorRoot() {
    var editorDoc = editor.getDoc();
    if (editorDoc && editorDoc.body) {
        return editorDoc.body;
    }
    return document.body;
}

function isHeadingNode(node) {
    return node && node.nodeType === 1 && node.matches && node.matches(htags);
}

function observeHeadingChanges() {
    var root = getEditorRoot();
    if (!root) {
        return;
    }

    if (headingObserver) {
        headingObserver.disconnect();
    }

    headingObserver = new MutationObserver(function(mutations) {
        for (var mutation of mutations) {
            var addedHeading = Array.from(mutation.addedNodes || []).some(isHeadingNode);
            var removedHeading = Array.from(mutation.removedNodes || []).some(isHeadingNode);
            if (addedHeading || removedHeading) {
                updateSections(root);
                break;
            }
        }
    });

    headingObserver.observe(root, { childList: true, subtree: true });
}

editor.on('loadContent', function() {
var root = getEditorRoot();
textvar = root;
console.log("TinyMCE container: " + (root.innerHTML || '').slice(0, 20));
main(root ? root.innerText : "");
observeHeadingChanges();
});

// Don't access container, access content directly:
// 2. Store in variable textvar and add HTML tags
// 3. Reinsert with tinymce.activeEditor.setContent()
// No need for cursor reset? Just setContent and write on?

function main(text) {
   findSentences(text);
   setConstraints(text);
   updateSections(getEditorRoot());
}

/* Parses the whole text and wraps each sentence in a span with a unique id
 * Only runs once when user inputs a whole new text */
function findSentences(text) {
    // Search for . to distinguish between sentences
    var i = 1;
    while (text.search(/\./) > 0) {
        var pos = text.search(/\./);
        sentence = text.slice(0, pos + 1);
        span = makeSpan(i, sentence, true);
        // Check wordcount of sentence
        findTooLong(span.id);
        i++;
        text = text.slice(pos + 2);
    }
    // Make span for loose words without .    
    if (text.length > 0) {
       span = makeSpan(i, text, true);
       findTooLong(span.id);
    }
    // First unused id number to assign to new sentences
    lastId = i + 1;
}

/* Designates pasted text with as a section by surrounding it with a section tag */
function setConstraints(where) {
    // Make empty span at the end for navigation purposes
    makeSpan("lastSpan", "", true);
    // Wrap everything in a section tag
    if (getEditorRoot().querySelector("section") === null) {
    var section = getEditorRoot().ownerDocument.createElement("section");
    section.setAttribute("id", "navSection");
    var towrap = getEditorRoot().ownerDocument.createRange();
    towrap.selectNodeContents(spantext);
    towrap.surroundContents(section);
    }
}

/* Helper function to create a span element with specific content */
function makeSpan(id, content, insertAsChild) {
    var span = getEditorRoot().ownerDocument.createElement("span");
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
        var sentence = getEditorRoot().ownerDocument.getElementById(id);
        var togo = sentence.innerText.trim() + " ";
        // Counts first space as first word
        var wordcount = 0;
        // Cuts sentence in words, counts words per sentence with wordcount.
        while(togo.search(/\s/) > 0) {
            var wordpos = togo.search(/\s/);
                wordcount++;
                    if (wordcount > maxWordsSentence) {
                        sentence.classList.add("sentence-tl");
                    }
                    else {
                        sentence.classList.remove("sentence-tl");
                    }
            if (wordcount !== sentence.getAttribute("data-words")) {
            sentence.setAttribute("data-words", wordcount);
            }
            togo = togo.slice(wordpos + 1);
    }
}

/* Removes the outest section tag to make space for multiple section tags.
 * Only runs when outest section tag is present, does nothing otherwise
 */
function removeNavSection(where) {
    var navSection = where.ownerDocument.getElementById("navSection");
                if (navSection !== null) {
                    var html = navSection.innerHTML;
                    where.insertAdjacentHTML("afterbegin", html);
                    where.removeChild(navSection);
                }
}

/* Wraps the text between two heading tags in a section tag
 * Precondition: findTooLong
 */
function findSections(where) {
    var root = where || getEditorRoot();
    removeNavSection(root);
    var headings = root.querySelectorAll(htags);
        var i = 0;
        while (i < headings.length) {
            var range = root.ownerDocument.createRange();
            var section = root.ownerDocument.createElement('section');
            var next = (i + 1);
            var idnr = "s" + next;
            section.setAttribute("id", idnr);
            var heading1 = headings[i];
            var heading2 = headings[next];
            range.setStartAfter(heading1);
            if (next === headings.length) {
                range.setEndBefore(root.lastElementChild);
            }
            else {
               range.setEndBefore(heading2);
            }
            section.appendChild(range.extractContents());
            range.insertNode(section);
            // Count words in section, requires findSentences first
            findLongSection(idnr);
            i++;
        }
    }


/* Finds a section tag and counts its total words.
* Precondition: findSentences, findTooLong, and findSections to obtain ids and "data-words" attribute
*/
function findLongSection(id) {
    var section = getEditorRoot().ownerDocument.getElementById(id);
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
        var root = where || getEditorRoot();
        var allsections = root.querySelectorAll("section");
        var j;
        for (j of allsections) {
            var html = j.innerHTML;
            j.insertAdjacentHTML("beforebegin", html);
            root.removeChild(j);
        }
        findSections(root);
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

/* Event Listener: Updates readability checks when Space, Backspace, Delete, or Period is pressed.*/
div.addEventListener("keyup", function(event) {
	const key = event.key;
        // Get current element
        cursorNode = window.getSelection().anchorNode.parentElement;
        // Get current position of cursor
        textpos = window.getSelection().focusOffset;
        // On keyup space, delete, del
        if (keyArray.includes(key)) {
            console.log("Fired: " + key);
            findTooLong(cursorNode.id);
            findLongSection(cursorNode.parentElement.id);
            // If the node is missing a period (because it has just been deleted), join with next node.
            var noPeriod = cursorNode.innerText.search(/\./) < 0;
            if (noPeriod) {
                // Join nodes
                joinSentence(cursorNode);
                // Set cursor to last position in text node
                setCursor(cursorNode.firstChild, textpos);
            }
        }
        // On keyup of new period, split node in two nodes
        if (key === "Enter") {
        splitSentence(cursorNode);
        // Deal with period placed in last node
        if (document.getElementById(lastId - 1).nextElementSibling.isSameNode(document.getElementById("lastSpan"))) {
            console.log("Period placed in last node!");
            setCursor(document.getElementById(lastId - 1), 1);
        }
        else {
            setCursor(cursorNode, 1);
        }
    }
});
     

editor.on('NodeChange', function(event) {
    var targetNode = event && event.element;
    var parentNodes = (event && event.parents) || [];
    if (!targetNode) {
        return;
    }
    if (isHeadingNode(targetNode) || parentNodes.some(isHeadingNode)) {
        updateSections(getEditorRoot());
    }
});

});
})();
