// Paths for resources

const lemmatiserPath = "resources/eclogue1LR.xml";
const lexiconPath = "resources/glosses.xml";
const commentaryPath = "resources/commentarynotes.xml";

// Sections and their buttons

const sections = document.querySelectorAll(".latin_text");
const nextSectionButton = document.querySelector("#next");
const previousSectionButton = document.querySelector("#previous");

let currentSection = 0;

nextSectionButton.addEventListener("click", () => nextSection() );
previousSectionButton.addEventListener("click", () => previousSection() );

function nextSection() {
    if (currentSection == sections.length - 1) { // there are no sections after this one
        return
    }

    $(sections[currentSection]).toggleClass("currently_reading")
    currentSection++
    $(sections[currentSection]).toggleClass("currently_reading")

    setSectionNavButtons()
}

function previousSection() {
    if (currentSection == 0) { // there are no sections before this one
        return
    }

    $(sections[currentSection]).toggleClass("currently_reading")
    currentSection--
    $(sections[currentSection]).toggleClass("currently_reading")

    setSectionNavButtons()
}

function setSectionNavButtons() {
    if (currentSection == 0) { // first section is displayed
        previousSectionButton.classList.add("invisible");        
    }
    
    else if (currentSection == sections.length - 1) { // last section is displayed
        nextSectionButton.classList.add("invisible");
    }
    
    else { // a middle section is displayed
        previousSectionButton.classList.remove("invisible");        
        nextSectionButton.classList.remove("invisible");
    }
}

setSectionNavButtons()

// Loading request indicator
    
const loading = document.querySelector("#loading");

function handleFetchStart() {
    loading.classList.remove("invisible");
    $('body').css('cursor', 'progress');
}

function handleFetchEnd() {
    loading.classList.add("invisible");
    $('body').css('cursor', 'default');
}

async function makeFetchRequest(url) {
    try {
        handleFetchStart();
        const response = await fetch(url);
        handleFetchEnd();
        return response

    } catch (error) {
        console.log("Fetch request failed: ", error);
        return error
    }
}

// Words

let words = null;

async function makeWordsClickable() {
    words = await spanAllWords()
    words.forEach(word => {
        word.addEventListener("click", (event) => {
            word = $(event.target)
            clearFocus();
            word.toggleClass("focus");
            updateCard(word);
        })
    });
}

async function spanAllWords() {
    // Wraps a <span> around each word in each verse line, to make it easier to click on the word.

    // This regex splits a line into words, punctuation, and white space; mecum, tecum, secum, nobiscum and vobiscum are split into pronoun and enclitic
    const spanWordsRegex = new RegExp(/([mts]e|[nv]obis)(?=cum)|\p{L}+|[^\p{L}]+/gu);

    // Wrap a <span> around each match
    $(".l").each((index, value) => {
        const matches = $(value).text().match(spanWordsRegex);
        for (let i = 0; i < matches.length; i++) {
            if (/\w+/.test(matches[i])) { // Wrap only the regex matches that are words
                matches[i] = "<span class='w'>" + matches[i] + "</span>" 
            }
            let text = matches.join("");
            $(value).html(text);
        }
    });

    // So far the enclitic -que is not separated from the word it is attached to.
    // All instances of -que are retrieved from the lemmatised text, the span which contains that instance is identified and split so as to give que its own span.

    const lemmatiserXML = await makeFetchRequest(lemmatiserPath)
        .then(response => response.text())
        .then(text => $.parseXML(text))

    const $queTokens = $(lemmatiserXML).find("[lemma=que]");
    $queTokens.each((index, value) => {
        const queLineNumber = $(value).attr("n") // e.g. "1.2"
        const queIndex = $(value).index()

        const lineDiv = $(".l[n='"+queLineNumber+"']")
        const queSpan = $(lineDiv).find(".w:nth-child("+queIndex+")");

        const oldHTML = queSpan.html();
        const newHTML = "<span class='w'>" + oldHTML.slice(0,-3) + "</span><span class='w'>que"

        queSpan.replaceWith(newHTML);
    });

    addLineNumbers() // required here since there is an ajax call on which it is dependent

    return document.querySelectorAll(".w")

}

makeWordsClickable()

// Cards

const card = document.getElementById("lookup_card");
const cardTitle = card.querySelector(".title");
const cardInfo = card.querySelector(".grammar ul");

