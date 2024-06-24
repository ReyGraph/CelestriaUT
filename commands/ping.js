module.exports = {
  name: 'ping',
  description: 'Check the bot\'s latency.',
  execute(message) {
    const latency = Date.now() - message.createdTimestamp;
    message.reply(`Pong! Latency is ${latency}ms.`);
  },
};
