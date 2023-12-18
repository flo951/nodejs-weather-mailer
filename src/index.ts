import { Request, Response } from 'express';

import 'dotenv/config';
import nodemailer from 'nodemailer';
import axios from 'axios';
import express from 'express';
import schedule from 'node-schedule';

const app = express();
const port = 3000;
let day: string;
let forecast;

app.get('/', (req: Request, res: Response) => {
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
    console.log({
      response: response.data.forecast.forecastday[1],
    });
    day = response.data.forecast.forecastday[1].date;
    forecast = response.data.forecast.forecastday[1];
    const minTemp = forecast.day.mintemp_c;
    const maxTemp = forecast.day.maxtemp_c;
    const uvIndex = forecast.day.uv;
    const windSpeed = forecast.day.maxwind_kph;
    const condition = forecast.day.condition.text;
    const chanceOfRain = forecast.day.daily_chance_of_rain;
    const sunrise = forecast.astro.sunrise;
    const sunset = forecast.astro.sunset;
    const willItSnow = forecast.day.daily_will_it_snow === 1 ? 'Ja' : 'Nein';
    const createTransporter = async () => {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_PASSWORD,
          },
        });
        return transporter;
      } catch (err) {
        console.log(err);
        return err;
      }
    };

    const sendMail = async (recipient: string) => {
      try {
        const mailOptions = {
          from: process.env.USER_EMAIL,
          to: recipient,
          subject: `Wetter für morgen ${day}`,
          html: `
          <h3>Wetter für morgen den ${day}</h3>
          <p>Temperatur zwischen ${minTemp}°C - ${maxTemp}°C</p>
          <p>UV Index: ${uvIndex}</p>
          <p>Wind: ${windSpeed} kmh</p>
          <p>Regenwahrscheinlichkeit: ${chanceOfRain}%</p>
          <p>Wird es schneien?: ${willItSnow}</p>
          <p>Vorhersage: ${condition}</p>
          <p>Sonnenaufgang: ${sunrise}</p>
          <p>Sonnenuntergang: ${sunset}</p>
          `,
        };

        let emailTransporter: any = await createTransporter();
        await emailTransporter.sendMail(mailOptions);
      } catch (err) {
        console.log(err);
      }
    };

    const emailList = [process.env.EMAIL1, process.env.EMAIL2];

    emailList.forEach((email) => email !== undefined && sendMail(email));
  } catch (error) {
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
