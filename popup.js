// Add this at the top of popup.js
window.initGapi = function() {
    gapi.load('client:auth2', async function() {
        try {
            await gapi.client.init({
                clientId: CONFIG.ERRORS.GCP.AUTH.CLIENT_ID,
                scope: CONFIG.ERRORS.GCP.AUTH.SCOPES.join(' '),
                cookiepolicy: 'none'  // This is important for Chrome extensions
            });
            console.log('GAPI initialized successfully');
        } catch (error) {
            console.error('GAPI initialization failed:', error);
        }
    });
};

class UIController {
    constructor() {
        this.state = {
            isConnected: false,
            selectedRegion: null,
            awsData: null
        };

        // Initialize AWS config with default settings
        AWS.config.update({
            region: CONFIG.AWS.DEFAULT_REGION,
            maxRetries: CONFIG.AWS.REQUEST_CONFIG.maxRetries,
            retryDelay: CONFIG.AWS.REQUEST_CONFIG.retryDelay,
            httpOptions: {
                timeout: CONFIG.AWS.REQUEST_CONFIG.timeout
            }
        });
        
        this.eventListeners = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const elementConfigs = [
            { id: 'connect', event: 'click', handler: () => this.handleConnect() },
            { id: 'ask', event: 'click', handler: () => this.handleAnalyze() },
            { id: 'showLogs', event: 'click', handler: () => this.handleShowLogs() },
            { id: 'summarizeLogs', event: 'click', handler: () => this.handleSummarizeLogs() }
        ];

        elementConfigs.forEach(config => {
            const element = document.getElementById(config.id);
            if (element) {
                element.addEventListener(config.event, config.handler);
                this.eventListeners.push({
                    element,
                    type: config.event,
                    handler: config.handler
                });
            }
        });
    }

    async handleConnect() {
        const credentials = {
            accessKey: document.getElementById('accessKey')?.value?.trim(),
            secretKey: document.getElementById('secretKey')?.value?.trim()
        };

        if (!credentials.accessKey || !credentials.secretKey) {
            this.showMessage(CONFIG.ERRORS.AWS.AUTHENTICATION.message, 'error');
            return;
        }

        try {
            CONFIG.log('Attempting AWS connection...');
            AWS.config.update({
                accessKeyId: credentials.accessKey,
                secretAccessKey: credentials.secretKey,
                region: CONFIG.AWS.DEFAULT_REGION
            });

            // Test AWS connectivity
            const sts = new AWS.STS();
            await sts.getCallerIdentity().promise();

            // Render Region Selector
            const regionMount = document.getElementById('regionSelectorMount');
            if (regionMount) {
                CONFIG.log('Mounting RegionSelector...');
                const root = ReactDOM.createRoot(regionMount);
                root.render(React.createElement(RegionSelector, {
                    onRegionSelect: (region) => {
                        CONFIG.log('Region selected:', region);
                        this.handleRegionSelect(region);
                    }
                }));
            } else {
                console.error('regionSelectorMount element not found');
            }

            document.querySelector('.region-section')?.classList.remove('hidden');
            this.showMessage('Connected successfully! Please select a region.', 'success');
            this.state.isConnected = true;

        } catch (error) {
            this.showMessage(`${CONFIG.ERRORS.AWS.CONNECTION.message}: ${error.message}`, 'error');
        }
    }

