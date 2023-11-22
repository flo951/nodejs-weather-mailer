import 'dotenv/config';
import nodemailer from 'nodemailer';
import google from 'googleapis';
import axios from 'axios';
import express from 'express';
import schedule from 'node-schedule';
const app = express();
const port = 3000;
let day;
let forecast;
app.get('/', (req, res) => {
    res.send('Welcome to the nodejs weather mailer!');
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
const getWeatherData = async () => {
    const options = {
        method: 'GET',
        url: 'https://weatherapi-com.p.rapidapi.com/forecast.json',
        params: { q: 'Vienna', days: '3' },
        headers: {
            'X-RapidAPI-Key': process.env.API_KEY,
            'X-RapidAPI-Host': 'weatherapi-com.p.rapidapi.com',
        },
    };
    try {
        const response = await axios.request(options);
        console.log({ response: response.data.forecast.forecastday[1] });
        day = response.data.forecast.forecastday[1].date;
        forecast = response.data.forecast.forecastday[1];
        const minTemp = forecast.day.mintemp_c;
        const maxTemp = forecast.day.maxtemp_c;
        const uvIndex = forecast.day.uv;
        const windSpeed = forecast.day.maxwind_kph;
        const createTransporter = async () => {
            try {
                const oauth2Client = new google.Auth.OAuth2Client(process.env.CLIENT_ID, process.env.CLIENT_SECRET, 'https://developers.google.com/oauthplayground');
                oauth2Client.setCredentials({
                    refresh_token: process.env.REFRESH_TOKEN,
                });
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        clientId: process.env.CLIENT_ID,
                        clientSecret: process.env.CLIENT_SECRET,
                    },
                });
                return transporter;
            }
            catch (err) {
                console.log(err);
                return err;
            }
        };
        const sendMail = async (recipient) => {
            try {
                const mailOptions = {
                    from: process.env.USER_EMAIL,
                    to: recipient,
                    subject: `Weather for Tomorrow ${day}`,
                    html: `
          <h3>Weather for Tomorrow ${day}</h3>
          <p>Min Temp: ${minTemp}°C</p>
          <p>Max Temp: ${maxTemp}°C</p>
          <p>UV Index: ${uvIndex}</p>
          <p>Wind Speed: ${windSpeed} kmh</p>
          <p>Have a nice day!</p>
          `,
                    auth: {
                        user: 'expensesplitterbot@gmail.com',
                        refreshToken: process.env.REFRESH_TOKEN,
                        accessToken: process.env.ACCESS_TOKEN,
                    },
                };
                let emailTransporter = await createTransporter();
                await emailTransporter.sendMail(mailOptions);
            }
            catch (err) {
                console.log(err);
            }
        };
        const emailList = [process.env.EMAIL1, process.env.EMAIL2];
        emailList.forEach((email) => email !== undefined && sendMail(email));
    }
    catch (error) {
        console.error(error);
    }
};
const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(0, 6)];
rule.hour = 20;
rule.minute = 0;
rule.tz = 'UTC+1';
schedule.scheduleJob(rule, function () {
    getWeatherData();
    console.log('send mail successfully');
});
console.log('server started');
