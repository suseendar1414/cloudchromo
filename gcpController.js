class GcpController {
    constructor() {
        this.state = {
            isConnected: false,
            selectedProject: null,
            gcpData: null
        };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const elementConfigs = [
            { id: 'connectGcp', event: 'click', handler: () => this.handleConnect() },
            { id: 'askGcp', event: 'click', handler: () => this.handleAnalyze() }
        ];

        elementConfigs.forEach(config => {
            const element = document.getElementById(config.id);
            if (element) {
                element.addEventListener(config.event, config.handler);
            }
        });
    }

    async handleConnect() {
        try {
            const token = await this.authenticateUser();
            if (token) {
                this.state.isConnected = true;
                this.showMessage('Connected to GCP successfully! Please select a project.', 'success');
                await this.loadProjects(token);
            }
        } catch (error) {
            this.showMessage(`GCP Connection error: ${error.message}`, 'error');
        }
    }

    async authenticateUser() {
        try {
            return new Promise((resolve, reject) => {
                chrome.identity.getAuthToken({ interactive: true }, function(token) {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    resolve(token);
                });
            });
        } catch (error) {
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    async loadProjects(token) {
        try {
            const response = await fetch('https://cloudresourcemanager.googleapis.com/v1/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.projects) {
                const projectMount = document.getElementById('projectSelectorMount');
                if (projectMount) {
                    const root = ReactDOM.createRoot(projectMount);
                    root.render(React.createElement(ProjectSelector, {
                        projects: data.projects,
                        onProjectSelect: (projectId) => this.handleProjectSelect(projectId)
                    }));
                }
            }
            
            document.querySelector('.project-section')?.classList.remove('hidden');
        } catch (error) {
            throw new Error(`Failed to load projects: ${error.message}`);
        }
    }

    async handleProjectSelect(projectId) {
        try {
            this.state.selectedProject = projectId;
            const token = await this.authenticateUser();
            
            // Show relevant sections
            ['gcpDashboardContainer', 'gcpQuerySection'].forEach(id => {
                document.getElementById(id)?.classList.remove('hidden');
            });

            // Load GCP Cost Dashboard
            const dashboardMount = document.getElementById('gcpDashboard');
            if (dashboardMount) {
                const root = ReactDOM.createRoot(dashboardMount);
                root.render(React.createElement(GcpCostDashboard, {
                    projectId: projectId,
                    token: token
                }));
            }
        } catch (error) {
            this.showMessage(`Project selection error: ${error.message}`, 'error');
        }
    }

    async handleAnalyze() {
        if (!this.state.isConnected || !this.state.selectedProject) {
            this.showMessage('Please connect to GCP and select a project first', 'error');
            return;
        }

        const question = document.getElementById('questionGcp')?.value?.trim();
        if (!question) {
            this.showMessage('Please enter a question', 'error');
            return;
        }

        try {
            this.showMessage('Analyzing...', 'success');
            const token = await this.authenticateUser();
            let response = 'GCP Analysis Results:\n';

            // Handle Compute Engine queries
            if (question.toLowerCase().includes('instance') || question.toLowerCase().includes('vm')) {
                const computeResponse = await fetch(
                    `https://compute.googleapis.com/compute/v1/projects/${this.state.selectedProject}/aggregated/instances`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                
                const data = await computeResponse.json();
                const instances = [];
                
                // Process instances from all zones
                if (data.items) {
                    Object.values(data.items).forEach(item => {
                        if (item.instances) {
                            instances.push(...item.instances);
                        }
                    });
                }

                response += `\nCompute Engine Instances:\n`;
                response += `- Total instances: ${instances.length}\n`;
                
                if (instances.length > 0) {
                    response += '\nInstance Details:\n';
                    instances.forEach(instance => {
                        const machineType = instance.machineType.split('/').pop();
                        response += `- ${instance.name}: ${machineType}, ${instance.status}\n`;
                    });
                }
            }

            this.showMessage(response, 'success');
        } catch (error) {
            this.showMessage(`Analysis error: ${error.message}`, 'error');
        }
    }

    showMessage(message, type) {
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.textContent = message;
            resultDiv.className = type;
            resultDiv.classList.remove('hidden');
        }
    }
}

// Export the controller for usage
window.GcpController = GcpController;