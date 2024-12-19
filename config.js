// config.js
const CONFIG = {
    ENV: {
        MODE: 'development',
        DEBUG: true,
        VERSION: '1.0.0'
    },

    // Existing AWS config remains unchanged
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
                // Other AWS regions...
            }
        },
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
        REQUEST_CONFIG: {
            timeout: 15000,
            maxRetries: 3,
            retryDelay: 1000
        }
    },

    // Adding GCP Configuration
    GCP: {
        REGIONS: {
            DEFAULT: 'us-central1',
            PREFERRED: ['us-central1', 'us-east1', 'europe-west1'],
            ALL: {
                'us-central1': {
                    name: 'Iowa',
                    active: true,
                    timeZone: 'America/Chicago',
                    zones: ['us-central1-a', 'us-central1-b', 'us-central1-c']
                },
                'us-east1': {
                    name: 'South Carolina',
                    active: true,
                    timeZone: 'America/New_York',
                    zones: ['us-east1-b', 'us-east1-c', 'us-east1-d']
                },
                'europe-west1': {
                    name: 'Belgium',
                    active: true,
                    timeZone: 'Europe/Brussels',
                    zones: ['europe-west1-b', 'europe-west1-c', 'europe-west1-d']
                },
                // Other GCP regions...
            }
        },
        SERVICES: {
            COMPUTE: {
                API_VERSION: 'v1',
                MAX_RESULTS: 100,
                RETRY_COUNT: 3
            },
            BILLING: {
                API_VERSION: 'v1',
                DEFAULT_TIMEFRAME_DAYS: 30
            },
            MONITORING: {
                API_VERSION: 'v3',
                LOG_RETENTION_DAYS: 14
            },
            RESOURCE_MANAGER: {
                API_VERSION: 'v1'
            }
        },
        REQUEST_CONFIG: {
            timeout: 15000,
            maxRetries: 3,
            retryDelay: 1000
        }
    },

    // Update UI configuration
    UI: {
        THEME: {
            colors: {
                primary: '#0066cc',
                secondary: '#6c757d',
                success: '#28a745',
                danger: '#dc3545',
                warning: '#ffc107',
                info: '#17a2b8',
                gcpBlue: '#4285F4',  // GCP brand color
                gcpRed: '#DB4437'    // GCP error color
            },
            fonts: {
                primary: 'system-ui, -apple-system, sans-serif',
                monospace: 'Monaco, Consolas, monospace'
            }
        },
        DASHBOARD: {
            refreshInterval: 300000,
            maxMetricsDisplayed: 6,
            costDecimalPlaces: 2
        },
        LOADING: {
            minDisplayTime: 500,
            spinnerSize: 'medium'
        }
    },

    // Update error messages
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
        GCP: {
            AUTH: {
                CLIENT_ID: '313190054173m07qk2acsbkd0dgprnk6t55boat4ihss.apps.googleusercontent.com',
                SCOPES: [
                    'https://www.googleapis.com/auth/compute.readonly',
                    'https://www.googleapis.com/auth/cloud-billing.readonly'
                ]
            },
            CONNECTION: {
                code: 'GCP_CONN_ERR',
                message: 'Failed to connect to Google Cloud services'
            },
            AUTHENTICATION: {
                code: 'GCP_AUTH_ERR',
                message: 'Google Cloud authentication failed'
            },
            PROJECT: {
                code: 'GCP_PROJECT_ERR',
                message: 'Failed to load Google Cloud projects'
            },
            BILLING: {
                code: 'GCP_BILLING_ERR',
                message: 'Failed to fetch billing data'
            }
        },
        OPENAI: {
            API: {
                code: 'OPENAI_API_ERR',
                message: 'OpenAI API request failed'
            }
        }
    },

    // Add GCP utility methods
    getGCPRegionName(regionCode) {
        return this.GCP.REGIONS.ALL[regionCode]?.name || regionCode;
    },

    isPreferredGCPRegion(regionCode) {
        return this.GCP.REGIONS.PREFERRED.includes(regionCode);
    },

    // Your existing utility methods remain unchanged
    getRegionName(regionCode) {
        return this.AWS.REGIONS.ALL[regionCode]?.name || regionCode;
    },

    isPreferredRegion(regionCode) {
        return this.AWS.REGIONS.PREFERRED.includes(regionCode);
    },

    getErrorMessage(errorCode) {
        for (const category in this.ERRORS) {
            for (const type in this.ERRORS[category]) {
                if (this.ERRORS[category][type].code === errorCode) {
                    return this.ERRORS[category][type].message;
                }
            }
        }
        return 'An unknown error occurred';
    },

    isDev() {
        return this.ENV.MODE === 'development';
    },

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
