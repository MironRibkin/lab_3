import * as readline from 'node:readline/promises';
import * as crypto from 'node:crypto';
import pkg from 'secure-random';

const {randomArray} = pkg;

class Game {
    moves;
    rules;
    currentCompMove;
    secretKey;
    errorsList = [
        {
            name: 'Wrong size',
            description: "The number of choices must not be >= 3",
            example: 'rock scissors paper spock lizard'
        },
        {
            name: 'Odd error',
            description: "The number of choices must be odd",
            example: 'rock paper scissors lizard spock'
        },
        {
            name: 'Unique error',
            description: "The choices must be unique",
            example: 'rock scissors paper spock'
        }
    ]

    getError(errorCodes) {
        if (errorCodes) {
            errorCodes.forEach(errCode => {
                const err = this.errorsList[errCode];

                console.log(`Error: ${err.name}
            Description: ${err.description}
            Correct example: ${err.example} `);
            });
            process.exit();
        }
    }

    getMoves() {
        const moves = process.argv.slice(2);
        this.getError(this.checkInputMoves(moves));
        this.moves = moves;
    }

    showTable() {
        console.log('Available moves: ');
        this.moves.forEach((element, index) => {
            console.log(`${index + 1} - ${element}`);
        });
        console.log('0 - exit');
        console.log('? - help');
    }

    determineResult(yourMove, computerMove) {
        return this.rules[yourMove][computerMove];
    }

    createRules(moves = this.moves) {
        this.rules = moves.reduce((columns, yourMove, index, array) => {
            columns[yourMove] = array.reduce((rows, computerMove) => {
                const centredMoves = this.centerMove(array.slice(0), yourMove);
                const indexComputerMove = centredMoves.indexOf(computerMove);
                rows[computerMove] =
                    (computerMove === yourMove) ? 'draw'
                        : indexComputerMove < Math.floor(array.length / 2) ? 'lose'
                            : 'win';

                return rows;
            }, {});
            return columns;
        }, {});
    }

    checkInputMoves(moves) {
        const errors = [];
        const nonUnique = moves.some((move, index, arr) => {
            if (index !== arr.length) return arr.includes(move, index + 1)
        });
        if (nonUnique) errors.push(2);
        if (moves.length % 2 === 0) errors.push(1)
        if (moves.length < 3) errors.push(0);

        return errors.length === 0 ? false : errors;
    }

    centerMove(element, moveToCenter) {
        while (element.indexOf(moveToCenter) !== Math.floor(element.length / 2)) {
            element.unshift(element.pop())
        }
        return element
    }

    createCompMove() {
        this.currentCompMove = this.moves[Math.floor(Math.random() * this.moves.length)];
    }
}

class GameInterface {
    static async readData(question) {
        const readData = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const res = await readData.question(question)
        readData.close()
        return res;
    }


    static async showInterface(game) {
        const answer = await this.readData('Enter your choices: ');

        if ((answer >= 0 && answer <= game.moves.length) || answer === '?') {
            switch (answer) {
                case '0':
                    break;
                case '?':
                    console.table(game.rules);
                    this.showInterface(game);
                    break;

                default: {
                    console.log('Your choice:', game.moves[answer - 1]);
                    console.log('My choice:', game.currentCompMove);
                    console.log('You', game.determineResult(game.moves[answer - 1], game.currentCompMove));
                    console.log('HMAC key:', game.secretKey);

                    const exit = await this.readData('Shall we play again? (y/n): ');

                    if (exit === 'y') {
                        main();
                    }
                }
            }
        } else {
            console.log('The wrong command was entered! Try again');
            this.showInterface(game);
        }
    }
}

class SecretKey {
    static createSecretKey() {
        return randomArray(256).map((byte) => byte.toString(16)).join('');
    }
}

class Hmac {
    static createHMAC(key, message) {
        const HMAC = crypto.createHmac('sha3-256', key);
        HMAC.update(message);
        return HMAC.digest('hex');
    }
}

function main() {
    const game = new Game();
    game.getMoves();
    game.createRules();
    game.createCompMove();
    game.secretKey = SecretKey.createSecretKey();
    console.log('HMAC:', Hmac.createHMAC(game.secretKey, game.currentCompMove));
    game.showTable();
    GameInterface.showInterface(game);
}

main();

