import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const Unauthorized = () => {
    const history = useHistory();

    useEffect(() => {
        const timer = setTimeout(() => {
            history.push('/');
        }, 3000);

        return () => clearTimeout(timer);
    }, [history]);

    return (
        <div>
            <h1>Vous n'êtes pas autorisé à consulter cette page</h1>
            <p>Vous allez être redirigé vers la page d'accueil...</p>
        </div>
    );
};

export default Unauthorized;