async function updateCard(word) { // word is an element
    cardTitle.innerHTML = word.html();
    card.classList.remove("invisible");

    const requests = [
        fetch(lemmatiserPath),
        fetch(lexiconPath),
        fetch(commentaryPath)
    ]

    Promise.all(requests)
        .then((responses) => Promise.all(responses.map((r) => r.text())))
        .then((results) => doSomething(word, results))
        .catch((error) => console.error(error)); 

}

function doSomething(wordElement, xmlFiles) {
    clearCard();

    const parser = new DOMParser();
    const [lemmatiser, lexicon, commentary] = xmlFiles.map(
        (file) => parser.parseFromString(file, "text/xml"));
    
    const word = getWordFromXML(lemmatiser, wordElement);
    const lemma = word.attributes.getNamedItem("lemma").nodeValue;
    
    const entry = lexicon.querySelector("entry[n='"+lemma+"']");
    console.log(entry)
    
    // the principal parts
    const principalParts = entry.querySelector("pp").innerHTML;
    const gender = entry.querySelector("gen").innerHTML;

    const principalPartsElement = document.createElement("li");
    principalPartsElement.innerHTML = [principalParts, gender].join(", ");

    cardInfo.append(principalPartsElement);

    // the gloss
    const glossElement = document.createElement("li");
    glossElement.innerHTML = entry.querySelector("gloss").innerHTML;

    cardInfo.append(glossElement);

    // morpho-syntactic descrition
    const msd = word.attributes.getNamedItem("msd").nodeValue;
    const msdText = getParseFromMSD(msd);

    if (msdText) { 
        const parseInfo = document.createElement("li");
        parseInfo.innerHTML = msdText;
        
        cardInfo.append(parseInfo);
    }

    // TODO: include comments

}

function clearCard() {
    cardInfo.replaceChildren();
}



function makeCard(wordElement) { 
    const lookupPanel = document.querySelector("#lookup");

    // remove any existing cards
    const existingCards = document.querySelectorAll(".w3-card-4")
    if (existingCards) { existingCards.forEach((card) => card.remove())}

    // create the card elements
    const card = document.createElement("div");
    card.classList.add("w3-card-4", "animate", "invisible");
    
    const cardHeader = document.createElement("header");
    cardHeader.classList.add("w3-container", "w3-blue");
    card.appendChild(cardHeader);

    const closeButton = document.createElement("span");
    closeButton.classList.add("cardbutton", "close");
    closeButton.innerHTML = "&times;"

    const hideButton = document.createElement("span");
    hideButton.classList.add("cardbutton", "hide");
    hideButton.innerHTML = "&#8597"

    const cardTitle = document.createElement("h2");

    cardHeader.append(closeButton, hideButton, cardTitle);

    const cardBar = document.createElement("div");
    cardBar.classList.add("w3-bar", "w3-blue");

    const cardContainer = document.createElement("div");
    cardContainer.classList.add("w3-container", "content");

    const cardGrammarInfo = document.createElement("div");
    cardGrammarInfo.classList.add("grammar");

    card.append(cardBar, cardContainer, cardGrammarInfo);

    const cardGrammarList = document.createElement("ul");
    cardGrammarInfo.appendChild(cardGrammarList);
    
    lookupPanel.append(card);

    populateCard(wordElement);
}

