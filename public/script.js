function verifyButton(token) {
    // uncomment this for redirect flow:
    // window.location.href = `https://verify.soraid.com/verify/?token=${token}`;
    let ui = Sora.createLoginUI(token, {
        onEvent: function(data) {
            console.log(data)
        },
        onSuccess: function(data) {
            console.log(data);
            window.location.href = "/verified";
        },
    });
    ui.launch();
}
