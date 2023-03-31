var lemmatiserPath = "resources/eclogue1LR.xml";
var lexiconPath = "resources/glosses.xml";
var commentaryPath = "resources/commentarynotes.xml";

var cardCounter = 0; // This is the counter for cards created in the #lookup pane, used in makeCard()

//  FUNCTIONS

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
    var wordIndex = String(parseInt(wordIndex)+1);
    var lineDiv = $(".l[n='"+ poemNumber + "." + lineNumber + "']");
    var wordSpan = $(lineDiv).children(".w:nth-of-type("+wordIndex+")")
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

function spanAllWords() {
    // Wrap a <span> around each word in each verse line, to make it easier to click on the word 
    // and look up its details.
    // var oldRe = new RegExp(/\p{L}+|[^\p{L}]+/gu);
    var re = new RegExp(/(?<=([mts]e|[nv]obis))cum|([mts]e|[nv]obis)(?=cum)|\p{L}+|[^\p{L}]+/gu);

    $.when($.get(lemmatiserPath)).done(function(xml){
        $(".l").each(function(){
            var words = $(this).text().match(re); // Split the line into words, punctuation, and white space
            // console.log($(this))
            console.log(words);
            for (let i = 0; i < words.length; i++) {
                if (/\w+/.test(words[i])) {
                    words[i] = "<span class='w'>" + words[i] + "</span>" // Wrap the words only in span tags
                }
            }
            var text = words.join("");
            $(this).html(text);
        });

        queInstances = $(xml).find("[lemma=que]")
        queInstances.each(function() {
            lineNumber = $(this).attr("n") // e.g. "1.2"
            queIndex = $(this).index()
            lineDiv = $(".l[n='"+lineNumber+"']")
            spanWithQue = $(lineDiv).find(".w:nth-child("+queIndex+")");
            oldHTML = spanWithQue.html();
            newHTML = "<span class='w'>" + oldHTML.slice(0,-3) + "</span><span class='w'>que"
            spanWithQue.replaceWith(newHTML);
        })

        addLineNumbers() // required here since there is an ajax call on which it is dependent
    });
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

function populateCard($elem, $card) {

    // populate the header of the card with the word-form as it is in the text
    $card.find("h2").html($elem.text());

    // call the XML docs
    $.when(
        $.get(lemmatiserPath),
        $.get(lexiconPath),
        $.get(commentaryPath),
    ).done(function(lemmatiserXML, lexiconXML, commentaryXML) {

        // from the lemmatiser get the word's XML object, its lemma
        var word = getWordFromXML(lemmatiserXML, $elem);
        var lemma = word.attributes.getNamedItem("lemma").nodeValue;
        
        // from the lexicon get the lemma's XML object
        var entry = $(lexiconXML).find("entry[n='"+lemma+"']");

        // the principal parts
        if (entry.find("pp").length) { // if they exist
            var principalParts = $(entry).find("pp").html();
            
            // if word has a gender, include it in the principal parts displayed
            if ($(entry).find("gen").length) { 
                var gender = $(entry).find("gen").html();
                principalParts += ", " + gender
            }

            // the html to display
            var principalPartsHTML = "<li class='lt'>" + principalParts + "</li>";

            // display in the card's content list
            $card.find(".grammar > ul").append(principalPartsHTML);
        }

        // the gloss
        var gloss = $(entry).find("gloss").html(); // html to allow markup in the lexicon
        
        // the html to display
        var glossHTML = "<li>" + gloss + "</li>";

        // display in the card's content list
        $card.find(".grammar > ul").append(glossHTML);
    
        // the morphosyntactic description (msd)
        var msd = word.attributes.getNamedItem("msd").nodeValue; // from the lemmatiser's XML object
        var msdText = getParseFromMSD(msd); // the information is acronymic and must be expanded

        if (msdText) { // the word has msd
            // the html to display
            var parseHTML = "<li>" + msdText + "</li>";
            
            // display in the card's content list  
            $card.find(".grammar > ul").append(parseHTML);
        }

        // get all the comments which include this word
        // make a list of what will be the relevant comments
        relevantComments = []
        
        // determine the word's reference as a string for comparison
        var [lineNumber, wordIndex] = getIndices($elem); // e.g. ["1,2", "3"]
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
            $cardBar = $card.find(".w3-bar")

            // if there are comments, then add a button first to allow users to return to the grammar notes
            if (i==0){
                $cardBar.append("<a href='javascript:void(0)' class='cardbutton w3-bar-item w3-button w3-hover-white'>Grammar</a>")
            }

            // add a button to the card bar
            commentButtonHTML = "<a href='javascript:void(0)' class='cardbutton w3-bar-item w3-button w3-hover-white'>"+String(i+1)+"</a>";
            $cardBar.append(commentButtonHTML);

            // add an invisible div with the comment
            commentHMTL = "<ul class='comment invisible'><li>"+comment+"</li></ul>";
            $card.find(".content").append(commentHMTL);
        }

        updateCardPositions();

        $card.removeClass("invisible");
    });
}

function updateCardPositions() {
    cards = $("#lookup").find(".w3-card-4");

    if (cards.length) {
        var heightAllCards = 0;
        $(".w3-card-4").each(function() {
            var cardTop = heightAllCards;
            $(this).css({"top": cardTop+16});
            heightAllCards += $(this).outerHeight(true);
        })
    }

    $("w3-card-4").each(function() {
        $(this).removeClass("invisible");
    })
}

