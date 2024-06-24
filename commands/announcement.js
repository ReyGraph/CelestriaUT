const { MessageActionRow, MessageSelectMenuBuilder, MessageEmbed, Permissions } = require('discord.js');

module.exports = {
    data: {
        name: 'announce',
        description: 'Build and send an announcement embed.',
    },
    async execute(interaction) {
        // Fetch only text channels for announcement
        const channels = interaction.guild.channels.cache.filter(channel => channel.isText());

        const channelOptions = channels.map(channel => ({
            label: `#${channel.name}`,
            value: channel.id,
        }));

        // Create a row with a dropdown menu for channel selection
        const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenuBuilder()
                    .setCustomId('channel')
                    .setPlaceholder('Select a channel')
                    .addOptions(channelOptions),
            );

        // Reply to the interaction with channel selection
        await interaction.reply({ content: 'Please select a channel for the announcement.', components: [row] });

        // Create a collector to listen for channel selection
        const filter = i => i.customId === 'channel' && i.isSelectMenu();
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        const announcement = {
            color: '#0099ff', // Default color
            description: 'This is an announcement!',
            attachments: [],
        };

        // Event listener for channel selection
        collector.on('collect', async i => {
            // Get the selected channel
            const selectedChannel = interaction.guild.channels.cache.get(i.values[0]);

            // Create an embed with user-defined features
            const embed = new MessageEmbed()
                .setColor(announcement.color)
                .setTitle('Announcement')
                .setDescription(announcement.description)
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL())
                .setFooter('Sent via Announcement Builder', interaction.guild.iconURL())
                .setTimestamp();

            // Send the embed to the selected channel
            const sentMessage = await selectedChannel.send({ embeds: [embed], files: announcement.attachments });

            // Follow up with a confirmation message including the message link
            await interaction.followUp(`Announcement sent in <#${selectedChannel.id}>. [View Message](${sentMessage.url})`);
        });

        // Handle the end of the collector
        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp('Announcement creation timed out.');
            }
        });

        // Function to check if the user has the MANAGE_MESSAGES permission
        const hasManageMessagesPermission = interaction.guild.me.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES);

        // Function to update the announcement options based on user input
        const updateAnnouncementOptions = async () => {
            announcement.color = interaction.options.getString('color') || announcement.color;
            announcement.description = interaction.options.getString('description') || announcement.description;

            // Check for attachments and permissions
            if (interaction.options.getMessage('attachment')) {
                const attachments = interaction.options.getMessage('attachment').attachments;
                if (attachments.size > 0 && hasManageMessagesPermission) {
                    announcement.attachments = attachments.map(attachment => attachment.url);
                }
            }
        };

        // Command options for customization
        interaction.options
            .addStringOption(option =>
                option.setName('color')
                    .setDescription('The color of the announcement embed in hexadecimal format (e.g., #FF0000).')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('The description of the announcement.')
                    .setRequired(false)
            )
            .addMessageOption(option =>
                option.setName('attachment')
                    .setDescription('Attachments to include in the announcement (up to 5).')
                    .setRequired(false)
            );

        // Event listener for options interaction
        client.on('interactionCreate', async optionInteraction => {
            if (!optionInteraction.isCommand() || optionInteraction.commandName !== 'announce') return;

            // Update announcement options based on user input
            await updateAnnouncementOptions();
        });
    },
};
