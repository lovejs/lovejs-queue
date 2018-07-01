const _ = require("lodash");
const { Plugin } = require("@lovejs/framework");
const {
    di: {
        Definitions: { Call, Service, Tag },
        helpers: { _service }
    }
} = require("@lovejs/components");

class QueuePlugin extends Plugin {
    async registerServices(container) {
        await container.loadDefinitions(__dirname + "/_framework/services/services.yml");
        const queues = this.get("queues");
        for (let queueName in queues) {
            const queue = queues[queueName];
            const { options, processors } = queue;
            const service = new Service("bull");
            service.setArgs([queueName, options]);
            service.addTag(new Tag("queue"));
            service.setPublic(true);
            for (let processor of processors) {
                const args = [];
                if (_.isObject(processor)) {
                    processor.name && args.push(processor.name);
                    processor.concurrency && args.push(processor.concurrency);
                    args.push(_service(processor.service));
                } else {
                    args.push(_service(processor));
                }

                service.addCall(new Call("process", args, false));
            }
            container.setService(`queue.${queueName}`, service);
        }
    }

    async boot(container) {
        const queues = this.get("queues");
        for (let queueName in queues) {
            const config = queues[queueName];
            const jobs = config.jobs;
            const queue = await container.get(`queue.${queueName}`);

            for (let jobId in jobs) {
                const job = await queue.getJob(jobId);
                console.log("job with job id is : ", jobId);
                console.log(jobs[jobId]);
                if (!job) {
                    console.log("job not found");
                    const { name, data, options } = jobs[jobId];
                    const args = [];
                    name && args.push(name);
                    args.push(data);
                    args.push({ ...options, jobId });
                    await queue.add(...args);
                }
            }
        }
    }
}

module.exports = QueuePlugin;
