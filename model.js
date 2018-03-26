//MODELO PARA USAR LA BASE DE DATOS.
//EN LAS TRANSPARENCIAS ESTAN LOS MODELOS

//Cargamos el modulo sequelize. Constructor
const Sequelize = require('sequelize');

//Generamos la instancia de sequelize con new para acceder a la base de datos
//que esta localizaza en el fichero quizzes.sqlite y el protocolo sqlite:
//parentesis: url del fichero
//{logging: false} es para que al empezar el juego en el terminal no salgan trazas indeseadas
const sequelize = new Sequelize ("sqlite:quizzes.sqlite", {logging: false});

//Generamos un modelo de datos.
//No lo hemos asignado a ninguna variable porque siempre que definimos un modelo en sequelize
//se crea un array que se llama models donde estan todos los modelos
sequelize.define('quiz', {
    question: {
        type: Sequelize.STRING,
        //cada pregunta es unica
        unique: {msg: "Ya existe esta pregunta"},
        //para que no se puedan crear preguntas vacias
        validate: {notEmpty: {msg: "La pregunta no puede estar vacia"}}
    },
    //comprobamos que la respuesta no esta vacia
    answer: {
        type: Sequelize.STRING,
        validate: {notEmpty: {msg: "La respuesta no puede estar vacia"}}
    }
});

//Sincronizamos. Es una promesa
//Miramos si en la base de datos existen las tablas que necesito
//En caso de que no exitan se van a crear

sequelize.sync()
    //Cuando se completa la promesa de sync pasamos al then
//donde se va a ejecutar una funcion que genera otra promesa. Dentro de sequelize
// accede a la propiedad model, accedo al modelo quiz y contamos cuantos hay
.then(() => sequelize.model.quiz.count())
    // cuando el anterior then devueva el valor pasamos a este then que toma como
    //parametro el valor de la cuenta
.then(count => {
    // en caso de que la cuenta sea 0
    if(!count){
        //creamos varios quizzes. bulkCreate() los crea.
        //El array es una promesa tambien por lo que ponemos el return para que la promesa
        // del then espere hasta que se cumpla la promesa del array
        return sequelize.models.quiz.bulkCreate([
            {question: "Capital de Italia", ansquer: "Roma"},
            {question: "Capital de Francia", ansquer: "Paris"},
            {question: "Capital de España", ansquer: "Madrid"},
            {question: "Capital de Portugal", ansquer: "Lisboa"},
        ]);
    }
})
    //por si hay algun error
.catch(error => {
    console.log(error);
});

//exportamos sequelize. Ahora sequelize es un objeto
module.exports = sequelize;