function populateCard(wordElement) {
    const card = document.querySelector("#lookup .w3-card-4");

    // populate the header of the card with the word-form as it is in the text
    
    const cardHeader = card.querySelector("h2");
    cardHeader.innerHTML = wordElement.text();

    // call the XML docs
    $.when(
        $.get(lemmatiserPath),
        $.get(lexiconPath),
        $.get(commentaryPath),
    ).done(function(lemmatiserXML, lexiconXML, commentaryXML) {

        // from the lemmatiser get the word's XML object, its lemma
        var word = getWordFromXML(lemmatiserXML, wordElement);
        var lemma = word.attributes.getNamedItem("lemma").nodeValue;
        
        // from the lexicon get the lemma's XML object
        var entry = $(lexiconXML).find("entry[n='"+lemma+"']");

        // get all the comments which include this word
        // make a list of what will be the relevant comments
        relevantComments = []
        
        // determine the word's reference as a string for comparison
        var [lineNumber, wordIndex] = getIndices(wordElement); // e.g. ["1,2", "3"]
        var wordReference = lineNumber + "." + String(parseInt(wordIndex)+1); // wordIndex is 0-indexed usually, but commentary notes are 1-indexed

        // loop through the comments and check which has a reference matching that of the word in question
        $(commentaryXML).find("entry").each(function() {

            references = $(this).find("references").html().split(", ")
            
            for (i=0; i<references.length; i++){
                if (references[i]==wordReference){
                    // the comment is a note on this word
                    relevantComments.push($(this));
                }
            }
        })

        // for each comment make a new note number in the header
        for (i=0; i<relevantComments.length; i++){
            comment = relevantComments[i].find("comment").html()
            cardBar = card.querySelector(".w3-bar")

            // if there are comments, then add a button first to allow users to return to the grammar notes
            if (i==0){
                const grammarButton = document.createElement("a");
                grammarButton.href = "javascript:void(0)";
                grammarButton.classList.add("cardbutton", "w3-bar-item", "w3-button", "w3-hover-white");
                grammarButton.innerHTML = "Grammar";
                cardBar.appendChild(grammarButton);
            }

            // add a button to the card bar

            let commentButton = document.createElement("a");
            commentButton.href = "javascript:void(0)";
            commentButton.classList.add("cardbutton", "w3-bar-item", "w3-button", "w3-hover-white");
            commentButton.innerHTML = String(i+1)
            cardBar.appendChild(commentButton);

            // add an invisible div with the comment            
            let commentElement = document.createElement("ul");
            commentElement.classList.add("comment", "invisible");
            commentElement.innerHTML = comment;
            card.querySelector(".content").append(commentElement);
        }

        card.classList.remove("invisible");
    });
}

//  FUNCTIONS

// Section navigation

function getReferences(rawReference) {
    var references = [];
    var rawReferences = rawReference.split(", ");

    for (i=0; i<rawReferences.length; i++) {
        var reference = {
            wordSpans: rawReferences[i],
            isMultiple: false
        }
        if (reference.wordSpans.includes("--")) {
            reference.isMultiple = true;
        }
        references.push(reference);
    }
    return references;
}

function getWordSpan(poemNumber, lineNumber, wordIndex) {
    var wordIndex = String(parseInt(wordIndex)-1);
    var lineDiv = $(".l[n='"+ poemNumber + "." + lineNumber + "']");
    var wordSpan = $(lineDiv).find(".w").eq(wordIndex);
    return wordSpan
}

function getWordSpans(rawReferences) {
    var rawReferenceList = rawReferences.split(", ")
    var wordSpans = []

    for (i=0; i<rawReferenceList.length; i++) {
        var reference = rawReferenceList[i];
        var [poemNumber, lineNumber, wordIndex] = reference.split(".");
        var wordIndex = String(parseInt(wordIndex)+1);
        var lineDiv = $(".l[n='"+ poemNumber + "." + lineNumber + "']");
        var wordSpan = $(lineDiv).children(".w:nth-of-type("+wordIndex+")")
        wordSpans.push(wordSpan);
    }
    return wordSpans
}

function addLineNumbers() {
    $(".l").each(function(){
        var rawLineNum = $(this).attr("n");
        var lineNum = rawLineNum.substring(1+rawLineNum.indexOf("."));
        /* The empty relative span is required to offset the line numbers correctly. */
        $(this).prepend("<span class=relative><span class=verse_ref>"+lineNum+"</span></span>")
        
        /* Make every 5th line number visible. */
        var lineNumInt = parseInt(lineNum)
        if (lineNumInt % 5 == 0) { 
            var vRef = $(this).find(".verse_ref");
            vRef.css("visibility", "visible");
        }
    });
}

function getIndices(elem) {
    var closestLine = $(elem).closest(".l");        
    var lineNumber = $(closestLine).attr("n");
    var wordsInLine = $(closestLine).find(".w");
    var wordIndex = $(wordsInLine).index(elem);

    return [lineNumber, wordIndex];
}

function getWordFromXML(xml, elem) {
    var [lineNumber, wordIndex] = getIndices(elem);
    var wordElements = $(xml).find("w[n='"+lineNumber+"']");
    var word = wordElements[wordIndex];
    return word;
}

