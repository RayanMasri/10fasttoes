import React from 'react';
import ReactDOM from 'react-dom';

class Control extends React.Component {
    constructor(props) {
        super(props);
        this.socket = props.socket;

        this.state = {
            words: [],
            index: 0,
            started: false,
            time: 'waiting',
        };

        this.keystrokes = {
            idle: 0,
            error: 0,
            correct: 0,
        };
        this.initialTime = new Date();
        this.accuracy = 100;
        this.completed = 0;
        this.interval = setInterval(() => {
            if (this.state.started) {
                this.updateUser('playing');
            }
        }, 100);
        this.finished = false;
    }

    componentDidMount() {
        this.socket.on('room.update', (data) => {
            if (this.finished) {
                this.endScreen(
                    data.clients
                        .filter(
                            (client) =>
                                client.status == 'done' ||
                                client.status == 'done.left'
                        )
                        .sort((a, b) =>
                            a.id == this.socket.id
                                ? -1
                                : b.id == this.socket.id
                                ? 1
                                : 0
                        )
                );
            }

            if (!this.state.started) {
                if (data.status.tag == 'starting') {
                    this.setState({
                        words: this.state.words,
                        index: this.state.index,
                        started: this.state.started,
                        time: data.status.info.countdown.toString(),
                    });
                } else {
                    if (data.status.tag == 'started') {
                        this.setState({
                            words: this.state.words,
                            index: this.state.index,
                            started: true,
                            time: this.state.time,
                        });
                        this.initialTime = new Date();
                    } else {
                        this.setState({
                            words: this.state.words,
                            index: this.state.index,
                            started: this.state.started,
                            time: 'waiting',
                        });
                    }
                }
                console.log(data);
            }

            if (!this.state.words.length) {
                this.setState({
                    words: data.words.map((word, index) => {
                        return {
                            word: word,
                            status: index == 0 ? 'highlight' : 'idle',
                        };
                    }),
                    index: 0,
                    started: this.state.started,
                    time: this.state.time,
                });
            }
        });
    }

