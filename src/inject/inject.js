// chrome.extension.sendMessage({}, function(response) {
// 	var readyStateCheckInterval = setInterval(function() {
// 	if (document.readyState === "complete") {
// 		clearInterval(readyStateCheckInterval);

// 		// ----------------------------------------------------------
// 		// This part of the script triggers when page is done loading
// 		console.log("Hello. This message was sent from scripts/inject.js");
// 		// ----------------------------------------------------------

// 	}
// 	}, 10);
// });

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    var sel = window.getSelection();
    var sentence = null
    var start = -1;
    var end = -1;
    if (!!sel.extentNode.parentNode) {
      var parentText = sel.extentNode.parentNode.innerText;
      start = sel.extentNode.wholeText.indexOf(request.word)
      start += parentText.indexOf(sel.extentNode.wholeText);
      end = start + 1;
      sentence = parentText;
    } else {
      sentence = sel.extentNode.wholeText;
      start = sel.extentNode.wholeText.indexOf(request.word);
      end = start + 1;
    }
    while(start > 0 &&
      !(sentence[start] == '.' && sentence[start+1] == ' ')) start--;
    if (start > 0) start = start + 2;

    while(end < sentence.length &&
      !(sentence[end - 1] == '.' && sentence[end] == ' ')) end++;
    // if (end != (sentence.length - 1)) end = end - 1;

    sentence = sentence.slice(start, end);
    var payload = {
      type: 'sentence',
      data: {
        sentence: sentence,
        type: 'sentence',
        wordList: [
          {
            word: request.word
          }
        ],
        title: document.title,
        url: window.location.href,
      }
    }
    chrome.extension.sendMessage(payload);
  });