function getParseFromMSD(msd) {
    if (msd!="MORPH=empty") {

        var msdItems = msd.toLowerCase().split("|");
        var msdDict = {}
        for (var i in msdItems) {
            var a = msdItems[i].split("=");
            msdDict[a[0]] = a[1];
        }

        var parseText = "";

        switch (msdDict["tense"]) {
            case undefined:
                break;
            case "impa":
                parseText += "impf. ";
                break;
            case "pqp":
                parseText += "plpf. ";
                break;
            case "pres":
            case "fut":
            case "perf":
                parseText += msdDict["tense"] +". ";
                break;
            default:
                console.log(msdDict["tense"]);
            
        }

        switch (msdDict["voice"]) {
            case undefined:
            case "act":
                break;
            case "dep":
            case "pass":
                parseText += msdDict["voice"] +". ";
                break;
            default:
                console.log(msdDict["voice"]);
        }

        switch (msdDict["mood"]) {
            case undefined:
            case "ind":
                break;
            case "par":
                parseText += "participle ";
                break;
            default:
                parseText += msdDict["mood"] + ". ";       
        }
        
        if (msdDict["case"]) {
            parseText += msdDict["case"] + ". ";
        }

        switch (msdDict["person"]) {
            case undefined:
                break;
            case "1":
                parseText += "1<sup>st</sup> ";
                break;
            case "2":
                parseText += "2<sup>nd</sup> ";
                break; 
            case "3":
                parseText += "3<sup>rd</sup> ";
                break;
            default:
                console.log("msdDict['person']="+msdDict["person"]);
        }

        switch (msdDict["numb"]) {
            case undefined:
                break;
            case "sing":
                parseText += "sg. ";
                break;
            case "plur":
                parseText += "pl. ";
                break;
            default:
                parseText += msdDict["numb"] + ". ";
        }

        switch (msdDict["gend"]) {
            case undefined:
                break;
            case "masc":
            case "fem":
            case "neut":
                parseText += msdDict["gend"] + ". ";
                break;
            default:
                console.log("Gender is " + msdDict["gend"]);
        }

        switch (msdDict["deg"]) {
            case undefined:
            case "pos":
                break;
            default:
                parseText += msdDict["deg"] + ". ";
        }

        if (msdDict["gen"]) {
            parseText += msdDict["gen"] + ". ";
        }
        
        return parseText;

        /*
        'case=Abl'
        'case=Acc'
        'case=Dat'
        'case=Gen'
        'case=Ind'
        'case=Nom'
        'case=Voc'
        
        'deg=Comp'
        'deg=Pos'
        'deg=Sup'
        
        'gen=Com'
        'gen=Fem'
        'gen=Masc'
        'gen=MascFem'
        'gen=MascNeut'
        'gen=Neut'
        
        'morph=empty'
        
        'mood=Ger'
        'mood=Imp'
        'mood=Ind'
        'mood=Inf'
        'mood=Par'
        'mood=Sub'
        
        'numb=Plur'
        'numb=Sing'
        
        'person=1'
        'person=2'
        'person=3'
        
        'tense=Fut'
        'tense=Impa'
        'tense=Perf'
        'tense=Pqp'
        'tense=Pres'

        'voice=Act'
        'voice=Dep'
        'voice=Pass'
        'voice=SemDep'

        */
    }
    return false;
}

function updateCardContent(button){
    $card = $(button).parents(".w3-card-4")
    buttonText = $(button).text()

    if (buttonText=="Grammar") {
        $card.find(".comment").addClass("invisible")
        $card.find(".grammar").removeClass("invisible")
    }
    else if (buttonText) {
        commentIndex = parseInt(buttonText);
        $card.find(".grammar").addClass("invisible");
        $card.find("ul.comment").addClass("invisible");
        $card.find("ul.comment:nth-of-type("+commentIndex+")").removeClass("invisible");
    }
}    


function getNodesBetween(startNode, endNode) {
    var nodes = [];
    var node = startNode;
    while ((node.nodeType=1 && node !== endNode) || (node.nodeType==3 && node !== endNode)) {
        nodes.push(node);
        node = node.nextSibling;
    }
    if (node == endNode) {
        nodes.push(node);
    }
    return nodes;
}

