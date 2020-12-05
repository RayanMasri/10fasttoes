import io from 'socket.io-client';
import React from 'react';
import ReactDOM from 'react-dom';
import Users from './components/Users.js';
import Control from './components/Control.js';
import './App.css';

// percentage equation ((max - min) * percentage / 100 + min)

class App extends React.Component {
    constructor(props) {
        super(props);
        this.name = localStorage.getItem('user') || 'Unnamed';
    }

    onNameChange(event) {
        if (event.target.value === null) return;

        const string = event.target.value.substring(0, 15);

        this.name = string;

        localStorage.setItem('user', this.name);
        this.socket.emit('user.name', this.name);
    }

    componentDidMount() {
        // this.socket = io('http://localhost:4001/');
        this.socket = io();
        this.socket.emit('user.name', this.name);

        ReactDOM.render(
            <div className='users-inner'>
                <Users socket={this.socket}></Users>
            </div>,
            document.querySelector('.users-outer')
        );

        ReactDOM.render(
            <div className='control-inner'>
                <Control socket={this.socket}></Control>
            </div>,
            document.querySelector('.control-outer')
        );
    }

    render() {
        return (
            <div className='App'>
                <div className='users-outer'></div>
                <div className='control-outer'>
                    {/* <div
                        className='overlay'
                        style={{
                            fontSize: '150px',
                            backgroundColor: '#ccc8',
                            position: 'fixed',
                            top: '0',
                            left: '0',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 'max-content',
                                height: 'max-content',
                                textAlign: 'center',
                            }}
                        >
                            10
                        </div>
                    </div> */}
                </div>
                {/* 
                <Control
                    ref={this.control}
                    onUpdate={this.onUpdate.bind(this)}
                ></Control> */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'fixed',
                        bottom: 0,
                        right: 0,
                        padding: '20px',
                        backgroundColor: 'lightgray',
                        borderTopLeftRadius: '25px',
                    }}
                >
                    <input
                        type='text'
                        placeholder='Username here'
                        onChange={this.onNameChange.bind(this)}
                        defaultValue={this.name}
                        style={{
                            border: 'none',
                            outline: 'none',
                            background: 'none',
                        }}
                    ></input>
                </div>
            </div>
        );
    }
}

export default App;
