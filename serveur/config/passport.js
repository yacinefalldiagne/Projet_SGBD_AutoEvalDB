// config/passport.js
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const MicrosoftStrategy = require("passport-microsoft").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../models/user");

// Configuration de la stratégie JWT
const jwtOpts = {};
jwtOpts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOpts.secretOrKey = process.env.JWT_SECRET;

module.exports = function (passport) {
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
            console.error(`Erreur lors de la désérialisation : ${err.message}`);
            done(err, null);
        }
    });

    // Configuration de la stratégie JWT
    passport.use(
        new JwtStrategy(jwtOpts, async (jwt_payload, done) => {
            try {
                const user = await User.findById(jwt_payload.id);
                if (user) {
                    return done(null, user);
                }
                return done(null, false);
            } catch (error) {
                console.error(`Erreur lors de la vérification JWT : ${error.message}`);
                return done(error, false);
            }
        })
    );

    // Configuration de la stratégie Google
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: "/auth/google/callback",
                scope: ["profile", "email"],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        return done(
                            new Error("Email non fourni par Google. Veuillez autoriser l'accès à votre email."),
                            null
                        );
                    }

                    // Vérification si l'utilisateur existe déjà
                    let user = await User.findOne({
                        $or: [{ googleId: profile.id }, { email }],
                    });

                    if (user) {
                        // Si l'utilisateur existe mais n'a pas de googleId, lier le compte
                        if (!user.googleId) {
                            user.googleId = profile.id;
                            await user.save();
                        }
                        console.log(`Utilisateur trouvé pour Google OAuth : ${user.email}`);
                        return done(null, user);
                    }

                    // Création d'un nouvel utilisateur
                    const newUser = new User({
                        name: profile.displayName,
                        email,
                        googleId: profile.id,
                        preferences: {
                            darkMode: false,
                            notifications: true,
                            language: "fr",
                        },
                    });

                    await newUser.save();
                    console.log(`Nouvel utilisateur créé via Google OAuth : ${newUser.email}`);
                    return done(null, newUser);
                } catch (err) {
                    console.error(`Erreur lors de l'authentification Google : ${err.message}`);
                    return done(err, null);
                }
            }
        )
    );

    // Configuration de la stratégie GitHub
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: "/auth/github/callback",
                scope: ["user:email"],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        return done(
                            new Error("Email non fourni par GitHub. Veuillez autoriser l'accès à votre email."),
                            null
                        );
                    }

                    // Vérification si l'utilisateur existe déjà
                    let user = await User.findOne({
                        $or: [{ githubId: profile.id }, { email }],
                    });

                    if (user) {
                        // Si l'utilisateur existe mais n'a pas de githubId, lier le compte
                        if (!user.githubId) {
                            user.githubId = profile.id;
                            await user.save();
                        }
                        console.log(`Utilisateur trouvé pour GitHub OAuth : ${user.email}`);
                        return done(null, user);
                    }

                    // Création d'un nouvel utilisateur
                    const newUser = new User({
                        name: profile.displayName || profile.username,
                        email,
                        githubId: profile.id,
                        preferences: {
                            darkMode: false,
                            notifications: true,
                            language: "fr",
                        },
                    });

                    await newUser.save();
                    console.log(`Nouvel utilisateur créé via GitHub OAuth : ${newUser.email}`);
                    return done(null, newUser);
                } catch (err) {
                    console.error(`Erreur lors de l'authentification GitHub : ${err.message}`);
                    return done(err, null);
                }
            }
        )
    );

    // Configuration de la stratégie Microsoft
    passport.use(
        new MicrosoftStrategy(
            {
                clientID: process.env.MICROSOFT_CLIENT_ID,
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
                callbackURL: "/auth/microsoft/callback",
                scope: ["user.read"],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        return done(
                            new Error(
                                "Email non fourni par Microsoft. Veuillez autoriser l'accès à votre email."
                            ),
                            null
                        );
                    }

                    // Vérification si l'utilisateur existe déjà
                    let user = await User.findOne({
                        $or: [{ microsoftId: profile.id }, { email }],
                    });

                    if (user) {
                        // Si l'utilisateur existe mais n'a pas de microsoftId, lier le compte
                        if (!user.microsoftId) {
                            user.microsoftId = profile.id;
                            await user.save();
                        }
                        console.log(`Utilisateur trouvé pour Microsoft OAuth : ${user.email}`);
                        return done(null, user);
                    }

                    // Création d'un nouvel utilisateur
                    const newUser = new User({
                        name: profile.displayName,
                        email,
                        microsoftId: profile.id,
                        preferences: {
                            darkMode: false,
                            notifications: true,
                            language: "fr",
                        },
                    });

                    await newUser.save();
                    console.log(`Nouvel utilisateur créé via Microsoft OAuth : ${newUser.email}`);
                    return done(null, newUser);
                } catch (err) {
                    console.error(`Erreur lors de l'authentification Microsoft : ${err.message}`);
                    return done(err, null);
                }
            }
        )
    );
};