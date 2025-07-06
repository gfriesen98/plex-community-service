// src/components/header.jsx
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from './theme-provider';

export function Header({ currentPage, navigateTo }) {
    const { theme, setTheme } = useTheme();

    return (
        <header className="border-b">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold">🐈‍⬛ Mega CMD</h1>
                        <nav className="hidden md:flex space-x-4 text-sm">
                            <button
                                onClick={() => navigateTo('transfers')}
                                className={`hover:underline ${currentPage === 'transfers' ? 'font-semibold' : ''}`}
                            >
                                Home
                            </button>
                            <button
                                onClick={() => navigateTo('logs')}
                                className={`hover:underline ${currentPage === 'logs' ? 'font-semibold' : ''}`}
                            >
                                Logs
                            </button>
                            <button
                                onClick={() => navigateTo('logs?type=request&date=all')}
                                className={`hover:underline ${currentPage === 'logs' ? 'font-semibold' : ''}`}
                            >
                                Requests
                            </button>
                        </nav>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    >
                        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </Button>
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                    {currentPage === 'logs' ? 'View and filter Mega CMD logs' : 'Frontend for managing Mega transfers with mega-cmd'}
                </p>

                {/* Mobile nav */}
                <nav className="md:hidden flex space-x-4 text-sm mt-4">
                    <button
                        onClick={() => navigateTo('transfers')}
                        className={`hover:underline ${currentPage === 'transfers' ? 'font-semibold' : ''}`}
                    >
                        Home
                    </button>
                    <button
                        onClick={() => navigateTo('logs')}
                        className={`hover:underline ${currentPage === 'logs' ? 'font-semibold' : ''}`}
                    >
                        Logs
                    </button>
                    <button
                        onClick={() => navigateTo('logs?type=request&date=all')}
                        className={`hover:underline ${currentPage === 'logs' ? 'font-semibold' : ''}`}
                    >
                        Requests
                    </button>
                </nav>
            </div>
        </header>
    );
}