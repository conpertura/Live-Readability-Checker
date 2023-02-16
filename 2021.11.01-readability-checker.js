var div = document.getElementById("enter"); // References the div which contains the text to be checked
var keyArray = [' ', 'Backspace', 'Delete']; // Contains the keys relevant for typing.
var lastId; // Stores the smallest unused id number to count from
var cursorNode; // Catches the current element where the cursor is placed
var textpos; // Catches the current position of the cursor within node or element
var pasted = false;
const htags = "h1, h2, h3, h4, h5, h6";
const maxWordsSentence = 5;
const maxWordsSection = 20;

/* Opens a file dialog from the OS to import text from a text file into div tag with id "enter" */
function openFile(event) {
    var text;
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function() {
      text = reader.result;
      div.innerText = "";
      findSentences(text);
      setConstraints(div);
    };
    reader.readAsText(input.files[0]);
    pasted = true; 
  };

/* Parses the whole text and wraps each sentence in a span with a unique id
 * Only runs once when user inputs a whole new text */
function findSentences(text) {
    // Search for spans separated by .
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
    if (document.querySelector("section") === null) {
    var section = document.createElement("section");
    section.setAttribute("id", "navSection");
    var towrap = document.createRange();
    towrap.selectNodeContents(where);
    towrap.surroundContents(section);
    }
}
    
/* Finds sentences longer than 20 words (condition wordcount > 20) and assigns a CSS class.
 * Precondition: findSentences to obtain ids.
 */
function findTooLong(id) {
        var sentence = document.getElementById(id);
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

/* Helper function to create a span element with specific content */
function makeSpan(id, content, insertAsChild) {
    var span = document.createElement("span");
        span.setAttribute("id", id);
        span.innerHTML = content + " ";
        if (insertAsChild) {
        div.appendChild(span);    
        }
        if (id === lastId) {
            lastId++;
        }
        return span;
}

/* Helper function to set cursor to a specified position. Arguments explained:
 * node = domnode, pos = 1 for end of domnode,
 * node = textnode (domnode.firstChild),
 * pos = any number for offset within textnode */
function setCursor(node, pos) {
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
    div.focus();
}

/* Helper function to provide text headings for section assignment */
function wrapHeading() {
    // make range from mouse selection
    var towrap = window.getSelection().getRangeAt(0);
    // wrap range in h4 tags
    var atag = document.createElement("h4");
    towrap.surroundContents(atag);
}

/* Event Listener: Updates readability checks when Space, Backspace, Delete, or Period is pressed.*/
div.addEventListener("keyup", function(key) {
    console.log(key);
        // Get current element
        cursorNode = window.getSelection().anchorNode.parentElement;
        // Get current position of cursor
        textpos = window.getSelection().focusOffset;
        // On keyup space, delete, del
        var keyUp = keyArray.includes(key);
        if (keyUp && pasted) {
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
    }
});
     

var nodeListener = function(event) {
    if (event.target.nodeName === "H4") {
        console.log("Heading altered! ", event.target);
        updateSections(div);
    }
};

div.addEventListener("DOMNodeInserted", nodeListener, false);
div.addEventListener("DOMNodeRemoved", nodeListener, false);
