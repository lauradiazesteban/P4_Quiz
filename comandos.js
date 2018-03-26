//Se requiere Sequelize para los siguientes métodos.
const Sequelize = require('sequelize');

const {log, bigLog, errorLog, colorize} = require("./out");

//Debemos devolver modelo de datos sequelize y acceder a su propiedad models.
//En vez de poner "const sequelize" y luego acceder a models, lo hacemos así directamente.
const {models} = require('./model');

//Funciones que implementan los comandos.

/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpComando = (socket, rl) => {
    log(socket, "Comandos:");
    log(socket, "  h|help - Muestra esta ayuda.");
    log(socket, "  list - Listar los quizzes existentes.");
    log(socket, "  show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log(socket, "  add - Añadir nuevo quiz iteractivamente.");
    log(socket, "  delete <id> - Borrar el quiz indicado.");
    log(socket, "  edit <id> - Editar el quiz indicado.");
    log(socket, "  test <id> - Probar el quiz indicado.");
    log(socket, "  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket, "  credits - Créditos.");
    log(socket, "  q|quit - Salir del programa.");
    rl.prompt();
};

/**
 * Lista los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listComando = (socket, rl)  =>{

    //Nueva versión hace lo siguiente.
    models.quiz.findAll()  //Es una promesa, cuando se cumpla me dará todos los quizzes existentes.
        .each(quiz => {
            log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errorLog(socket, error.message);
        })
        //Then final, donde haya pasado lo que haya pasado, me saca el prompt.
        //No lo saco hasta que no haya terminado con las promesas anteriores.
        .then(() => {
            rl.prompt();
        });
};

/**
 * Promesa auxiliar que valida si existe el valor como parámetro y comprueba si el id es un número.
 * Si la cosa va bien, se devuelve la promesa con resolve y sino se saca el error con el reject.
 * @param id
 * @returns Promise
 */
const validateId = id => {

    return new Sequelize.Promise((resolve, reject) => {
        if(typeof id === "undefined") {
            reject(new Error(`Falta el parámetro <id>`));
        } else {
            id = parseInt(id); //Coge la parte entera.
            if(Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro <id> no es un número`));
            } else {
                resolve(id);
            }
        }
    });
};

/**
 * Muestra el quiz indicado en el parametro: La pregunta y la respuesta.
 *
 * @param id Clave del quiz a mostrar.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.showComando = (socket, rl, id) => {

    validateId(id) //Devuelve la promesa. Si no hay error, continuo. No me voy al catch.
        .then(id => models.quiz.findById(id)) //Busco el quiz, si lo encuentro, continuo.
        .then(quiz => {
            if (!quiz) { //Comprueba si realmente se ha devuelto un quiz.
                throw new Error(`No existe un quiz asociado al id=${id}`);
            }
            log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(error => {
            errorLog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * Función auxiliar que realiza una promesa a la hora hacer una pregunta.
 * Cuando se cumple la promesa, proporciona el texto introducido.
 * Colorea en rojo el texto con el que voy a preguntar y espera la respuesta.
 * @param rl
 * @param text
 * @returns Promesa
 */
const makeQuestion = (rl, text) => {

    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};

/**
 * Añade un nuevo quiz al modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addComando = (socket, rl)  => {

    makeQuestion(rl, ' Introduzca una pregunta: ')
        .then(q => {
            return makeQuestion(rl, ' Introduzca una respuesta: ')
                .then(a => {
                    return {question: q, answer: a};
                });
        })
        .then(quiz => {
            return models.quiz.create(quiz);
        })
        .then((quiz) => {
            log(socket, ` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorLog(socket, 'El quiz es erróneo:');
            error.errors.forEach(({message}) => errorLog(message));
        })
        .catch(error => {
            errorLog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });

};


/**
 * Borra un quiz del modelo.
 *
 * @param id Clave del quiz a borrar en el modelo.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.deleteComando = (socket, rl, id) => {

    validateId(id)
        .then(id => models.quiz.destroy({where: {id}}))
        .catch(error => {
            errorLog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};



/**
 * Edita un quiz del modelo.
 *
 * @param id Clave del quiz a editar en el modelo.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.editComando = (socket, rl, id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if(!quiz){
                throw new Error(`No existe un quiz asociado al id=${id}`);
            }
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
            return makeQuestion(rl, ' Introduzca la pregunta: ')
                .then(q => {
                    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
                    return makeQuestion(rl, ' Introduzca la respuesta: ')
                        .then(a => {
                            quiz.question = q;
                            quiz.answer = a;
                            return quiz;
                        });
                });
        })
        .then(quiz => {
            return quiz.save();
        })
        .then(quiz => {
            log(socket, ` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorLog(socket, 'El quiz es erróneo:');
            error.errors.forEach(({message}) => errorLog(message));
        })
        .catch(error => {
            errorLog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};



/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param id Clave del quiz a probar.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.testComando = (socket, rl,id) => {
    //Valido el id como en el método editCmd.
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if(!quiz){
                throw new Error(`No existe un quiz asociado al id=${id}`);
            }
            //Hago la pregunta y si me la devuelve, la respuesta la comparo para ver si es correcta.
            return makeQuestion(rl, ` ¿ ${colorize(quiz.question, 'magenta')} ?`)
                .then(a => {
                    if (a.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
                        log(socket, 'Su respuesta es correcta.');
                        bigLog(socket, 'CORRECTO', 'green');

                    }else{
                        log(socket,'Su respuesta es incorrecta.');
                        bigLog(socket,'INCORRECTO', 'red');
                    }
                });
        })
        .catch(Sequelize.ValidationError, error => {
            errorLog(socket, 'El quiz es erróneo:');
            error.errors.forEach(({message}) => errorLog(message));
        })
        .catch(error => {
            errorLog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playComando = (socket,rl) => {

    //Para almacenar las preguntas que se han ido acertando. Numero de aciertos totales.
    let score = 0;
    let toBeResolved = [];

    //Es una promesa, cuando se cumpla me dará todos los id de los quizzes existentes.
    models.quiz.findAll()
        .each(quiz => {
            toBeResolved.push(quiz.id);

        })
        .then(() => {
            playOne();
        });

    //Función jugar otra pregunta más. Función recursiva.
    const playOne = () => {

        //Si no hay ninguna más por resolver, se termina con el rl.prompt()
        if (toBeResolved.length === 0) {

            //Sacamos mensaje diciendo que no hay nada más que preguntar.
            log(socket, ` No hay nada más que preguntar.`);

            //Sacamos la puntación. El numero de aciertos.
            log(socket, ` Fin del juego. Aciertos: ${score} `);
            bigLog(socket, ` ${score}`, 'magenta');

            //Para que el usuario meta otro comando.
            rl.prompt();

        }else {
            //Tengo que ir a por la posición del toBeResolved "final", dado que se irá modificando a medida que se vayan eliminando quizzes.
            let pos = Math.floor(Math.random()*toBeResolved.length);
            let id=toBeResolved[pos];
            //Vamos a validar el id que hemos obtenido aleatoriamente.
            validateId(id)
                .then(id => models.quiz.findById(id))
                .then(quiz => {
                    if(!quiz){
                        throw new Error(`No existe un quiz asociado al id=${id}`);
                    }
                    //Voy a preguntar la pregunta asociada al id escogido aleatoriamente.
                    //Hago la pregunta y si me la devuelve, la respuesta la comparo para ver si es correcta.
                    return makeQuestion(rl, ` ¿${colorize(quiz.question, 'magenta')}? `)
                        .then(a => {
                            if (a.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
                                score = score + 1;
                                //Y la quitamos del array, porque ya se habrá contestado.
                                //Por ejemplo, si hacemos toBeResolved.splice(3,1), dejaría el array como "0 1 2 4"
                                //No podemos usar model.deleteByIndex() porque afecta al json de las preguntas
                                //y la eliminaríamos de ahí.
                                toBeResolved.splice(pos, 1);
                                log(` CORRECTO - Lleva ${score} aciertos`);
                                //Llamada recursiva a playOne para que vuelva a jugar otra pregunta.
                                playOne();

                            }else{
                                log(socket, ` INCORRECTO.`);
                                log(socket,` Fin del juego. Aciertos: ${score} `);
                                bigLog(socket,` ${score}`, 'magenta');
                            }

                        });
                })
                .catch(Sequelize.ValidationError, error => {
                    errorLog(socket, 'El quiz es erróneo:');
                    error.errors.forEach(({message}) => errorLog(message));
                })
                .catch(error => {
                    errorLog(socket,error.message);
                })
                .then(() => {
                    rl.prompt();
                });
        }
    };

    //Para que empieze el proceso. Aquí la llamo. Arriba, solo estaba definida.
    //playOne();
};


/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsComando = (socket, rl) => {
    log(socket,'Autores de la práctica:');
    log(socket,'Alejandra Fiol de Nicolás', 'green');
    log(socket,'Laura Diaz', 'green');
    rl.prompt();
};



/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
// si ponemos el comando quit en uno de los clientes se sale del servidor y del resto de clientes activos
//para arreglarlo no solo cerramos el readline sino que tambien el socket
//para ello metemos socket.end()
exports.quitComando = (socket,rl) => {
    rl.close();
    socket.end();
};
