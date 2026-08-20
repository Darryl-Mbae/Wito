import { useEffect, useState } from 'react';

export default function TermsOfService() {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/terms-of-service.html')
            .then(response => response.text())
            .then(html => {
                setContent(html);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading terms of service:', error);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div dangerouslySetInnerHTML={{ __html: content }} />
    );
}