    endScreen(clients) {
        ReactDOM.render(
            <div>
                <div
                    style={{
                        backgroundColor: '#a7c8e7',
                    }}
                ></div>
                {clients.map((client) => {
                    return (
                        <div
                            style={{
                                width: '900px',
                                display: 'flex',
                                flexDirection: 'row',
                            }}
                        >
                            <div
                                style={{
                                    textAlign: 'center',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '125px',
                                }}
                            >
                                {client.name}
                            </div>

                            <div
                                style={{
                                    textAlign: 'center',
                                    width: '225px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <span>{client.wpm}</span>
                                <span>(words per minute)</span>
                            </div>

                            <div
                                style={{
                                    textAlign: 'center',
                                    width: '100px',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '15px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <span
                                        style={{
                                            marginRight: '5px',
                                        }}
                                    >
                                        (
                                    </span>
                                    <span
                                        style={{
                                            color: 'green',
                                            marginRight: '5px',
                                        }}
                                    >
                                        {client.correct}
                                    </span>
                                    <span
                                        style={{
                                            marginRight: '5px',
                                        }}
                                    >
                                        |
                                    </span>
                                    <span
                                        style={{
                                            color: 'red',
                                            marginRight: '5px',
                                        }}
                                    >
                                        {client.error}
                                    </span>
                                    <span
                                        style={{
                                            marginRight: '5px',
                                        }}
                                    >
                                        )
                                    </span>
                                </div>

                                <span
                                    style={{
                                        fontSize: '19px',
                                    }}
                                >
                                    {client.correct + client.error}
                                </span>
                            </div>

                            <div
                                style={{
                                    textAlign: 'center',
                                    width: '100px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <span>{client.accuracy}%</span>
                            </div>

                            <div
                                style={{
                                    textAlign: 'center',
                                    width: '100px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <span>
                                    {new Date(client.time)
                                        .getUTCMinutes()
                                        .toString()
                                        .padStart(2, '0') +
                                        ':' +
                                        new Date(client.time)
                                            .getSeconds()
                                            .toString()
                                            .padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>,
            document.querySelector('.control')
        );
    }

    updateUser(status) {
        var diff = this.keystrokes.error - this.keystrokes.correct;
        var res = diff <= 0 ? diff : 0;
        var accuracy = Math.abs(
            ((res / this.keystrokes.idle) * 100).toFixed(2)
        );
        var entries = this.keystrokes.correct + this.keystrokes.error;
        var diff = new Date(Math.abs(this.initialTime - new Date()));
        var ndiff = (diff.getUTCSeconds() + diff.getUTCMinutes() * 60) / 60;
        var wpm = ndiff < 0.01 ? 0 : Math.round(entries / 5 / ndiff);
        var percentage = (this.completed / 70) * 100;
        this.socket.emit(
            'user.update',
            wpm,
            accuracy,
            percentage,
            status,
            this.keystrokes.correct,
            this.keystrokes.error,
            Math.abs(this.initialTime - new Date())
        );
    }

    update(event) {
        if (event.target.value === null) return;

        const string = event.target.value;

        if (
            string.trim() !=
            this.state.words[this.state.index].word.substr(
                0,
                string.trim().length
            )
        ) {
            if (/\S/.test(string)) {
                this.keystrokes.error += 1;
            }
        } else {
            if (/\S/.test(string)) {
                this.keystrokes.correct += 1;
            }
        }

        if (/\S/.test(string)) {
            this.keystrokes.idle += 1;
        }

        if (string.indexOf(' ') >= 0) {
            var correct =
                string.split(' ')[0] == this.state.words[this.state.index].word;

            if (correct) {
                this.completed += 1;

                if (this.state.index == this.state.words.length - 1) {
                    this.end();
                }

                this.setState({
                    words: this.state.words.map((item, index) => {
                        return {
                            word: item.word,
                            status:
                                this.state.index == index
                                    ? 'correct'
                                    : this.state.index + 1 == index
                                    ? 'highlight'
                                    : item.status,
                        };
                    }),
                    index: this.state.index + 1,
                });
            } else {
                if (this.state.words[this.state.index].status != 'highlight') {
                    this.setState({
                        words: this.state.words.map((item, index) => {
                            return {
                                word: item.word,
                                status:
                                    this.state.index == index
                                        ? 'highlight'
                                        : item.status,
                            };
                        }),
                        index: this.state.index,
                    });
                }
            }

            event.target.value = '';

            return;
        }

        if (
            string.trim() !=
            this.state.words[this.state.index].word.substr(
                0,
                string.trim().length
            )
        ) {
            if (this.state.words[this.state.index].status != 'incorrect') {
                this.setState({
                    words: this.state.words.map((item, index) => {
                        return {
                            word: item.word,
                            status:
                                this.state.index == index
                                    ? 'incorrect'
                                    : item.status,
                        };
                    }),
                    index: this.state.index,
                });
            }
        } else {
            if (this.state.words[this.state.index].status != 'highlight') {
                this.setState({
                    words: this.state.words.map((item, index) => {
                        return {
                            word: item.word,
                            status:
                                this.state.index == index
                                    ? 'highlight'
                                    : item.status,
                        };
                    }),
                    index: this.state.index,
                });
            }
        }
    }

    end() {
        clearInterval(this.interval);
        this.finished = true;
        this.updateUser('done');
    }

    render() {
        return (
            <div
                style={{
                    width: 'max-content',
                    border: '2px solid gray',
                    borderRadius: '10px',
                    padding: '5px',
                }}
                class='control'
            >
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: this.state.started ? 'none' : 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'fixed',
                        top: '0',
                        left: '0',
                        backgroundColor: '#ccc8',
                        fontSize: '50px',
                    }}
                >
                    <span>{this.state.time}</span>
                </div>
                <div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            width: 'max-content',
                            padding: '10px',
                            height: '50px',
                        }}
                    >
                        {(
                            this.state.words.chunk(5)[
                                Math.ceil((this.state.index + 1) / 14) - 1
                            ] || []
                        ).map((item) => {
                            return (
                                <span
                                    style={{
                                        fontSize: '30px',
                                        textAlign: 'center',
                                        height: 'max-content',
                                        padding: '5px',
                                        color:
                                            item.status == 'correct'
                                                ? 'green'
                                                : 'black',
                                        backgroundColor:
                                            item.status == 'incorrect'
                                                ? 'red'
                                                : item.status == 'highlight'
                                                ? '#ccc'
                                                : 'transparent',
                                    }}
                                >
                                    {item.word}
                                </span>
                            );
                        })}
                    </div>
                    <div>
                        <input
                            type='text'
                            style={{
                                fontSize: '30px',
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '5px',
                            }}
                            disabled={!this.state.started}
                            onChange={this.update.bind(this)}
                        ></input>
                    </div>
                </div>
            </div>
        );
    }
}

Array.prototype.chunk = function (size) {
    return this.reduce(
        (memo, value, index) => {
            if (index % (this.length / size) == 0 && index !== 0) memo.push([]);
            memo[memo.length - 1].push(value);
            return memo;
        },
        [[]]
    );
};

export default Control;
