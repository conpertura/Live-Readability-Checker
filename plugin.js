(function() {

    tinymce.PluginManager.add( 'tinymce-live-readability-checker', function( editor ) {

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

// Don't access container, access content directly:
// 2. Store in variable textvar and add HTML tags
// 3. Reinsert with tinymce.activeEditor.setContent()
// No need for cursor reset? Just setContent and write on?

function main(text) {
   findSentences(text);
   setConstraints(text);
}

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

/* Designates pasted text with as a section by surrounding it with a section tag */
function setConstraints(where) {
    // Make empty span at the end for navigation purposes
    makeSpan("lastSpan", "", true);
    // Wrap everything in a section tag
    if (document.querySelector("section") === null) {
    var section = document.createElement("section");
    section.setAttribute("id", "navSection");
    var towrap = document.createRange();
    towrap.selectNodeContents(spantext);
    towrap.surroundContents(section);
    }
}

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

/* Removes the outest section tag to make space for multiple section tags.
 * Only runs when outest section tag is present, does nothing otherwise
 */
function removeNavSection(where) {
    var navSection = document.getElementById("navSection");
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
    removeNavSection(where);
    var headings = where.querySelectorAll(htags);
        var i = 0;
        while (i < headings.length) {
            var range = document.createRange();
            var section = document.createElement('section');
            var next = (i + 1);
            var idnr = "s" + next;
            section.setAttribute("id", idnr);
            var heading1 = headings[i];
            var heading2 = headings[next];
            range.setStartAfter(heading1);
            if (next === headings.length) {
                range.setEndBefore(where.lastElementChild); 
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
        var allsections = where.querySelectorAll("section");
        var j;
        for (j of allsections) {
            var html = j.innerHTML;
            j.insertAdjacentHTML("beforebegin", html);
            where.removeChild(j);
        }
        findSections(where);
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

var nodeListener = function(event) {
    if (event.target.nodeName === "H4") {
        console.log("Heading altered! ", event.target);
        updateSections(textvar);
    }
};

editor.on("DOMNodeInserted", nodeListener, false);
editor.on("DOMNodeRemoved", nodeListener, false);

});
})();
