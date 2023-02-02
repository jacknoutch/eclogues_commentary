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

    function getNodesBetween(startNode, endNode) {
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
  
    function spanNotes() {
        $.when($.get("resources/commentarynotes.xml")).done(function(xml) {  
            $(xml).find("entry").each(function() {
                var references = $(this).find("references").html().split(", ");
                var id = $(this).attr("id");
                
                for (let i=0; i<references.length; i++) {                    
                    let [p, l, w] = references[i].split(".");
                    var lineEl = $(".l[n='"+p+"."+l+"']");
                    var wordsInLine = $(lineEl).find(".w");
                    
                    if (w.indexOf("--")>=0) {
                        let [w1, w2] = w.split("--");
                        var nodes = getNodesBetween(wordsInLine[w1-1], wordsInLine[w2-1]);
                        $(nodes).wrapAll("<span class='comment comment" + id + "'></span>")
                    }
                    else {
                        $(wordsInLine[w-1]).wrap("<span class='comment comment" + id + "'></span>")
                    }
                }                
            });
        });
    }

    function addLineNumbers() {
        $(".l").each(function(){
            var line_num = $(this).attr("n");
            /* The empty relative span is required to offset the line numbers correctly. */
            $(this).prepend("<span class=relative><span class=verse_ref>"+line_num+"</span></span>")
            
            /* Make every 5th line number visible. */
            var line_num_int = parseInt(line_num.slice(2))
            if (line_num_int % 5 == 0) { 
                var v_ref = $(this).find(".verse_ref");
                v_ref.css("visibility", "visible");
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
                    $(card).find("#lookup_list").append(ppHTML);
                }
    
                var gloss = $(entry).find("gloss").html();
                var glossHTML = "<li>" + gloss + "</li>";
                $(card).find("#lookup_list").append(glossHTML);
            
                var msd = word.attributes.getNamedItem("msd").nodeValue;
                var msdText = getParseFromMSD(msd);
    
                if (msdText) {
                    var parseHTML = "<li>" + msdText + "</li>"
                    $(card).find("#lookup_list").append(parseHTML);
                }

                setCardPosition();

            });

        } else if (mode="c") {
            $.when($.get("resources/commentarynotes.xml")).done(function(xml) {
                $(".focus").removeClass("focus");
                
                var elClasses = elem.attr("class");
                var commentClass = elClasses.match(/comment\d+/)[0];
                
                var id = commentClass.substring(7);
                var commentEntry = $(xml).find('entry[id="'+id+'"]')
                var comment = commentEntry.find("comment").html();
                
                $("#reading").find(".comment"+id).each(function() {
                    $(this).addClass("focus");
                });
                
                $(card).find("#lookup_list").append(comment);
            
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
        var cards = $("#lookup").find(".w3-card-4");
        var newCardID = cards.length;

        if (mode=="w") {
            var cardClass = "word";
            var cardID = "card"+newCardID;
            var color = "w3-blue";
        }
        else if (mode=="c") {
            var cardClass = "comment";
            var cardID = "card"+newCardID;
            var color = "w3-red"
        }


        var newHTML = "\
        <div class='w3-card-4 animate invisible "+cardClass+"' id='"+cardID+"'> \
            <header class='w3-container "+color+"'> \
                <span class='cardbutton close'>&times;</span> \
                <span class='cardbutton hide'>&#8597</span> \
                <h2 id='lookup_header'></h2> \
            </header> \
            <div class='w3-container'> \
                <ul id='lookup_list'></ul> \
            </div> \
        </div>"
        
        $("#lookup").append(newHTML);
        var newCard = $("#"+cardID);
        newCard.find("#lookup_header").html(elem.text());

        getLookupInfo(elem, mode, newCard);
    }

//  EVENTS

    spanAllWords(); // Wrap each word in a <span> for ease of reference
    spanNotes();
    addLineNumbers();

    $(document).on({
        "click": function(event) {
            $target = $(event.target);
            if (event.ctrlKey && $($target.parents()).hasClass("comment")) {
                var commentElement = $target.parents(".comment");
                displayLookupInfo(commentElement, "c");
            }
            else if ($(event.target).hasClass("w")) {
                $(".focus").removeClass("focus");
                $target.addClass("focus");
                displayLookupInfo($target, "w");
            }
            else {
                $(".focus").removeClass("focus");
            }
        },
        "hover": function(event) {
            // Write a function to show words in a particular comment when hovering over any of them with the CTRL key depressed
        }
    });

    $("#lookup").on("click", function(event) {
        $target = $(event.target);
        if ($target.hasClass("close")) {
            card = $target.parents(".w3-card-4");
            card.remove();
            setCardPosition();
        }
        else if ($target.hasClass("hide")) {
            card = $target.parents(".w3-card-4");
            cardLookupList = card.find("#lookup_list");
            cardLookupList.toggle();
            setCardPosition();
        } 
    });
});

