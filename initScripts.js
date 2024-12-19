document.addEventListener('DOMContentLoaded', () => {     
    try {         
        window.cloudController = new CloudController();         

        // Mount React components if needed         
        const regionMount = document.getElementById('regionSelectorMount');         
        if (regionMount) {             
            const root = ReactDOM.createRoot(regionMount);             
            root.render(React.createElement(RegionSelector));         
        }          

        const projectMount = document.getElementById('projectSelectorMount');         
        if (projectMount) {             
            const root = ReactDOM.createRoot(projectMount);             
            root.render(React.createElement(ProjectSelector));         
        }      
    } catch (error) {         
        console.error('Failed to initialize:', error);         
        const resultDiv = document.getElementById('result');         
        if (resultDiv) {             
            resultDiv.textContent = `Initialization error: ${error.message}`;             
            resultDiv.className = 'error';             
            resultDiv.classList.remove('hidden');         
        }     
    } 
});