function makeCard($elem) {
    
    // get a unique id for the card and increment the counter
    var newCardID = cardCounter;
    cardCounter++;

    // set the card class, id and colo(u)r
    var cardClass = "word";
    var cardID = "card"+newCardID;
    var color = "w3-blue";

    // remove any existing card of the same class
    $(".w3-card-4").filter("."+cardClass).remove();

    // the html of the card without content
    var newHTML = "\
    <div class='w3-card-4 animate invisible "+cardClass+"' id='"+cardID+"'> \
        <header class='w3-container "+color+"'> \
            <span class='cardbutton close'>&times;</span> \
            <span class='cardbutton hide'>&#8597</span> \
            <h2></h2> \
        </header> \
        <div class='w3-bar "+color+"'></div> \
        <div class='w3-container content'> \
            <div class='grammar'> \
                <ul></ul> \
            </div> \
        </div> \
    </div>"
    
    // insert the html into the page
    $("#lookup").append(newHTML);
    var $card = $("#"+cardID);

    // populate the card with the element's information
    populateCard($elem, $card);
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
            $(wordSpan).animate({
                backgroundColor: "yellow",
                
            }, 500, function() {
                $(this).animate({
                    backgroundColor: "none",
                }, 500)
            })
            return;
        }
        
        // otherwise the reference is to a series of words
        var [startReference, endReference] = reference["wordSpans"].split("--");
        var [startPoemNumber, startLineNumber, startWordIndex] = startReference.split(".");
        var [endPoemNumber, endLineNumber, endWordIndex] = endReference.split(".");
        var startSpan = getWordSpan(startPoemNumber, startLineNumber, startWordIndex);
        var endSpan = getWordSpan(endPoemNumber, endLineNumber, endWordIndex)

        // the reference may cross over into more than one
        if (startLineNumber!=endLineNumber) {

            var startLineDiv = $(".l[n='"+startPoemNumber+"."+startLineNumber+"']");
            var startLineLastElem = $(startLineDiv).find(".w:last()");
            var startLineTextNodes = getNodesBetween(startSpan[0], startLineLastElem[0])
            
            var endLineDiv = $(".l[n='"+endPoemNumber+"."+endLineNumber+"']");
            var endLineFirstElem = $(endLineDiv).find(".w:first()");
            var endLineTextNodes = getNodesBetween(endLineFirstElem[0], endSpan[0]);

            var startLine = parseInt(startLineNumber);
            var endLine = parseInt(endLineNumber);

            $(startLineTextNodes).wrapAll("<span class='quickHighlight' />");
            $(endLineTextNodes).wrapAll("<span class='quickHighlight' />");

            while (endLine - startLine > 1) {
                var nextLineDiv = $(startLineDiv).next(".l").not(".undisplayed");
                var nextLineFirstElem = $(nextLineDiv).find(".w:first()");
                var nextLineLastElem = $(nextLineDiv).find(".w:last()");
                var nextLineNodes = getNodesBetween(nextLineFirstElem[0], nextLineLastElem[0]);
                $(nextLineNodes).wrapAll("<span class='quickHighlight' />");
                startLine++;
            }

            $(".quickHighlight").animate({
                backgroundColor: "yellow",
                    
                }, 500, function() {
                    $(this).animate({
                        backgroundColor: "none",
                    }, 500, function () {
                        $(".quickHighlight").children().unwrap();
                        return
                    })
                }
            )
        }
        
        // for references that are within a single line but cover a series of words
        var textNodes = getNodesBetween(startSpan[0], endSpan[0])

        $(textNodes).wrapAll("<span class='quickHighlight' />")

        $(".quickHighlight").animate({
                backgroundColor: "yellow",
                
            }, 500, function() {
                $(this).animate({
                    backgroundColor: "none",
                }, 500, function () {
                    return $(textNodes).unwrap()
                })
        })
    }
}

$(document).ready(function(){

    var $loading = $("#loading");

    $(document).ajaxStart(function () {
        $loading.removeClass("invisible");
        $('body').css('cursor', 'progress');
    })
    $(document).ajaxStop(function () {
        $loading.addClass("invisible");
        $('body').css('cursor', 'default');
    });

//  EVENTS

    spanAllWords(); // Wrap each word in a <span> for ease of reference

    $(document).on({
        "click": function(event) {
            $target = $(event.target);
            if ($target.hasClass("w")) { // the user has clicked on a word
                // remove focus from all other words, focus on this one, and then get its information
                $(".focus").children().unwrap()
                $(".focus").removeClass("focus");
                $target.addClass("focus");
                makeCard($target);
            }
            else if ($target.hasClass("cardbutton") && $target.hasClass("w3-bar-item")) { // the user has clicked on one of the card's grammar/comment buttons
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
                updateCardPositions();
                $(".focus").children().unwrap()
                $(".focus").removeClass("focus");
            }
            else if ($target.hasClass("hide")) { // the user has clicked on the hide button of a card
                // identify the card in question, close it and its content before rearranging the position of other cards
                card = $target.parents(".w3-card-4");
                card.toggleClass("closed");
                cardContent = card.find(".content");
                cardContent.toggle();   
                updateCardPositions();
            }
            else { // the user has clicked anywhere else
                // remove focus from the text
                $(".focus").children().unwrap()
                $(".focus").removeClass("focus");
            }
        },
    });
});

