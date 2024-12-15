const RegionSelector = ({ onRegionSelect }) => {
    const [regions, setRegions] = React.useState({
        active: [],
        recent: [],
        others: []
    });
    const [loading, setLoading] = React.useState(true);

    const getRecentRegions = () => {
        try {
            const saved = localStorage.getItem('recentAwsRegions');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            CONFIG.log('Error reading recent regions:', e);
            return [];
        }
    };

    const addToRecent = (regionId, regionName) => {
        try {
            const recent = getRecentRegions();
            const newRecent = [
                { id: regionId, name: regionName },
                ...recent.filter(r => r.id !== regionId)
            ].slice(0, 5);
            localStorage.setItem('recentAwsRegions', JSON.stringify(newRecent));
        } catch (e) {
            CONFIG.log('Error saving recent region:', e);
        }
    };

    const loadAllRegions = async () => {
        try {
            // First try to get regions from AWS API
            const ec2 = new AWS.EC2({
                region: CONFIG.AWS.DEFAULT_REGION,
                apiVersion: CONFIG.AWS.SERVICES.EC2.API_VERSION
            });
            const { Regions } = await ec2.describeRegions().promise();
            return Regions.map(r => ({
                id: r.RegionName,
                name: CONFIG.AWS.REGIONS.ALL[r.RegionName]?.name || r.RegionName
            }));
        } catch (error) {
            CONFIG.log('Error loading regions from AWS:', error);
            // Fallback to CONFIG's static region list
            return Object.entries(CONFIG.AWS.REGIONS.ALL)
                .filter(([_, details]) => details.active)
                .map(([id, details]) => ({
                    id: id,
                    name: details.name
                }));
        }
    };

    React.useEffect(() => {
        const initializeRegions = async () => {
            setLoading(true);
            try {
                const allRegions = await loadAllRegions();
                const recentRegions = getRecentRegions();
                const recentIds = new Set(recentRegions.map(r => r.id));

                // Filter out recent regions from others
                let others = allRegions.filter(region => !recentIds.has(region.id));

                // Sort others by name
                others.sort((a, b) => a.name.localeCompare(b.name));

                setRegions({
                    active: [],  // Will be populated when service checking is implemented
                    recent: recentRegions,
                    others: others
                });
            } catch (error) {
                CONFIG.log('Failed to initialize regions:', error);
                setRegions({
                    active: [],
                    recent: getRecentRegions(),
                    others: []
                });
            } finally {
                setLoading(false);
            }
        };

        initializeRegions();
    }, []);

    const handleRegionChange = (e) => {
        const select = e.target;
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption.value) {
            const regionId = selectedOption.value;
            const regionName = selectedOption.text;
            addToRecent(regionId, regionName);
            if (onRegionSelect) {
                onRegionSelect(regionId);
            }
        }
    };

    if (loading) {
        return React.createElement('div', { 
            className: 'p-4 text-gray-600',
            style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }
        }, 'Loading regions...');
    }

    return React.createElement('select', {
        id: 'region',
        className: 'w-full p-2 border rounded-md bg-white',
        onChange: handleRegionChange,
        style: {
            maxWidth: '100%'
        }
    }, [
        React.createElement('option', { 
            value: '', 
            disabled: true, 
            selected: true,
            key: 'default'
        }, 'Select a region'),
        
        regions.recent.length > 0 && React.createElement('optgroup', {
            label: 'Recently Used',
            key: 'recent'
        }, regions.recent.map(region =>
            React.createElement('option', {
                key: region.id,
                value: region.id
            }, region.name)
        )),
        
        regions.others.length > 0 && React.createElement('optgroup', {
            label: 'All Regions',
            key: 'others'
        }, regions.others.map(region =>
            React.createElement('option', {
                key: region.id,
                value: region.id
            }, region.name)
        ))
    ].filter(Boolean));
};

// Export the component for usage
window.RegionSelector = RegionSelector;