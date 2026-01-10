import type {Program} from "ollieos/types";

export default {
    name: "lodestar-sub-test",
    description: "Test subscribing to a Lodestar topic and receiving messages.",
    usage_suffix: "<topic>",
    arg_descriptions: {
        "Arguments:": {
            "topic": "The topic to subscribe to. Wildcards are supported.",
        },
    },
    compat: "2.0.0",
    main: async (data) => {
        const {kernel, term, args, process} = data;

        if (args.length < 1) {
            term.writeln("Usage: lodestar-sub-test <topic>");
            return 1;
        }

        const topic = args[0];

        const ipc = kernel.get_ipc();
        const channel = ipc.create_channel(process.pid, "lodestar");

        if (!channel) {
            term.writeln("Failed to create IPC channel to Lodestar service. Is the lodestard running?");
            return 1;
        }

        // listen for confirmation message or error
        ipc.channel_listen(channel, process.pid, async (msg) => {
            const msg_data = msg.data as { type: string; [key: string]: any };

            if (msg_data.type === "error") {
                term.writeln(`Subscription error: ${msg_data.message}`);
                process.kill(1);
            } else if (msg_data.type === "subscribe_ack") {
                term.writeln(`Successfully subscribed to topic '${topic}'.`);
            } else {
                term.writeln(`Received message on topic '${topic}': ${JSON.stringify(msg.data)}`);
            }
        });

        const sub_msg = {
            type: "subscribe",
            topic,
        };

        ipc.channel_send(channel, process.pid, sub_msg);

        process.detach();
        return 0;
    }
} as Program;
