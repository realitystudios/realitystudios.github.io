function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));

    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
  
function getCookie(cname) {
    
    var name = cname + "=";
    var ca = document.cookie.split(';');
    
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }

    return "";
}

// Waiting for the load event
if (typeof Osano !== 'undefined'){
    Osano.cm.on("osano-cm-initialized", function (consentObject) {
        if (consentObject.ANALYTICS === "ACCEPT") {
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'UA-158065838-1');
        }
    });

    Osano.cm.on("osano-cm-consent-saved", function (consentObject){
        if (consentObject.ANALYTICS === "ACCEPT"){

        } else if (consentObject.ANALYTICS === "DENY"){
            
        }
    });
}