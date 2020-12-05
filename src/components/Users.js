import React from 'react';
import ReactDOM from 'react-dom';

class Users extends React.Component {
    constructor(props) {
        super(props);
        this.socket = props.socket;
    }

    componentDidMount() {
        this.socket.on('room.update', (data) => {
            ReactDOM.render(
                <div>
                    {data.clients.map((client) => {
                        return (
                            <div
                                style={{
                                    opacity:
                                        client.status == 'left' ||
                                        client.status == 'done.left'
                                            ? '0.3'
                                            : '1',
                                }}
                            >
                                <div
                                    className='user-bar'
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        width: 'max-content',
                                    }}
                                >
                                    <svg height='50' width='1070' style={{}}>
                                        <g>
                                            <text
                                                x='1060'
                                                y='24'
                                                text-anchor='end'
                                            >
                                                {`${client.wpm} WPM`}
                                            </text>
                                            <text
                                                x='7'
                                                y='24'
                                                text-anchor='start'
                                            >
                                                {`${client.name} `}
                                            </text>

                                            {Array.range(0, 69).map((index) => {
                                                return (
                                                    <line
                                                        x1={(
                                                            12 +
                                                            (index * 10 +
                                                                index * 5)
                                                        ).toString()}
                                                        y1='36'
                                                        x2={(
                                                            12 +
                                                            ((index + 1) * 10 +
                                                                index * 5)
                                                        ).toString()}
                                                        y2='36'
                                                        style={{
                                                            stroke: 'gray',
                                                            strokeWidth: 2,
                                                        }}
                                                    />
                                                );
                                            })}
                                            <circle
                                                cx='12'
                                                cy='36'
                                                r='6'
                                                stroke='gray'
                                                strokeWidth='2'
                                                fill='white'
                                                stroke='gray'
                                            />

                                            <circle
                                                cx='1055'
                                                cy='36'
                                                r='6'
                                                stroke='gray'
                                                strokeWidth='2'
                                                fill='white'
                                                stroke='gray'
                                            />
                                            <g
                                                style={{
                                                    transform: `translate(${
                                                        (1043 *
                                                            client.percentage) /
                                                            100 +
                                                        12
                                                    }px, 36px)`,
                                                    transition:
                                                        'transform 0.2s',
                                                }}
                                            >
                                                <circle
                                                    r='5'
                                                    stroke='gray'
                                                    strokeWidth='2'
                                                    fill='gray'
                                                />
                                            </g>
                                        </g>
                                    </svg>
                                </div>
                            </div>
                        );
                    })}
                </div>,
                document.querySelector('.users')
            );
        });
    }

    render() {
        return <div className='users'></div>;
    }
}

Array.range = function (a, b, step) {
    var A = [];
    if (typeof a == 'number') {
        A[0] = a;
        step = step || 1;
        while (a + step <= b) {
            A[A.length] = a += step;
        }
    } else {
        var s = 'abcdefghijklmnopqrstuvwxyz';
        if (a === a.toUpperCase()) {
            b = b.toUpperCase();
            s = s.toUpperCase();
        }
        s = s.substring(s.indexOf(a), s.indexOf(b) + 1);
        A = s.split('');
    }
    return A;
};
export default Users;
