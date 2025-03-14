const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/user');

module.exports = function(passport) {
    // Sérialisation de l'utilisateur pour les sessions
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Désérialisation de l'utilisateur
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });

    // Configuration de la stratégie Google
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Vérification si l'utilisateur existe déjà
            let user = await User.findOne({ 
                $or: [
                    { googleId: profile.id },
                    { email: profile.emails[0].value }
                ]
            });

            if (user) {
                // Mise à jour des informations si l'utilisateur existe
                if (!user.googleId) {
                    user.googleId = profile.id;
                    await user.save();
                }
                return done(null, user);
            }

            // Création d'un nouvel utilisateur
            const newUser = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                // Pas besoin de mot de passe pour l'authentification OAuth
            });

            await newUser.save();
            return done(null, newUser);
        } catch (err) {
            return done(err, null);
        }
    }));

    // Configuration de la stratégie GitHub
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/auth/github/callback",
        scope: ['user:email']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails && profile.emails[0].value;
            
            // Vérification si l'utilisateur existe déjà
            let user = await User.findOne({ 
                $or: [
                    { githubId: profile.id },
                    { email: email }
                ]
            });

            if (user) {
                // Mise à jour des informations si l'utilisateur existe
                if (!user.githubId) {
                    user.githubId = profile.id;
                    await user.save();
                }
                return done(null, user);
            }

            // Création d'un nouvel utilisateur
            const newUser = new User({
                name: profile.displayName || profile.username,
                email: email,
                githubId: profile.id,
                // Pas besoin de mot de passe pour l'authentification OAuth
            });

            await newUser.save();
            return done(null, newUser);
        } catch (err) {
            return done(err, null);
        }
    }));

    // Configuration de la stratégie Microsoft
    passport.use(new MicrosoftStrategy({
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: "/auth/microsoft/callback",
        scope: ['user.read']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails && profile.emails[0].value;
            
            // Vérification si l'utilisateur existe déjà
            let user = await User.findOne({ 
                $or: [
                    { microsoftId: profile.id },
                    { email: email }
                ]
            });

            if (user) {
                // Mise à jour des informations si l'utilisateur existe
                if (!user.microsoftId) {
                    user.microsoftId = profile.id;
                    await user.save();
                }
                return done(null, user);
            }

            // Création d'un nouvel utilisateur
            const newUser = new User({
                name: profile.displayName,
                email: email,
                microsoftId: profile.id,
                // Pas besoin de mot de passe pour l'authentification OAuth
            });

            await newUser.save();
            return done(null, newUser);
        } catch (err) {
            return done(err, null);
        }
    }));
};