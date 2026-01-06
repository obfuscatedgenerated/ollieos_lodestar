import type {Program} from "ollieos/types";

export default {
    name: "lodestar-send",
    description: "Publish a string message to a Lodestar topic.",
    usage_suffix: "<topic> [-j] <message>",
    arg_descriptions: {
        "Arguments:": {
            "topic": "The topic to publish the message to.",
            "message": "The message to publish.",
            "-j": "Indicates that the message is in JSON format, rather than plain text.",
        },
    },
    main: async (data) => {
        const {term, args, process} = data;

        if (args.length < 2) {
            term.execute("help lodestar-send");
            return 1;
        }

        const topic = args[0];
        const message_txt = args.slice(1).join(" ");

        let message: string | object;

        // check for -j flag
        const json_flag_index = args.indexOf("-j");
        if (json_flag_index !== -1) {
            // remove -j from args
            args.splice(json_flag_index, 1);

            // parse message
            try {
                message = JSON.parse(message_txt);
            } catch (e) {
                term.writeln("Failed to parse message as JSON.");
                return 1;
            }
        } else {
            message = message_txt;
        }

        const ipc = term.get_ipc();
        const channel = ipc.create_channel(process.pid, "lodestar");

        if (!channel) {
            term.writeln("Failed to create IPC channel to Lodestar service. Is the lodestard running?");
            return 1;
        }

        const publish_msg = {
            type: "publish",
            topic,
            message,
        };

        ipc.channel_send(channel, process.pid, publish_msg);

        if (typeof message === "object") {
            term.writeln(`Published JSON message to topic '${topic}': ${JSON.stringify(message)}`);
        } else {
            term.writeln(`Published message to topic '${topic}': ${message}`);
        }

        return 0;
    }
} as Program;
