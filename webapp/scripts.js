$(document).ready(function(){

   function isLetter(character) {
      return character.length === 1 && character.match(/[a-z]/i);
   }

   $(".clickable").click(function(){
      // The function gets the index for the line within the poem, the index for the word in the line
      // (not including punctuation), and the wordform which the user clicks on.
      //    This is then passed to a jQuery request to the XML data document from T. Clérice's Lasciva
      // Roma, which returns details to be included in the html.
      
      var lineIndex = $(".l").index(this); // the index of the line in the poem

      //
      s = window.getSelection();
      var range = s.getRangeAt(0);
      var cursorOffset = range.startOffset;
      var node = s.anchorNode;
      var lineText = node.nodeValue;
      
      var i = 0;
      var wordStart = 0;
      var words = [];
      var word = "";

      // Now we must find the beginning and end of the word which the user clicked.
      // We cycle through the line, logging each word and counting where each word begins and ends.
      while (i <= lineText.length) {
         if (i == lineText.length) { // the last character, ergo the end of the word
            wordText = lineText.slice(wordStart, i);
            words[words.length] = {
               wordForm: wordText,
               start: wordStart,
               end: i
            }
            wordStart = i+1;
         } else if (isLetter(lineText[i])) { // the word continues
            word += lineText[i];
         } else { // the end of the word has been found
            wordText = lineText.slice(wordStart, i);
            words[words.length] = {
               wordForm: wordText,
               start: wordStart,
               end: i
            }
            wordStart = i+1;
         }
         i++;
      }

      // 
      word_index = 0;
      while (cursorOffset >= words[word_index].start) {
         word = words[word_index];
         if (cursorOffset >= word.start && cursorOffset <= word.end) {
            break;
         }
         word_index++;
      }

      loadDoc(lineIndex, word_index, word.wordForm);
   });

   // To load the XML file
   function loadDoc(lineIndex, wordIndex, wordForm) {
      var txt = '';
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function(){
         if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
            getWordAndPos(this, lineIndex, wordIndex, wordForm)
         }
      };
      xmlhttp.open("GET","ecl1_lascivaroma.xml",true);
      xmlhttp.send();
   }

   function getWordAndPos(xml, lineIndex, wordIndex, wordForm) {
      // adds the notes from the xml to the html
      var xmlDoc = xml.responseXML;
      var abElements = xmlDoc.getElementsByTagName('ab');
      var lineArray = [];
      for(var i=0;i<abElements.length;i++){
         if(abElements[i].getAttribute("type")=="line"){
            lineArray.push(abElements[i])
      }}
      lineNode = lineArray[lineIndex]
      
      var   w_node = lineNode.getElementsByTagName("w")[wordIndex];
      var xmlText = w_node.childNodes[0].nodeValue;
      xmlText += " - ";
      xmlText += w_node.attributes.getNamedItem("lemma").nodeValue;
      xmlText += "<br>";
      xmlText += w_node.attributes.getNamedItem("pos").nodeValue;
      xmlText += "<br>";
      xmlText += w_node.attributes.getNamedItem("msd").nodeValue;
      document.getElementById("demo").innerHTML = xmlText;
   }

});
