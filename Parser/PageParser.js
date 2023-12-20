function onWindowLoad() {

    AddEventListeners();

    chrome.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;

        return chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            // injectImmediately: true,  // uncomment this to make it execute straight away, other wise it will wait for document_idle
            func: DOMtoString,
            // args: ['body']  // you can use this to target what element to get the html for
        });

    }).then(function (results) {
        var DOMString = results[0].result;
        ParseDOMString(DOMString);
        // var inputs = findAllInput(results[0].result);
        // for(var i = 0; i < inputs.length; i++) {
        //     message.innerText += "Input ID:" + inputs[i].id + " Input value: " + inputs[i].value;
        // }

    }).catch(function (error) {
        //message.innerText = 'There was an error injecting script : \n' + error.message;
    });
}

window.onload = onWindowLoad;

function AddEventListeners() {
    const refreshButton = document.getElementById('refresh-container');
    refreshButton.addEventListener('click', onWindowLoad);
}

function DOMtoString(selector) {
  if (selector) {
      selector = document.querySelector(selector);
      if (!selector) return "ERROR: querySelector failed to find node"
  } else {
      selector = document.documentElement;
  }
  return selector.outerHTML;
}


/**
 * Parses the DOM as a string and extracts all hidden variables
 * @param {*} DOMString HTML DOM in string format
 */
function ParseDOMString(DOMString) {

    //Transform string into DOM Parser Class
    var parser = new DOMParser();
    var doc = parser.parseFromString(DOMString, "text/html");

    //Get all input tags with hidden attribe
    var hiddenInputs = doc.querySelectorAll("input[type='hidden']");

    console.log("Hidden Inputs: ", hiddenInputs);

    //Populate sidebar with elements
    PopulateSidebar(hiddenInputs);

}

/**
 * Populates the sidebar with hidden input elements
 * @param {*} elements Hidden input elements
 */
function PopulateSidebar(elements) {

    var hiddenVariablesContainer = document.getElementById("hidden-variable-container");
    hiddenVariablesContainer.innerHTML = '';

    var hasValidElements = false;

    elements.forEach(async element => {

        //Get name and value for input
        var elementNumber = 1;
        var elementName = element.id || element.getAttribute("name") || "";
        var elementValue = element.value || "";
        elementValue && elementNumber++;


        //Add it to storage and the div
        //elementValue && await SetElementMapping(elementName + elementNumber, elementName);
        if(elementValue) {
            hasValidElements = true;
            AddElementToContainer(hiddenVariablesContainer, elementName, elementValue, elementNumber);
        }
    });

    hasValidElements ? ShowResultsDiv() : HideResultsDiv();

}


/**
 * Adds DOM elements to the specified container
 * @param {*} container DOM container in which to add elements 
 * @param {*} name Name of the element
 * @param {*} value Value of the element
 */
async function AddElementToContainer(container, name, value, uniqueId) {

    //Create wrapper div
    const wrapperDiv = document.createElement("div");
    wrapperDiv.className = "hidden-variable-row";

    // Add elements to container 
    wrapperDiv.appendChild(GetNameDiv(name, uniqueId));
    wrapperDiv.appendChild(GetColonDiv())
    wrapperDiv.appendChild(GetValueDiv(value, uniqueId));

    // Create a new element for copy icon if necessary
    value && wrapperDiv.appendChild(GetCopyDiv(value));

    // Add div to parent
    container.appendChild(wrapperDiv);
    ShowResultsDiv();
}

function ShowResultsDiv() {
    const emptyDiv = document.getElementById('empty-result-hidden-variables');
    emptyDiv.style.display = 'none';

    const wrapperDiv = document.getElementById('hidden-variables-wrapper');
    wrapperDiv.style.display = 'inherit';
}

function HideResultsDiv() {
    const emptyDiv = document.getElementById('empty-result-hidden-variables');
    emptyDiv.style.display = 'inherit';

    const wrapperDiv = document.getElementById('hidden-variables-wrapper');
    wrapperDiv.style.display = 'none';
}


/**
 * Creates a name div object
 * @param {*} name Name of the object
 * @param {*} uniqueId Unique ID of the object
 */
function GetNameDiv(name, uniqueId) {
    const nameDiv = document.createElement("div");

    nameDiv.className = "hidden-variable-name";
    nameDiv.id = "hidden-name-" + uniqueId;
    var nameText = document.createTextNode(name);
    nameDiv.appendChild(nameText);

    return nameDiv;
}


/**
 * Creates a name input object
 * @param {*} name Name of the object
 * @param {*} uniqueId Unique ID of the object
 */
async function GetNameInput(name, uniqueId) {

    //console.log("Name Input");

    const nameInput = document.createElement("input");
    nameInput.className = "hidden-variable-name";
    nameInput.id = name + uniqueId;
    nameInput.value = await GetElementMapping(name + uniqueId);

    nameInput.addEventListener("focus", function () {
        nameInput.style.color = "var(--white)";
        nameInput.style.backgroundColor = "var(--black)";
        nameInput.style.margin = "0.2rem";    
    });
    
    nameInput.addEventListener("blur", function () {
        nameInput.style.backgroundColor = "var(--main-panel-bg-color)";
        nameInput.style.color = "var(--secondary-text-color)";
        nameInput.style.margin = "0";    
    });

    nameInput.addEventListener("change", async function() {
        var newValue = this.value;
        var key = this.id;
        await SetElementMapping(key, newValue);
    });

    return nameInput;
}


/**
 * 
 * @returns Div element with a colon
 */
function GetColonDiv() {

    //console.log("Colon Div");

    const colonDiv = document.createElement("div");
    colonDiv.className = "flex-box";
    var colonText = document.createTextNode(":");
    colonDiv.appendChild(colonText);

    return colonDiv;
}

/**
 * 
 * @param {*} value 
 * @returns 
 */
function GetValueDiv(value, uniqueId) {

    //console.log("Value Div");

    const valueDiv = document.createElement("div");
    valueDiv.className = "hidden-variable-value";
    valueDiv.id = "hidden-value-" + uniqueId;
    var valueText = document.createTextNode(value);
    valueDiv.appendChild(valueText);

    return valueDiv;
}

function GetCopyDiv(value) {

    //console.log("Copy Div");

    const copyDiv = document.createElement("div");
    copyDiv.className = "copy-hidden-val flex-box";
    copyDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><style>svg{fill:#8E8E8E}</style><path d="${COPY_SVG_PATH}"/></svg></div>`;

    //Add copy handler to icon
    copyDiv.onclick = function() {
        CopyToClipboard(value);
    }
    

    return copyDiv;
}


/**
 * Adds element to chrome.storage.local
 * @param {*} name Name of the element alias
 */
async function SetElementMapping(key, value) {
    var obj= {};
    obj[key] = value;
    await chrome.storage.local.set(obj);
}


/**
 * Retrieves element name from chrome.local.storage
 * @param {*} name Name of element to retrieve
 */
async function GetElementMapping(name) {
    console.log("GetElementMapping");
    var valueObj = await chrome.storage.local.get(name);
    return valueObj[name];
}

/**
 * Copies selected text to clipboard
 * @param {*} text text to copy to clipboard 
 */
function CopyToClipboard(text) {

    // Copy text
    navigator.clipboard.writeText(text);

}