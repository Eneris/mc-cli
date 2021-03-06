const net = require("net");
const dns = require("dns");
const mcpc_buffer = require("./mcpcBuffer");

const MC_DEFAULT_PORT = 25565;

function ping(server, port, callback, timeout, protocol) {

    if (typeof port == "function") {
        callback = port;
        port = MC_DEFAULT_PORT;
    }

    if (typeof port !== "number") {
        port = MC_DEFAULT_PORT;
    }

    if (typeof timeout == "undefined") {
        timeout = 3000;
    }

    // Use the specified protocol version, if supplied
    if (typeof protocol !== "number") {
        protocol = 47;
    }

    dns.resolveSrv('_minecraft._tcp.' + server, function (err, record) {
        let connectTo = {
            port: port,
            host: server
        };

        if (!err && 0 < record.length) {
            connectTo = {
                host: record[0].name,
                port: record[0].port
            }
        }

        let socket = net.connect(connectTo, function () {
            // Write out handshake packet.
            let handshakeBuffer = mcpc_buffer.createBuffer();

            handshakeBuffer.writeVarInt(0);
            handshakeBuffer.writeVarInt(protocol);
            handshakeBuffer.writeString(server);
            handshakeBuffer.writeUShort(port);
            handshakeBuffer.writeVarInt(1);

            writePCBuffer(socket, handshakeBuffer);

            // Write the set connection state packet, we should get the MOTD after this.
            let setModeBuffer = mcpc_buffer.createBuffer();

            setModeBuffer.writeVarInt(0);

            writePCBuffer(socket, setModeBuffer);
        });

        socket.setTimeout(timeout, function () {
            if (callback) {
                callback(new Error("Socket timed out when connecting to " + server + ":" + port), null);
            }

            socket.destroy();
        });

        let readingBuffer = Buffer.alloc(0);

        socket.on('data', function (data) {
            readingBuffer = Buffer.concat([readingBuffer, data]);

            let buffer = mcpc_buffer.createBuffer(readingBuffer);
            let length;

            try {
                length = buffer.readVarInt();
            } catch (err) {
                // The buffer isn't long enough yet, wait for more data!
                return;
            }

            // Make sure we have the data we need!
            if (readingBuffer.length < length - buffer.offset()) {
                return;
            }

            // Read the packet ID, throw it away.
            buffer.readVarInt();

            try {
                let json = JSON.parse(buffer.readString());

                // We parsed it, send it along!
                callback(null, json);
            } catch (err) {
                // Our data is corrupt? Fail hard.
                callback(err, null);

                return;
            }

            // We're done here.
            socket.destroy();
        });

        socket.once('error', function (err) {
            if (callback) {
                callback(err, null);
            }

            socket.destroy();
        });
    });


};

// Wraps our Buffer into another to fit the Minecraft protocol.
function writePCBuffer(client, buffer) {
    let length = mcpc_buffer.createBuffer();

    length.writeVarInt(buffer.buffer().length);

    client.write(Buffer.concat([length.buffer(), buffer.buffer()]));
}

module.exports = ping;
