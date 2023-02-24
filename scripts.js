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

    function addNoteClasses() {
        $.when($.get("resources/commentarynotes.xml")).done(function(xml) {
            $(xml).find("entry").each(function() {
                var references = $(this).find("references").html().split(", ");
                var id = $(this).attr("id");
                var noteClass = "comment" + id;

                for (let i=0; i<references.length; i++) {
                    let [poem, line, word] = references[i].split(".");
                    var lineEl = $(".l[n='"+poem+"."+line+"']");
                    var wordsInLine = $(lineEl).find(".w");

                    if (word.indexOf("--")>=0) {
                        let [w1, w2] = word.split("--");
                        var startWord = wordsInLine[w1-1];
                        var endWord = wordsInLine[w2-1];
                        $(startWord).addClass(noteClass+" comment");
                        $(endWord).addClass(noteClass+" comment");
                        var wordEls = $(startWord).nextUntil("."+noteClass);
                        for (let j=0; j<wordEls.length; j++) {
                            $(wordEls[j]).addClass(noteClass+" comment");
                        }
                    }
                    else {
                        var wordEl = wordsInLine[word-1];
                        $(wordEl).addClass(noteClass+" comment");
                    }
                }
            });
        }); 
    }

    function getNodesBetween(startNode, endNode) { // Currently not used, but possibly of use to highlight whole phrases, not just words
        var nodes = [];
        var node = startNode;
        while (node && node !== endNode) {
            nodes.push(node);
            node = node.nextSibling;
        }
        if (node == endNode) {
            nodes.push(node);
        }
        return nodes;
    }

    function addLineNumbers() {
        $(".l").each(function(){
            var rawLineNum = $(this).attr("n");
            var lineNum = rawLineNum.substring(1+rawLineNum.indexOf("."));
            console.log(lineNum);
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
                    parseText += msdDict["gend"].slice(0,1) + ". ";
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

    function getLookupInfo(elem, mode, card) {
        if (mode=="w") {
            card.find("#lookup_header").html(elem.text());

            $.when($.get("resources/eclogue1LR.xml"), $.get("resources/glosses.xml")).done(function(xml1, xml2) {
                var word = getWordFromXML(xml1, elem);
                var lemma = word.attributes.getNamedItem("lemma").nodeValue;
                var entry = $(xml2).find("entry[n='"+lemma+"']");
    
                if (entry.find("pp").length) {
                    var principalParts = $(entry).find("pp").html();
    
                    if ($(entry).find("gen").length) {
                        var gen = $(entry).find("gen").html();
                        var ppHTML = "<li class='lt'>" + principalParts + ", " + gen + "</li>";
                    }
                    else {
                        var ppHTML = "<li class='lt'>" + principalParts + "</li>";
                    }
                    $(card).find(".lookupList").append(ppHTML);
                }
    
                var gloss = $(entry).find("gloss").html();
                var glossHTML = "<li>" + gloss + "</li>";
                $(card).find(".lookupList").append(glossHTML);
            
                var msd = word.attributes.getNamedItem("msd").nodeValue;
                var msdText = getParseFromMSD(msd);
    
                if (msdText) {
                    var parseHTML = "<li>" + msdText + "</li>"
                    $(card).find(".lookupList").append(parseHTML);
                }

                setCardPosition();

            });

        } else if (mode="c") {
            
            $.when($.get("resources/commentarynotes.xml")).done(function(xml) {
                
                var elClasses = elem.attr("class");
                var commentClass = elClasses.match(/comment\d+/)[0];
                
                var id = commentClass.substring(7);
                var commentEntry = $(xml).find('entry[id="'+id+'"]')
                var comment = commentEntry.find("comment").html();
                card.find("#lookup_header").html(commentEntry.find("text")[0]);

                var references = commentEntry.find("references").html().split(", ");
                for (let i=0; i<references.length; i++) {
                    let [poem, line, word] = references[i].split(".");
                    var lineEl = $(".l[n='"+poem+"."+line+"']");
                    var wordsInLine = $(lineEl).find(".w");

                    if (word.indexOf("--")>=0) {
                        let [w1, w2] = word.split("--");
                        var startWord = wordsInLine[w1-1];
                        var endWord = wordsInLine[w2-1];
                        var nodes = getNodesBetween(startWord, endWord);
                        $(nodes).wrapAll("<span class='focus'></span>");
                    }
                    else {
                        var wordEl = wordsInLine[word-1];
                        $(wordEl).addClass("focus");
                    }
                    }
                // $("#reading").find(".comment"+id).each(function() {
                //     $(this).addClass("focus");
                // });
                
                $(card).find(".lookupList").append(comment);
            
                setCardPosition();

            });
        }

        card.removeClass("invisible");
    }

    function setCardPosition() {
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

    function displayLookupInfo(elem, mode) {
        var newCardID = cardCounter;
        cardCounter++;

        if (mode=="w") {
            var cardClass = "word";
            var cardID = "card"+newCardID;
            var color = "w3-blue";
        }
        else if (mode=="c") {
            var cardClass = "comment";
            var cardID = "card"+newCardID;
            var color = "w3-red";
        }

        $(".w3-card-4").filter("."+cardClass).remove();

        var newHTML = "\
        <div class='w3-card-4 animate invisible "+cardClass+"' id='"+cardID+"'> \
            <header class='w3-container "+color+"'> \
                <span class='cardbutton close'>&times;</span> \
                <span class='cardbutton hide'>&#8597</span> \
                <h2 id='lookup_header'></h2> \
            </header> \
            <div class='w3-container content'> \
                <ul class='lookupList'></ul> \
            </div> \
        </div>"
        
        $("#lookup").append(newHTML);
        var newCard = $("#"+cardID);

        getLookupInfo(elem, mode, newCard);
    }

//  EVENTS

    spanAllWords(); // Wrap each word in a <span> for ease of reference
    addNoteClasses();
    addLineNumbers();

    var cardCounter = 0; // This is the counter for cards created in the #lookup pane, used in displayLookupInfo()

    $(document).on({
        "click": function(event) {
            $target = $(event.target);
            if (event.ctrlKey && $target.hasClass("comment")) {
                $(".focus").children().unwrap()
                $(".focus").removeClass("focus");
                displayLookupInfo($target, "c");
            }
            else if ($target.hasClass("w")) {
                $(".focus").children().unwrap()
                $(".focus").removeClass("focus");
                $target.addClass("focus");
                displayLookupInfo($target, "w");
            }
            else if ($target.hasClass("close")) {
                card = $target.parents(".w3-card-4");
                card.remove();
                setCardPosition();
            }
            else if ($target.hasClass("hide")) {
                card = $target.parents(".w3-card-4");
                card.toggleClass("closed");
                cardContent = card.find(".content");
                cardContent.toggle();
                setCardPosition();
            }
            else {
                $(".focus").children().unwrap()
                $(".focus").removeClass("focus");
            }
        },
        "keydown": function(event) {
            if (event.ctrlKey) {
                $(".w.comment").addClass("highlight");
            }
        },
        "keyup": function(event) {
            $(".w.comment").removeClass("highlight");
        },
        "hover": function(event) {
            // Write a function to show words in a particular comment when hovering over any of them with the CTRL key depressed
        }
    });
});

