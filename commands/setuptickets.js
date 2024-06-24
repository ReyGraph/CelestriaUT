const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const fs = require('fs');

const ticketConfig = require('../ticket-config.json');

module.exports = {
  data: {
    name: 'setupticket',
    description: 'Set up the ticket system.',
  },
  async execute(interaction) {
    if (!interaction.member.permissions.has('MANAGE_GUILD')) {
      return interaction.reply('You do not have the required permissions to use this command.');
    }

    const configurationOptions = [
      { name: 'ticketCategory', description: 'Ticket Category ID', current: ticketConfig.ticketCategoryID, validator: validateSnowflake },
      { name: 'logChannel', description: 'Log Channel ID', current: ticketConfig.logChannelID, validator: validateSnowflake },
      { name: 'supportRole', description: 'Support Role ID', current: ticketConfig.supportRoleID, validator: validateSnowflake },
      { name: 'verificationMessage', description: 'Verification Message', current: ticketConfig.verificationMessage, validator: validateNonEmptyString },
      { name: 'serverHelpMessage', description: 'Server Help Message', current: ticketConfig.serverHelpMessage, validator: validateNonEmptyString },
    ];

    const embed = new MessageEmbed()
      .setTitle('Ticket System Setup')
      .setDescription('Use the buttons below to configure the ticket system settings.')
      .setColor('#3498db');

    const rows = configurationOptions.map(option => {
      const button = new MessageButton()
        .setCustomId(option.name)
        .setLabel(option.description)
        .setStyle('PRIMARY');

      return new MessageActionRow().addComponents(button);
    });

    await interaction.reply({ embeds: [embed], components: rows });

    const collector = interaction.channel.createMessageComponentCollector({ filter: i => configurationOptions.some(opt => i.customId === opt.name), time: 30000 });

    collector.on('collect', async interaction => {
      const selectedOption = configurationOptions.find(opt => interaction.customId === opt.name);
      const currentValue = selectedOption.current;

      const promptEmbed = new MessageEmbed()
        .setTitle('Ticket System Setup')
        .setDescription(`Current value for ${selectedOption.description}: \`${currentValue}\`\n\nPlease enter the new value.`)
        .setColor('#3498db');

      const promptMessage = await interaction.followUp({ embeds: [promptEmbed] });

      const responseCollector = interaction.channel.createMessageCollector({ filter: msg => msg.author.id === interaction.user.id, time: 30000 });

      responseCollector.on('collect', async response => {
        const newValue = response.content.trim();

        if (selectedOption.validator(newValue)) {
          ticketConfig[selectedOption.name] = newValue;
          saveTicketConfig();

          const successEmbed = new MessageEmbed()
            .setTitle('Ticket System Setup')
            .setDescription(`${selectedOption.description} updated successfully.`)
            .setColor('#2ecc71');
          
          promptMessage.edit({ embeds: [successEmbed] });
        } else {
          const errorEmbed = new MessageEmbed()
            .setTitle('Ticket System Setup')
            .setDescription(`Invalid value for ${selectedOption.description}. Please try again.`)
            .setColor('#e74c3c');
          
          promptMessage.edit({ embeds: [errorEmbed] });
        }

        responseCollector.stop();
      });

      responseCollector.on('end', () => {
        promptMessage.delete();
        interaction.editReply({ components: [] });
      });
    });
  },
};

function validateSnowflake(value) {
  return /^[0-9]{18}$/.test(value);
}

function validateNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function saveTicketConfig() {
  fs.writeFileSync('ticket-config.json', JSON.stringify(ticketConfig, null, 2), 'utf-8');
}
