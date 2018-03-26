
const readline = require('readline');
const model = require('./model');
const {log, bigLog, errorLog, colorize} = require("./out");
const comandos = require ("./comandos");
const net = require("net");

net.createServer(socket => {

    console.log("Se ha conectado un cliente desde " + socket.remoteAddress);

    //Mensaje inicial
    bigLog(socket, 'CORE QUIZ', 'blue');

    const rl = readline.createInterface({
        input: socket,
        output: socket,
        prompt: colorize("quiz > ", 'green'),
        completer : (line) => {
            const completions = 'h help add delete edit list test p play credits q quit'.split(' ');
            const hits = completions.filter((c) => c.startsWith(line));
            // show all completions if none found
            return [hits.length ? hits : completions, line];
        }
    });
    //atender los eventos de los socket
    socket
    //evento fin para que cuando el cliente cierre la conexion, cerrar el readline
        .on("end", () => {rl.close();} )
    //si hay algun error en la conexion cerramos tambien el readline
        .on("error", () => {rl.close();});

    rl.prompt();

    rl
        .on('line', (line) => {

            let args = line.split(" ");
            let comando = args[0].toLowerCase().trim();

            switch (comando) {
                case '':
                    rl.prompt();
                    break;

                case 'h':
                case 'help':
                    comandos.helpComando(socket, rl);
                    break;

                case 'quit':
                case 'q':
                    comandos.quitComando(socket, rl);
                    break;

                case 'add':
                    comandos.addComando(socket, rl);
                    break;

                case 'list':
                    comandos.listComando(socket, rl);
                    break;

                case 'show':
                    comandos.showComando(socket, rl, args[1]);
                    break;

                case 'test':
                    comandos.testComando(socket, rl, args[1]);
                    break;

                case 'play':
                case 'p':
                    comandos.playComando(socket, rl);
                    break;

                case 'delete':
                    comandos.deleteComando(rl,args[1]);
                    break;

                case 'edit':
                    comandos.editComando(socket, rl,args[1]);
                    break;

                case 'credits':
                    comandos.creditsComando(socket, rl);
                    break;

                default:
                    log(socket, `Comando desconocido: '${colorize(cmd, 'red')}'`);
                    log(socket, `Use ${colorize('help', 'green')} para ver todos los comandos disponibles.`);
                    rl.prompt();
                    break;
            }


        })
        //para que no se salga de todos lo sitios activos cuando en un cliente ponemos quit
        .on('close', () => {
            log( socket,'Adiós');
           // quitamos esa linea para no matar el servidor con quit process.exit(0);
        });


})
    .listen(3030);

