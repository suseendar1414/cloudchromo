const ProjectSelector = ({ onProjectSelect }) => {
    const [projects, setProjects] = React.useState({
        active: [],
        recent: [],
        others: []
    });
    const [loading, setLoading] = React.useState(true);

    const getRecentProjects = () => {
        try {
            const saved = localStorage.getItem('recentGcpProjects');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            CONFIG.log('Error reading recent projects:', e);
            return [];
        }
    };

    const addToRecent = (projectId, projectName) => {
        try {
            const recent = getRecentProjects();
            const newRecent = [
                { id: projectId, name: projectName },
                ...recent.filter(p => p.id !== projectId)
            ].slice(0, 5);
            localStorage.setItem('recentGcpProjects', JSON.stringify(newRecent));
        } catch (e) {
            CONFIG.log('Error saving recent project:', e);
        }
    };

    const loadProjects = async () => {
        try {
            return new Promise((resolve, reject) => {
                chrome.identity.getAuthToken({ interactive: true }, async function(token) {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    try {
                        const response = await fetch(
                            'https://cloudresourcemanager.googleapis.com/v1/projects',
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            }
                        );
                        const data = await response.json();
                        const projects = (data.projects || []).map(p => ({
                            id: p.projectId,
                            name: p.name || p.projectId
                        }));
                        resolve(projects);
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        } catch (error) {
            CONFIG.log('Error loading GCP projects:', error);
            return [];
        }
    };

    React.useEffect(() => {
        const initializeProjects = async () => {
            setLoading(true);
            try {
                const allProjects = await loadProjects();
                const recentProjects = getRecentProjects();
                const recentIds = new Set(recentProjects.map(p => p.id));

                // Filter out recent projects from others
                let others = allProjects.filter(project => !recentIds.has(project.id));

                // Sort others by name
                others.sort((a, b) => a.name.localeCompare(b.name));

                setProjects({
                    active: [],  // Could be used for favorite/pinned projects in future
                    recent: recentProjects,
                    others: others
                });
            } catch (error) {
                CONFIG.log('Failed to initialize projects:', error);
                setProjects({
                    active: [],
                    recent: getRecentProjects(),
                    others: []
                });
            } finally {
                setLoading(false);
            }
        };

        initializeProjects();
    }, []);

    const handleProjectChange = (e) => {
        const select = e.target;
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption.value) {
            const projectId = selectedOption.value;
            const projectName = selectedOption.text;
            addToRecent(projectId, projectName);
            if (onProjectSelect) {
                onProjectSelect(projectId);
            }
        }
    };

    if (loading) {
        return React.createElement('div', {
            className: 'p-4 text-center text-gray-600'
        }, 'Loading projects...');
    }

    return React.createElement('select', {
        id: 'project',
        className: 'w-full p-2 border rounded-md bg-white',
        onChange: handleProjectChange
    }, [
        React.createElement('option', {
            value: '',
            disabled: true,
            selected: true,
            key: 'default'
        }, 'Select a project'),

        projects.recent.length > 0 && React.createElement('optgroup', {
            label: 'Recently Used',
            key: 'recent'
        }, projects.recent.map(project =>
            React.createElement('option', {
                key: project.id,
                value: project.id
            }, project.name)
        )),

        projects.others.length > 0 && React.createElement('optgroup', {
            label: 'All Projects',
            key: 'others'
        }, projects.others.map(project =>
            React.createElement('option', {
                key: project.id,
                value: project.id
            }, project.name)
        ))
    ].filter(Boolean));
};

// Expose to window object instead of using export
window.ProjectSelector = ProjectSelector;