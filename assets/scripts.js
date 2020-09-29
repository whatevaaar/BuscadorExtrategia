// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
    apiKey: "AIzaSyDvAaIy2lQoHU3_fddRYa3h5c8kygN0GHM",
    authDomain: "buscadorextrateg-1596755329667.firebaseapp.com",
    databaseURL: "https://buscadorextrateg-1596755329667.firebaseio.com",
    projectId: "buscadorextrateg-1596755329667",
    storageBucket: "buscadorextrateg-1596755329667.appspot.com",
    messagingSenderId: "821365588486",
    appId: "1:821365588486:web:a8b39d97927f2d85603987",
    measurementId: "G-QGSGGDG9YW"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Client ID and API key from the Developer Console
var CLIENT_ID = '<YOUR_CLIENT_ID>';
var API_KEY = '<YOUR_API_KEY>';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];


var NUMERO_DE_RESULTADOS = 0;
// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

const authorizeButton = document.getElementById('authorize_button');
const signoutButton = document.getElementById('signout_button');
const barraBusqueda = document.getElementById('search_bar');
const divCards = document.getElementById("content");
const divPaginacion = document.getElementById("paginacion");
const tablaCarrito = document.getElementById("tabla-carrito");

const listaDeIdDeCarpetasPadre = [];
var listaDeReviews = [];
var queryPadres = "";

