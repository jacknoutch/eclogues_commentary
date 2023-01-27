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
        });
    }

    function addLineNumbers() {
        $(".l").each(function(){
            var line_num = $(this).attr("n");
            $(this).prepend("<span class=relative><span class=verse_ref>"+line_num+"</span></span>")
            
            var line_num_int = parseInt(line_num.slice(2)) /* Make every 5th line number visible. */
            if (line_num_int % 5 == 0) {
                var v_ref = $(this).find(".verse_ref");
                v_ref.css("visibility", "visible");
            }
        });
    }

    function getIndices(elem) {
        var closestLine = $(elem).closest(".l");
        var lineNumber = $(closestLine).attr("n");
        var wordIndex = $(elem).index() - 1; /* Minus one to account for the line number <span> in each .l div */
        return [lineNumber, wordIndex];
    }

    function getWordFromXML(xml, elem) {
        var [lineNumber, wordIndex] = getIndices(elem);
        var wordElements = $(xml).find("w[n='"+lineNumber+"']");
        var word = wordElements[wordIndex];
        return word;
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

    function getParseFromMSD(msd) {
        if (msd!="MORPH=empty") {
            var msdList = msd.toLowerCase().split("|");
            var msdDict = {};
            for (let i=0; i<msdList.length; i++) {
                var msdDouble = msdList[i].split("=");
                msdDict[msdDouble[0]] = msdDouble[1];
            }
            var parseText = "";
            
            if (msdDict["morph"]) {
                return false;
            }

            if (msdDict["case"]) {
                parseText += msdDict["case"] + ". ";
            }

            if (msdDict["person"]) {
                parseText += msdDict["person"] + ". ";
            }

            if (msdDict["numb"]) {
                parseText += msdDict["numb"] + ". ";
            }

            if (msdDict["gen"]) {
                parseText += msdDict["gen"] + ". ";
            }

            if (msdDict["deg"]) {
                parseText += msdDict["deg"] + ". ";
            }
            
            if (msdDict["mood"]) {
                parseText += msdDict["mood"] + ". ";
            }

            if (msdDict["tense"]) {
                parseText += msdDict["tense"] + ". ";
            }

            if (msdDict["voice"]) {
                parseText += msdDict["voice"] + ". ";
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

    function getLookupDetails(elem) {
        var $card = $(".w3-card-4");

        $.when($.get("resources/eclogue1LR.xml"), $.get("resources/glosses.xml")).done(function(xml1, xml2) {
                var word = getWordFromXML(xml1, elem);
                var lemma = word.attributes.getNamedItem("lemma").nodeValue;
                var entry = $(xml2).find("entry[n='"+lemma+"']");

                if (entry.find("pp").length) {
                        var principalParts = $(entry).find("pp").html();

                    if ($(entry).find("gen").length) {
                        var gen = $(entry).find("gen").html();
                        var ppHTML = "<li class='lt'>" + principalParts + ", " + gen + ".</li>";
                    }
                    else {
                        var ppHTML = "<li class='lt'>" + principalParts + "</li>";
                    }
                    $("#lookup_list").append(ppHTML);
                }

                var gloss = $(entry).find("gloss").html();
                var glossHTML = "<li id=''>" + gloss + "</li>";
                $("#lookup_list").append(glossHTML);
            
                var msd = word.attributes.getNamedItem("msd").nodeValue;
                var msdText = getParseFromMSD(msd);
                if (msdText) {
                    var parseHTML = "<li>" + msdText + "</li>"
                    $("#lookup_list").append(parseHTML);
                }
                
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

    function display_lookup_information(word_elem) {
        $("#lookup").empty();

        var newHTML = "\
        <div class='w3-card-4 animate'> \
            <header class='w3-container w3-blue'> \
                <span class='cardbutton close'>&times;</span> \
                <span class='cardbutton hide'>&#8597</span> \
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

    addLineNumbers();

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

    $("#lookup").on("click", ".hide", function() {
        $cardList = $(".w3-card-4").children()[1];
        $($cardList).toggle();
    });

    $("#lookup").on("click", ".close", function() {
        $(".w3-card-4").remove();
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
        }
    });
});