    async handleAnalyze() {
        if (!this.state.isConnected || !this.state.selectedRegion) {
            this.showMessage('Please connect to AWS and select a region first', 'error');
            return;
        }

        const question = document.getElementById('question')?.value?.trim();
        if (!question) {
            this.showMessage('Please enter a question', 'error');
            return;
        }

        try {
            this.showMessage('Analyzing...', 'success');
            let response = 'Analysis Results:\n';

            // Handle different types of questions
            if (question.toLowerCase().includes('ec2') || question.toLowerCase().includes('instances')) {
                const ec2 = new AWS.EC2({
                    apiVersion: CONFIG.AWS.SERVICES.EC2.API_VERSION
                });
                const instances = await ec2.describeInstances().promise();
                const runningInstances = instances.Reservations
                    .flatMap(r => r.Instances)
                    .filter(i => i.State.Name === 'running');

                response += `\nEC2 Instances:\n`;
                response += `- Total instances: ${runningInstances.length}\n`;
                response += `- Instance types in use: ${[...new Set(runningInstances.map(i => i.InstanceType))].join(', ')}\n`;
                
                // Add instance details
                if (runningInstances.length > 0) {
                    response += '\nInstance Details:\n';
                    runningInstances.forEach(instance => {
                        const name = instance.Tags?.find(t => t.Key === 'Name')?.Value || 'Unnamed';
                        response += `- ${name} (${instance.InstanceId}): ${instance.InstanceType}, ${instance.State.Name}\n`;
                    });
                }
            }

            if (question.toLowerCase().includes('s3') || question.toLowerCase().includes('bucket')) {
                const s3 = new AWS.S3();
                const buckets = await s3.listBuckets().promise();
                response += `\nS3 Buckets:\n`;
                response += `- Total buckets: ${buckets.Buckets.length}\n`;
                
                if (buckets.Buckets.length > 0) {
                    response += '- Bucket names:\n';
                    for (const bucket of buckets.Buckets) {
                        const region = await this.getBucketRegion(bucket.Name);
                        response += `  • ${bucket.Name} (${region})\n`;
                    }
                }
            }

            if (question.toLowerCase().includes('rds') || question.toLowerCase().includes('database')) {
                const rds = new AWS.RDS();
                const databases = await rds.describeDBInstances().promise();
                response += `\nRDS Databases:\n`;
                response += `- Total databases: ${databases.DBInstances.length}\n`;
                
                if (databases.DBInstances.length > 0) {
                    response += '\nDatabase Details:\n';
                    databases.DBInstances.forEach(db => {
                        response += `- ${db.DBInstanceIdentifier}: ${db.Engine} ${db.EngineVersion}, Status: ${db.DBInstanceStatus}\n`;
                    });
                }
            }

            this.showMessage(response, 'success');

        } catch (error) {
            this.showMessage(`Analysis error: ${error.message}`, 'error');
        }
    }

    async getBucketRegion(bucketName) {
        try {
            const s3 = new AWS.S3();
            const location = await s3.getBucketLocation({ Bucket: bucketName }).promise();
            return location.LocationConstraint || 'us-east-1';
        } catch (error) {
            return 'unknown';
        }
    }

    async handleRegionSelect(region) {
        try {
            AWS.config.update({ region });
            this.state.selectedRegion = region;

            // Render Dashboard
            const dashboardMount = document.getElementById('awsDashboard');
            if (dashboardMount) {
                const root = ReactDOM.createRoot(dashboardMount);
                root.render(React.createElement(CostDashboard));
            }

            // Show relevant sections
            ['dashboardContainer', 'querySection', 'logsSection'].forEach(id => {
                document.getElementById(id)?.classList.remove('hidden');
            });

        } catch (error) {
            this.showMessage(`Region selection error: ${error.message}`, 'error');
        }
    }

    async handleShowLogs() {
        try {
            const cloudwatchlogs = new AWS.CloudWatchLogs({
                apiVersion: CONFIG.AWS.SERVICES.CLOUDWATCH.API_VERSION
            });
            
            // First, check if we have logs access
            try {
                await cloudwatchlogs.describeLogGroups({limit: 1}).promise();
            } catch (error) {
                if (error.code === 'AccessDeniedException' || error.code === 'UnauthorizedOperation') {
                    this.showMessage(
                        'CloudWatch Logs access requires additional permissions beyond read-only access.' +
                        '\nRequired permissions include:' +
                        '\n- logs:GetLogEvents' +
                        '\n- logs:FilterLogEvents' +
                        '\n- logs:DescribeLogGroups' +
                        '\n\nPlease contact your AWS administrator if you need access to logs.',
                        'error'
                    );
                    return;
                }
            }
    
            // If we get here, we have access to logs
            const logGroups = await cloudwatchlogs.describeLogGroups().promise();
            let logsContent = 'CloudWatch Log Groups:\n\n';
            
            for (const group of logGroups.logGroups) {
                logsContent += `${group.logGroupName}\n`;
                logsContent += `- Created: ${new Date(group.creationTime).toLocaleString()}\n`;
                logsContent += `- Stored Bytes: ${group.storedBytes}\n\n`;
            }
    
            const logsArea = document.getElementById('logsArea');
            if (logsArea) {
                logsArea.value = logsContent;
                logsArea.classList.remove('hidden');
                document.getElementById('summarizeLogs')?.classList.remove('hidden');
            }
        } catch (error) {
            this.showMessage(`Error accessing logs: ${error.message}`, 'error');
        }
    }

