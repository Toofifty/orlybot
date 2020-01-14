import fetch from 'node-fetch';
import bot from 'core/bot';

const WAQI_URL = `https://api.waqi.info/feed/melbourne/?token=${process.env.WAQI_TOKEN}`;

const fetchAirQuality = async () => {
    const { data } = await fetch(WAQI_URL).then(body => body.json());
    return data;
};

const severity = aqi => {
    if (aqi > 300) {
        return {
            pollution: 'Hazardous',
            implications:
                'Health alert: everyone may experience more serious health effects',
            caution: 'Everyone should avoid all outdoor exertion',
        };
    }
    if (aqi > 200) {
        return {
            pollution: 'Very Unhealthy',
            implications:
                'Health warnings of emergency conditions. The entire population is more likely to be affected.	',
            caution:
                'Active children and adults, and people with respiratory disease, such as asthma, should avoid all outdoor exertion; everyone else, especially children, should limit outdoor exertion.',
        };
    }
    if (aqi > 150) {
        return {
            pollution: 'Unhealthy',
            implications:
                'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects',
            caution:
                'Active children and adults, and people with respiratory disease, such as asthma, should avoid prolonged outdoor exertion; everyone else, especially children, should limit prolonged outdoor exertion',
        };
    }
    if (aqi > 100) {
        return {
            pollution: 'Unhealthy for Sensitive Groups',
            implications:
                'Members of sensitive groups may experience health effects. The general public is not likely to be affected.',
            caution:
                'Active children and adults, and people with respiratory disease, such as asthma, should limit prolonged outdoor exertion.',
        };
    }
    if (aqi > 50) {
        return {
            pollution: 'Moderate',
            implications:
                'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.',
            caution:
                'Active children and adults, and people with respiratory disease, such as asthma, should limit prolonged outdoor exertion.',
        };
    }
    return {
        pollution: 'Good',
        implications:
            'Air quality is considered satisfactory, and air pollution poses little or no risk',
        caution: 'None',
    };
};

bot.cmd('aq', bot.passThrough('airquality')).desc('Shortcut for `airquality`');

bot.cmd('airquality', async ({ send }) => {
    const { aqi } = await fetchAirQuality();
    const { pollution, implications, caution } = severity(aqi);
    send(
        [
            `Current AQI in Melbourne CBD: *${aqi}* (${pollution})\n`,
            `*Health implications:* ${implications}\n`,
            `*Cautionary Statement (for PM2.5):* ${caution}\n`,
            `_More information available at_ https://aqicn.org/scale/`,
        ].join('\n')
    );
}).desc('Get the current AQI (Air Quality Index) value for Melbourne');
