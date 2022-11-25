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

    function writeParseData(parseData) {
        html = "<span class='latin'>" + parseData[1] + "</span><br/>"
        // var xmlText = parseData.join("<br>")
        document.getElementById("demo").innerHTML = html;
        return;
    }

    function openLexiconEntry(lineNumber, wordIndex) {
        // Currently: get the lemma of the word and open Logeion at the appropriate page.
        var url = "https://logeion.uchicago.edu/"

            $.get("ecl1_lascivaroma2.xml", function(xml){ 
                var wordElements = $(xml).find("w[n='"+lineNumber+"']");
                var word = wordElements[wordIndex];
                var lemma = word.attributes.getNamedItem("lemma").nodeValue;
                url += lemma
                window.open(url, '_blank').focus();
            });
    }

    function getParseData(lineNumber, wordIndex) {
        var parseData = [];

        $.get("ecl1_lascivaroma2.xml", function(xml){ 
            var wordElements = $(xml).find("w[n='"+lineNumber+"']");
            var word = wordElements[wordIndex];

            parseData.push(word.childNodes[0].nodeValue); // wordform
            parseData.push(word.attributes.getNamedItem("lemma").nodeValue);
            parseData.push(word.attributes.getNamedItem("msd").nodeValue);
            parseData.push(word.attributes.getNamedItem("pos").nodeValue);

            writeParseData(parseData);
            return;
        });
    }

    function getGloss(lineNumber, wordIndex) {
        console.log("getGloss - Coming soon!");
        return;
    }

    function getAgreement(lineNumber, wordIndex) {
        console.log("getAgreement - Coming soon!");
        return;
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

    $( "span" ).click(function() {

        var closestLine = $(this).closest(".l");
        var lineNumber = $(closestLine).attr("n");
        var wordIndex = $(this).index();
        console.log(lineNumber, wordIndex);

        if (window.event.ctrlKey && window.event.shiftKey) { // User is pressing CTRL & SHIFT
            openLexiconEntry(lineNumber, wordIndex);
            getParseData(lineNumber, wordIndex);
        }
        else if (window.event.ctrlKey) { // User is pressing CTRL
            getParseData(lineNumber, wordIndex);
        }
        else if (window.event.shiftKey) { // User is pressing SHIFT
            getAgreement(lineNumber, wordIndex);
        }
        else if ( $(this).hasClass("superspecial")){
            // This word is already selected
            getGloss(lineNumber, wordIndex);
        }
        else { // User is not pressing CTRL or SHIFT

        }

        $( "span" ).removeClass("superspecial");
        $( this ).addClass("superspecial");
    });
});