    async handleSummarizeLogs() {
        // Since this is tied to CloudWatch Logs access, we should do the same permission check
        try {
            const cloudwatchlogs = new AWS.CloudWatchLogs({
                apiVersion: CONFIG.AWS.SERVICES.CLOUDWATCH.API_VERSION
            });
            
            // Check for logs access
            try {
                await cloudwatchlogs.describeLogGroups({limit: 1}).promise();
            } catch (error) {
                if (error.code === 'AccessDeniedException' || error.code === 'UnauthorizedOperation') {
                    this.showMessage(
                        'Log summarization requires CloudWatch Logs access permissions.' +
                        '\nRequired permissions include:' +
                        '\n- logs:GetLogEvents' +
                        '\n- logs:FilterLogEvents' +
                        '\n- logs:DescribeLogGroups' +
                        '\n\nPlease contact your AWS administrator if you need access to logs.',
                        'error'
                    );
                    return;
                }
            }
    
            const logsArea = document.getElementById('logsArea');
            if (!logsArea || !logsArea.value) {
                this.showMessage('No logs to summarize. Please fetch logs first.', 'error');
                return;
            }
    
            // If we have access and logs data, implement summarization
            this.showMessage('Log summarization feature is available with proper CloudWatch Logs access. You can analyze:' +
                '\n- Error patterns' +
                '\n- Common events' +
                '\n- Performance metrics' +
                '\n- System health indicators', 
                'success'
            );
        } catch (error) {
            this.showMessage(`Error with log summarization: ${error.message}`, 'error');
        }
    }
}


// Add the new CloudController class
class CloudController {
    constructor() {
        this.state = {
            activeProvider: 'aws',
            controllers: {
                aws: new UIController(),
                gcp: new GcpController()
            }
        };

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Cloud provider tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.handleTabSwitch(tab.dataset.target));
        });

        // Initialize provider-specific visibility
        this.updateVisibility();
    }

    handleTabSwitch(target) {
        this.state.activeProvider = target.includes('aws') ? 'aws' : 'gcp';
        
        document.querySelectorAll('.tab').forEach(t => 
            t.classList.toggle('active', t.dataset.target === target)
        );
        
        document.querySelectorAll('.tab-content').forEach(c => 
            c.classList.toggle('active', c.id === target)
        );

        this.updateVisibility();
    }

    updateVisibility() {
        const isAws = this.state.activeProvider === 'aws';
        document.getElementById('result').className = 'hidden';
        
        ['aws-content', 'gcp-content'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.toggle('active', 
                    isAws ? id === 'aws-content' : id === 'gcp-content'
                );
            }
        });
    }

    showMessage(message, type) {
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.textContent = message;
            resultDiv.className = type;
            resultDiv.classList.remove('hidden');
        }
    }

    getActiveController() {
        return this.controllers[this.state.activeProvider];
    }
}



// Export both controllers
window.UIController = UIController;
window.CloudController = CloudController;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.cloudController = new CloudController();
    } catch (error) {
        console.error('Failed to initialize cloud controller:', error);
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.textContent = `Initialization error: ${error.message}`;
            resultDiv.className = 'error';
            resultDiv.classList.remove('hidden');
        }
    }
});