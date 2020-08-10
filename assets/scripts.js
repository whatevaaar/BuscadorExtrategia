
// Client ID and API key from the Developer Console
var CLIENT_ID = '<YOUR_CLIENT_ID>';
var API_KEY = '<YOUR_API_KEY>';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
var barraBusquda = document.getElementById('search_bar');
var divCards = document.getElementById("content");
var listaDeIdDeCarpetasPadre = [];
var queryPadres = "";
/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        apiKey: "AIzaSyDvAaIy2lQoHU3_fddRYa3h5c8kygN0GHM",
        clientId: "821365588486-8d3gkovtldune4atelsto0o8qkdhj67j.apps.googleusercontent.com",
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    }, function (error) {
        appendPre(JSON.stringify(error, null, 2));
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        crearListaDePadres();
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        barraBusquda.style.display = 'block';
    } else {
        barraBusquda.style.display = 'none';
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

/**
 * Crea cards con los resultados encontrados
 */
function crearCard(file) {
    let nombre = file.name.slice(0, file.name.indexOf('-')).replaceAll('_', ' ');
    console.log(file.name)
    let card = document.createElement('div');
    card.className = 'card mt-3 ml-5 mr-5';

    let cardHeader = document.createElement('h5');
    cardHeader.className = 'card-header';
    cardHeader.innerText = nombre;

    let cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    let title = document.createElement('h5');
    title.innerText = file.name;
    title.className = 'card-title';

    let enlace = document.createElement('a');
    enlace.className = "btn btn-outline-success";
    enlace.href = "http://drive.google.com/a/extrategia.com.mx/uc?id=" + file.id;
    enlace.innerText = 'Descargar';

    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    cardBody.appendChild(title);
    cardBody.appendChild(enlace);
    divCards.appendChild(card);
}

function crearListaDePadres() {
    gapi.client.drive.files.list({
        'q': "'0AA9UZB_ARqnhUk9PVA' in parents and mimeType = 'application/vnd.google-apps.folder'",
        'corpora': "allDrives",
        'includeItemsFromAllDrives': true,
        'supportsAllDrives': true,
        'fields': "nextPageToken, files(id, name)"
    }).then(function (response) {
        var files = response.result.files;
        if (files && files.length > 0) {
            files.forEach(file => {
                listaDeIdDeCarpetasPadre.push(file.id);
            });
        }
        listaDeIdDeCarpetasPadre.forEach(id => {
            queryPadres = queryPadres + "'" + id + "' in parents or ";
        });
        queryPadres = queryPadres.slice(0, -4);
    });
}

/**
 * Print files.
 */
function listFiles() {
    divCards.innerHTML = '';
    let num = 0;
    let termino = document.getElementById('input_busqueda').value.toUpperCase();
    console.log(listaDeIdDeCarpetasPadre);
    let query = ["mimeType != 'application/vnd.google-apps.folder'",
        "and",
        "trashed = false",
        "and",
        "(name contains '" + termino + "' or fullText contains '" + termino + "')",
        "and",
        "(" + queryPadres + ")",
        "and",
        "(mimeType = 'application/vnd.ms-powerpoint' or mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation')",
    ].join(' ');
    console.log(query);
    gapi.client.drive.files.list({
        'q': query,
        'corpora': 'allDrives',
        'includeItemsFromAllDrives': true,
        'supportsAllDrives': true,
        'fields': "nextPageToken, files(id, name, webContentLink)"
    }).then(function (response) {
        var files = response.result.files;
        if (files && files.length > 0)
            files.forEach(file => crearCard(file));
        else $('.toast').toast('show');
    });

}

function buscar(event) {
    if (event.which == 13 || event.keyCode == 13) {
        listFiles();
        return false;
    }
    return true;
};
