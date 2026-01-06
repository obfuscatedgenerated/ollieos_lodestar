interface TrieNode {
    // channel ids
    subscribers: Set<number>;

    children: Map<string, TrieNode>;
}

const create_empty_node = (): TrieNode => ({
    subscribers: new Set<number>(),
    children: new Map<string, TrieNode>(),
});


const root = create_empty_node();

export const subscribe = (topic: string, channel_id: number) => {
    const parts = topic.split(".").filter((part) => part.length > 0);
    let node = root;

    for (const part of parts) {
        if (!node.children.has(part)) {
            node.children.set(part, create_empty_node());
        }
        node = node.children.get(part)!;
    }

    node.subscribers.add(channel_id);
}

export const unsubscribe = (topic: string, channel_id: number) => {
    const parts = topic.split(".").filter((part) => part.length > 0);
    let node = root;

    for (const part of parts) {
        if (!node.children.has(part)) {
            return;
        }
        node = node.children.get(part)!;
    }

    node.subscribers.delete(channel_id);
}

export const get_specific_subscribers = (topic: string): Set<number> => {
    const parts = topic.split(".").filter((part) => part.length > 0);
    let node = root;

    for (const part of parts) {
        if (!node.children.has(part)) {
            return new Set<number>();
        }
        node = node.children.get(part)!;
    }

    return new Set<number>(node.subscribers);
}

export const get_all_subscribers = (topic: string): Set<number> => {
    const parts = topic.split(".").filter((part) => part.length > 0);
    const result = new Set<number>();

    const dfs = (node: TrieNode, depth: number) => {
        if (depth === parts.length) {
            for (const sub of node.subscribers) {
                result.add(sub);
            }
            return;
        }

        const part = parts[depth];

        // exact match
        if (node.children.has(part)) {
            dfs(node.children.get(part)!, depth + 1);
        }

        // wildcard match
        if (node.children.has("*")) {
            dfs(node.children.get("*")!, depth + 1);
        }
    }

    dfs(root, 0);

    return result;
}

export const check_subscribed = (topic: string, channel_id: number): boolean => {
    const parts = topic.split(".").filter((part) => part.length > 0);
    let node = root;

    for (const part of parts) {
        if (!node.children.has(part)) {
            return false;
        }
        node = node.children.get(part)!;
    }

    return node.subscribers.has(channel_id);
}

export const validate_syntax = (topic: string): boolean => {
    const parts = topic.split(".");

    for (const part of parts) {
        if (part.length === 0) {
            return false;
        }
        if (part !== "*" && !/^[a-zA-Z0-9_-]+$/.test(part)) {
            return false;
        }
    }

    return true;
}
