module.exports = {
    type: "object",
    properties: {
        queues: {
            type: "object",
            title: "Queues configuration",
            additionalProperties: {
                type: "object",
                properties: {
                    redis: { default: {}, oneOf: [{ type: "object" }, { type: "string" }] },
                    processors: {
                        type: "array",
                        items: {
                            oneOf: [
                                { type: "string" },
                                {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        service: { type: "string" },
                                        concurrency: { type: "integer" }
                                    },
                                    required: ["service"]
                                }
                            ]
                        }
                    },
                    jobs: {
                        type: "object",
                        additionalProperties: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                data: {},
                                options: { type: "object" }
                            }
                        }
                    }
                }
            }
        }
    }
};
