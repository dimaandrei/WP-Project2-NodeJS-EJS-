
process.env.ORA_SDTZ = 'UTC';
const oracledb = require('oracledb');
const dbConfig = require('./dbconfig.js');
var connection;
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();
const port = 6789;
const fs = require('fs');
const { Console } = require('console');
const OracleDB = require('oracledb');
const { json } = require('body-parser');
// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(cookieParser());
app.use(session({ secret: "secret session" }));

app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));




// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
//app.get('/', (req, res) => res.send('Hello World'));

app.get('/', (req, res) => {
	//console.log(req.cookies.username);
	res.render('index', {
		username: req.cookies.username,
		firstname: req.session.firstname,
		dbData:null,
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
			intrebari: listaIntrebari,
			raspunsuri_corecte: raspCor
		});
	});
});


app.get('/autentificare', (req, res) => {
	res.render('autentificare', {
		title: 'Autentificare',
		username: req.cookies.username,
		mesajEroare: req.cookies.mesajEroare,
	});
});

app.post('/verificare-autentificare', (req, res) => {
	/*console.log(req.body);
	if (req.body.username === "test" && req.body.password === "test") {
		console.log("Corect");
		
		res.cookie('username', req.body.username,{ httpOnly: true});
		res.clearCookie('mesajEroare');
		//console.log(req.cookies.username);
		res.redirect('/');
	}
	else{
		console.log("Incorect");
		//req.cookies.mesajEroare = "User name or password incorrect!"
		res.clearCookie('username');
		res.cookie('mesajEroare', "User name or password incorrect!",{ httpOnly: true});

		res.redirect('/autentificare');
	}*/
	fs.readFile('utilizatori.json', (err, data) => {
		if (err) {
			res.status(404);
			res.send('Eroare! File not found!');
			return;
		}

		const result = JSON.parse(data).filter(u => u.username === req.body.username && u.password === req.body.password);

		if (result.length > 0) {
			req.session.username = req.body.username;
			req.session.firstname = result[0].firstname;
			req.session.lastname = result[0].lastname;
			res.cookie('username', req.session.username, { httpOnly: true });
			res.clearCookie('mesajEroare');
			res.redirect('/');
		}
		else {
			req.session.mesajEroare = 'Utilizator sau parolă greșite!';
			res.clearCookie('username');
			res.cookie('mesajEroare', req.session.mesajEroare, { httpOnly: true });
			res.redirect('/autentificare');
		}
	});


});

app.get('/delogare', (req, res) => {
	res.clearCookie('username');
	res.redirect('/autentificare');
});

async function run() {
	//let connection;
	try {
		let sql, binds, options, result;
		connection = await oracledb.getConnection(dbConfig);
		const stmts = [
			'DROP TABLE produse',
			'CREATE TABLE produse(id NUMBER NOT NULL, data VARCHAR(20), pret NUMERIC(5))'//,
			//'ALTER TABLE produse ADD(CONSTRAINT id_pk PRIMARY KEY(id))'
		];
		for (const s of stmts) {
			try {
				await connection.execute(s);
			} catch (e) {
				if (e.errorNum != 942)
					console.error(e);
			}
		}
	} catch (err) {
		console.error(err);
	}
	/*
	finally {
		if (connection) {
			try {
				await connection.close();
			} catch (err) {
				console.error(err);
			}
		}
	}*/
}
async function closeConn() {
	try {
		if (connection) {
			try {
				await connection.close();
			} catch (err) {
				console.error(err);
			}
		}
	}
	catch (err) {
		console.error(err);
	}
}
app.get('/creare-bd', (req, res) => {
	run();
	res.redirect('/');
});

app.get('/close-conn', (req, res) => {
	closeConn();
	res.redirect('/');
});
async function insert() {
	try {
		sql = 'INSERT INTO produse VALUES (:1, :2, :3)';
		binds = [
			[1, "Castraveti", 4],
			[2, "Rosii", 13],
			[3, "Banane", 7],
			[4, "Capsuni", 9],
			[5, "Cirese", 79],
		];
		// For a complete list of options see the documentation.
		options = {
			autoCommit: true,
			// batchErrors: true,  // continue processing even if there are data errors
			bindDefs: [{ type: oracledb.NUMBER },
			{ type: oracledb.STRING, maxSize: 20 },
			{ type: oracledb.NUMBER }
			]
		};
		result = await connection.executeMany(sql, binds, options);
		console.log("Number of rows inserted:", result.rowsAffected); // For a complete list of options see the documentation.
	} catch (err) {
		console.error(err);
	}
}
app.get('/inserare-bd', (req, res) => {
	insert();
	res.redirect('/');
});

async function select() {
	try {
		sql = 'SELECT * FROM produse';

		binds = {};

		// For a complete list of options see the documentation.
		options = {
			outFormat: oracledb.OUT_FORMAT_OBJECT,   // query result format
			// extendedMetaData: true,               // get extra metadata
			// prefetchRows:     100,                // internal buffer allocation size for tuning
			// fetchArraySize:   100                 // internal buffer allocation size for tuning
		};
		
		let result = await connection.execute(sql, binds, options);
		/*
		console.log("Metadata: ");
		console.dir(result.metaData, { depth: null });
		console.log("Query results: ");
		console.dir(result.rows, { depth: null });
		*/
		return result;
	} catch (err) {
		console.error(err);
	}

}

app.get('/show-produse', (req, res) => {
	select().then( function (value) {
		//console.log(value.rows);
		res.render('index', {
			username: req.cookies.username,
			firstname: req.session.firstname,
			dbData: value.rows,
		});
	});

});

app.post('/adaugare-cos', (req, res) => {
	//var cart = req.session.cart || [];
    //cart.push(req.body.id);
	if(!req.session.cart)
		req.session.cart=[]
	req.session.cart.push(req.body.id);
	console.log(req.session.cart);
	res.redirect('/show-produse');
});

app.get('/vizualizare-cos', (req, res) => {
	select().then( function (value) {
		//console.log(value.rows);
		res.render('vizualizare-cos', {
			title: 'Coș cumpărături',
			username: req.cookies.username,
			firstname: req.session.firstname,
			dbData: value.rows,
			cart: req.session.cart,
		});
	});
	
});

//res.send("formular: " + JSON.stringify(req.body));


app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:6789`));

