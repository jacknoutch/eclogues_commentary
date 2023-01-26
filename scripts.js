function hideCard() {
    $cardList = $(".w3-card-4").children()[1];
    $($cardList).toggle();
}

function closeCard() {
    $(".w3-card-4").remove();   
}

$(document).ready(function(){

//  FUNCTIONS

    function spanAllWords() {
        // Wrap a <span> around each word in each verse line, to make it easier to click on the word 
        // and look up its details.
        $(".l").each(function(){
            var words = $(this).text().match(/\w+|\s+|[^\s\w]+/g); // Split the line into words, punctuation, and white space
            for (let i = 0; i < words.length; i++) {
                if (/\w+/.test(words[i])) {
                    words[i] = "<span class='w'>" + words[i] + "</span>" // Wrap the words only in span tags
                }
            }
            var text = words.join("");
            $(this).html(text);
        })
    }

    function getWordFromXML(xml, elem) {
        var [lineNumber, wordIndex] = getIndices(elem);
        var wordElements = $(xml).find("w[n='"+lineNumber+"']");
        var word = wordElements[wordIndex];
        return word;
    }

    function openLexiconEntry(elem) {
        // Currently: get the lemma of the word and open Logeion at the appropriate page.
        var url = "https://logeion.uchicago.edu/"

            $.get("resources/eclogue1LR.xml", function(xml){
                var word = getWordFromXML(xml, elem);
                var lemma = word.attributes.getNamedItem("lemma").nodeValue;
                url += lemma
                window.open(url, '_blank').focus();
            });
    }

    function getPOS(elem) {
        var shortPOS;
        var fullPOS;

        $.get("resources/eclogue1LR.xml", function(xml){
            var word = getWordFromXML(xml, elem);
            shortPOS = word.attributes.getNamedItem("pos").nodeValue;

            switch(shortPOS) {
                case "ADJadv.mul":
                    fullPOS = ""
                    break;
                case "ADJcar":
                    fullPOS = ""
                    break;
                case "ADJqua":
                    fullPOS = ""
                    break;
                case "ADJdis":
                    fullPOS = ""
                    break;
                case "ADJord":
                    fullPOS = ""
                    break;
                case "ADJqua":
                    fullPOS = ""
                    break;
                case "ADV":
                    fullPOS = "Adverb"
                    break;
                case "ADVneg":
                    fullPOS = ""
                    break;
                case "ADVrel":
                    fullPOS = ""
                    break;
                case "CON":
                    fullPOS = "Conjunction"
                    break;
                case "CONcoo":
                    fullPOS = "Coordinating conjunction"
                    break;
                case "CONsub":
                    fullPOS = "Subordinating conjunction"
                    break;
                case "INJ":
                    fullPOS = "Interjection"
                    break;
                case "NOMcom":
                    fullPOS = "Noun"
                    break;
                case "NOMpro":
                    fullPOS = "Proper noun"
                    break;
                case "PRE":
                    fullPOS = "Preposition"
                    break;
                case "PROdem":
                    fullPOS = "Demonstrative pronoun"
                    break;
                case "PROind":
                    fullPOS = ""
                    break;
                case "PROint":
                    fullPOS = ""
                    break;
                case "PROper":
                    fullPOS = "Personal pronoun"
                    break;
                case "PROpos":
                    fullPOS = ""
                    break;
                case "PROpos.ref":
                    fullPOS = ""
                    break;
                case "PROrel":
                    fullPOS = "Relative pronoun"
                    break;
                case "VER":
                    fullPOS = "Verb"
                    break;
                }
            $("#pos").html(fullPOS);
        });
    }

    function getLookupDetails(elem) {
        var $card = $(".w3-card-4");

        $.when($.get("resources/eclogue1LR.xml"), $.get("resources/glosses.xml")).done(function(xml1, xml2) {
                var word = getWordFromXML(xml1, elem);
                var lemma = word.attributes.getNamedItem("lemma").nodeValue;

                var entry = $(xml2).find("entry[n='"+lemma+"']");
                var gloss = $(entry).find("gloss").html();
                var glossHTML = "<li>" + gloss + "</li>";
                $("#lookup_list").append(glossHTML);

                var principalParts = $(entry).find("pp").html();
                
                var gend = $(entry).find("gend").html();
                var ppHTML = "<li>" + principalParts + ", " + gend + ".</li>"; // BUG: not every word has a gender
                $("#lookup_list").append(ppHTML);

                var msd = word.attributes.getNamedItem("msd").nodeValue;
                var msdList = msd.split("|");
                var msdText = msdList.join(", ");
                var parseHTML = "<li>" + msdText + "</li>"
                $("#lookup_list").append(parseHTML);

                windowWidth = checkWidth();

                if (windowWidth=="l") {
                    focusOffset = $(".focus").offset();
                    focusOffsetTop = focusOffset["top"];

                    cardMiddle = $card.height() / 2;

                    $(".w3-card-4").parent().css({position: 'relative'});
                    $(".w3-card-4").css({top: focusOffsetTop - cardMiddle, left: 0, position:'absolute'});
                }
            });
    }

    function checkWidth() {
        var windowsize = $(window).width();
        if (windowsize < 601) {
            return "s";
        }
        else if (windowsize < 923) {
            return "m";
        }
        else {
            return "l";
        }
    }

    function getAgreement(elem) {
        console.log("getAgreement - Coming soon!");
        return;
    }

    function getIndices(elem) {
        var closestLine = $(elem).closest(".l");
        var lineNumber = $(closestLine).attr("n");
        var wordIndex = $(elem).index();
        return [lineNumber, wordIndex];
    }

    function emptyReadingAids() {
        $("#pp").empty();
        $("#pos").empty();
        $("#gloss").empty();
        $("#parse").empty();
    }

    function display_lookup_information(word_elem) {
        $("#lookup").empty();

        var newHTML = "\
        <div class='w3-card-4 animate'> \
            <header class='w3-container w3-blue'> \
                <span onclick='hideCard()' class='w3-hidebtn'>&#8597</span> \
                <span onclick='closeCard()' class='w3-closebtn'>&times;</span> \
                <h2 id='lookup_header'></h2> \
            </header> \
            <div class='w3-container'> \
                <ul id='lookup_list'></ul> \
            </div> \
        </div>"
        
        $("#lookup").html(newHTML);
        $("#lookup_header").html(word_elem.text());

        getLookupDetails(word_elem);
    }

//  EVENTS

    spanAllWords(); // Wrap each word in a <span> for ease of reference

    /*
    There are several actions a user can decide to do...
    1. Focus on a word (LMB click)
    2. Gloss for a word (2nd LMB click)
    3. Parsing information for a word (CTRL + LMB click)
    4. Syntax/agreement with a word (SHIFT + LMB click)
    5. Lexicon entry for a word (CTRL + SHIFT + LMB click)
    6. Commentary notes (ALT + LMB click)
    */

    $(".l").hover(function() {
        
        if (window.event.altKey) { // Cursor is hovering over a line and user is pressing the ALT key
            $(this).css("background-color", "yellow");
        }}, function() {
            $(this).css("background-color", "transparent");
        }
    );

    $(".w").click(function() {

        $( ".w" ).removeClass("focus");
        $(this).addClass("focus");
        display_lookup_information($(this));

    });

    $(".w3-closebtn").click(function() { // Why isn't this working?

        alert("hello");

    });

    $(window).keydown(function(event) {
        if (event.ctrlKey) { // User is pressing CTRL
            $("#posButton").addClass("buttonReady");
        }
        else if (window.event.shiftKey) { // User is pressing SHIFT
            $("#ppButton").addClass("buttonReady");
        }
        else { // User is not pressing CTRL or SHIFT
            // Do some stuff
        }
    });

    $(window).keyup(function(event) {
        $("#posButton").removeClass("buttonReady");
        $("#ppButton").removeClass("buttonReady");
    });

    $(document).click(function(event) {
    // Remove the focus class if user clicks somewhere other than on a word 
        if (!$(event.target).is(".w") && !$(event.target).is("button")) {
            $( ".w" ).removeClass("focus");
            $( ".w" ).removeClass("select");
            emptyReadingAids();
        }
    });
});

