document.addEventListener('DOMContentLoaded', () => {
    checkIframeLoaded();
});

function checkIframeLoaded() {
    // Get a handle to the iframe element
    var iframe = document.getElementById('reviewIframe');
    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    // Check if loading is complete
    if (  iframeDoc.readyState  == 'complete' ) {
        // The loading is complete, call the function we want executed once the iframe is loaded
        afterLoading();
        return;
    } 

    // If we are here, it is not loaded. Set things up so we check   the status again in 100 milliseconds
    setTimeout(checkIframeLoaded, 100);
}

function afterLoading(){
    let iFrameID = document.getElementById('reviewIframe');
    if(iFrameID) {
        iFrameID.height = "";
        iFrameID.height = iFrameID.contentWindow.document.body.scrollHeight + 50 + "px";
    }   
}