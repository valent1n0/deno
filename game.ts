import { WebSocket, isWebSocketCloseEvent } from 'https://deno.land/std/ws/mod.ts';
import { v4 } from 'https://deno.land/std/uuid/mod.ts';

const players = new Map<string, {
    socket: WebSocket,
    x: number,
    y: number,
    name: string,
    color: string
}>();

function broadcast(): void {
    let data = [];
    for(const player of players.values()) {
        data.push({
            x: player.x,
            y: player.y,
            name: player.name,
            color: player.color
        })
    }
    for (const player of players.values()) {
        player.socket.send(JSON.stringify({
            type: 'update',
            players: data
        }));
    }
}

export async function game(ws: WebSocket): Promise<void> {
    // Create id and add it to players lit
    const id = v4.generate();
    players.set(id, {
        socket: ws,
        x: 0,
        y: 0,
        name: '',
        color: '#' + (Math.random().toString(16) + "000000").substring(2,8)
    });
    broadcast();
    for await (const ev of ws) {
        console.log(ev);
        if (typeof ev === 'string') {
            let message = JSON.parse(ev);
            if (message.type === 'join') {
                let p = players.get(id);
                if (p) {
                    p.name = message.name;
                }
            }
            if (message.type === 'update') {
                let p = players.get(id);
                if (p) {
                    let message = JSON.parse(ev);
                    console.log(message);
                    p.x = message.data.x;
                    p.y = message.data.y;
                    broadcast();
                }
            }
        } 
        else if (isWebSocketCloseEvent(ev)) {
            players.delete(id);
            broadcast();
            break;
        }
    } 
}

