$(document).ready(function(){

//  FUNCTIONS

    function spanAllWords() {
        // Wrap a <span> around each word in each verse line, to make it easier to click on the word 
        // and look up its details.
        $(".l").each(function(){
            var words = $(this).text().split( /\s+/ );
            var text = words.join( "</span> <span class='w'>" );
            $(this).html( "<span class='w'>" + text + "</span>" );
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
                    fullPOS = "Common noun"
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

    function getPrincipalParts(elem) {
        $.get("resources/eclogue1LR.xml", function(xml){
            var word = getWordFromXML(xml, elem);
            var lemma = word.attributes.getNamedItem("lemma").nodeValue;

            $.get("glosses.xml", function(xml){
                var entry = $(xml).find("entry[n='"+lemma+"']");
                var principalParts = $(entry).find("pp").text();
                var gend = $(entry).find("gend").text();
                var ppGenderText = principalParts + ", " + gend + ".";
                $("#pp").html(ppGenderText);
            });
        });
    }

    function parse(elem) {
        $.get("resources/eclogue1LR.xml", function(xml){
            var word = getWordFromXML(xml, elem);
            var msd = word.attributes.getNamedItem("msd").nodeValue;
            var msdList = msd.split("|");
            var newText = msdList.join("\n");
            $("#parse").html(newText);
        });
    }

    function getGloss(elem) {
        var lemma;
        $.get("resources/eclogue1LR.xml", function(xml){
            var word = getWordFromXML(xml, elem);
            lemma = word.attributes.getNamedItem("lemma").nodeValue;
            
            $.get("glosses.xml", function(xml){
                entry = $(xml).find("entry[n='"+lemma+"']");
                gloss = $(entry).find("gloss").text();
                $("#gloss").html(gloss);
            })
        })
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
        });

    $( ".w" ).click(function() {

        if (!$(".select")[0]) { // the select class does not exist, i.e. a word is not selected
            $( this ).addClass("select");
            emptyReadingAids()
        }

        else if ($(this).hasClass("select")) {
            getGloss($(this));
        }

        else if (!$(this).hasClass("select")) { // a different word is currently selected
            $( ".w" ).removeClass("select");
            $( this ).addClass("select");
            emptyReadingAids()
        }

        if (window.event.ctrlKey && window.event.shiftKey) { // User is pressing CTRL & SHIFT
            openLexiconEntry($(this));
        }
        else if (window.event.ctrlKey) { // User is pressing CTRL
            getPOS($(this));
        }
        else if (window.event.shiftKey) { // User is pressing SHIFT
            getPrincipalParts($(this));
        }
        else { // User is not pressing CTRL or SHIFT
                
        }
    });

    $("#glossButton").click(function() {
        
        if (!$(".select")[0]) { // if the select class does not exist, i.e. a word has not been selected
            return;
        }

        getGloss($(".select"))
        return;

    });

    $("#ppButton").click(function() {
        if (!$(".select")[0]) { // if the select class does not exist, i.e. a word has not been selected
            console.log("running");
            return;
        }

        getPrincipalParts($(".select"))
        return;
    });

    $("#posButton").click(function() {
        if (!$(".select")[0]) { // if the select class does not exist, i.e. a word has not been selected
            console.log("running");
            return;
        }

        getPOS($(".select"))
        return;
    });

    $("#parseButton").click(function() {
        if (!$(".select")[0]) { // if the select class does not exist, i.e. a word has not been selected
            console.log("running");
            return;
        }

        parse($(".select"))
        return;
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
    // Remove the select class if user clicks somewhere other than on a word 
        if (!$(event.target).is(".w") && !$(event.target).is("button")) {
            $( ".w" ).removeClass("select");
        }
    });
});

