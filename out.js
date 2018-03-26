

const figlet =  require('figlet');
const chalk = require('chalk');
const net = require("net");
/**
 * Dar color a un String
 * @param msg String al que damos color
 * @param color Color del que se pinta el msg
 * @returns {String} El String con el color indicado
 */
const colorize = (msg, color) => {
    if (typeof color !== "undefined"){
        msg = chalk[color].bold(msg);
    }
    return msg;
};
/**
 * Escribe un msg de log
 * @param msg String que tenemos que escribir
 * @param color Color del msg
 * @param socket para que nos imprima en la pantalla del cliente los comandos
 */
const log = ( socket, msg, color) => {
    //para que escriba en la pantalla de cada socket
    socket.write(colorize(msg, color) + "\n");
};
/**
 * Escribe el mensaje de log en grande
 * @param msg Texto
 * @param color Color del texto
 * @param socket
 */
const bigLog = ( socket, msg, color) => {
    log(socket, figlet.textSync (msg, {horizontalLayout: 'full'}), color);

};
/**
 * Escribe el mensaje de error emsg
 * @param emsg Texto del mensaje de error
 * @param socket
 */
const errorLog = (socket, emsg) => {
    socket.write(`${colorize('Error', 'red')}: ${colorize(colorize(emsg, 'red'), "bgYellowBright")}\n`);
};

exports = module.exports = {
    colorize,
    log,
    bigLog,
    errorLog
};
