// Global variables

// Paths for resources

const lemmatiserPath = "resources/eclogue1LR.xml";
const lexiconPath = "resources/glosses.xml";
const commentaryPath = "resources/commentary.xml";

let lemmatiserXML = null;
let lexiconXML = null;
let commentaryXML = null;

const bookIconPath = "./resources/book.svg";

let bookIconData = null;

async function loadXMLResource(path, parser) {
    try {
        let response = await fetch(path);
        let text = await response.text();
        return parser.parseFromString(text, "application/xml");
    } catch (error) {
        console.log(`Error loading resourice at ${path}: ${error}`);
        return null;
    }
}

async function loadXMLData() {
    let parser = new DOMParser();
    lemmatiserXML = await loadXMLResource(lemmatiserPath, parser);
    lexiconXML = await loadXMLResource(lexiconPath, parser);
    commentaryXML = await loadXMLResource(commentaryPath, parser);

    // The book icon for comments
    let response = await fetch(bookIconPath);
    bookIconData = await response.text();
}

// Sections and their buttons

const sections = document.querySelectorAll(".latin_text");
const nextSectionButton = document.querySelector("#next");
const previousSectionButton = document.querySelector("#previous");

let currentSection = 0;

// The card

const card = document.getElementById("lookup_card");
const card_close = card.querySelector(".close")

const cardTitle = card.querySelector(".title");
const cardContent = card.querySelector("#lookup_card_content");
const cardPrincipalParts = card.querySelector("#principalParts");
const cardGloss = card.querySelector("#gloss");
const cardParsing = card.querySelector("#parsing");
const cardComments = card.querySelector("#comments");

const infoButton = card.querySelector(".button.info");

let currentLemma = "";

//

nextSectionButton.addEventListener("click", () => nextSection() );
previousSectionButton.addEventListener("click", () => previousSection() );

function nextSection() {
    if (currentSection == sections.length - 1) { // there are no sections after this one
        return
    }

    sections[currentSection].classList.toggle("currently_reading");
    currentSection++
    sections[currentSection].classList.toggle("currently_reading");
    
    setSectionNavButtons()
}

function previousSection() {
    if (currentSection == 0) { // there are no sections before this one
        return
    }
    
    sections[currentSection].classList.toggle("currently_reading");
    currentSection--
    sections[currentSection].classList.toggle("currently_reading");

    setSectionNavButtons()
}

function setSectionNavButtons() {
    closeCard()

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
        word.addEventListener("click", () => {
            card.classList.add("invisible");
            clearFocus();
            word.classList.toggle("focus");
            updateCard(word);
            card.classList.remove("closed");
            cardContent.classList.remove("invisible");

            word.scrollIntoView({ 
                behavior: "smooth",
                block: "center",
            });

        })
    });
}

async function spanAllWords() {
    // Wraps a <span> around each word in each verse line, to make it easier to click on the word.

    // This regex splits a line into words, punctuation, and white space; mecum, tecum, secum, nobiscum and vobiscum are split into pronoun and enclitic
    const spanWordsRegex = new RegExp(/([mts]e|[nv]obis)(?=cum)|\p{L}+|[^\p{L}]+/gu);

    const lines = document.querySelectorAll(".line_text");
    lines.forEach(line => {
        const matches = line.textContent.match(spanWordsRegex); 
        let text = "";
        
        // Wrap a <span> around each match which is not a number
        matches.forEach(match => {
            if (/\w+/.test(match)) {
                match = `<span class='w'>${match}</span>`
            }
            text += match;
        });

        // Insert the new spanned word into the line
        line.innerHTML = text;
    });

    // So far the enclitic -que is not separated from the word it is attached to.
    // All instances of -que are retrieved from the lemmatised text, the span which contains that instance is identified and split so as to give que its own span.
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

    return document.querySelectorAll(".w")

}

// Cards

infoButton.addEventListener("click",() => {
    window.location.href = `https://logeion.uchicago.edu/${currentLemma}`
});

