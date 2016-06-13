// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });


var dataRef = null;
var itemData = null;
var itemList = [];

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
  	if ('login' == request.type) {
      dataRef.authWithPassword({
          email: request.username,
          password: request.password
      }, function(error, _authData) {
        if (error) {
          switch (error.code) {
            case "INVALID_EMAIL":
              console.log("The specified user account email is invalid.");
              break;
            default:
              console.log("Error logging user in:", error);
          }
        } else {
          console.log("Authenticated successfully with payload:", _authData);
          initItemList();
        }
      });
    } else if ('sentence' == request.type) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function(data) {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
       
            var dataText = translateXML(xhr.responseXML);
            if(dataText != null){
              request.data.timestamp = Wilddog.ServerValue.TIMESTAMP;
              request.data.wordList[0].comment = dataText.strpho + ' ' + dataText.basetrans + ' ' + dataText.webtrans;
              var item = null;
              for(var i in itemList) {
                if (-1 != itemList[i].sentence.indexOf(request.data.wordList[0].word)) {
                  item = itemList[i];
                  break;
                }
              }

              var _data = null
              if (null != item) {
                if (!item.wordList) item.wordList = [];
                item.wordList.push(request.data.wordList[0])
                dataRef.child(dataRef.getAuth().uid).child('/bnword/items/').child(item.key).set(item, function(result) {
                  console.log(result)
                });
              } else {
                dataRef.child(dataRef.getAuth().uid).child('/bnword/items/').push(request.data, function(result) {
                  console.log(result)
                });
              }
            }
          }
        }
      }

      var url = 'http://dict.youdao.com/fsearch?client=deskdict&keyfrom=chrome.extension&q='+encodeURIComponent(request.data.wordList[0].word)+'&pos=-1&doctype=xml&xmlVersion=3.2&dogVersion=1.0&vendor=unknown&appVer=3.1.17.4208&le=eng'
   
      xhr.open('GET', url, true);
      xhr.send();
    }
  });

var clickHandler = function(e, tab) {
  if (!dataRef.getAuth()) {
    chrome.tabs.sendMessage(tab.id, {authed: false});
  } else {
    if (tab.url.indexOf('chrome-extension://') == 0) {
      dataRef.child(dataRef.getAuth().uid).child('/bnword/items/').push({
        sentence: e.selectionText.trim(),
        timestamp: Wilddog.ServerValue.TIMESTAMP,
        title: tab.title,
        type: 'sentence'
      }, function(result) {
        console.log(result)
      });
    } else {
      chrome.tabs.sendMessage(tab.id, {
        authed: true,
        word: e.selectionText.trim()});
    }
  }
};

chrome.contextMenus.create({
    "title": "Buzz This",
    "contexts": ["selection"],
    "onclick" : clickHandler
  });