function quickHighlight(rawReferences) {
    // Quickly highlight text for drawing attention of the user.

    // get an array of references; each reference is a dict
    references = getReferences(rawReferences);

    // cycle through the references
    for (i=0; i<references.length; i++) {
        var reference = references[i];
        
        // the reference is to a single, discrete word
        if (!reference.isMultiple) {
            var [poemNumber, lineNumber, wordIndex] = reference["wordSpans"].split(".");
            var wordSpan = getWordSpan(poemNumber, lineNumber, wordIndex);
            $(wordSpan).addClass("quickHighlight")
            continue;
        }
        
        // otherwise the reference is to a series of words
        var [startReference, endReference] = reference["wordSpans"].split("--");
        var [startPoemNumber, startLineNumber, startWordIndex] = startReference.split(".");
        var [endPoemNumber, endLineNumber, endWordIndex] = endReference.split(".");
        var startSpan = getWordSpan(startPoemNumber, startLineNumber, startWordIndex);
        var endSpan = getWordSpan(endPoemNumber, endLineNumber, endWordIndex)

        // the reference is on one line
        if (startLineNumber==endLineNumber) {
            textNodes = getNodesBetween(startSpan[0], endSpan[0])
            $(textNodes).wrapAll("<span class='temporarySpan quickHighlight' />")
            continue;
        }

        // the reference is over multiple lines
        var startLineDiv = $(".l[n='"+startPoemNumber+"."+startLineNumber+"']");
        var startLineLastElem = $(startLineDiv).find(".w:last()");
        var startLineTextNodes = getNodesBetween(startSpan[0], startLineLastElem[0])
        $(startLineTextNodes).wrapAll("<span class='temporarySpan quickHighlight' />")
        
        var endLineDiv = $(".l[n='"+endPoemNumber+"."+endLineNumber+"']");
        var endLineFirstElem = $(endLineDiv).find(".w:first()");
        var endLineTextNodes = getNodesBetween(endLineFirstElem[0], endSpan[0]);
        $(endLineTextNodes).wrapAll("<span class='temporarySpan quickHighlight' />")

        var startLine = parseInt(startLineNumber);
        var endLine = parseInt(endLineNumber);

        while (endLine - startLine > 1) {
            var nextLineDiv = $(startLineDiv).next(".l").not(".undisplayed");
            var nextLineFirstElem = $(nextLineDiv).find(".w:first()");
            var nextLineLastElem = $(nextLineDiv).find(".w:last()");
            var nextLineNodes = getNodesBetween(nextLineFirstElem[0], nextLineLastElem[0]);
            $(nextTextNodes).wrapAll("<span class='temporarySpan quickHighlight' />")
            startLine++;
        }
    }
}

function clearFocus() {
    $(".temporarySpan.quickHighlight").children().unwrap();
    $(".quickHighlight").toggleClass("quickHighlight");
    $(".focus").children().unwrap()
    $(".focus").toggleClass("focus");
}

$(document).ready( async () => {

//  EVENTS

    $(document).on({
        "click": function(event) {
            
            const $target = $(event.target);

            if ($target.hasClass("cardbutton") && $target.hasClass("w3-bar-item")) { // the user has clicked on one of the card's grammar/comment buttons
                updateCardContent($target)
                card = $target.parents(".w3-card-4");
                if (card.hasClass("closed")) {
                    card = $target.parents(".w3-card-4");
                    card.toggleClass("closed");
                    cardContent = card.find(".content");
                    cardContent.toggle();
                }
            }

            else if ($target.hasClass("close")) { // the user has clicked on the close button of a card
                // identify the card in question and delete it before rearranging the position of other cards
                card = $target.parents(".w3-card-4");
                card.remove();
                $(".focus").children().unwrap()
                $(".focus").removeClass("focus");
            }

            else if ($target.hasClass("hide")) { // the user has clicked on the hide button of a card
                // identify the card in question, close it and its content before rearranging the position of other cards
                card = $target.parents(".w3-card-4");
                card.toggleClass("closed");
                cardContent = card.find(".content");
                cardContent.toggle();   
            }

            else if ($target.is("a")) {
                $(".focus").children().unwrap();
                $(".focus").removeClass("focus");
            }

            else { // the user has clicked anywhere else
                // remove focus from the text
                $(".focus").children().unwrap();
                $(".focus").removeClass("focus");
                $(".temporarySpan.quickHighlight").children().unwrap();
                $(".quickHighlight").removeClass("quickHighlight");
            }
        },
    });
});

