// Paths for resources

const lemmatiserPath = "resources/eclogue1LR.xml";
const lexiconPath = "resources/glosses.xml";
const commentaryPath = "resources/commentary.xml";

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
        word.addEventListener("click", () => {
            clearFocus();
            word.classList.toggle("focus");
            updateCard(word);
            card.classList.remove("closed");
            cardContent.classList.remove("invisible");
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
const card_hide = card.querySelector(".hide")
const card_close = card.querySelector(".close")

const cardTitle = card.querySelector(".title");
const cardInfo = card.querySelector(".grammar ul");
const cardContent = card.querySelector("#lookup_card_content")

async function updateCard(word) { // word is an element
    cardTitle.innerHTML = word.innerHTML;
    card.classList.remove("invisible");

    const requests = [
        fetch(lemmatiserPath),
        fetch(lexiconPath),
        fetch(commentaryPath)
    ] // TODO: why is this called every time cardUpdate is called?

    Promise.all(requests)
        .then((responses) => Promise.all(responses.map((r) => r.text())))
        .then((results) => loadDetails(word, results))
        .catch((error) => console.error(error)); 

}

function loadDetails(wordElement, xmlFiles) {
    clearCard();

    const parser = new DOMParser();
    const [lemmatiser, lexicon, commentary] = xmlFiles.map(
        (file) => parser.parseFromString(file, "text/xml"));

    const xmlWord = getWordFromXML(lemmatiser, wordElement);
    const lemma = loadLemma(xmlWord);
    const parseData = loadParseData(xmlWord);
    const principalPartData = loadPrincipalPartData(lemma, lexicon)
    const glossData = loadGlossData(lemma, lexicon);
    const commentaryData = loadCommentaryData(wordElement, commentary);
    
    loadDetailsToCard(parseData, principalPartData, glossData, commentaryData);
}

function loadLemma(xmlWord) {
    return xmlWord.attributes.getNamedItem("lemma").nodeValue;
}

function loadParseData(xmlWord) {
    // morpho-syntactic descrition
    const msd = xmlWord.attributes.getNamedItem("msd").nodeValue;
    const msdText = getParseFromMSD(msd);

    return msdText
}

function loadPrincipalPartData(lemma, lexicon) {
    const entry = lexicon.querySelector("entry[n='"+lemma+"']");

    // the principal parts
    let principalParts = entry.querySelector("pp")
    let gender = entry.querySelector("gen");
    if (principalParts != null && gender != null) {
        principalParts = principalParts.innerHTML;
        gender = gender.innerHTML;

        return [principalParts, gender].join(",");
    }
}

function loadGlossData(lemma, lexicon) {
    const entry = lexicon.querySelector("entry[n='"+lemma+"']");
    return entry.querySelector("gloss").innerHTML;
}

function loadCommentaryData(wordElement, commentary) { 
    let indices = getIndices(wordElement);
    console.log(indices)
    const entries  = commentary.getElementsByTagName("entry")
    let data = null
    for (const entry of entries) {
        const references = entry.getElementsByTagName("reference")
        for (reference of references) {
            if (reference.textContent == indices) {
                data = entry.getElementsByTagName("comment")[0].innerHTML
            }
        }
    }
    return data
}

function loadDetailsToCard(parseData, principalPartData, glossData, commentaryData) {
    if (parseData != null) { 
        const parseInfo = document.createElement("li");
        parseInfo.innerHTML = parseData;
        
        cardInfo.append(parseInfo);
    }

    if (principalPartData != null) {
        const principalPartsElement = document.createElement("li");
        principalPartsElement.innerHTML = principalPartData;
    
        cardInfo.append(principalPartsElement);
    }

    if (glossData != null) {
        const glossElement = document.createElement("li");
        glossElement.innerHTML = glossData
    
        cardInfo.append(glossElement);
    }

    if (commentaryData != null) {
        const commentaryElement = document.createElement("li");
        commentaryElement.innerHTML = commentaryData

        cardInfo.append(commentaryElement)
    }
}

function clearCard() {
    cardInfo.replaceChildren();
}

card_hide.addEventListener("click", () => hideCard())
card_close.addEventListener("click", () => closeCard())

function hideCard() {
    card.classList.toggle("closed");
    cardContent.classList.toggle("invisible");
}

function closeCard() {
    card.classList.toggle("invisible");
}

//  FUNCTIONS

// Section navigation

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
    var wordIndex = $(wordsInLine).index(elem) + 1; // index string is human readable => not zero indexed

    return lineNumber + "." + wordIndex;
}

function getWordFromXML(xml, elem) {
    var index = getIndices(elem);
    var [poemNumber, lineNumber, wordIndex] = index.split(".")
    var wordElements = $(xml).find("w[n='"+poemNumber + "." + lineNumber+"']");
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
    return false;
}

function clearFocus() {
    $(".temporarySpan.quickHighlight").children().unwrap();
    $(".quickHighlight").toggleClass("quickHighlight");
    $(".focus").children().unwrap()
    $(".focus").toggleClass("focus");
}