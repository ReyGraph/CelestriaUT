const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js');
const parser = require('rss-parser');
const fs = require('fs');

module.exports = {
    name: 'setnotification',
    description: 'Set up YouTube notification reminders for a specific channel.',
    async execute(message, args) {
        // Check if the user has the 'MANAGE_GUILD' permission
        if (!message.member.permissions.has('MANAGE_GUILD')) {
            return message.reply('You do not have the required permissions to use this command.');
        }

        // Check if the correct number of arguments is provided
        if (args.length !== 1) {
            return message.reply(`Please provide the required arguments: !setnotification <channel>`);
        }

        const targetChannelName = args[0];
        const targetChannel = message.guild.channels.cache.find(channel => channel.name === targetChannelName);

        if (!targetChannel) {
            return message.reply('Invalid channel. Please provide a valid text channel name.');
        }

        // Get the YouTube channel URL for the guild (you need to provide the channel URL)
        const youtubeChannelUrl = 'https://www.youtube.com/c/@Celestrialin'; // Replace with the target YouTube channel URL

        // Get the RSS feed URL from FetchRSS
        const rssFeedUrl = 'http://fetchrss.com/rss/657762135e9b9571b904a022657767228b00861bed3edd12.xml'; // Replace with your FetchRSS feed URL

        // Save the notification settings to a file
        const settings = loadNotificationSettings();
        settings[message.guild.id] = {
            youtube: {
                channel: targetChannel.id,
                lastCheckedVideoTitle: null, // Initialize as null
            },
        };
        saveNotificationSettings(settings);

        // Set up logic to periodically check for new videos
        setInterval(async () => {
            try {
                const feed = await parser.parseURL(rssFeedUrl);

                // Check if the latest video is different from the last checked video
                const lastCheckedVideoTitle = settings[message.guild.id].youtube.lastCheckedVideoTitle;
                const latestVideo = feed.items[0];
                if (latestVideo.title !== lastCheckedVideoTitle) {
                    sendNotificationToDiscordChannel(targetChannel, latestVideo);
                    settings[message.guild.id].youtube.lastCheckedVideoTitle = latestVideo.title;
                    saveNotificationSettings(settings);
                }
            } catch (error) {
                console.error('Error checking for new YouTube videos:', error.message);
            }
        }, 60 * 60 * 1000); // Check every hour

        // Send a confirmation message
        message.reply(`YouTube notifications will be sent to ${targetChannel}. Setup complete!`);
    },
};

// Simulate saving and loading notification settings to/from a file
function saveNotificationSettings(settings) {
    fs.writeFileSync('notification-settings.json', JSON.stringify(settings, null, 2), 'utf-8');
}

function loadNotificationSettings() {
    try {
        const data = fs.readFileSync('notification-settings.json', 'utf-8');
        return JSON.parse(data) || {};
    } catch (error) {
        console.error('Error loading notification settings:', error.message);
        return {};
    }
}

function sendNotificationToDiscordChannel(targetChannel, video) {
    const videoUrl = video.link;
    const embed = new MessageEmbed()
        .setTitle(video.title)
        .setDescription(video.contentSnippet)
        .setURL(videoUrl)
        .setColor('#FF0000'); // Customize the color as needed

    targetChannel.send({ embeds: [embed] });
}
