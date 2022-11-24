$(document).ready(function(){

   String.prototype.replaceAt = function(start, end, replacement) {
      return this.substring(0, start) + replacement + this.substring(end, this.length);
   }

   function isLetter(character) {
      return character.length === 1 && character.match(/[a-z]/i);
   }

   function getLineWords(lineText) {
      var words = [];
   
      var i = 0;
      var wordStart = 0;
      var word = "";

      // Now we must find the beginning and end of the word which the user clicked.
      // We cycle through the line, logging each word and counting where each word begins and ends.
      while (i <= lineText.length) {
         if (i == lineText.length) {
            word = lineText.slice(wordStart, i);
            words[words.length] = {
               wordForm: word,
               start: wordStart,
               end: i
            }
         } else if (isLetter(lineText[i])) {
            word += lineText[i];
         } else {
            word = lineText.slice(wordStart, i);
            words[words.length] = {
               wordForm: word,
               start: wordStart,
               end: i
            }
            wordStart = i+1;
         }
         i++;
      }
      return words;
   }

   function getLineIndex(offset, words) {
      // Now we find the index of the word in the line, by finding which word the cursor's offset is within
      wordIndex = 0;
      while (offset >= words[wordIndex].start) {
         word = words[wordIndex];
         if (offset >= word.start && offset <= word.end) {
            break;
         }
         wordIndex++;
      }
      return wordIndex;
   }
   
   function getWordIndex() {
      s = window.getSelection();
      var div = s.anchorNode.parentElement;
      textNodes = []
      nodes = div.childNodes;
      for (let i = 0; i< nodes.length; i++) {
         var node = nodes[i], nodeType = node.nodeType;
         if (nodeType == 3) {
            textNodes.push(node);
         }
         else if (nodeType == 1 || nodeType == 9 || nodeType == 11) {
            textNodes = textNodes.concat(getTextNodesIn(node, opt_fnFilter));
         }    
      }
      console.log(textNodes);

      // Get a list of words in the line, each of which has a wordForm, start index, and end index
      var words = getLineWords(div.innerHTML);
      
      // Get the index of the cursor click and the word at that index
      var range = s.getRangeAt(0);
      var offset = range.startOffset;
      var wordIndex = getLineIndex(offset, words);

      // Edit the div's HTML to include a <span> tag around the word that was clicked 
      $(div).html(function() {
         clickedWord = words[wordIndex];
         var addedHTML = "<span class='superspecial'>" + clickedWord.wordForm + "</span>";
         var newInnerHTML = div.innerHTML.replaceAt(clickedWord.start, clickedWord.end, addedHTML);
         this.innerHTML = newInnerHTML;
         return;
      });
      // $("h2:contains('cow')").html(function(_, html) {
      //    html.replace(/(cow)/g, '<span class="smallcaps">$1</span>');
      // });

      return wordIndex;
   }

   // To load the XML file
   function loadDoc(lineIndex, wordIndex) {
      var txt = '';
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function(){
         if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
            getWordAndPos(this, lineIndex, wordIndex)
         }
      };
      xmlhttp.open("GET","ecl1_lascivaroma.xml",true);
      xmlhttp.send();
   }

   function getWordAndPos(xml, lineIndex, wordIndex) {
      // adds the notes from the xml to the html
      var xmlDoc = xml.responseXML;
      var abElements = xmlDoc.getElementsByTagName('ab');
      var lineArray = [];
      for(var i=0;i<abElements.length;i++){
         if(abElements[i].getAttribute("type")=="line"){
            lineArray.push(abElements[i])
      }}
      lineNode = lineArray[lineIndex]
      
      var w_node = lineNode.getElementsByTagName("w")[wordIndex];
      var xmlText = w_node.childNodes[0].nodeValue;
      xmlText += " - ";
      xmlText += w_node.attributes.getNamedItem("lemma").nodeValue;
      xmlText += "<br>";
      xmlText += w_node.attributes.getNamedItem("pos").nodeValue;
      xmlText += "<br>";
      xmlText += w_node.attributes.getNamedItem("msd").nodeValue;
      document.getElementById("demo").innerHTML = xmlText;
   }

   $(".clickable").click(function(){
      // The function gets the index for the line and word which the user has clicked on. This is then 
      // passed to a jQuery request to the XML data document from T. Clérice's Lasciva Roma, which 
      // returns details to be included in the html.

      $("span").contents().unwrap(); // Remove all other spans element tags

      var lineIndex = $(".l").index(this);
      var wordIndex = getWordIndex();

      loadDoc(lineIndex, wordIndex);
   });

});
