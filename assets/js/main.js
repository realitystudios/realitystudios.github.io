
function verifyCaptcha(action, callback){
    grecaptcha.execute('6LcaW-oUAAAAAPUiW4ebE7if7cJWVizaaQtr4z5o', {action: action}).then(function(token){
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://us-central1-reality-studios.cloudfunctions.net/verifyCaptcha", true)
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4){
                callback(xhr.response);
            }
        }
        xhr.send(JSON.stringify({
            token: token
        }));
    });
}

grecaptcha.ready(function() {
    verifyCaptcha('pageLoad', (data)=>{
        var res = JSON.parse(data);

        console.log(res.score);
    });
});

const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    new FormData(contactForm);
});
contactForm.addEventListener('formdata', (e) => {
    var data = {};

    e.formData.forEach((value, key) => {
        data[key] = value;
    });

    verifyCaptcha('submitForm', (response)=>{
        if (JSON.parse(response).score > 0.5){
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "https://us-central1-reality-studios.cloudfunctions.net/sendEmail", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4){
                    console.log("Request Finished");
                }
            }; 
            xhr.send(JSON.stringify(data));
        }
    });
});