function updateCard(word) { // word is an element
    handleFetchStart();
    cardTitle.innerHTML = word.innerHTML;
    loadDetails(word);
}

function loadDetails(wordElement) {
    clearCard();

    const xmlWord = getWordFromXML(lemmatiserXML, wordElement);
    const lemma = loadLemma(xmlWord);
    currentLemma = lemma;
    const parseData = loadParseData(xmlWord);
    const principalPartData = loadPrincipalPartData(lemma, lexiconXML)
    const genderData = loadGenderData(lemma, lexiconXML);
    const glossData = loadGlossData(lemma, lexiconXML);
    const commentaryData = loadCommentaryData(wordElement, commentaryXML);
        
    loadDetailsToCard(parseData, principalPartData, genderData, glossData, commentaryData);
    card.classList.remove("invisible");
    handleFetchEnd();
}

function loadLemma(xmlWord) {
    return xmlWord.attributes.getNamedItem("lemma").nodeValue;
}

function loadParseData(xmlWord) {
    // morpho-syntactic description
    const msd = xmlWord.attributes.getNamedItem("msd").nodeValue;
    const msdText = getParseFromMSD(msd);

    return msdText
}

function loadPrincipalPartData(lemma, lexicon) {
    const entry = lexicon.querySelector(`entry[n='${lemma}']`);
    const pp = entry.querySelector("pp");
    if (pp != null) {1
        return pp.innerHTML;
    }
    return null;
}

function loadGenderData(lemma, lexicon) {
    const entry = lexicon.querySelector(`entry[n='${lemma}']`);
    const gen = entry.querySelector("gen");
    if (gen != null) {1
        return gen.innerHTML;
    }
    return null;
}

function loadGlossData(lemma, lexicon) {
    const entry = lexicon.querySelector(`entry[n='${lemma}']`);
    return entry.querySelector("gloss").innerHTML;
}

/**
 * Retrieves the comment entry elements for a given HTML word element.
 * @param {HTMLElement} wordElement
 * @param {Element}
 * @returns {Element[]}
 */
function loadCommentaryData(wordElement, commentary) {

    const index = getIndex(wordElement);
    const entries  = commentary.getElementsByTagName("entry");

    const matchingEntries = [];

    for (const entry of entries) {
        const references = entry.getElementsByTagName("references")[0].innerHTML
        if (isReferenced(index, references)) {
            matchingEntries.push(entry)
        }
    }
    return matchingEntries
}

function isReferenced(index, references) {
    // references may be "1.2.3, 1.2.4, 1.3.5--1.4.2, 1.2, 1.3--1.4"
    const references_indexes = references.split(", ")

    for (reference_index of references_indexes) {
        if (index === reference_index) {
            return true
        }

        const index_range = reference_index.split("--")
        if (index_range.length === 2 && indexWithinRange(index, index_range[0], index_range[1])) {
            return true
        }
    }

    return false
}

function indexWithinRange(index, lowBound, highBound) {
    // e.g. 1.2.3, 1.2.1, 1.2.4 -> true
    // e.g. 1.2.3, 1.2.4, 1.2.5 -> false
    // highBound must be larger than lowBound
    if (!isLargerOrEqual(lowBound, index)) {
        return false
    }

    if (!isLargerOrEqual(index, highBound)) {
        return false
    }

    return true

    }

function isLargerOrEqual(low, high) {
    const low_split = low.split(".")
    const high_split = high.split(".")

    for (i = 0; i < 3; i++) {
        low_split[i] = Number(low_split[i])
        high_split[i] = Number(high_split[i])
        if (low_split[i] != high_split[i]) {
            return low_split[i] < high_split[i]
        }
    }

    return true
}

