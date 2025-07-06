// src/App.jsx
import { useState, useEffect } from 'react';
import { ThemeProvider } from './components/theme-provider';
import { Header } from './components/header';
import { TransfersPage } from './pages/transfers-page';
import { LogsPage } from './pages/logs-page';

function App() {
    const [currentPage, setCurrentPage] = useState('transfers');

    useEffect(() => {
        // Simple routing based on URL path
        const path = window.location.pathname;
        if (path === '/logs') {
            setCurrentPage('logs');
        } else {
            setCurrentPage('transfers');
        }
    }, []);

    // Handle navigation
    const navigateTo = (page) => {
        setCurrentPage(page);
        window.history.pushState({}, '', page === 'transfers' ? '/' : `/${page}`);
    };

    return (
        <ThemeProvider defaultTheme="dark" storageKey="mega-cmd-theme">
            <div className="min-h-screen bg-background">
                <Header currentPage={currentPage} navigateTo={navigateTo} />

                <div className="container mx-auto px-4 py-6">
                    {currentPage === 'transfers' && <TransfersPage />}
                    {currentPage === 'logs' && <LogsPage />}
                </div>
            </div>
        </ThemeProvider>
    );
}

export default App;