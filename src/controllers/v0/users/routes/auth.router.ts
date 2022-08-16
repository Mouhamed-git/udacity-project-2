import { Router, Request, Response } from 'express';

import { User } from '../models/User';

import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { NextFunction } from 'connect';

import * as EmailValidator from 'email-validator';
import { config } from '../../../../config/config';

const router: Router = Router();

// Use Bcrypt to Generated Salted Hashed Passwords
async function generatePassword(plainTextPassword: string): Promise<string> {
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    return await bcrypt.hash(plainTextPassword, salt);
}

//Use Bcrypt to Compare your password to your Salted Hashed Password
async function comparePasswords(plainTextPassword: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainTextPassword, hash);
}

//Use jwt to create a new JWT Payload containing
function generateJWT(user: User): string {
    return jwt.sign(user.toJSON(), config.jwt.secret);
}

//Check authorization token
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.headers || !req.headers.authorization) {
        return res.status(401).send({ error: 'No authorization headers.' });
    }

    const token = req.headers.authorization.split(' ');

    if (token.length != 2 || token[0] != 'Bearer') {
        return res.status(401).send({ error: 'Malformed token.' });
    }

    return jwt.verify(token[1], config.jwt.secret, (err, decoded) => {
        if (err) {
            return res.status(500).send({ error: 'Failed to authenticate.' });
        }
        return next();
    });
}

//Authenticate user
router.post('/login', async (req: Request, res: Response) => {
    const email = req.body.email;
    const password = req.body.password;
    // check email is valid
    if (!email || !EmailValidator.validate(email)) {
        return res.status(400).send({ auth: false, message: 'Email is required or malformed' });
    }

    // check email password valid
    if (!password) {
        return res.status(400).send({ auth: false, message: 'Password is required.' });
    }

    const user = await User.findByPk(email);
    // check that user exists
    if (!user) {
        return res.status(401).send({ auth: false, message: 'User not exists.' });
    }

    // check that the password matches
    const authValid = await comparePasswords(password, user.password_hash)

    if (!authValid) {
        return res.status(401).send({ auth: false, message: 'Email or password incorrect.' });
    }

    // Generate JWT
    const jwt = generateJWT(user);

    res.status(200).send({ auth: true, token: jwt, user: user.short() });
});

//Register a new user
router.post('/register', async (req: Request, res: Response) => {
    const email = req.body.email;
    const plainTextPassword = req.body.password;
    // check email is valid
    if (!email || !EmailValidator.validate(email)) {
        return res.status(400).send({ auth: false, message: 'Email is required or malformed.' });
    }

    // check email password valid
    if (!plainTextPassword) {
        return res.status(400).send({ auth: false, message: 'Password is required.' });
    }

    // find the user
    const user = await User.findByPk(email);

    // check that user doesnt exists
    if (user) {
        return res.status(422).send({ auth: false, message: 'User may already exist.' });
    }

    const password_hash = await generatePassword(plainTextPassword);

    const newUser = await new User({
        email: email,
        password_hash: password_hash
    });

    let savedUser;
    try {
        savedUser = await newUser.save();
    } catch (e) {
        throw e;
    }

    // Generate JWT
    const jwt = generateJWT(savedUser);

    res.status(201).send({ token: jwt, user: savedUser.short() });
});

export const AuthRouter: Router = router;
