const { MessageEmbed } = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'help',
  description: 'Display information about the bot and available commands.',
  execute(message) {
    const prefix = config.PREFIX;

    const embed = new MessageEmbed()
      .setTitle('Bot Help')
      .setDescription('This bot provides various commands to help you in the server.')
      .addField(`${prefix}help`, 'Display this help message.')
      .addField(`${prefix}ping`, 'Check the bot\'s latency.')
      .addField(`${prefix}announce`, 'Send announcements with embeds.')
      .addField(`${prefix}setupnotifications`, 'Set up notifications for new YouTube videos.')
      .addField(`${prefix}setuptickets`, 'Set up the ticket system.')
      // Add more commands as needed
      .setColor('#3498db'); // You can customize the color

    message.channel.send({ embeds: [embed] });
  },
};
