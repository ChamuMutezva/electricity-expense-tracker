"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Cloud,
    Sun,
    CloudRain,
    Thermometer,
    Wind,
    RefreshCw,
    MapPin,
    AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WeatherData {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    description: string;
    location: string;
    icon: string;
}

interface WeatherResponse {
    main: {
        temp: number;
        humidity: number;
    };
    weather: Array<{
        main: string;
        description: string;
        icon: string;
    }>;
    wind: {
        speed: number;
    };
    name: string;
}

export default function WeatherUsageCorrelation() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [usageImpact, setUsageImpact] = useState<string>("");
    const [impactLevel, setImpactLevel] = useState<"low" | "medium" | "high">(
        "medium"
    );
    const [location, setLocation] = useState<{
        lat: number;
        lon: number;
    } | null>(null);

    // Get user's location
    const getUserLocation = () => {
        setLoading(true);
        setError("");

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by this browser");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
            },
            (error) => {
                setError(error.message);
                setLoading(false);
            }
        );
    };

    // Fetch weather data
    const fetchWeatherData = async (lat: number, lon: number) => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);

            if (!response.ok) {
                throw new Error("Failed to fetch weather data");
            }

            const data: WeatherResponse = await response.json();

            const weatherData: WeatherData = {
                temperature: Math.round(data.main.temp),
                condition: data.weather[0].main.toLowerCase(),
                humidity: data.main.humidity,
                windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
                description: data.weather[0].description,
                location: data.name,
                icon: data.weather[0].icon,
            };

            setWeather(weatherData);
            calculateUsageImpact(weatherData);
        } catch (err) {
            setError("Failed to fetch weather data. Please try again.");
            console.error("Weather fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate usage impact based on weather
    const calculateUsageImpact = (weatherData: WeatherData) => {
        let impact = "";
        let level: "low" | "medium" | "high" = "medium";

        const temp = weatherData.temperature;
        const humidity = weatherData.humidity;

        if (temp > 30) {
            impact =
                "High AC usage expected due to hot weather. Consider using fans, closing curtains, and setting AC to 24-26°C";
            level = "high";
        } else if (temp < 10) {
            impact =
                "High heating usage expected. Use layers, check insulation, and set heating to 18-20°C";
            level = "high";
        } else if (temp > 26) {
            impact =
                "Moderate cooling needed. Use fans before AC, open windows at night";
            level = "medium";
        } else if (temp < 15) {
            impact =
                "Light heating may be needed. Dress warmly and use blankets first";
            level = "medium";
        } else {
            impact =
                "Optimal temperature for energy efficiency. Minimal heating/cooling needed";
            level = "low";
        }

        // Add humidity factor
        if (humidity > 70) {
            impact += ". High humidity may increase AC usage for comfort.";
            level = level === "low" ? "medium" : "high";
        } else if (humidity < 30) {
            impact += ". Low humidity may require humidifiers.";
        }

        // Add wind factor
        if (weatherData.windSpeed > 20) {
            impact += " Strong winds - good for natural ventilation.";
        }

        setUsageImpact(impact);
        setImpactLevel(level);
    };

    // Auto-fetch weather on component mount
    useEffect(() => {
        getUserLocation();
    }, []);

    // Fetch weather when location is available
    useEffect(() => {
        if (location) {
            fetchWeatherData(location.lat, location.lon);
        }
    }, [location]);

    const getWeatherIcon = (condition: string, iconCode?: string) => {
        // You can use the OpenWeatherMap icon or custom icons
        if (iconCode) {
            return (
                <img
                    src={`https://openweathermap.org/img/wn/${iconCode}@2x.png`}
                    alt={condition}
                    className="h-12 w-12"
                />
            );
        }

        // Fallback to custom icons
        switch (condition) {
            case "clear":
                return <Sun className="h-8 w-8 text-yellow-500" />;
            case "rain":
            case "drizzle":
                return <CloudRain className="h-8 w-8 text-blue-500" />;
            case "clouds":
                return <Cloud className="h-8 w-8 text-gray-500" />;
            default:
                return <Cloud className="h-8 w-8 text-gray-500" />;
        }
    };

    const getImpactColor = (level: string) => {
        switch (level) {
            case "high":
                return "text-red-700 bg-red-50 border-red-200";
            case "medium":
                return "text-orange-700 bg-orange-50 border-orange-200";
            default:
                return "text-green-700 bg-green-50 border-green-200";
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Thermometer className="h-5 w-5 text-orange-500" />
                        Weather Impact on Usage
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={getUserLocation}
                        disabled={loading}
                    >
                        {loading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert className="mb-4 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                {loading && !weather && (
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        <span>Getting weather data...</span>
                    </div>
                )}

                {weather && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                {getWeatherIcon(
                                    weather.condition,
                                    weather.icon
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-2xl">
                                            {weather.temperature}°C
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {weather.description}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        <span>{weather.location}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Wind className="h-4 w-4 text-blue-500" />
                                    <span>Wind: {weather.windSpeed} km/h</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Cloud className="h-4 w-4 text-gray-500" />
                                    <span>Humidity: {weather.humidity}%</span>
                                </div>
                            </div>
                        </div>

                        <div
                            className={`text-sm p-4 rounded-lg border ${getImpactColor(
                                impactLevel
                            )}`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">
                                    Energy Impact: {impactLevel.toUpperCase()}
                                </span>
                            </div>
                            <p className="leading-relaxed">💡 {usageImpact}</p>
                        </div>
                    </>
                )}

                {!weather && !loading && !error && (
                    <div className="text-center py-8">
                        <Button onClick={getUserLocation}>
                            <MapPin className="h-4 w-4 mr-2" />
                            Get Weather Data
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
