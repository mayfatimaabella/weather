import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Geolocation } from '@capacitor/geolocation';
import { AlertController } from '@ionic/angular';

const API_URL = environment.API_URL;
const API_KEY = environment.API_KEY;

interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    wind_speed: number;
    weather: {
      description: string;
      icon: string;
    }[];
    feels_like: number;
  };
  daily: {
    dt: number;
    temp: {
      day: number;
    };
    weather: {
      description: string;
      icon: string;
    }[];
  }[];
  hourly: {
    dt: number;
    temp: number;
    weather: {
      description: string;
      icon: string;
    }[];
  }[];
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  currentWeather: WeatherData['current'] | undefined;
  dailyForecast: WeatherData['daily'] | undefined;
  hourlyForecast: WeatherData['hourly'] | undefined;
  units: string = 'metric';
  latitude: number | undefined;
  longitude: number | undefined;
  locationName: string = '';

  constructor(public httpClient: HttpClient, public alertController: AlertController) {
    this.getLocation();
  }

  async getLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      this.latitude = coordinates.coords.latitude;
      this.longitude = coordinates.coords.longitude;
      this.getWeatherData();
      this.getCityName();
    } catch (error) {
      this.presentAlert('Location Error', 'Cannot find your current location');
      this.latitude = 33.44;
      this.longitude = -94.04;
      this.getWeatherData();
      this.locationName = 'Enter location';
    }
  }

  getWeatherData() {
    if (this.latitude && this.longitude) {
      this.httpClient
        .get<WeatherData>(`${API_URL}/onecall?lat=${this.latitude}&lon=${this.longitude}&appid=${API_KEY}&units=${this.units}`)
        .subscribe((results) => {
          console.log(results);
          this.currentWeather = results.current;
          this.dailyForecast = results.daily.slice(1, 6);
          this.hourlyForecast = results.hourly.slice(0, 24);
        });
    }
  }

  async getCityName() {
    if (this.latitude && this.longitude) {
      const rvrsgeoCodingUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${this.latitude}&lon=${this.longitude}&limit=1&appid=${API_KEY}`;
      this.httpClient.get<any>(rvrsgeoCodingUrl).subscribe((results) => {
        if (results && results.length > 0) {
          this.locationName = results[0].name;
        } else {
          this.locationName = 'Location Not Found';
        }
      });
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async presentPrompt() {
    const alert = await this.alertController.create({
      header: 'Enter location',
      inputs: [
        {
          name: 'location',
          type: 'text',
          placeholder: 'City or Zip Code',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Search',
          handler: (data) => {
            this.getCoordinatesFromLocation(data.location);
          },
        },
      ],
    });
    await alert.present();
  }

  async getCoordinatesFromLocation(location: string) {
    const geocodingUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${API_KEY}`;
    this.httpClient.get<any>(geocodingUrl).subscribe((results) => {
      if (results && results.length > 0) {
        this.latitude = results[0].lat;
        this.longitude = results[0].lon;
        this.getWeatherData();
        this.locationName = results[0].name;
      } else {
        this.presentAlert('Location not found', 'Cant find specified location.');
      }
    });
  }

  getWeatherIcon(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  timeStamp(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  }

  dateFormat(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  }

  toggleUnits() {
    this.units = this.units === 'metric' ? 'imperial' : 'metric';
    this.getWeatherData();
  }

  getTempUnit(): string {
    return this.units === 'metric' ? '°C' : '°F';
  }
}