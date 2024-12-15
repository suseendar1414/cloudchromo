const fetchCostData = async (costExplorer) => {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const response = await costExplorer.getCostAndUsage({
            TimePeriod: {
                Start: lastMonth.toISOString().split('T')[0],
                End: now.toISOString().split('T')[0]
            },
            Granularity: 'MONTHLY',
            Metrics: ['UnblendedCost']
        }).promise();

        const currentMonth = response.ResultsByTime[1]?.Total?.UnblendedCost?.Amount || 0;
        const lastMonthCost = response.ResultsByTime[0]?.Total?.UnblendedCost?.Amount || 0;
        const costChange = lastMonthCost ? ((currentMonth - lastMonthCost) / lastMonthCost) * 100 : 0;

        return {
            currentCost: parseFloat(currentMonth),
            costChange: costChange
        };
    } catch (error) {
        CONFIG.log('Cost data fetch error:', error);
        return {
            currentCost: 0,
            costChange: 0
        };
    }
};

const fetchResourceData = async (ec2) => {
    try {
        const instances = await ec2.describeInstances().promise();
        const activeResources = instances.Reservations
            .flatMap(r => r.Instances)
            .filter(i => i.State.Name === 'running');

        return {
            activeResources: activeResources
        };
    } catch (error) {
        CONFIG.log('Resource data fetch error:', error);
        return {
            activeResources: []
        };
    }
};

const MetricCard = ({ title, value, subtitle, trend = null }) => {
    const trendClass = trend >= 0 ? 'text-red-500' : 'text-green-500';
    
    return React.createElement('div', { className: 'metric-card' }, [
        React.createElement('div', { className: 'metric-title font-bold mb-2' }, title),
        React.createElement('div', { className: 'metric-value text-2xl mb-1' }, value),
        trend !== null && React.createElement('div', {
            className: `metric-trend ${trendClass} text-sm`,
            key: 'trend'
        }, `${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(1)}%`),
        React.createElement('div', { className: 'metric-subtitle text-gray-600 text-sm' }, subtitle)
    ]);
};

const CostDashboard = () => {
    const [state, setState] = React.useState({
        loading: true,
        data: null,
        error: null
    });

    const fetchDashboardData = async () => {
        try {
            const costExplorer = new AWS.CostExplorer({
                apiVersion: CONFIG.AWS.SERVICES.COST_EXPLORER.API_VERSION
            });
            const ec2 = new AWS.EC2({
                apiVersion: CONFIG.AWS.SERVICES.EC2.API_VERSION
            });

            const [costData, resourceData] = await Promise.all([
                fetchCostData(costExplorer),
                fetchResourceData(ec2)
            ]);

            setState({
                loading: false,
                error: null,
                data: {
                    ...costData,
                    ...resourceData
                }
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));
            CONFIG.log('Dashboard data fetch error:', error);
        }
    };

    React.useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, CONFIG.UI.DASHBOARD.refreshInterval);
        return () => clearInterval(interval);
    }, []);

    if (state.loading) {
        return React.createElement('div', { className: 'p-4 text-center text-gray-600' },
            'Loading dashboard data...'
        );
    }

    if (state.error) {
        return React.createElement('div', { className: 'p-4 text-center text-red-500' },
            `Error loading dashboard: ${state.error}`
        );
    }

    return React.createElement('div', { className: 'dashboard' }, [
        React.createElement('div', { 
            className: 'grid grid-cols-1 md:grid-cols-2 gap-4', 
            key: 'metrics' 
        }, [
            React.createElement(MetricCard, {
                title: 'Monthly Cost',
                value: state.data?.currentCost ? 
                    `$${state.data.currentCost.toFixed(CONFIG.UI.DASHBOARD.costDecimalPlaces)}` : 
                    '$0.00',
                subtitle: 'Current month',
                trend: state.data?.costChange,
                key: 'monthly-cost'
            }),
            React.createElement(MetricCard, {
                title: 'Active Resources',
                value: state.data?.activeResources?.length || 0,
                subtitle: 'Running instances',
                key: 'active-resources'
            })
        ])
    ]);
};

// Export for window usage
window.CostDashboard = CostDashboard;