function translateXML(xmlnode){
  var noBaseTrans = false;
  var noWebTrans = false;
  var translate = "<strong>查询:</strong><br/>";
  var root = xmlnode.getElementsByTagName("yodaodict")[0];
  
  if(""+ root.getElementsByTagName("return-phrase")[0].childNodes[0] != "undefined" )
    var retphrase = root.getElementsByTagName("return-phrase")[0].childNodes[0].nodeValue;
  
  if(""+ root.getElementsByTagName("dictcn-speach")[0] != "undefined" )
    speach = root.getElementsByTagName("dictcn-speach")[0].childNodes[0].nodeValue;
    
  var lang = "&le=";  
  if(""+ root.getElementsByTagName("lang")[0] != "undefined" )
      lang += root.getElementsByTagName("lang")[0].childNodes[0].nodeValue; 
  var strpho = "";
  if (""+ root.getElementsByTagName("phonetic-symbol")[0] != "undefined" ) {
    if(""+ root.getElementsByTagName("phonetic-symbol")[0].childNodes[0] != "undefined")
      var pho = root.getElementsByTagName("phonetic-symbol")[0].childNodes[0].nodeValue;
    
    if (pho != null) {
      strpho = "[" + pho + "]";
    }
  }
  
  if (""+ root.getElementsByTagName("translation")[0] == "undefined")
  {
     noBaseTrans = true;
  }
  if (""+ root.getElementsByTagName("web-translation")[0] == "undefined")
  {
     noWebTrans = true;
  }
  
  var basetrans = "";
  var baseTransString = "";
  var webtrans = "";
  var webTransString = "";
  var translations;
  var webtranslations;
  if (noBaseTrans == false) {
    if ("" + root.getElementsByTagName("translation")[0].childNodes[0] != "undefined") {
      translations = root.getElementsByTagName("translation");
    }
    else {
      noBaseTrans = true;
    }
    var i;
    for ( i = 0; i < translations.length - 1; i++) {
      basetrans += '<div class="ydd-trans-container ydd-padding010">' + translations[i].getElementsByTagName("content")[0].childNodes[0].nodeValue + "</div>";
      baseTransString += translations[i].getElementsByTagName("content")[0].childNodes[0].nodeValue + "; ";
    }
    basetrans += '<div class="ydd-trans-container ydd-padding010">' + translations[i].getElementsByTagName("content")[0].childNodes[0].nodeValue + "</div>";
    baseTransString += translations[i].getElementsByTagName("content")[0].childNodes[0].nodeValue + "; ";
  }
  
  if (noWebTrans == false) {
    if ("" + root.getElementsByTagName("web-translation")[0].childNodes[0] != "undefined") {
      webtranslations = root.getElementsByTagName("web-translation");
    }
    else {
      noWebTrans = true;
    }
    var i;
    for ( i = 0; i < webtranslations.length -1 ; i++) {
      webtrans += '<div class="ydd-trans-container ydd-padding010"><a href="http://dict.youdao.com/search?q=' + encodeURIComponent(webtranslations[i].getElementsByTagName("key")[0].childNodes[0].nodeValue) + '&keyfrom=chrome.extension'+lang+'" target=_blank>' + webtranslations[i].getElementsByTagName("key")[0].childNodes[0].nodeValue + ":</a> ";
      webtrans += webtranslations[i].getElementsByTagName("trans")[0].getElementsByTagName("value")[0].childNodes[0].nodeValue + "<br /></div>";
      webTransString +=  webtranslations[i].getElementsByTagName("trans")[0].getElementsByTagName("value")[0].childNodes[0].nodeValue + "; ";
    }
    webtrans += '<div class="ydd-trans-container ydd-padding010"><a href="http://dict.youdao.com/search?q=' + encodeURIComponent(webtranslations[i].getElementsByTagName("key")[0].childNodes[0].nodeValue) + '&keyfrom=chrome.extension'+lang+'" target=_blank>' + webtranslations[i].getElementsByTagName("key")[0].childNodes[0].nodeValue + ":</a> ";
    webtrans += webtranslations[i].getElementsByTagName("trans")[0].getElementsByTagName("value")[0].childNodes[0].nodeValue + "</div>";
    webTransString +=  webtranslations[i].getElementsByTagName("trans")[0].getElementsByTagName("value")[0].childNodes[0].nodeValue + "; ";
  }

  return {
    'strpho': strpho,
    'basetrans': baseTransString,
    'webtrans': webTransString
  }
}

function initItemList() {
  dataRef.child(dataRef.getAuth().uid).child('/bnword/items/')
      .orderByChild("timestamp")
      .endAt(new Date('3000/01/01').getTime()) // NOTICE: displayed items are reversed
      .limitToLast(10)
      .on('value', function(snapshot) {
    itemList = [];
    snapshot.forEach(function(data) {
      var item = data.val();
      item.key = data.key();
      itemList.push(item);
    });
    itemList.reverse();
  })
}

function loadScript(url, callback){
  // Adding the script tag to the head as suggested before
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;

  // Then bind the event to the callback function.
  // There are several events for cross browser compatibility.
  script.onreadystatechange = callback;
  script.onload = callback;

  // Fire the loading
  head.appendChild(script);
}

loadScript("js/wilddog.js", function() {
  dataRef = new Wilddog('https://bn.wilddogio.com/');

  if (!!dataRef.getAuth()) {
    initItemList();
  }
});