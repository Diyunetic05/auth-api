const request = require('supertest');
const app = require('../server');

describe('Auth API Tests', () => {
    let authToken;
    let createdNoteId;

    // Test 1: Signup
    test('POST /signup - creates new user', async () => {
        const res = await request(app)
            .post('/signup')
            .send({ email: 'test@example.com', password: 'Test123' });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Signup successful!');
    });

    // Test 2: Duplicate signup (should fail)
    test('POST /signup - rejects duplicate email', async () => {
        const res = await request(app)
            .post('/signup')
            .send({ email: 'test@example.com', password: 'Test123' });

        expect(res.statusCode).toBe(409);
        expect(res.body.error).toBe('User already exists');
    });

    // Test 3: Login (should return token)
    test('POST /login - returns JWT token', async () => {
        const res = await request(app)
            .post('/login')
            .send({ email: 'test@example.com', password: 'Test123' });

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
        authToken = res.body.token;
    });

    // Test 4: Login with wrong password (should fail)
    test('POST /login - rejects wrong password', async () => {
        const res = await request(app)
            .post('/login')
            .send({ email: 'test@example.com', password: 'wrongpassword' });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });

    // Test 5: Create note (protected route)
    test('POST /notes - creates note with valid token', async () => {
        const res = await request(app)
            .post('/notes')
            .set('Authorization', authToken)
            .send({ title: 'Test Note', content: 'Test Content' });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Note created!');
        createdNoteId = res.body.id;
    });

    // Test 6: Get notes (protected route)
    test('GET /notes - returns user notes with valid token', async () => {
        const res = await request(app)
            .get('/notes')
            .set('Authorization', authToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.notes).toBeInstanceOf(Array);
    });

    // Test 7: Get notes without token (should fail)
    test('GET /notes - rejects request without token', async () => {
        const res = await request(app)
            .get('/notes');

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe('No token provided');
    });

    // Test 8: /me endpoint
    test('GET /me - returns current user info', async () => {
        const res = await request(app)
            .get('/me')
            .set('Authorization', authToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.email).toBe('test@example.com');
    });

    // Test 9: Health check
    test('GET /health - returns ok status', async () => {
        const res = await request(app)
            .get('/health');

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('ok');
    });
});