function loadDetailsToCard(parseData, principalPartData, genderData, glossData, commentaryData) {
    let principalPartsSpan = null;

    if (principalPartData != null) {
        principalPartsSpan = document.createElement("span");
        principalPartsSpan.classList.add("lt");
        principalPartsSpan.innerHTML = principalPartData;
        cardPrincipalParts.appendChild(principalPartsSpan);
    }
    
    if (genderData != null) {
        if (principalPartsSpan != null) {
            principalPartsSpan.insertAdjacentHTML("afterend",` ${genderData}`);
        }
        else {
            cardPrincipalParts.innerHTML = genderData;
        }
    }

    if (glossData != null) {
        cardGloss.innerHTML = glossData;
    }

    if (parseData != null) { 
        cardParsing.innerHTML = parseData;   
    }

    if (commentaryData != null) {
        commentaryData.forEach(entry => {   
            
            // Create new element
            const commentaryElement = document.createElement("div");
            commentaryElement.classList.add("comment");

            // Create SVG element
            const SVGContainer = document.createElement("span");
            SVGContainer.classList.add("bookIcon");
            SVGContainer.innerHTML = bookIconData;

            // Create the text element
            let newPara = document.createElement("p");
            let lineReference = document.createElement("span");
            lineReference.innerHTML = getLinesFrom(entry.querySelector("references").innerHTML) + " ";
            let quotationText = document.createElement("span");
            quotationText.classList.add("lt");
            try {
                quotationText.innerHTML = entry.querySelector("text").innerHTML + ": ";
            } catch (error) {
                console.log(`Error: ${error}`);
            }

            commentText = document.createElement("span");
            commentText.classList.add("commentText");
            commentText.innerHTML = entry.querySelector("comment").innerHTML;

            // Insert the new elements
            commentaryElement.append(SVGContainer);
            newPara.appendChild(lineReference);
            newPara.appendChild(quotationText);
            newPara.appendChild(commentText);
            commentaryElement.append(newPara);
            cardComments.append(commentaryElement);
        });
    }
}

function clearCard() {

    cardComments.querySelectorAll("div.comment").forEach(element => {
        element.remove()
    })

    principalParts.innerHTML = "";
    gloss.innerHTML = "";
    parsing.innerHTML = "";
}

card_close.addEventListener("click", () => closeCard())

function closeCard() {
    card.classList.add("invisible");
}

//  FUNCTIONS

// Section navigation

function revealNthLineNumbers(n) {
    const lineNumbers = document.querySelectorAll(".line_number");
    lineNumbers.forEach((lineNumber, index) => {
        if ((index + 1) % n == 0) {
            lineNumber.style.visibility = "visible";
        }
    });
}

function getIndex(elem) {
    var closestLine = $(elem).closest(".l");        
    var lineNumber = $(closestLine).attr("n");
    var wordsInLine = $(closestLine).find(".w");
    var wordIndex = $(wordsInLine).index(elem) + 1; // index string is human readable => not zero indexed

    return lineNumber + "." + wordIndex;
}

function getWordFromXML(xml, elem) {
    var index = getIndex(elem);
    var [poemNumber, lineNumber, wordIndex] = index.split(".")
    var wordElements = $(xml).find(`w[n='${poemNumber}.${lineNumber}']`);
    var word = wordElements[wordIndex - 1]; // -1 for zero indexing
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
    return null;
}

function clearFocus() {
    $(".temporarySpan.quickHighlight").children().unwrap();
    $(".quickHighlight").toggleClass("quickHighlight");
    $(".focus").children().unwrap()
    $(".focus").toggleClass("focus");
}

function refer(arg) {
    console.log("refer:" + arg)
}

function getLinesFrom(references) {
    let result = "";
    let lineNumbers = new Set();
    references = references.split(", ");
    references.forEach((reference) => {
        reference = reference.split("--");
        reference.forEach((point) => {
            let lineNumber = point.split(".")[1];
            lineNumbers.add(lineNumber);
        });
    });
    result = [... lineNumbers].sort((a, b) => a - b).join("-");
    return result;
}

//


window.addEventListener("load", async () => {
    await loadXMLData();
    await setSectionNavButtons();    
    await revealNthLineNumbers(5);
    await makeWordsClickable();
});