import type { Program } from "ollieos/types";
import type { IPCMessage } from "ollieos/processes";

import {check_subscribed, get_all_subscribers, subscribe, unsubscribe, validate_syntax} from "./topic_trie";

const SERVICE_NAME = "lodestar";

interface LodestarMessageBase {
    type: "subscribe" | "unsubscribe" | "publish";
}

interface LodestarSubscribeMessage extends LodestarMessageBase {
    type: "subscribe";
    topic: string;
}

interface LodestarUnsubscribeMessage extends LodestarMessageBase {
    type: "unsubscribe";
    topic: string;
}

interface LodestarPublishMessage extends LodestarMessageBase {
    type: "publish";
    topic: string;
    message: unknown;
}

export default {
    name: "lodestard",
    description: "Lodestar - Pub/Sub IPC Star Network",
    usage_suffix: "",
    hide_from_help: true,
    arg_descriptions: {},
    main: async (data) => {
        const { term, process } = data;

        const ipc = term.get_ipc();

        // check if service is already running
        if (ipc.service_lookup(SERVICE_NAME)) {
            term.writeln("Lodestar service is already running.");
            return 1;
        }

        process.detach();

        // handle incoming messages
        const handle_message = (channel_id: number, msg: IPCMessage) => {
            // check msg is an object
            if (typeof msg.data !== "object" || msg.data === null) {
                ipc.channel_send(channel_id, process.pid, { type: "error", message: "Invalid message format." });
                return;
            }

            // check msg type
            const base_msg = msg.data as LodestarMessageBase;
            switch (base_msg.type) {
                case "subscribe":
                    const subscribe_msg = msg.data as LodestarSubscribeMessage;

                    // check topic is a string
                    if (typeof subscribe_msg.topic !== "string") {
                        ipc.channel_send(channel_id, process.pid, { type: "error", message: "Topic must be a string." });
                        return;
                    }

                    // validate topic
                    if (!validate_syntax(subscribe_msg.topic)) {
                        ipc.channel_send(channel_id, process.pid, { type: "error", message: "Invalid topic syntax." });
                        return;
                    }

                    // check for existing subscription
                    if (check_subscribed(subscribe_msg.topic, channel_id)) {
                        ipc.channel_send(channel_id, process.pid, { type: "warning", message: "Already subscribed to topic." });
                        return;
                    }

                    // process subscription
                    subscribe(subscribe_msg.topic, channel_id);

                    // notify success
                    ipc.channel_send(channel_id, process.pid, { type: "subscribe_ack", topic: subscribe_msg.topic });

                    break;
                case "unsubscribe":
                    const unsubscribe_msg = msg.data as LodestarUnsubscribeMessage;

                    // check topic is a string
                    if (typeof unsubscribe_msg.topic !== "string") {
                        ipc.channel_send(channel_id, process.pid, { type: "error", message: "Topic must be a string." });
                        return;
                    }

                    // validate topic
                    if (!validate_syntax(unsubscribe_msg.topic)) {
                        ipc.channel_send(channel_id, process.pid, { type: "error", message: "Invalid topic syntax." });
                        return;
                    }

                    // check for existing subscription
                    if (!check_subscribed(unsubscribe_msg.topic, channel_id)) {
                        ipc.channel_send(channel_id, process.pid, { type: "warning", message: "Not subscribed to topic." });
                        return;
                    }

                    // process unsubscription
                    unsubscribe(unsubscribe_msg.topic, channel_id);

                    // notify success
                    ipc.channel_send(channel_id, process.pid, { type: "unsubscribe_ack", topic: unsubscribe_msg.topic });

                    break;
                case "publish":
                    const publish_msg = msg.data as LodestarPublishMessage;

                    // check topic is a string
                    if (typeof publish_msg.topic !== "string") {
                        ipc.channel_send(channel_id, process.pid, { type: "error", message: "Topic must be a string." });
                        return;
                    }

                    // topic cannot contain wildcards when publishing
                    if (publish_msg.topic.includes("*")) {
                        ipc.channel_send(channel_id, process.pid, { type: "error", message: "Topic cannot contain wildcards when publishing." });
                        return;
                    }

                    // validate topic
                    if (!validate_syntax(publish_msg.topic)) {
                        ipc.channel_send(channel_id, process.pid, { type: "error", message: "Invalid topic syntax." });
                        return;
                    }

                    // get all subscribers
                    const subscribers = get_all_subscribers(publish_msg.topic);
                    for (const sub_channel_id of subscribers) {
                        // ignore sender
                        if (sub_channel_id === channel_id) {
                            continue;
                        }

                        ipc.channel_send(sub_channel_id, process.pid, { type: "message", topic: publish_msg.topic, message: publish_msg.message });
                    }

                    break;
                default:
                    ipc.channel_send(channel_id, process.pid, { type: "error", message: "Unknown message type." });
                    return;
            }
        }

        // register service to receive messages
        ipc.service_register(SERVICE_NAME, process.pid, (channel_id) => {
            ipc.channel_listen(channel_id, process.pid, (msg) => handle_message(channel_id, msg));
        });

        return 0;
    }
} as Program;
