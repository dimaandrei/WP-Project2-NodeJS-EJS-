
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const cookieParser=require('cookie-parser');
const app = express();
const port = 6789;
const fs = require('fs');
const { Console } = require('console');
// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())


// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
//app.get('/', (req, res) => res.send('Hello World'));

app.get('/', (req, res) => {
	// în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
	
	res.render('index', {
		
	});
});

// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get('/chestionar', (req, res) => {
	// în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
	fs.readFile('intrebari.json', (err, data) => {
		if (err) {
			res.send('Nu există întrebări!');
			return;
		}
		res.render('chestionar', {
			intrebari: JSON.parse(data)
		});
	});
});

app.post('/rezultat-chestionar', (req, res) => {
	fs.readFile('intrebari.json', (err, data) => {
		if (err) {
			res.send('Nu exista intrebari!');
			return;
		}
		const listaIntrebari = JSON.parse(data);
		const body = req.body;
		const keys = Object.keys(body);
		
		var raspCor = 0;
		for (var i = 0; i < keys.length; ++i) {
			let k = keys[i];
			if (listaIntrebari[k].corect == body[k])
				raspCor++;
		}
		res.render('rezultat-chestionar', { 
			intrebari:listaIntrebari,
			raspunsuri_corecte: raspCor });
	});
});


app.get('/autentificare', (req, res)=>{
	res.render('autentificare', {
        title: 'Autentificare', 
    });    
});

app.post('/verificare-autentificare', (req, res) =>{
	console.log(req.body);
	//res.send("formular: " + JSON.stringify(req.body));
	if(req.body.username==="test" && req.body.password==="test")
	{
		console.log("Corect");
		req.cookies.username = req.body.username;
		res.redirect('/');
	}
	
	
});

//res.send("formular: " + JSON.stringify(req.body));


app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:6789`));

