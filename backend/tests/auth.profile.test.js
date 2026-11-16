const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const { createUser } = require('./helpers');

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('PUT /api/v1/auth/updatedetails', () => {
    const put = (token, body) => request(app)
        .put('/api/v1/auth/updatedetails')
        .set(auth(token))
        .send(body);

    test('updates name, tel and email', async () => {
        const { token } = await createUser();

        const res = await put(token, { name: 'New Name', tel: '0899999999', email: 'New.Email@Test.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('New Name');
        expect(res.body.data.tel).toBe('0899999999');
        expect(res.body.data.email).toBe('new.email@test.com');
        expect(res.body.data.password).toBeUndefined();
    });

    test('ignores role and password in the body', async () => {
        const { user, token } = await createUser();

        const res = await put(token, { name: 'Renamed', role: 'admin', password: 'hacked123' });

        expect(res.status).toBe(200);
        expect(res.body.data.role).toBe('user');

        const login = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: user.email, password: 'password123' });
        expect(login.status).toBe(200);
    });

    test('email of another user -> 400', async () => {
        const { user: other } = await createUser();
        const { token } = await createUser();

        const res = await put(token, { email: other.email });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email is already registered');
    });

    test('own email in a different case -> 200', async () => {
        const { token } = await createUser({ email: 'user1@gmail.com' });

        const res = await put(token, { email: 'USER1@gmail.com' });

        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe('user1@gmail.com');
    });

    test('empty body -> 400', async () => {
        const { token } = await createUser();

        const res = await put(token, {});

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Please provide name, tel or email to update');
    });

    test('body with only role or password -> 400', async () => {
        const { token } = await createUser();

        const res = await put(token, { role: 'admin', password: 'hacked123' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Please provide name, tel or email to update');
    });

    test('invalid email -> 400', async () => {
        const { token } = await createUser();

        const res = await put(token, { email: 'not-an-email' });

        expect(res.status).toBe(400);
    });

    test('invalid tel -> 400', async () => {
        const { token } = await createUser();

        const res = await put(token, { tel: '12ab' });

        expect(res.status).toBe(400);
    });

    test('no token -> 401', async () => {
        const res = await request(app).put('/api/v1/auth/updatedetails').send({ name: 'X' });

        expect(res.status).toBe(401);
    });
});

describe('PUT /api/v1/auth/updatepassword', () => {
    const put = (token, body) => request(app)
        .put('/api/v1/auth/updatepassword')
        .set(auth(token))
        .send(body);
    const login = (email, password) => request(app)
        .post('/api/v1/auth/login')
        .send({ email, password });
    const me = (token) => request(app).get('/api/v1/auth/me').set(auth(token));

    test('changes the password and returns a token', async () => {
        const { user, token } = await createUser();

        const res = await put(token, { currentPassword: 'password123', newPassword: 'newpass456' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(typeof res.body.token).toBe('string');
        expect((await login(user.email, 'newpass456')).status).toBe(200);
        expect((await login(user.email, 'password123')).status).toBe(401);
    });

    test('the token used for the change is revoked', async () => {
        const { token } = await createUser();

        const res = await put(token, { currentPassword: 'password123', newPassword: 'newpass456' });

        expect((await me(token)).status).toBe(401);
        expect((await me(res.body.token)).status).toBe(200);
    });

    test('changing the password logs out older sessions but not the new token', async () => {
        const { user, token } = await createUser();
        const olderSession = jwt.sign(
            { id: user._id, iat: Math.floor(Date.now() / 1000) - 60 },
            process.env.JWT_SECRET,
            { expiresIn: '1h', jwtid: crypto.randomUUID() }
        );
        expect((await me(olderSession)).status).toBe(200);

        const res = await put(token, { currentPassword: 'password123', newPassword: 'newpass456' });

        expect(res.status).toBe(200);
        expect((await me(olderSession)).status).toBe(401);
        expect((await me(res.body.token)).status).toBe(200);
    });

    test('wrong current password -> 401', async () => {
        const { token } = await createUser();

        const res = await put(token, { currentPassword: 'wrongpass', newPassword: 'newpass456' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Current password is incorrect');
        expect((await me(token)).status).toBe(200);
    });

    test('missing currentPassword or newPassword -> 400', async () => {
        const { token } = await createUser();

        const noNew = await put(token, { currentPassword: 'password123' });
        const noCurrent = await put(token, { newPassword: 'newpass456' });

        expect(noNew.status).toBe(400);
        expect(noNew.body.message).toBe('Please provide currentPassword and newPassword');
        expect(noCurrent.status).toBe(400);
        expect(noCurrent.body.message).toBe('Please provide currentPassword and newPassword');
    });

    test('new password shorter than 6 characters -> 400', async () => {
        const { user, token } = await createUser();

        const res = await put(token, { currentPassword: 'password123', newPassword: '12345' });

        expect(res.status).toBe(400);
        expect((await login(user.email, 'password123')).status).toBe(200);
        expect((await me(token)).status).toBe(200);
    });
});