conseguirReviews();
const NUMERO_MAXIMO_RESULTADOS_POR_PAG = 10;
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
        barraBusqueda.style.display = 'block';
    } else {
        barraBusqueda.style.display = 'none';
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
function crearCard(file, index) {
    let nombre = file.name.slice(0, file.name.indexOf('-')).replaceAll('_', ' ');
    let nombreTemp = nombre.replaceAll(" ", "_").replaceAll(".", "");
    let rating = encontrarRating(nombreTemp);
    let key = file.name.split('-')[2];
    let costo = switchPrecios(key);
    let card = document.createElement('div');
    card.className = 'card mt-3 ml-5 mr-5';
    card.id = 'resultado-' + index;
    card.dataset.sort = rating;

    let cardHeader = document.createElement('h5');
    cardHeader.className = 'card-header';
    cardHeader.innerHTML = nombre + "  <span class=\"badge badge-secondary\">" + key + "</span>";

    let cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    let title = document.createElement('h5');
    title.innerText = file.name;
    title.className = 'card-title';

    let divRow = document.createElement('div');
    divRow.className = 'row justify-content-around';

    let colBoton = document.createElement('div');
    colBoton.className = 'col';

    let colAgregarCarrito = document.createElement('div');
    colAgregarCarrito.className = 'col';
    let botonAgregar = document.createElement('button');
    botonAgregar.onclick = function () {
        agregarAlCarrito(nombreTemp, costo, key);
    };
    botonAgregar.innerText = "Agregar al carrito";
    botonAgregar.classList.add("btn");
    botonAgregar.classList.add("btn-outline-info");
    colAgregarCarrito.appendChild(botonAgregar);
    let colRating = document.createElement('div');
    colRating.className = 'col';
    for (let i = 0; i < 5; i++) {
        let estrella = document.createElement('span');
        estrella.className = rating > i ? 'fa fa-star checked' : 'fa fa-star';
        estrella.id = "rating-" + nombreTemp + i;
        estrella.onclick = function () {
            listenerRating(i, nombreTemp);
            escribirRating(i, nombreTemp);
        };
        colRating.appendChild(estrella);
    }


    let enlace = document.createElement('a');
    enlace.className = "btn btn-outline-success";
    enlace.href = "http://drive.google.com/a/extrategia.com.mx/uc?id=" + file.id;
    enlace.innerText = 'Descargar';
    divRow.appendChild(colBoton);
    divRow.appendChild(colRating);
    divRow.appendChild(colAgregarCarrito);
    colBoton.appendChild(enlace);
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    cardBody.appendChild(title);
    cardBody.appendChild(divRow);
    divCards.appendChild(card);
}

function listenerRating(index, nombre) {
    for (let j = 0; j < 5; j++) {
        if (j <= index)
            $('#rating-' + nombre + j).addClass("checked");
        else
            $('#rating-' + nombre + j).removeClass("checked");
    }
}

function encontrarRating(nombre) {
    let rating = 0;
    let numRatings = encontrarNumRatings(nombre);
    listaDeReviews.forEach((element) => {
        if (element.nombre.trim() === nombre.trim()) {
            rating = element.rating;
            return rating / numRatings;
        }
    });
    return rating / numRatings;
}

function encontrarNumRatings(nombre) {
    let num = 0
    listaDeReviews.forEach((element) => {
        if (element.nombre == nombre)
            num = element.numRatings;
        return num;
    });
    return num;
}
function conseguirReviews() {
    var query = firebase.database().ref("ratings/");
    query.on("value", function (snapshot) {
        if (snapshot.empty)
            listaDeReviews = [];
        listaTemp = [];
        snapshot.forEach(function (childSnapshot) {
            let childData = childSnapshot.val();
            console.log(childData)
            listaTemp.push({ nombre: childSnapshot.key, rating: childData.rating, numRatings: childData.numRatings })
        });
        listaDeReviews = listaTemp;
    }, function (error) {
        console.error(error);
    });
}
function escribirRating(index, nombre) {
    let numViejo = encontrarNumRatings(nombre);
    let ratingViejo = encontrarRating(nombre) * numViejo;
    firebase.database().ref('ratings/' + nombre).set({
        nombre: nombre,
        rating: index + 1 + ratingViejo,
        numRatings: encontrarNumRatings(nombre) + 1,
    }, function (error) {
        if (error)
            console.log(error);
    });
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
    let termino = document.getElementById('input_busqueda').value.toUpperCase();
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
    gapi.client.drive.files.list({
        'q': query,
        'corpora': 'allDrives',
        'includeItemsFromAllDrives': true,
        'supportsAllDrives': true,
        'fields': "nextPageToken, files(id, name, webContentLink)"
    }).then(function (response) {
        var files = response.result.files;
        if (files && files.length > 0) {
            NUMERO_DE_RESULTADOS = files.length;
            files.forEach(function (file, i) {
                crearCard(file, i);
            });
            if (files.length > 10)
                crearPaginacion();
            ordenarLista();
        }
        else $('.toast').toast('show');
    });

}

function ordenarLista() {
    var result = $('.card').sort(function (a, b) {
        var contentA = parseInt($(a).data('sort'));
        var contentB = parseInt($(b).data('sort'));
        return (contentA > contentB) ? -1 : (contentA < contentB) ? 1 : 0;
    });

    $('#content').html(result);
}

function crearPaginacion() {
    divPaginacion.hidden = false;
    for (let index = 0; index < NUMERO_DE_RESULTADOS; index++) {
        document.getElementById("resultado-" + index).hidden = index > 10 ? true : false;
        if (index % NUMERO_MAXIMO_RESULTADOS_POR_PAG == 0 && index > 0) {
            crearElementoDePaginacion(index);
            crearOnClickPaginacion(index);
        }
    }

}

function crearElementoDePaginacion(index) {
    let elemento = document.createElement('li');
    elemento.className = 'page-item';
    elemento.id = 'paginacion-' + index;

    let enlace = document.createElement('a');
    enlace.className = "page-link";
    enlace.href = "#";
    enlace.innerText = index.toString().slice(0, -1);
    elemento.appendChild(enlace);
    document.getElementById("ul-paginacion").appendChild(elemento);
}

function crearOnClickPaginacion(index) {
    $('#paginacion-' + index).click(function () {
        for (let i = 0; i < NUMERO_DE_RESULTADOS; i++) {
            if (i != index)
                $('#paginacion-' + i).removeClass("active");
            else
                $('#paginacion-' + i).addClass(" active");
            document.getElementById("resultado-" + i).hidden = (i > index || i < index - 9) ? true : false;
        }
        return false;
    });
}

function buscar(event) {
    if (event.which == 13 || event.keyCode == 13) {
        listFiles();
        return false;
    }
    return true;
};

function switchPrecios(key) {
    switch (key) {
        case "PR": return 120_000;
        case "LAN": return 120_000;
        case "BMI": return 120_000;
        case "MKD": return 110_000;
        case "CON": return 100_000;
        case "EST": return 120_000;
        case "CRI": return 180_000;
        case "VID": return 120_000;
        case "MTR": return 180_000;
        case "CTR": return 180_000;
        case "RES": return 85_000;
        case "DED": return 120_000;
        case "IMP": return 120_000;
        case "SCN": return 35_000;
        case "APU": return 120_000;
        case "MAN": return 200_000;
        case "PTR": return 120_000;
        case "COV": return 120_000;
        case "CPE": return 120_000;
        case "RRE": return 120_000;
        case "ARQ": return 120_000;
        case "BRA": return 120_000;
        case "VID": return 120_000;
        case "FOT": return 120_000;
        case "BCH": return 120_000;
        case "EST": return 120_000;
        case "INT": return 120_000;
        case "EVE": return 120_000;
        case "WEB": return 120_000;
        case "APP": return 120_000;
        case "INF": return 120_000;
        case "VEN": return 120_000;
        case "TAL": return 120_000;
        default: return 0;
    }
}

function agregarAlCarrito(nombre, costo, key) {
    let row = document.createElement('tr');
    row.id = "row-" + nombre;
    let columnaNombre =document.createElement('td');
    let columnaEnlace =document.createElement('td');
    let columnaClave =document.createElement('td');
    let columnaPrecio =document.createElement('td');
    let enlace = document.createElement('a');
    enlace.href = "#";
    enlace.onclick = function() {
        eliminarDelCarrito(nombre);
    };
    enlace.innerHTML = "<i class=\"fa fa-window-close\"></i>";
    columnaEnlace.appendChild(enlace);
    columnaNombre.innerText = nombre;
    columnaClave.innerText = key;
    columnaPrecio.innerText = costo;
    row.appendChild(columnaNombre)
    row.appendChild(columnaClave)
    row.appendChild(columnaPrecio)
    row.appendChild(columnaEnlace)
    tablaCarrito.appendChild(row);
}

function eliminarDelCarrito(nombre){
    document.getElementById("row-"+ nombre).remove();
}