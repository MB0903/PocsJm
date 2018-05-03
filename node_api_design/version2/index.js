const config = require('config');
const express = require('express'); //return a funcion
const app = express(); //return an object
const Joi = require('joi');
const morgan = require('morgan'); // middlware to log the request
const startupDebugger = require('debug')('app:startup'); //app:startup es un nombre arbitrario que le ponemos a nuestro logger.
// para poderlo usar debeomos crear la env DEBUG y ponerle el valor. Por ejemplo: DEBUG=app:startup
const dbDebugger = require('debug')('app:db');



//Custom middleware function
const logger = require('./logger');
const authenticate = require('./authentication');

//Habilita el parseo de objetos json en express,
//por defecto esta caracteristica viene apagada por lo que usando 
//la siguient linea la prendemos.
app.use(express.json());

console.log(`NODE_ENV: ${process.env.NODE_ENV} `); // Si la variable no esta seteada aca se obtiene undefined
console.log(`app: ${app.get('env')}`); // y aca se obtiene development

app.use(express.urlencoded({extended: true}));// Este middleware bàsicamente toma un request como key=value&key=value
//los parsea y pobla el objeto req.body como un objeto json.

app.use(express.static('public'));// Con este middleware podemos servir contenido estatico
// como imagenes archivos, css, entre otros.

//app.use(morgan());

app.set('view engine', 'pug'); // internamente express carga el pug module ya no es necesario usar require.
app.set('views', './views'); //default


if(app.get('env') === 'development'){
  app.use(morgan('tiny'));
  startupDebugger('Morgan enabled...');
}

dbDebugger('Connected to database');

//CONFIG
console.log('Application name: ' + config.get('name'));
console.log('Mail server: ' +  config.get('mail.host'));
console.log('Mail server: ' +  config.get('mail.password'));


//Next es una referencia a la siguiente middleware function.
// en el pipeline de procesamiendo request.
// Si no ponemos el next la respuesta al usuario se va a colgar, ya que no estamos terminando el ciclo
//de procesamiento. por lo tanto es necesario pasarle la siguiente funcion middleware que se
//encarga de finalizar el ciclo de procesamiento request y response.
app.use(logger);
app.use(authenticate);

const courses = [
  { id: 1, name: 'course1' },
  { id: 2, name: 'course2' },
  { id: 3, name: 'course3' }
];

//this function requires two paramters, the path
// and a callback that is going to be executed when the path is called.
app.get('/', (req, res) => {
  //res.send('Hello World');
  res.render('index', {title: 'my express app', message: 'hello'})
});

app.get('/api/courses', (req, res) => {
  res.send(courses);
});

//id va a ser el nombre del parametro que vamos a esperar.
/*app.get('/api/courses/:id', (req, res) => {
     res.send(req.params.id);
});*/


app.get('/api/courses/:id', (req, res) => {
  //La funcion parseInt es una funcion global de javascript.
  const courseId = req.params.id;
  const course = courses.find(c => c.id === parseInt(req.params.id));
  //if there is not any course we return: 404
  if (!course) return res.status(404).send(`The course with the given ID ${courseId} was not found.`);
  res.send(course);
});

//si recibimos multiples parametros en la url sería
app.get('/api/posts/:year/:month', (req, res) => {
  res.send(req.params);
});

//Para obteneer los parametros query es decir los que van despues de ?
// usamos req.query
//http://localhost:3000/api/books/1/2?sortBy=name
app.get('/api/books/:year/:month', (req, res) => {
  res.send(req.query);
});

//Con esto primero leemos la variable de ambiente en caso de no existir entonces se toma
//el valor 3000
const port = process.env.PORT || 3000;

//Adicionalmente podemos llamar una funcion cuando nuestro servidor
//este escuchando por el puerto
app.listen(port, () => {
  console.log(`Listening on port ${port} ...`);
});


/******############# */
// ########## POST ######
/******############## */

app.post('/api/courses', (req, res) => {

  //el esquema me define  la figura del objeto.
  //que propiedades tenemos en dicho objeto.
  //el tipo de dato, la longitud, el rango.
  // si es requerido o no el atributo
  const { error } = validateCourse(req.body);//object destructuring
  if(error)
  {
    //Si no viene el nombre o su longitud es menor a 3 devolvemos un 400 que es la convención
    //de Bad request
    return res.status(400).send(error.details[0].message);
  }
  
  const course = {
    id: courses.length + 1,
    name: req.body.name,
  }
  courses.push(course);
  res.send(course) ;

});

/******############# */
// ########## PUT ######
/******############## */
app.put('/api/courses/:id', (req, res) => {

  const courseId = req.params.id;
  const course = courses.find(c => c.id === parseInt(req.params.id));

  if(!course) return res.status(404).send(`The course with the given ID ${courseId} was not found.`);

  //Object Destructuring.
  //The object returned by this method has two properties error and value.
  //Como en este caso queremos el error ponemos el nombre de dicha propiedad.
  const { error } = validateCourse(req.body);

 if(error)
 {
   //Si no viene el nombre o su longitud es menor a 3 devolvemos un 400 que es la convención
   //de Bad request
   return res.status(400).send(error.details[0].message);
 }

 course.name = req.body.name;
 res.send(course);

});

function validateCourse(course){
  const schema = {
    //La propiedad name dentro del body debe tener un minimo de tres caracteres y es requerido.
    name: Joi.string().min(3).required()
  };
  console.log(Joi.validate(course, schema));
 return Joi.validate(course, schema);

}


/******############# */
// ########## DELETE ######
/******############## */

app.delete('/api/courses/:id', (req, res) => {

  const course = courses.find(c => c.id === parseInt(req.params.id));
  const courseId = req.params.id;
  /*if(!course){
    res.status(404).send(`The course with the given ID ${courseId} was not found.`);
    return;
  }*/
  //Una forma de escribir el mismo codigo en la misma linea es la siguiente:

  if(!course) return res.status(404).send(`The course with the given ID ${courseId} was not found.`);

  //delete
  const index = courses.indexOf(course);
  courses.splice(index, 1);

  res.send(course);

});