export const initTheme = () => {
    let stored;
    try {
        stored = localStorage.getItem('theme');
    } catch (err) {
        stored = null;
    }

    const prefersDark =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        let hasStored;
        try {
            hasStored = localStorage.getItem('theme');
        } catch (err) {
            hasStored = null;
        }

        if (!hasStored) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
};
