const { Command } = require("@lovejs/components/console");
const _ = require("lodash");

const jobStatus = ["waiting", "active", "completed", "failed", "delayed"];

class QueuesCommand extends Command {
    constructor(queues) {
        super();
        this.queues = queues;
    }

    getOutputStyles() {
        return {
            header: { fg: "whiteBright", style: ["bold"] },
            queueName: { fg: "#DB49AC", style: "bold" },
            waiting: { fg: "#FFF" },
            active: { fg: "#FFF" },
            completed: { fg: "#FFF" },
            failed: { fg: "#FFF" },
            delayed: { fg: "#FFF" }
        };
    }

    register(program) {
        program
            .command("queues:list")
            .description("Return list of availables queues")
            .action(this.executeList.bind(this));

        program
            .command("queues:empty")
            .option("-q, --queue [queue]", "Use following queue")
            .description("Empty the queue")
            .action(this.executeEmpty.bind(this));

        program
            .command("queues:clean")
            .option("-q, --queue [queue]", "Use following queue")
            .description("Clean the queue")
            .action(this.executeClean.bind(this));

        program
            .command("queues:jobs")
            .option("-q, --queue [queue]", "Use following queue")
            .description("List pending jobs on a queue")
            .action(this.executeJobs.bind(this));
    }

    async executeList() {
        const rows = [];
        rows.push([
            "[header]Queues[/header]",
            "[header]Waiting[/header]",
            "[header]Active[/header]",
            "[header]Completed[/header]",
            "[header]Failed[/header]",
            "[header]Delayed[/header]"
        ]);

        for (let queue of this.queues) {
            const jobs = await queue.getJobCounts();
            rows.push([`[queueName]${queue.name}[/queueName]`, ...jobStatus.map(j => `[${j}]${jobs[j]}[/${j}]`)]);
        }
    }

    async executeEmpty({}, { queue: name }) {
        const queue = this.getQueue(name);
        await queue.empty();
        for (let job of await queue.getRepeatableJobs()) {
            console.log(job);
            await queue.removeRepeatable(job.name, job);
        }
    }

    async executeClean({}, { queue: name }) {
        const queue = this.getQueue(name);
        await queue.clean(0);
    }

    async executeJobs(a, { queue: name }) {
        const queue = this.getQueue(name);
        const jobs = await queue.getJobs();
        const jobsr = await queue.getRepeatableJobs();

        const rows = [];

        for (let jobr of jobsr) {
            rows.push([jobr.id, jobr.cron]);
        }

        for (let job of jobs) {
            rows.push([job.id, await job.getState()]);
        }

        if (rows.length > 0) {
            this.output(this.table(rows));
        } else {
            this.output("[info]Queue is empty.[/info]", true);
        }
    }

    getQueue(name) {
        const queue = _.find(this.queues, q => q.name === name);
        if (!queue) {
            throw new Error(`Queue with name ${name} is not configured`);
        }
        return queue;
    }
}

module.exports = QueuesCommand;
