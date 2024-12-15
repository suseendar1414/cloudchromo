// config.js
const CONFIG = {
    ENV: {
        MODE: 'development',
        DEBUG: true,
        VERSION: '1.0.0'
    },
    AWS: {
        DEFAULT_REGION: 'us-east-1',
        REGIONS: {
            PREFERRED: ['us-east-1', 'us-west-2', 'eu-west-1'],
            ALL: {
                'us-east-1': {
                    name: 'US East (N. Virginia)',
                    active: true,
                    timeZone: 'America/New_York'
                },
                'us-west-1': {
                    name: 'US West (N. California)',
                    active: true,
                    timeZone: 'America/Los_Angeles'
                },
                'us-west-2': {
                    name: 'US West (Oregon)',
                    active: true,
                    timeZone: 'America/Los_Angeles'
                },
                'eu-west-1': {
                    name: 'Europe (Ireland)',
                    active: true,
                    timeZone: 'Europe/Dublin'
                },
                'eu-west-2': {
                    name: 'Europe (London)',
                    active: true,
                    timeZone: 'Europe/London'
                },
                'eu-west-3': {
                    name: 'Europe (Paris)',
                    active: true,
                    timeZone: 'Europe/Paris'
                },
                'eu-central-1': {
                    name: 'Europe (Frankfurt)',
                    active: true,
                    timeZone: 'Europe/Berlin'
                },
                'ap-southeast-1': {
                    name: 'Asia Pacific (Singapore)',
                    active: true,
                    timeZone: 'Asia/Singapore'
                },
                'ap-southeast-2': {
                    name: 'Asia Pacific (Sydney)',
                    active: true,
                    timeZone: 'Australia/Sydney'
                },
                'ap-northeast-1': {
                    name: 'Asia Pacific (Tokyo)',
                    active: true,
                    timeZone: 'Asia/Tokyo'
                },
                'ap-northeast-2': {
                    name: 'Asia Pacific (Seoul)',
                    active: true,
                    timeZone: 'Asia/Seoul'
                },
                'ap-northeast-3': {
                    name: 'Asia Pacific (Osaka)',
                    active: true,
                    timeZone: 'Asia/Osaka'
                },
                'ap-south-1': {
                    name: 'Asia Pacific (Mumbai)',
                    active: true,
                    timeZone: 'Asia/Kolkata'
                },
                'sa-east-1': {
                    name: 'South America (Sao Paulo)',
                    active: true,
                    timeZone: 'America/Sao_Paulo'
                },
                'ca-central-1': {
                    name: 'Canada (Central)',
                    active: true,
                    timeZone: 'America/Toronto'
                },
                'me-south-1': {
                    name: 'Middle East (Bahrain)',
                    active: true,
                    timeZone: 'Asia/Bahrain'
                },
                'af-south-1': {
                    name: 'Africa (Cape Town)',
                    active: true,
                    timeZone: 'Africa/Johannesburg'
                },
                'eu-north-1': {
                    name: 'Europe (Stockholm)',
                    active: true,
                    timeZone: 'Europe/Stockholm'
                },
                'ap-east-1': {
                    name: 'Asia Pacific (Hong Kong)',
                    active: true,
                    timeZone: 'Asia/Hong_Kong'
                }
            }
        },

        // Service specific configurations
        SERVICES: {
            EC2: {
                API_VERSION: '2016-11-15',
                MAX_RESULTS: 100,
                RETRY_COUNT: 3
            },
            COST_EXPLORER: {
                API_VERSION: '2017-10-25',
                DEFAULT_TIMEFRAME_DAYS: 30
            },
            CLOUDWATCH: {
                API_VERSION: '2014-03-28',
                LOG_RETENTION_DAYS: 14
            }
        },

        // Request configuration
        REQUEST_CONFIG: {
            timeout: 15000, // 15 seconds
            maxRetries: 3,
            retryDelay: 1000 // 1 second
        }
    },

    OPENAI: {
        API_KEY: 'API-key', // Remove process.env reference
        MODEL: 'gpt-4-turbo-preview',
        BASE_URL: 'https://api.openai.com/v1',
        MAX_TOKENS: 2000,
        TEMPERATURE: 0.7,
        DEFAULTS: {
            systemPrompt: "You are an AWS infrastructure expert assistant."
        }
    },

    UI: {
        THEME: {
            colors: {
                primary: '#0066cc',
                secondary: '#6c757d',
                success: '#28a745',
                danger: '#dc3545',
                warning: '#ffc107',
                info: '#17a2b8'
            },
            fonts: {
                primary: 'system-ui, -apple-system, sans-serif',
                monospace: 'Monaco, Consolas, monospace'
            }
        },
        DASHBOARD: {
            refreshInterval: 300000, // 5 minutes
            maxMetricsDisplayed: 6,
            costDecimalPlaces: 2
        },
        LOADING: {
            minDisplayTime: 500, // milliseconds
            spinnerSize: 'medium'
        }
    },

    // Error messages and codes
    ERRORS: {
        AWS: {
            CONNECTION: {
                code: 'AWS_CONN_ERR',
                message: 'Failed to connect to AWS services'
            },
            AUTHENTICATION: {
                code: 'AWS_AUTH_ERR',
                message: 'AWS authentication failed'
            },
            COST_DATA: {
                code: 'COST_DATA_ERR',
                message: 'Failed to fetch cost data'
            }
        },
        OPENAI: {
            API: {
                code: 'OPENAI_API_ERR',
                message: 'OpenAI API request failed'
            }
        }
    },

    // Utility methods
    getRegionName(regionCode) {
        return this.AWS.REGIONS.ALL[regionCode]?.name || regionCode;
    },

    isPreferredRegion(regionCode) {
        return this.AWS.REGIONS.PREFERRED.includes(regionCode);
    },

    getErrorMessage(errorCode) {
        // Traverse through ERRORS object to find matching error code
        for (const category in this.ERRORS) {
            for (const type in this.ERRORS[category]) {
                if (this.ERRORS[category][type].code === errorCode) {
                    return this.ERRORS[category][type].message;
                }
            }
        }
        return 'An unknown error occurred';
    },

    // Development mode checks
    isDev() {
        return this.ENV.MODE === 'development';
    },

    // Logging utility
    log(...args) {
        if (this.isDev() && this.ENV.DEBUG) {
            console.log('[Config]:', ...args);
        }
    }
};


Object.freeze(CONFIG);
window.CONFIG = CONFIG;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

